export function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] ${className}`}>{children}</div>;
}
