"use client";

import { WhatsappLogo } from "@phosphor-icons/react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export function WhatsAppFloater() {
  const { user, loading } = useAuth();

  // Only show for authenticated users
  if (loading || !user) return null;

  return (
    <Link
      href="https://wa.me/447961793661"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-6 right-6 z-50 flex items-center rounded-full bg-[#25D366] p-3 text-white shadow-lg transition-all duration-300 ease-in-out hover:pr-5 hover:shadow-xl active:scale-95"
    >
      <WhatsappLogo size={28} weight="fill" className="shrink-0" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 ease-in-out group-hover:max-w-[120px] group-hover:ml-2">
        Chat with us
      </span>
    </Link>
  );
}
