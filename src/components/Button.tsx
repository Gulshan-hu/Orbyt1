import { forwardRef, ButtonHTMLAttributes } from "react";
import buttonPattern from '@/assets/button-pattern.png';

type Variant = "primary" | "ghost" | "danger";
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; full?: boolean; }

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", full, className = "", ...rest }, ref
) {
  const base = "inline-flex items-center justify-center font-[Unbounded] text-sm rounded-[999px] px-7 py-3.5 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap relative overflow-hidden";
  const v = variant === "primary"
    ? "text-black hover:brightness-90"
    : variant === "ghost"
    ? "bg-transparent text-white border border-[#2A2A2A] hover:border-[#E2E2E2]"
    : "bg-transparent text-[#FF6B6B] border border-[#3A1A1A] hover:bg-[#1A0A0A]";

  return (
    <button
      ref={ref}
      className={`${base} ${v} ${full ? "w-full" : ""} ${className}`}
      style={{
        backgroundImage: variant === "primary" ? `url(${buttonPattern})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        textShadow: variant === "primary" ? '0 1px 2px rgba(255,255,255,0.8)' : undefined,
      }}
      {...rest}
    />
  );
});
