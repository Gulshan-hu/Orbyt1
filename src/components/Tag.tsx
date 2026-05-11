interface TagProps { selected?: boolean; onClick?: () => void; children: React.ReactNode; small?: boolean; static?: boolean; }
export function Tag({ selected, onClick, children, small, static: isStatic }: TagProps) {
  const pad = small ? "px-3 py-1 text-[12px]" : "px-[18px] py-2 text-[14px]";
  const cls = selected
    ? "bg-white text-black border-white"
    : "bg-[#1A1A1A] text-[#A1A1A1] border-[#2A2A2A] hover:border-[#E2E2E2]";
  return (
    <button type="button" onClick={onClick} disabled={isStatic}
      className={`inline-flex items-center border rounded-[999px] font-[Proza_Libre] transition-colors ${pad} ${cls} ${isStatic ? "cursor-default" : "cursor-pointer"}`}>
      {children}
    </button>
  );
}
