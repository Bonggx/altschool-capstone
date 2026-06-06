// Badge is a small colored pill used for specialties, ownership type, and status labels
interface BadgeProps {
  label: string;
  variant?: "pink" | "green" | "blue" | "gray" | "red" | "yellow";
  onClick?: () => void;
}

const variants = {
  pink: "bg-brand-100 text-brand-700",
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-gray-100 text-gray-600",
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
};

export default function Badge({ label, variant = "gray", onClick }: BadgeProps) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
    >
      {label}
    </span>
  );
}
