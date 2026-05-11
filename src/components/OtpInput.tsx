import { useEffect, useRef } from "react";

export function OtpInput({ value, onChange, onComplete, length = 8 }: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const setDigit = (i: number, d: string) => {
    const clean = d.replace(/\D/g, "").slice(0, 1);
    const arr = value.padEnd(length, " ").split("");
    arr[i] = clean || " ";
    const next = arr.join("").replace(/ /g, "").padEnd(length, " ").trimEnd();
    onChange(next);
    if (clean && i < length - 1) refs.current[i + 1]?.focus();
    if (next.replace(/\s/g, "").length === length) onComplete?.(next);
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      e.preventDefault();
      const arr = value.padEnd(length, " ").split("");
      arr[i - 1] = " ";
      onChange(arr.join("").trimEnd());
      refs.current[i - 1]?.focus();
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    if (text.length === length) { refs.current[length - 1]?.focus(); onComplete?.(text); }
    else refs.current[text.length]?.focus();
  };

  return (
    <div className="flex justify-center gap-2.5">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={e => setDigit(i, e.target.value)}
          onKeyDown={e => onKey(i, e)}
          onPaste={onPaste}
          className="w-12 h-14 text-center bg-black border border-[#2A2A2A] rounded-[12px] text-white text-[22px] font-[Unbounded] focus:border-white focus:outline-none transition-colors"
        />
      ))}
    </div>
  );
}
