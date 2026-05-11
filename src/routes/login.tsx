import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { Input, FieldLabel } from "@/components/Input";
import { OtpInput } from "@/components/OtpInput";
import { useAuth, sendLoginOtp, verifyLoginOtp } from "@/lib/auth";
import { useToast } from "@/components/Toast";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const { user, loading } = useAuth();
  const [stage, setStage] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => { if (!loading && user) navigate({ to: "/dashboard" }); }, [user, loading, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    setSending(true);
    const { error } = await sendLoginOtp(email);
    setSending(false);
    if (error) {
      const errorMsg = error.message || "";

      if (errorMsg.includes("once every 60 seconds")) {
        show("Please wait 60 seconds before requesting another code for this email.");
        setCooldown(60);
      } else if (errorMsg.includes("rate limit") || errorMsg.includes("Email rate limit exceeded")) {
        show("Too many requests. Please wait a few minutes or use a different email.");
      } else {
        show(errorMsg || "Failed to send code");
      }
      return;
    }
    setCooldown(60);
    show(`Verification code sent to ${email}`);
  };

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/\S+@\S+/.test(email)) return;
    sendCode();
    setOtp("");
    setOtpError("");
    setStage("otp");
  };

  const verify = async () => {
    const { error } = await verifyLoginOtp(email, otp);
    if (error) {
      setOtpError("Incorrect or expired code. Try again.");
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-10 w-full max-w-[440px]">
          {stage === "email" ? (
            <>
              <h1 className="text-white text-[26px] mb-2">Welcome back</h1>
              <p className="text-[#A1A1A1] text-[15px] font-[Proza_Libre] mb-8">Sign in with your Gmail to continue.</p>
              <form onSubmit={submitEmail} className="flex flex-col gap-5">
                <div>
                  <FieldLabel>Gmail</FieldLabel>
                  <Input type="email" required placeholder="alex@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
                  <p className="text-[12px] text-[#A1A1A1] mt-1.5 font-[Proza_Libre]">Tip: Use Gmail aliases like yourmail+test1@gmail.com for testing</p>
                </div>
                <Button type="submit" full disabled={sending}>{sending ? "Sending..." : "Continue with Gmail"}</Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <h1 className="text-white text-[26px] mb-2">Check your inbox</h1>
              <p className="text-[#A1A1A1] text-[15px] font-[Proza_Libre] mb-8">
                We sent an 8-digit code to <span className="text-white">{email}</span>
              </p>
              <OtpInput value={otp} onChange={v => { setOtp(v); setOtpError(""); }} length={8} />
              {otpError && <p className="text-[#FF6B6B] text-[13px] font-[Proza_Libre] mt-3">{otpError}</p>}
              <div className="mt-5">
                <Button variant="ghost" disabled={cooldown > 0} onClick={() => { sendCode(); setOtp(""); }}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </Button>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={() => { setStage("email"); setOtp(""); setOtpError(""); }}>Back</Button>
                <Button disabled={otp.length !== 8} onClick={verify}>Verify</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
