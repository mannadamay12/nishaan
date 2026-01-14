import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">nish.aan</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to sign in with a magic link
        </p>
      </div>

      <LoginForm />

      <p className="text-center text-xs text-muted-foreground">
        A sign-in link will be sent to your email
      </p>
    </div>
  );
}
