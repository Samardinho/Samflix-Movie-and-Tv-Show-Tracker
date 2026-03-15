import { useState } from "react";

interface RatingStarsProps {
  value: number | null;
  onChange: (rating: number) => void;
  maxRating?: number;
  readonly?: boolean;
}

export function RatingStars({
  value,
  onChange,
  maxRating = 10,
  readonly = false
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value ?? 0;

  if (readonly && value === null) {
    return <span className="text-gray-400 dark:text-gray-500">No rating</span>;
  }

  const starSize = readonly && maxRating === 10 ? "text-lg" : "text-2xl";
  const starGap = readonly && maxRating === 10 ? "gap-0.5" : "gap-1";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className={`flex ${starGap}`}>
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onChange(star)}
            onMouseEnter={() => !readonly && setHoverValue(star)}
            onMouseLeave={() => !readonly && setHoverValue(null)}
            disabled={readonly}
            className={`${starSize} transition-colors ${
              readonly ? "cursor-default" : "cursor-pointer"
            } ${
              star <= displayValue
                ? "text-yellow-400 dark:text-yellow-500"
                : "text-gray-300 dark:text-gray-600 hover:text-yellow-200 dark:hover:text-yellow-400"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {value !== null && (
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}/{maxRating}</span>
      )}
    </div>
  );
}

