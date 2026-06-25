import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <AuthForm mode="login" />
      <p className="text-center text-sm text-ivory/60">
        No account?{" "}
        <Link href="/register" className="text-amber-node hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
