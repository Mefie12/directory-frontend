/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClaimStatus({ business }: any) {
  const router = useRouter();

  return (
    <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center text-center pt-10">
      {/* Pending Icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-[#93C01F]/20 rounded-full flex items-center justify-center">
          <div className="w-12 h-12 bg-[#93C01F] rounded-full flex items-center justify-center shadow-xs">
            <Clock className="w-6 h-6 text-white stroke-3" />
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-extrabold text-[#1F3A4C] mb-4 leading-tight">
        Claim Submitted!
      </h1>

      <p className="text-gray-500 mb-8 max-w-xs mx-auto">
        Thank you! Your claim for{" "}
        <span className="font-bold text-[#93C01F]">{business.name}</span> has
        been received and is currently{" "}
        <span className="font-bold text-[#E3C079]">under review</span>.
      </p>

      {/* Review Info Card */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 p-6 text-left">
        <h4 className="font-bold text-[#1F3A4C] mb-3">What happens next?</h4>
        <ul className="space-y-4">
          <li className="flex gap-4 text-sm text-gray-600 items-start">
            <span className="w-6 h-6 rounded-full bg-[#93C01F]/10 text-[#1F3A4C] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              1
            </span>
            <span>
              Our team will review your submitted evidence within 24-48 hours.
            </span>
          </li>
          <li className="flex gap-4 text-sm text-gray-600 items-start">
            <span className="w-6 h-6 rounded-full bg-[#93C01F]/10 text-[#1F3A4C] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              2
            </span>
            <span>
              You will receive an email update once the status changes.
            </span>
          </li>
        </ul>
      </div>

      <div className="w-full space-y-3">
        <Button
          onClick={() => router.push("/dashboard/vendor")}
          className="w-full bg-[#93C01F] hover:bg-[#7ea919] text-white h-12 text-base font-medium rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <LayoutDashboard className="w-5 h-5" /> Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
