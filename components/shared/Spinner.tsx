import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeMap = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div
      className={cn(
        "border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin",
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
