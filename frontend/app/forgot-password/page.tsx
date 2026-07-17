"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const result = await forgotPassword(email);

      setResetToken(result.resetToken || null);
      setIsSubmitted(true);

      toast({
        title: "Success",
        description: result.message || "Password reset instructions sent to your email",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send password reset",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Mail className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Forgot Password</h1>
          </div>

          {!isSubmitted ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="h-10"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Check your email for password reset instructions
                </p>
              </div>

              {resetToken && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Development mode: Your reset token is:
                  </p>
                  <div className="bg-muted p-3 rounded-lg text-xs font-mono break-all text-foreground">
                    {resetToken}
                  </div>
                  <Button
                    onClick={() => {
                      const params = new URLSearchParams({ token: resetToken });
                      router.push(`/reset-password?${params.toString()}`);
                    }}
                    className="w-full"
                  >
                    Reset Password Now
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                  setResetToken(null);
                }}
              >
                Try Another Email
              </Button>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/login" className="flex items-center gap-2 text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
