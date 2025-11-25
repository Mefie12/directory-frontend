"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function PreferenceField() {
  // Updated state to hold string values instead of booleans
  const [settings, setSettings] = useState({
    theme: "light",
    language: "en",
    timezone: "utc",
  });

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4 flex flex-col">
      {/* Theme */}
      <div className="flex items-center justify-between py-6 border border-gray-200 rounded-lg px-4">
        <div className="flex-1 pr-4">
          <h3 className="text-sm font-medium text-gray-900">Theme</h3>
          <p className="text-sm text-gray-500 mt-1">
            Customize the look and feel of the workspace to reduce eye strain.
          </p>
        </div>
        <Select
          value={settings.theme}
          onValueChange={(val) => updateSetting("theme", val)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Languages */}
      <div className="flex items-center justify-between py-6 border border-gray-200 rounded-lg px-4">
        <div className="flex-1 pr-4">
          <h3 className="text-sm font-medium text-gray-900">Language</h3>
          <p className="text-sm text-gray-500 mt-1">
            Select your preferred language for the dashboard interface.
          </p>
        </div>
        <Select
          value={settings.language}
          onValueChange={(val) => updateSetting("language", val)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timezone */}
      <div className="flex items-center justify-between py-6 border border-gray-200 rounded-lg px-4">
        <div className="flex-1 pr-4">
          <h3 className="text-sm font-medium text-gray-900">Timezone</h3>
          <p className="text-sm text-gray-500 mt-1">
            Set your local timezone to ensure calendar events display correctly.
          </p>
        </div>
        <Select
          value={settings.timezone}
          onValueChange={(val) => updateSetting("timezone", val)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="utc">UTC (GMT+0)</SelectItem>
            <SelectItem value="est">EST (GMT-5)</SelectItem>
            <SelectItem value="pst">PST (GMT-8)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button className="mt-6 bg-lime-500 text-white hover:bg-lime-600 w-36">
          Save changes
        </Button>
      </div>
    </div>
  );
}
