"use client";

// import { useState } from "react";
import {
  Bell,
  // ChevronDown,
  // LogOut,
  // UserRoundPlus,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { Button } from "../ui/button";

export default function Header() {
  // const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isPremium = false; // This would typically come from user data
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-end px-4 lg:px-10 py-1">
      {user && (
        <div className="flex items-center gap-4">
          <div>
            {isPremium ? (
              <Badge className="bg-[#FACC15] text-white px-2 py-2 shadow-sm">
                <span>
                  <Image
                    src="/images/icons/diamond.svg"
                    alt="diamond"
                    width={16}
                    height={16}
                  />
                </span>
                Premium
              </Badge>
            ) : (
              <Badge className="bg-[#419E6A] text-white px-2 py-2 shadow-sm">
                <span>
                  <Image
                    src="/images/icons/bulb.svg"
                    alt="diamond"
                    width={16}
                    height={16}
                  />
                </span>
                Basic
              </Badge>
            )}
          </div>
          <div className="flex items-center rounded-full bg-[#E9F0F6] p-2 cursor-pointer">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Bell className="h-5 w-5 text-gray-900" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="rounded-lg mt-2 w-80 space-y-4 p-0"
                align="end"
              >
                <div className="flex flex-row items-center justify-between px-1.5 py-2">
                  <DropdownMenuLabel>Notification</DropdownMenuLabel>
                  <div className="text-sm pr-3 cursor-pointer">
                    <Button variant="link" className="text-[#93C01F] cursor-pointer hover:no-underline">Mark all as read</Button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto px-2">
                <DropdownMenuItem>No new notifications</DropdownMenuItem>
                </div>
                <Separator className="mt-2 mb-0" />
                <div className="bg-[#F8FAFC] text-center w-full py-1">
                  <Button variant="link" className="cursor-pointer ">
                    View all notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.image} />
                  <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>

                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs font-semibold text-gray-900">
                    {user.name}
                  </span>
                  <Badge className="text-[10px] bg-[#FF8D2826] text-[#FF8D28] px-2 py-0 mt-1">
                    {user.role}
                  </Badge>
                </div>
                {/* <span
                className={`text-gray-900 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              >
                <ChevronDown className="h-4 w-4" />
              </span> */}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="rounded-lg mt-2 w-60 space-y-4"
              align="end"
            >
              <div className=" rounded-lg">
                <DropdownMenuItem asChild>
                  <div className="flex items-center gap-3 cursor-pointer">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.image} />
                      <AvatarFallback>
                        {user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-gray-900">
                        {user.name}
                      </span>
                      <Badge className="text-[10px] bg-[#FF8D2826] text-[#FF8D28] px-2 py-0 mt-1">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuItem>
                <Separator className="my-2" />
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile-settings"
                    className="flex items-center gap-2"
                  >
                    <Image
                      src="/images/icons/profile.svg"
                      alt=""
                      width={16}
                      height={16}
                    />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing" className="flex items-center gap-2">
                    <Image
                      src="/images/icons/billing.svg"
                      alt="Billing"
                      width={16}
                      height={16}
                    />
                    Billing & Subscriptions
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href="/billing" className="flex items-center gap-2">
                    <Image
                      src="/images/icons/help.svg"
                      alt="Help"
                      width={16}
                      height={16}
                    />
                    Help/Support
                  </Link>
                </DropdownMenuItem>
                <Separator className="my-2" />
                <DropdownMenuItem asChild>
                  <Button
                    variant="link"
                    onClick={logout}
                    className="flex items-center gap-2 text-red-500 hover:bg-transparent hover:no-underline hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Image
                      src="/images/icons/logout.svg"
                      alt="Logout"
                      width={16}
                      height={16}
                    />
                    Logout
                  </Button>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
