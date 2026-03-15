interface ReleaseDateBadgeProps {
  date: string;
  label?: string;
}

export function ReleaseDateBadge({ date, label = "Release Date" }: ReleaseDateBadgeProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl shadow-lg">
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <div>
        <div className="text-xs opacity-90">{label}</div>
        <div className="font-bold">{formatDate(date)}</div>
      </div>
    </div>
  );
}

