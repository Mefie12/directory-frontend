/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { resendEmailClaimOtp, verifyEmailClaimOtp } from "@/lib/api";

const OTP_EXPIRY_SECONDS = 15 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtp({
  business,
  listingSlug,
  onNext,
}: {
  business: any;
  listingSlug: string;
  onNext: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [expiresIn, setExpiresIn] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [otpValue, setOtpValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpValue(digits);
  };

  useEffect(() => {
    if (expiresIn <= 0) return;
    const interval = setInterval(() => setExpiresIn((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(interval);
  }, [expiresIn]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleVerifyCode = async () => {
    if (otpValue.length < 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken") || undefined;
      await verifyEmailClaimOtp(listingSlug, otpValue, token);
      toast.success("Email verified — your case is now under admin review.");
      onNext();
    } catch (error: any) {
      toast.error(error.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      const token = localStorage.getItem("authToken") || undefined;
      await resendEmailClaimOtp(listingSlug, token);
      setExpiresIn(OTP_EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success("A new code has been sent.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  const digits = otpValue.split("");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1F3A4C] mb-3">
          Enter 6-Digit Code
        </h2>
        <p className="text-gray-500 text-lg">
          We&apos;ve sent a 6-digit verification code to {business?.name}&apos;s
          registered email address. Please enter it below.
        </p>
      </div>

      {/* OTP input area */}
      <div
        className="relative flex justify-between gap-2 mb-8 cursor-text"
        onClick={focusInput}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otpValue}
          onChange={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 w-full h-full opacity-0 z-10"
          aria-label="OTP input"
        />

        {Array.from({ length: 6 }).map((_, index) => {
          const isActiveSlot = isFocused && index === otpValue.length;
          const isFilled = index < digits.length;

          return (
            <div
              key={index}
              className={`
                w-12 h-14 md:w-14 md:h-16 flex items-center justify-center
                text-2xl font-bold rounded-xl border-2 transition-all
                text-[#1F3A4C] select-none
                ${isActiveSlot ? "border-[#1F3A4C] ring-4 ring-slate-100" : "border-gray-200"}
                ${isFilled ? "bg-white" : "bg-gray-50"}
              `}
            >
              {isFilled ? (
                digits[index]
              ) : isActiveSlot ? (
                <div className="w-px h-6 bg-[#1F3A4C] animate-pulse" />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2 mb-12">
        <div className="flex items-center gap-2 text-gray-500 font-medium">
          Code expires in{" "}
          <span className="text-[#1F3A4C]">{formatTime(expiresIn)}</span>
        </div>
        <p className="text-gray-500">
          Didn&apos;t receive a code?{" "}
          <button
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || isResending}
            className="text-[#93C01F] font-bold hover:underline disabled:text-gray-300 disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
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
