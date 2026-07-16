"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Key, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      toast({
        title: "Error",
        description: "No reset token provided. Please use the link from your email.",
        variant: "destructive",
      });
      router.push("/login");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, router, toast]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!newPassword) {
      newErrors.newPassword = "Password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) {
      return;
    }

    try {
      setIsLoading(true);
      const result = await resetPassword(token, newPassword);

      setIsSuccess(true);
      toast({
        title: "Success",
        description: result.message || "Your password has been reset successfully",
        variant: "success",
      });

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Key className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Reset Password</h1>
          </div>

          {!isSuccess ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) {
                        setErrors({ ...errors, newPassword: undefined });
                      }
                    }}
                    placeholder="Enter new password"
                    disabled={isLoading}
                    className="h-10"
                  />
                  {errors.newPassword && (
                    <p className="text-xs text-destructive mt-1">{errors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: undefined });
                      }
                    }}
                    placeholder="Confirm new password"
                    disabled={isLoading}
                    className="h-10"
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </>
          ) : (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-50 dark:bg-green-950/30 p-3">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Password Reset Successful</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your password has been reset. Redirecting to login...
                </p>
              </div>
            </div>
          )}

          {!isSuccess && (
            <div className="mt-6 flex items-center justify-between text-sm">
              <Link href="/login" className="flex items-center gap-2 text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
