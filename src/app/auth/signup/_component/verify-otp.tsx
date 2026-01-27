"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface VerifyOtpProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading: boolean;
}

export default function VerifyOtp({
  email,
  onVerify,
  onResend,
  isLoading,
}: VerifyOtpProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Added: Auto-fill on paste logic
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pastedData.every((char) => /^\d$/.test(char))) {
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(pastedData.length - 1, 5)]?.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Verify your email</h2>
        <p className="text-sm text-gray-500">Sent to {email}</p>
      </div>

      <div className="flex justify-center gap-2">
        {otp.map((digit, i) => (
          <Input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            className="w-12 h-12 text-center text-lg font-bold"
            value={digit}
            onPaste={handlePaste} // Paste listener
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          />
        ))}
      </div>

      <Button
        className="w-full bg-[#93C01F] hover:bg-[#82ab1b]"
        disabled={isLoading || otp.some((d) => !d)}
        onClick={() => onVerify(otp.join(""))}
      >
        {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Verify Code"}
      </Button>

      <div className="text-center text-sm">
        {timer > 0 ? (
          <span className="text-gray-500">Resend in {timer}s</span>
        ) : (
          <button
            type="button"
            onClick={() => {
              onResend();
              setTimer(60); // Reset timer on resend
            }}
            className="text-[#93C01F] font-bold underline hover:text-[#82ab1b]"
          >
            Resend Code
          </button>
        )}
      </div>
    </div>
  );
}
