import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | AI Code Review",
  description: "Application settings and preferences",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure your account and review preferences.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm text-muted-foreground">
          Settings will be available once authentication is configured.
        </p>
      </div>
    </div>
  );
}
