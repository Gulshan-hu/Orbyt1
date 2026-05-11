export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="inline-flex items-center justify-center rounded-full bg-[#2A2A2A] text-white font-[Unbounded] flex-shrink-0">
      {initials}
    </div>
  );
}
