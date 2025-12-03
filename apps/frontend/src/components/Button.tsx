import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  isLoading,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <>
          <LoadingSpinner />
          {loadingText || "Loading..."}
        </>
      ) : (
        children
      )}
    </button>
  );
}
