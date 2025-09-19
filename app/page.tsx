import AuthLayout from "@/components/auth/AuthLayout";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export default function Home() {
  return (
    <AuthLayout>
      <AdminLoginForm />
    </AuthLayout>
  );
}
