import AuthLayout from "@/components/auth/AuthLayout";
import AdminLoginForm from "@/components/auth/AdminLoginForm";

export default function Home() {
  return (
    <AuthLayout>
      <AdminLoginForm />
    </AuthLayout>
  );
}
