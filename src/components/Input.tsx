import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

const baseCls = "w-full bg-black border border-[#2A2A2A] rounded-[12px] px-4 py-[14px] text-white text-[15px] font-[Proza_Libre] placeholder:text-[#A1A1A1] focus:border-[#E2E2E2] focus:outline-none transition-colors";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...rest }, ref
) { return <input ref={ref} className={`${baseCls} ${className}`} {...rest} />; });

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className = "", ...rest }, ref
) { return <textarea ref={ref} className={`${baseCls} resize-y ${className}`} {...rest} />; });

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = "", children, ...rest }, ref
) { return <select ref={ref} className={`${baseCls} ${className}`} {...rest}>{children}</select>; });

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[13px] text-[#A1A1A1] mb-1.5 font-[Proza_Libre]">{children}</label>;
}
