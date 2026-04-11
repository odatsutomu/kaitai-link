// Kaitai 画像ストレージ（Cloudflare R2）

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

// ── R2 環境変数バリデーション ─────────────────────────────────────────────
function getR2Config() {
  const accountId     = process.env.R2_ACCOUNT_ID;
  const accessKeyId   = process.env.R2_ACCESS_KEY_ID;
  const secretKey     = process.env.R2_SECRET_ACCESS_KEY;
  const bucket        = process.env.R2_KAITAI_BUCKET ?? process.env.R2_BUCKET_NAME ?? "kaitai-images";
  const publicUrl     = process.env.R2_KAITAI_PUBLIC_URL ?? process.env.R2_PUBLIC_URL ?? "";

  const missing: string[] = [];
  if (!accountId)   missing.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretKey)   missing.push("R2_SECRET_ACCESS_KEY");
  if (!publicUrl)   missing.push("R2_KAITAI_PUBLIC_URL");

  if (missing.length > 0) {
    throw new Error(
      `R2ストレージ未設定: 環境変数 ${missing.join(", ")} が設定されていません。` +
      `Vercelダッシュボード → Settings → Environment Variables で設定してください。`
    );
  }

  return { accountId: accountId!, accessKeyId: accessKeyId!, secretKey: secretKey!, bucket, publicUrl };
}

// Lazy init — 環境変数チェックをアップロード時に行う（モジュールロード時ではなく）
let _r2Client: S3Client | null = null;
let _bucket = "";
let _publicUrl = "";

function getR2() {
  if (!_r2Client) {
    const cfg = getR2Config();
    _r2Client = new S3Client({
      region:   "auto",
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId:     cfg.accessKeyId,
        secretAccessKey: cfg.secretKey,
      },
    });
    _bucket    = cfg.bucket;
    _publicUrl = cfg.publicUrl;
  }
  return { client: _r2Client, bucket: _bucket, publicUrl: _publicUrl };
}

export type UploadResult = { key: string; url: string };

/**
 * base64 dataURL を R2 にアップロード
 */
export async function uploadKaitaiImage(
  dataUrl: string,
  companyId: string,
  options: {
    siteId?:     string;
    reportType?: string;
    fileName?:   string;
  } = {}
): Promise<UploadResult> {
  const match = dataUrl.match(/^data:(image\/[\w+]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid dataURL");

  const contentType = match[1];
  const ext         = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const uuid        = crypto.randomUUID();

  const parts = [
    "kaitai",
    companyId,
    options.siteId     ?? "no-site",
    options.reportType ?? "misc",
    options.fileName   ?? `${uuid}.${ext}`,
  ];
  const key    = parts.join("/");
  const buffer = Buffer.from(match[2], "base64");

  const r2 = getR2();
  await r2.client.send(
    new PutObjectCommand({
      Bucket:       r2.bucket,
      Key:          key,
      Body:         buffer,
      ContentType:  contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { key, url: `${r2.publicUrl}/${key}` };
}

/**
 * バイナリ (Buffer/Uint8Array) を直接 R2 にアップロード
 */
export async function uploadKaitaiImageBinary(
  buffer: Buffer | Uint8Array,
  contentType: string,
  companyId: string,
  options: {
    siteId?:     string;
    reportType?: string;
    fileName?:   string;
  } = {}
): Promise<UploadResult> {
  const ext  = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const uuid = crypto.randomUUID();

  const parts = [
    "kaitai",
    companyId,
    options.siteId     ?? "no-site",
    options.reportType ?? "misc",
    options.fileName   ?? `${uuid}.${ext}`,
  ];
  const key = parts.join("/");

  const r2 = getR2();
  await r2.client.send(
    new PutObjectCommand({
      Bucket:       r2.bucket,
      Key:          key,
      Body:         buffer,
      ContentType:  contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { key, url: `${r2.publicUrl}/${key}` };
}

/** 単一画像を削除 */
export async function deleteKaitaiImage(key: string) {
  const r2 = getR2();
  await r2.client.send(
    new DeleteObjectCommand({ Bucket: r2.bucket, Key: key })
  );
}

/** 複数画像を一括削除（期限切れクリーンアップ用） */
export async function deleteKaitaiImages(keys: string[]) {
  if (keys.length === 0) return;
  const r2 = getR2();
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    await r2.client.send(
      new DeleteObjectsCommand({
        Bucket: r2.bucket,
        Delete: {
          Objects: chunk.map(Key => ({ Key })),
          Quiet:   true,
        },
      })
    );
  }
}
