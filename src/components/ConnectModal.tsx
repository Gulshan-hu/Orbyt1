import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Textarea } from "./Input";
import { sendConnectionRequest } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { useToast } from "./Toast";

export function ConnectModal({ open, onClose, projectName, captainName, captainId }: { open: boolean; onClose: () => void; projectName: string; captainName: string; captainId?: string }) {
  const [msg, setMsg] = useState("");
  const { show } = useToast();
  const { user } = useAuth();

  const handleSend = async () => {
    if (!user || !captainId) return;
    await sendConnectionRequest({
      fromUserId: user.id,
      toUserId: captainId,
      projectId: null,
      message: msg.trim() || undefined,
    });
    show("Request sent!");
    onClose();
    setMsg("");
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-white text-[20px] mb-3">Do you want to join {projectName}?</h2>
      <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre] mb-6">A notification will be sent to Captain {captainName}. If they accept, your connection will be activated.</p>
      <Textarea rows={4} placeholder="How can your skills help this project?" value={msg} onChange={e => setMsg(e.target.value)} />
      <div className="flex gap-2 mt-6">
        <Button variant="ghost" full onClick={onClose}>Cancel</Button>
        <Button full onClick={handleSend}>Send</Button>
      </div>
    </Modal>
  );
}
