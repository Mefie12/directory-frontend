/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VerifyOtp({
  business,
  claimedEmail,
  onNext,
}: {
  business: any;
  claimedEmail: string;
  onNext: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(165);
  const [otpValue, setOtpValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
  const listingIdentifier = business?.slug || business?.id;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpValue(digits);
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

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
    if (otpValue.length < 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    if (!listingIdentifier) {
      toast.error("Listing identifier not found. Please restart the claim.");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${API_URL}/api/listing/${listingIdentifier}/verify_claim_by_email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            otp: otpValue,
            email: claimedEmail,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid verification code");
      }

      toast.success("Listing verified successfully!");
      onNext();
    } catch (error: any) {
      toast.error(error.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!listingIdentifier) return;

    try {
      const token = localStorage.getItem("authToken");

      const response = await fetch(
        `${API_URL}/api/listing/${listingIdentifier}/resend_otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            email: claimedEmail,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to resend code");

      setTimer(60);
      toast.success("Code resent successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
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
          We&apos;ve sent a 6-digit verification code to{" "}
          <span className="font-bold text-[#1F3A4C]">{claimedEmail}</span>.
          Please enter it below.
        </p>
      </div>

      {/* OTP input area */}
      <div
        className="relative flex justify-between gap-2 mb-8 cursor-text"
        onClick={focusInput}
      >
        {/* Real input overlaid transparently — receives all keyboard/paste events natively */}
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

        {/* Visual digit boxes */}
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
          <span className="text-[#1F3A4C]">{formatTime(timer)}</span>
        </div>
        <p className="text-gray-500">
          Didn&apos;t receive a code?{" "}
          <button
            onClick={handleResendCode}
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
