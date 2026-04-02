import { redirect } from "next/navigation";

// ルートアクセスは /kaitai にリダイレクト
export default function RootPage() {
  redirect("/kaitai");
}
