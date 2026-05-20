import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Avatar } from "./Avatar";
import { Tag } from "./Tag";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { sendConnectionRequest, type OrbytUser } from "@/lib/data";
import { useAuth } from "@/lib/auth";

export function UserCard({ user, recommended }: { user: OrbytUser; recommended?: boolean }) {
  const [sending, setSending] = useState(false);
  const { show } = useToast();
  const { user: currentUser } = useAuth();
  const fullName = `${user.firstName} ${user.lastName}`;

  const handleConnect = async () => {
    if (!currentUser) return;
    setSending(true);
    try {
      await sendConnectionRequest({
        fromUserId: currentUser.id,
        toUserId: user.id,
        projectId: null,
      });
      show("Connection request sent!");
    } catch (error: any) {
      console.error("Connection request error:", error);
      if (error?.message?.includes("duplicate") || error?.code === "23505") {
        show("Connection request already sent");
      } else {
        show("Failed to send request");
      }
    } finally {
      setSending(false);
    }
  };

  if (recommended) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ scale: 1.02, y: -4 }}
        className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-6 w-[300px] flex-shrink-0 snap-start">
        <div className="flex justify-between">
          <span className="bg-[#2A2A2A] text-[#E2E2E2] rounded-[999px] px-3 py-1 text-[11px] font-[Proza_Libre]">User</span>
          <span className="bg-[#2A2A2A] text-white rounded-[999px] px-3 py-1 text-[11px] font-[Proza_Libre]">⚡ {user.matchScore}% match</span>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Avatar name={fullName} size={52} />
          <div className="min-w-0">
            <div className="text-white text-[15px] font-[Unbounded] truncate">{fullName}</div>
            <div className="text-[#A1A1A1] text-[13px] font-[Proza_Libre] truncate">{user.university} · {user.major}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3.5">{user.skills.slice(0, 5).map(s => <Tag key={s} small static>{s}</Tag>)}</div>
        <div className="text-[12px] text-[#A1A1A1] font-[Proza_Libre] mt-3.5">{user.projectCount} projects</div>
        <div className="flex gap-2 mt-4">
          <Link to="/profile/$userId" params={{ userId: user.id }} className="flex-1"><Button variant="ghost" full className="!text-[13px] !px-3 !py-2.5">View Profile</Button></Link>
          <Button full className="flex-1 !text-[13px] !px-3 !py-2.5" onClick={handleConnect} disabled={sending}>{sending ? "Sending..." : "Connect →"}</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-6 hover:border-[#E2E2E2] transition">
      <div className="flex items-center gap-3">
        <Avatar name={fullName} size={48} />
        <div className="min-w-0">
          <div className="text-white text-[15px] font-[Unbounded] truncate">{fullName}</div>
          <div className="text-[#A1A1A1] text-[13px] font-[Proza_Libre] truncate">{user.university} · {user.major}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3.5">{user.skills.map(s => <Tag key={s} small static>{s}</Tag>)}</div>
      <div className="text-[12px] text-[#A1A1A1] font-[Proza_Libre] mt-4">{user.connectionCount} connections · {user.projectCount} projects</div>
      <div className="flex gap-2 mt-4">
        <Link to="/profile/$userId" params={{ userId: user.id }} className="flex-1"><Button variant="ghost" full>View Profile</Button></Link>
        <Button full onClick={handleConnect} disabled={sending}>{sending ? "Sending..." : "Connect"}</Button>
      </div>
    </motion.div>
  );
}
