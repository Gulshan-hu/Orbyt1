import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/Button";
import { Input, FieldLabel } from "@/components/Input";
import { OtpInput } from "@/components/OtpInput";
import { useAuth, sendLoginOtp, verifyLoginOtp, signInWithGoogle } from "@/lib/auth";
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

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      show(error.message || "Failed to sign in with Google");
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
              <p className="text-[#A1A1A1] text-[15px] font-[Proza_Libre] mb-8">Sign in to continue.</p>
              <div className="flex flex-col gap-4 mb-6">
                <Button onClick={handleGoogleSignIn} full variant="ghost" className="flex items-center justify-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                    <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-[#2A2A2A]" />
                <span className="text-[#A1A1A1] text-[13px] font-[Proza_Libre]">or</span>
                <div className="flex-1 h-px bg-[#2A2A2A]" />
              </div>
              <form onSubmit={submitEmail} className="flex flex-col gap-5">
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <Input type="email" required placeholder="alex@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
                  <p className="text-[12px] text-[#A1A1A1] mt-1.5 font-[Proza_Libre]">Tip: Use Gmail aliases like yourmail+test1@gmail.com for testing</p>
                </div>
                <Button type="submit" full disabled={sending}>{sending ? "Sending..." : "Continue with Email"}</Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <h1 className="text-white text-[26px] mb-2">Check your inbox</h1>
              <p className="text-[#A1A1A1] text-[15px] font-[Proza_Libre] mb-8">
                We sent a 6-digit code to <span className="text-white">{email}</span>
              </p>
              <OtpInput value={otp} onChange={v => { setOtp(v); setOtpError(""); }} length={6} />
              {otpError && <p className="text-[#FF6B6B] text-[13px] font-[Proza_Libre] mt-3">{otpError}</p>}
              <div className="mt-5">
                <Button variant="ghost" disabled={cooldown > 0} onClick={() => { sendCode(); setOtp(""); }}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </Button>
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={() => { setStage("email"); setOtp(""); setOtpError(""); }}>Back</Button>
                <Button disabled={otp.length !== 6} onClick={verify}>Verify</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
