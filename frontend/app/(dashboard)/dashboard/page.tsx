import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | AI Code Review",
  description: "Overview and analytics for your code reviews",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your code review activity and insights.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Reviews", value: "128" },
          { label: "Active Projects", value: "12" },
          { label: "Issues Found", value: "47" },
          { label: "Avg. Review Time", value: "4.2m" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
