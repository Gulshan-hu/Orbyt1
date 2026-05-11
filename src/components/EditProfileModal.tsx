import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input, Select, FieldLabel } from "./Input";
import { SkillPicker } from "./SkillPicker";
import { OtpInput } from "./OtpInput";
import { UNIVERSITIES, MAJORS } from "@/lib/constants";
import { updateUserProfile, type OrbytUser } from "@/lib/data";
import { requestEmailChange, verifyEmailChangeOtp } from "@/lib/auth";
import { useToast } from "./Toast";

export function EditProfileModal({ open, onClose, user, onSaved }: { open: boolean; onClose: () => void; user: OrbytUser; onSaved: () => void }) {
  const isPredefined = (u: string) => UNIVERSITIES.includes(u);
  const initialUni = isPredefined(user.university) ? user.university : "Digər";
  const initialUniOther = isPredefined(user.university) ? "" : user.university;

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [university, setUniversity] = useState(initialUni);
  const [universityOther, setUniversityOther] = useState(initialUniOther);
  const [major, setMajor] = useState(user.major);
  const [skills, setSkills] = useState<string[]>(user.skills);
  const { show } = useToast();

  // Email change verification
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const toggle = (s: string) => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const resolvedUni = university === "Digər" ? universityOther.trim() : university;

  const persist = async () => {
    await updateUserProfile(user.id, {
      first_name: firstName.trim() || user.firstName,
      last_name: lastName.trim() || user.lastName,
      university: resolvedUni || user.university,
      major,
      skills,
    });
    show("Profile updated successfully");
    onSaved();
    onClose();
  };

  const sendCode = async () => {
    const { error } = await requestEmailChange(email);
    if (error) {
      show(error.message || "Failed to send code");
      return;
    }
    setCooldown(60);
    show(`Verification code sent to ${email}`);
  };

  const save = () => {
    const emailChanged = email.trim().toLowerCase() !== user.email.toLowerCase();
    if (emailChanged) {
      if (!/\S+@\S+/.test(email)) { show("Enter a valid email"); return; }
      sendCode();
      setOtp("");
      setOtpError("");
      setVerifying(true);
      return;
    }
    persist();
  };

  const verifyAndSave = async () => {
    const { error } = await verifyEmailChangeOtp(email, otp);
    if (error) {
      setOtpError("Incorrect or expired code. Try again.");
    } else {
      setVerifying(false);
      persist();
    }
  };

  const cancel = () => {
    setFirstName(user.firstName); setLastName(user.lastName); setEmail(user.email);
    setUniversity(initialUni); setUniversityOther(initialUniOther);
    setMajor(user.major); setSkills(user.skills);
    setVerifying(false); setOtp(""); setOtpError("");
    onClose();
  };

  return (
    <Modal open={open} onClose={cancel}>
      {!verifying ? (
        <>
          <h2 className="text-white text-[20px] mb-5">Edit Profile</h2>
          <div className="flex flex-col gap-3.5 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div><FieldLabel>First name</FieldLabel><Input value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
              <div><FieldLabel>Last name</FieldLabel><Input value={lastName} onChange={e => setLastName(e.target.value)} /></div>
            </div>
            <div>
              <FieldLabel>Gmail</FieldLabel>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <p className="text-[12px] text-[#A1A1A1] mt-1.5 font-[Proza_Libre]">Changing this will require email verification</p>
            </div>
            <div><FieldLabel>University</FieldLabel>
              <Select value={university} onChange={e => setUniversity(e.target.value)}>
                {UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
              </Select>
              {university === "Digər" && (
                <div className="mt-3"><Input placeholder="Enter your university name" value={universityOther} onChange={e => setUniversityOther(e.target.value)} /></div>
              )}
            </div>
            <div><FieldLabel>Major</FieldLabel>
              <Select value={major} onChange={e => setMajor(e.target.value)}>
                {MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
              </Select>
            </div>
            <div><FieldLabel>Skills</FieldLabel><SkillPicker selected={skills} onToggle={toggle} /></div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button variant="ghost" full onClick={cancel}>Cancel</Button>
            <Button full onClick={save}>Save Changes</Button>
          </div>
        </>
      ) : (
        <div className="text-center py-2">
          <h2 className="text-white text-[22px] mb-2">Check your inbox</h2>
          <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre] mb-6">
            We sent an 8-digit code to <span className="text-white">{email}</span>
          </p>
          <OtpInput value={otp} onChange={v => { setOtp(v); setOtpError(""); }} length={8} />
          {otpError && <p className="text-[#FF6B6B] text-[13px] font-[Proza_Libre] mt-3">{otpError}</p>}
          <div className="mt-4">
            <Button variant="ghost" disabled={cooldown > 0} onClick={() => { sendCode(); setOtp(""); }}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => { setVerifying(false); setOtp(""); setOtpError(""); }}>Back</Button>
            <Button disabled={otp.length !== 8} onClick={verifyAndSave}>Verify & Save</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
