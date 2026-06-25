import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <div className="space-y-4">
      <AuthForm mode="register" />
      <p className="text-center text-sm text-ivory/60">
        Already have an account?{" "}
        <Link href="/login" className="text-amber-node hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
