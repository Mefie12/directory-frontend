/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export default function ClaimStatus({ business }: any) {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const slug = business?.slug || business?.id;

  return (
    <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center text-center pt-6">
      {/* Success icon */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-[#93C01F]/10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#93C01F] flex items-center justify-center shadow-lg shadow-[#93C01F]/30">
            <CheckCircle2 className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
        </div>
        {/* Decorative ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#93C01F]/20 animate-ping opacity-30" />
      </div>

      <h1 className="text-3xl font-extrabold text-[#1F3A4C] mb-2 leading-tight">
        Claim Submitted!
      </h1>
      <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
        Your claim for{" "}
        <span className="font-bold text-[#93C01F]">{business?.name}</span> has been
        received and is{" "}
        <span className="font-bold text-amber-500">under review</span>.
      </p>

      {/* What happens next */}
      <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm mb-8 p-5 text-left">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-[#1F3A4C]" />
          <h4 className="font-bold text-[#1F3A4C] text-sm">What happens next?</h4>
        </div>
        <ul className="space-y-4">
          {[
            "Our team will review your submitted evidence within 24–48 hours.",
            "You'll receive an email notification once the status changes.",
            "Once approved, your listing will display a verified badge.",
          ].map((text, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-600 items-start">
              <span className="w-6 h-6 rounded-full bg-[#93C01F]/10 text-[#1F3A4C] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="w-full space-y-3">
        <Button
          onClick={async () => {
            await refreshUser();
            router.push("/dashboard");
          }}
          className="w-full bg-[#93C01F] hover:bg-[#7ea919] text-white h-12 text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-[#93C01F]/20 active:scale-[0.98] transition-transform"
        >
          <LayoutDashboard className="w-4 h-4" />
          Go to Dashboard
        </Button>

        {slug && (
          <Button
            variant="outline"
            onClick={() => {
              const pathByType: Record<string, string> = { event: "events", community: "communities" };
              const segment = pathByType[business?.type] ?? "businesses";
              router.push(`/${segment}/${slug}`);
            }}
            className="w-full h-12 text-sm font-bold rounded-xl border-gray-200 text-[#1F3A4C] hover:bg-gray-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <ExternalLink className="w-4 h-4" />
            View Listing
          </Button>
        )}
      </div>
    </div>
  );
}
