import type { ReactElement } from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
}

export function ErrorState({ title = "Something went wrong", message }: ErrorStateProps): ReactElement {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-6 text-center">
      <h2 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">{title}</h2>
      {message && <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>}
    </div>
  );
}


