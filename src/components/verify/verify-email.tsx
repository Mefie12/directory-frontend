/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Mail, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function VerifyEmail({ business, onNext }: any) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    setIsLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
      const token = localStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/api/verify_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: business.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Verification code sent!");
        onNext();
      } else {
        throw new Error(data.message || "Failed to send verification code.");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#1F3A4C] mb-3">
          Verify your Email
        </h2>
        <p className="text-gray-500">
          A verification code will be sent to your business email to confirm
          your identity.
        </p>
      </div>

      <Card className="p-8 border-gray-100 shadow-sm mb-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-[#93C01F]" />
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
          Business Email
        </p>
        <p className="text-lg font-bold text-[#1F3A4C]">{business.email}</p>
      </Card>

      <div className="bg-[#FFF9EA] border border-[#FFEBAA] rounded-xl p-4 flex gap-3 items-start mb-12">
        <Info className="w-5 h-5 text-[#B78828] shrink-0 mt-0.5" />
        <p className="text-sm text-[#8A6318] leading-relaxed">
          Please check your inbox and spam folder. The code will expire in 10
          minutes.
        </p>
      </div>

      <div className="mt-auto">
        <Button
          onClick={handleSendCode}
          disabled={isLoading}
          className="w-full bg-[#93C01F] hover:bg-[#7ea919] text-white h-12 text-base font-medium rounded-lg cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Send Code & Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
