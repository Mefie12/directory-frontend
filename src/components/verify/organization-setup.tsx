"use client";

import { useState } from "react";
import { 
  Building2, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  ArrowRight, 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function OrganizationSetup({ onNext }: { onNext: () => void }) {
  const [mode, setMode] = useState<"select" | "create">("select");
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [selectedOrg, setSelectedOrg] = useState("");
  const [newOrgData, setNewOrgData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const handleContinue = () => {
    setIsLoading(true);
    // Simulate API call to link or create organization
    setTimeout(() => {
      setIsLoading(false);
      onNext();
    }, 1500);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#1F3A4C] mb-3">
          Organization Setup
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          To manage a business profile, you must first establish your organization relationship. Link an existing entity or create a fresh identity.
        </p>
      </div>

      {/* Mode Switcher Cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => setMode("select")}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
            mode === "select"
              ? "border-[#93C01F] bg-[#93C01F]/5 text-[#1F3A4C]"
              : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
          }`}
        >
          <Search className={`w-6 h-6 mb-2 ${mode === "select" ? "text-[#93C01F]" : "text-gray-400"}`} />
          <span className="text-xs font-bold uppercase tracking-wide">Find Existing</span>
        </button>

        <button
          onClick={() => setMode("create")}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
            mode === "create"
              ? "border-[#93C01F] bg-[#93C01F]/5 text-[#1F3A4C]"
              : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
          }`}
        >
          <Plus className={`w-6 h-6 mb-2 ${mode === "create" ? "text-[#93C01F]" : "text-gray-400"}`} />
          <span className="text-xs font-bold uppercase tracking-wide">Create New</span>
        </button>
      </div>

      {/* --- SELECT MODE --- */}
      {mode === "select" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-4 h-4 text-[#93C01F]" />
              <h3 className="font-bold text-[#1F3A4C]">Select an existing organization</h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Organization
              </label>
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger className="mt-2 w-full h-14 bg-gray-50 border-gray-200 rounded-lg focus:ring-[#93C01F]">
                  <SelectValue placeholder="Search for your organization..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acme">Acme Corp Industries</SelectItem>
                  <SelectItem value="global">Global Tech Solutions</SelectItem>
                  <SelectItem value="local">Local Market Vendors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE MODE --- */}
      {mode === "create" && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-[#93C01F]" />
              <h3 className="font-bold text-[#1F3A4C]">Create a new Organization</h3>
            </div>

            {/* Org Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Organization Legal Name
              </label>
              <Input 
                placeholder="e.g. Acme Corp Industries" 
                className="h-12 bg-gray-50 border-gray-200 rounded-lg focus-visible:ring-[#93C01F] shadow-none"
                value={newOrgData.name}
                onChange={(e) => setNewOrgData({...newOrgData, name: e.target.value})}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Business Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="contact@company.com" 
                  className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-lg focus-visible:ring-[#93C01F] shadow-none"
                  value={newOrgData.email}
                  onChange={(e) => setNewOrgData({...newOrgData, email: e.target.value})}
                />
              </div>
              <p className="text-[10px] text-gray-400">We&apos;ll send a domain verification link here.</p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="+1 (555) 000-0000" 
                  className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-lg focus-visible:ring-[#93C01F] shadow-none"
                  value={newOrgData.phone}
                  onChange={(e) => setNewOrgData({...newOrgData, phone: e.target.value})}
                />
              </div>
            </div>
           </div>
        </div>
      )}

      {/* Main Action Button */}
      <div className="mt-8">
        <Button
          onClick={handleContinue}
          disabled={isLoading || (mode === "select" && !selectedOrg) || (mode === "create" && !newOrgData.name)}
          className="w-full bg-[#93C01F] hover:bg-[#7ea919] text-white h-12 text-base font-medium rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              {mode === "select" ? "Select & Continue" : "Confirm & Create"} 
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}