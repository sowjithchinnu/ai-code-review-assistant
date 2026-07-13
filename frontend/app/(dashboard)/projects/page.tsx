import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects | AI Code Review",
  description: "Manage your code projects",
};

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
        <p className="text-muted-foreground">
          Manage repositories connected to AI code review.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm text-muted-foreground">
          No projects connected yet. Connect a repository to start automated
          code reviews.
        </p>
      </div>
    </div>
  );
}
