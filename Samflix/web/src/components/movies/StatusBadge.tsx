import type { EntryStatus } from "../../types/domain";

interface StatusBadgeProps {
  status: EntryStatus;
}

const statusColors: Record<EntryStatus, string> = {
  plan: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
  watching: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300",
  completed: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300",
  dropped: "bg-slate-100 dark:bg-slate-800/30 text-slate-800 dark:text-slate-300"
};

const statusLabels: Record<EntryStatus, string> = {
  plan: "Plan to Watch",
  watching: "Watching",
  completed: "Completed",
  dropped: "Dropped"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

