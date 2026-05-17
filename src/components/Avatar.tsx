export function Avatar({ name, size = 36, avatarUrl }: { name: string; size?: number; avatarUrl?: string | null }) {
  const initials = name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();

  if (avatarUrl) {
    return (
      <div style={{ width: size, height: size }}
        className="inline-flex items-center justify-center rounded-full bg-[#2A2A2A] overflow-hidden flex-shrink-0">
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="inline-flex items-center justify-center rounded-full bg-[#2A2A2A] text-white font-[Unbounded] flex-shrink-0">
      {initials}
    </div>
  );
}
