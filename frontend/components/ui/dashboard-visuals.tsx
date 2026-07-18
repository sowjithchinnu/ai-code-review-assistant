import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
  showLineNumbers?: boolean;
  highlightedLineNumber?: number | null;
}

function highlightCode(code: string) {
  const keywords = [
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "class",
    "import",
    "export",
    "async",
    "await",
    "try",
    "catch",
    "new",
    "for",
    "while",
    "true",
    "false",
    "null",
  ];

  return code.split(/(\s+|[{}()[\];,.:=+/*<>!&|?-]+)/).map((token, index) => {
    if (!token) return null;

    if (token.startsWith("//")) {
      return (
        <span key={`${token}-${index}`} className="text-emerald-500">
          {token}
        </span>
      );
    }

    if (/^".*"$/.test(token) || /^'.*'$/.test(token) || /^`.*`$/.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-amber-500">
          {token}
        </span>
      );
    }

    if (/^\d+$/.test(token)) {
      return (
        <span key={`${token}-${index}`} className="text-violet-500">
          {token}
        </span>
      );
    }

    if (keywords.includes(token)) {
      return (
        <span key={`${token}-${index}`} className="text-sky-500">
          {token}
        </span>
      );
    }

    return <span key={`${token}-${index}`}>{token}</span>;
  });
}

export function CodeBlock({ code, language = "ts", title, className, showLineNumbers = false, highlightedLineNumber = null }: CodeBlockProps) {
  const lines = code.split("\n");

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border/60 bg-slate-950 text-sm shadow-inner", className)}>
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.24em] text-slate-300">
        <span>{title ?? `${language} snippet`}</span>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-400">
          {language}
        </span>
      </div>
      <div className="max-h-[30rem] overflow-auto">
        <pre className="overflow-x-auto p-4 text-[13px] leading-6 text-slate-100">
          <code className="block font-mono">
            {showLineNumbers ? (
              lines.map((line, index) => {
                const lineNumber = index + 1;
                const isHighlighted = highlightedLineNumber !== null && lineNumber === highlightedLineNumber;

                return (
                  <div
                    key={`${lineNumber}-${line}`}
                    data-line-number={lineNumber}
                    className={cn("flex min-h-[1.5rem]", isHighlighted && "bg-amber-100/80 text-amber-950 dark:bg-amber-900/30 dark:text-amber-200")}
                  >
                    <span className="mr-4 w-10 shrink-0 select-none border-r border-white/10 pr-3 text-right text-[11px] text-slate-500">
                      {lineNumber}
                    </span>
                    <span className="flex-1 whitespace-pre break-normal">
                      {highlightCode(line)}
                    </span>
                  </div>
                );
              })
            ) : (
              highlightCode(code)
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-border/70 bg-card/60 px-6 py-14 text-center shadow-sm"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="h-10 animate-pulse rounded-xl bg-muted" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function MetricsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-border/60 bg-background/70 p-4">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-8 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-3 w-32 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
