import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Avatar } from "./Avatar";
import { Tag } from "./Tag";
import { Button } from "./Button";
import { ConnectModal } from "./ConnectModal";
import { type OrbytProject } from "@/lib/data";

function StatusBadge({ status }: { status: 'looking_for_team' | 'in_progress' | 'done' }) {
  const config = {
    looking_for_team: { label: "Looking for Team", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    in_progress: { label: "In Progress", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    done: { label: "Done", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  };
  const { label, color } = config[status];
  return (
    <span className={`${color} border rounded-[999px] px-3 py-1 text-[11px] font-[Proza_Libre]`}>
      {label}
    </span>
  );
}

export function ProjectCard({ project, recommended, captainName, captainAvatar }: {
  project: OrbytProject;
  recommended?: boolean;
  captainName?: string;
  captainAvatar?: string;
}) {
  const [open, setOpen] = useState(false);
  const displayName = captainName || "Captain";

  if (recommended) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-6 w-[300px] flex-shrink-0 snap-start">
          <div className="flex justify-between">
            <StatusBadge status={project.status} />
            <span className="bg-[#2A2A2A] text-white rounded-[999px] px-3 py-1 text-[11px] font-[Proza_Libre]">⚡ {project.matchScore}% match</span>
          </div>
          <h3 className="text-white text-[16px] mt-3.5 mb-2">{project.name}</h3>
          <p className="text-[#A1A1A1] text-[13px] font-[Proza_Libre] leading-[1.5]" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{project.description}</p>
          <div className="border-t border-[#2A2A2A] my-3.5" />
          <div className="text-[12px] text-[#A1A1A1] font-[Proza_Libre] mb-1.5">Have:</div>
          <div className="flex flex-wrap gap-1.5">{project.skillsHave.slice(0, 4).map(s => <Tag key={s} small static>{s}</Tag>)}</div>
          <div className="text-[12px] text-[#A1A1A1] font-[Proza_Libre] mt-3 mb-1.5">Need:</div>
          <div className="flex flex-wrap gap-1.5">{project.skillsNeed.slice(0, 4).map(n => <Tag key={n.skill} small static>{n.skill}</Tag>)}</div>
          <div className="flex items-center gap-2 mt-3.5">
            <Avatar name={displayName} size={28} />
            <span className="text-white text-[13px] font-[Proza_Libre]">{displayName}</span>
          </div>
          <div className="flex gap-2 mt-4">
            <Link to="/profile/$userId" params={{ userId: project.captainId }} className="flex-1"><Button variant="ghost" full className="!text-[13px] !px-3 !py-2.5">View Profile</Button></Link>
            <Button full className="flex-1 !text-[13px] !px-3 !py-2.5" onClick={() => setOpen(true)}>Connect →</Button>
          </div>
        </motion.div>
        <ConnectModal open={open} onClose={() => setOpen(false)} projectName={project.name} captainName={displayName} captainId={project.captainId} />
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.4 }}
        whileHover={{ scale: 1.02, y: -4 }}
        className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-6 hover:border-[#E2E2E2] transition cursor-pointer">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-white text-[17px]">{project.name}</h3>
            <StatusBadge status={project.status} />
          </div>
          <span className="text-[#A1A1A1] text-[12px] font-[Proza_Libre] flex-shrink-0">{project.createdAt}</span>
        </div>
        <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre] leading-[1.6] mt-3" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{project.description}</p>
        <div className="border-t border-[#2A2A2A] my-4" />
        <div className="text-[12px] text-[#A1A1A1] font-[Proza_Libre] mb-1.5">✓ Have:</div>
        <div className="flex flex-wrap gap-1.5">{project.skillsHave.map(s => <Tag key={s} small static>{s}</Tag>)}</div>
        <div className="text-[12px] text-[#A1A1A1] font-[Proza_Libre] mt-3 mb-1.5">✗ Need:</div>
        <div className="flex flex-wrap gap-1.5">{project.skillsNeed.map(n => <Tag key={n.skill} small static>{n.skill}</Tag>)}</div>
        <div className="flex items-center gap-2 mt-4">
          <Avatar name={displayName} size={28} />
          <span className="text-white text-[13px] font-[Proza_Libre]">{displayName}</span>
        </div>
        <Button full className="mt-4 !text-[14px]" onClick={() => setOpen(true)}>Connect →</Button>
      </motion.div>
      <ConnectModal open={open} onClose={() => setOpen(false)} projectName={project.name} captainName={displayName} captainId={project.captainId} />
    </>
  );
}
