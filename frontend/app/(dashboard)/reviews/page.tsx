import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews | AI Code Review",
  description: "Code review history and results",
};

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reviews</h2>
        <p className="text-muted-foreground">
          Browse past code reviews and their findings.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm text-muted-foreground">
          No reviews yet. Run a review on a connected project to see results
          here.
        </p>
      </div>
    </div>
  );
}
