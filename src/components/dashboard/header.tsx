"use client";

import { useState } from "react";
import { Bell, LogOut, UserRoundPen, UserRoundPlus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex items-center justify-end px-10 py-4">
      <div className="flex items-center gap-4">

        <div className="flex items-center">
          <Bell className="h-6 w-6 text-gray-600" />
        </div>

        <div className="h-6 w-px bg-gray-300"></div>

        <DropdownMenu onOpenChange={(open) => setIsDropdownOpen(open)}>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar>
                <AvatarImage
                  src="/avatar.png"
                  alt="user"
                  className="border border-[#F3C5D5] rounded-full bg-[#F3C5D5]"
                />
                <AvatarFallback>SS</AvatarFallback>
              </Avatar>

              <span className="text-sm font-medium text-gray-700">
                Sharon Sings
              </span>
              <span
                className={`text-gray-700 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-1 h-4 w-4"
                >
                  <path
                    d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="rounded-lg">
            <div className="border border-gray-200 rounded-lg">
              <DropdownMenuItem asChild>
                <Link href="/profile-settings" className="flex items-center gap-2">
                  <UserRoundPen />
                  Profile settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/new-account" className="flex items-center gap-2">
                  <UserRoundPlus />
                  New account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/logout" className="flex items-center gap-2">
                  <LogOut />
                  Logout
                </Link>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}