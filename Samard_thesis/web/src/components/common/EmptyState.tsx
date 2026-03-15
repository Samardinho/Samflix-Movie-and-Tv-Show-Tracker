import type { ReactElement } from "react";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({
  title = "Nothing here yet",
  message
}: EmptyStateProps): ReactElement {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
      <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {message && <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>}
    </div>
  );
}


