// Kaitai 画像ストレージ（Cloudflare R2）

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region:   "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET     = process.env.R2_KAITAI_BUCKET ?? process.env.R2_BUCKET_NAME ?? "kaitai-images";
const PUBLIC_URL = process.env.R2_KAITAI_PUBLIC_URL ?? process.env.R2_PUBLIC_URL ?? "";

export type UploadResult = { key: string; url: string };

/**
 * base64 dataURL を R2 にアップロード
 * key: kaitai/{companyId}/{siteId}/{reportType}/{uuid}.{ext}
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

  await r2Client.send(
    new PutObjectCommand({
      Bucket:       BUCKET,
      Key:          key,
      Body:         buffer,
      ContentType:  contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { key, url: `${PUBLIC_URL}/${key}` };
}

/**
 * バイナリ (Buffer/Uint8Array) を直接 R2 にアップロード
 * base64 変換なしでメモリ効率が良い
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

  await r2Client.send(
    new PutObjectCommand({
      Bucket:       BUCKET,
      Key:          key,
      Body:         buffer,
      ContentType:  contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { key, url: `${PUBLIC_URL}/${key}` };
}

/** 単一画像を削除 */
export async function deleteKaitaiImage(key: string) {
  await r2Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}

/** 複数画像を一括削除（期限切れクリーンアップ用） */
export async function deleteKaitaiImages(keys: string[]) {
  if (keys.length === 0) return;
  // R2/S3 は最大 1000 件ずつ
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    await r2Client.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: {
          Objects: chunk.map(Key => ({ Key })),
          Quiet:   true,
        },
      })
    );
  }
}
