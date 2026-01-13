import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent you a magic link. Click the link in your email to sign in.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive an email? Check your spam folder or try again.
        </p>

        <Button variant="outline" asChild className="w-full">
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
    </div>
  );
}
