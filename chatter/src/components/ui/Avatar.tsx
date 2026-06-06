// Avatar displays a user's profile picture or their initials as a fallback
interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-20 h-20 text-2xl",
};

export default function Avatar({ src, name, size = "md" }: AvatarProps) {
  // Gets the first letter of the user's name to use as a fallback
  const initials = name ? name.charAt(0).toUpperCase() : "?";

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "User avatar"}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  // Shows initials in a colored circle when no image is available
  return (
    <div
      className={`${sizes[size]} rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center flex-shrink-0`}
    >
      {initials}
    </div>
  );
}
