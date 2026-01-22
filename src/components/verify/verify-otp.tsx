/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VerifyOtp({ business, otp, setOtp, onNext }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(165);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleVerifyCode = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Email verified!");
      onNext();
    }, 2000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1F3A4C] mb-3">
          Enter 6-Digit Code
        </h2>
        <p className="text-gray-500 text-lg">
          We&apos;ve sent a 6-digit verification code to{" "}
          <span className="font-bold text-[#1F3A4C]">{business.email}</span>.
          Please enter it below.
        </p>
      </div>

      <div className="flex justify-between gap-2 mb-8">
        {otp.map((digit: string, index: number) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#1F3A4C] focus:ring-4 focus:ring-slate-100 outline-none transition-all text-[#1F3A4C]"
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 mb-12">
        <div className="flex items-center gap-2 text-gray-500 font-medium">
          Code expires in{" "}
          <span className="text-[#1F3A4C]">{formatTime(timer)}</span>
        </div>
        <p className="text-gray-500">
          Didn&apos;t receive a code?{" "}
          <button
            onClick={() => toast.info("Code resent!")}
            className="text-[#93C01F] font-bold hover:underline"
          >
            Resend Code
          </button>
        </p>
      </div>

      <Button
        onClick={handleVerifyCode}
        disabled={isLoading}
        className="w-full bg-[#93C01F] hover:bg-[#7ea919] text-white h-12 text-base font-medium rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            Verify & Continue <CheckCircle className="w-5 h-5" />
          </>
        )}
      </Button>
    </div>
  );
}
