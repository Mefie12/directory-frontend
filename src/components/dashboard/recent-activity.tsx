"use client";

import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "../ui/separator";

interface ActivityItem {
  id: string;
  initials: string;
  color: string; // tailwind color classes
  title: string;
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  items: ActivityItem[];
}

export default function RecentActivityCard({ items }: RecentActivityProps) {
  return (
    <div className="w-full rounded-2xl border border-[#E3E8EF] bg-white p-6 shadow-xs">
      <h2 className="text-xl font-semibold text-[#0F1A2A] mb-10">
        Recent Activity
      </h2>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-[#F0F4FF] flex items-center justify-center">
              <Image
                src="/images/icons/empty.svg"
                alt="No Activity"
                width={40}
                height={40}
              />
            </div>
            <p className="text-[#65758B] mt-3">No Recent Activity</p>
          </div>
        ) : (
          items.map((item, index) => (
            <div key={item.id}>
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar className={`h-10 w-10 rounded-full ${item.color}`}>
                  <AvatarFallback className="text-black font-semibold text-sm">
                    {item.initials}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-semibold text-[#0F1A2A]">{item.title}</h3>
                  <p className="text-[#3D4B61] mt-1 text-sm">
                    {item.description}
                  </p>
                  <p className="text-[#65758B] text-xs mt-2">
                    {item.timestamp}
                  </p>
                </div>
              </div>

              {/* Separator (between items only) */}
              {index !== items.length - 1 && (
                <Separator className="my-4 bg-[#E5EAF1]" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
