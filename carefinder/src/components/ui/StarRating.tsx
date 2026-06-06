import { useState } from "react";

interface StarRatingProps {
  value: number; // renamed from rating
  maxRating?: number;
  onChange?: (value: number) => void; // renamed from onRate
  readonly?: boolean; // explicit readonly flag
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-3 h-3",
  md: "w-5 h-5",
  lg: "w-7 h-7",
};

export default function StarRating({ value, maxRating = 5, onChange, readonly = false, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const isInteractive = !readonly && !!onChange;
  // Show hovered star count when interactive, otherwise show actual value
  const display = isInteractive ? (hovered || value) : value;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          // data-star attribute lets tests select stars by index
          data-star={star}
          disabled={!isInteractive}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => isInteractive && setHovered(star)}
          onMouseLeave={() => isInteractive && setHovered(0)}
          className={`${isInteractive ? "cursor-pointer" : "cursor-default"} focus:outline-none`}
        >
          <svg
            className={`${sizes[size]} transition-colors ${
              star <= display ? "text-brand-500 fill-brand-500" : "text-gray-300 fill-gray-300"
            }`}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}