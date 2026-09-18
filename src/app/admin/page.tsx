import AdminDashboard from "@/components/admin/AdminDashboard";

// Panel admin selalu butuh data terkini — jangan di-cache.
export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminDashboard />;
}
