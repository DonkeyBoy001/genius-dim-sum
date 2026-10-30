import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";

export const metadata: Metadata = { title: "天才港点 后台", robots: { index: false } };

export default function AdminPage() {
  return <AdminApp />;
}
