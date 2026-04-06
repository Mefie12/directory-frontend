"use client";

import { WhatsappLogo } from "@phosphor-icons/react";
import Link from "next/link";

export function WhatsAppFloater() {
  return (
    <Link
      href="https://wa.me/YOUR_PHONE_NUMBER"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl active:scale-95"
    >
      <WhatsappLogo size={28} weight="fill" />
      <span className="text-sm font-semibold whitespace-nowrap">
        Chat with us
      </span>
    </Link>
  );
}
