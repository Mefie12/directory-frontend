/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MoreVertical,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Loader2,
  Search,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";


// --- Types ---
interface Claim {
  id: string;
  listing_slug: string;
  listing_name: string;
  user_name: string;
  role: string;
  document_url: string; // The URL to the evidence file
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingSlug, setProcessingSlug] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

  // --- 1. Fetch all claims ---
  const fetchClaims = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/claims`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setClaims(data.data || data);
      }
    } catch {
      toast.error("Failed to load claims database.");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // --- 2. Action Handler (Approve/Reject) ---
  const handleClaimAction = async (
    slug: string,
    action: "approve" | "reject",
  ) => {
    setProcessingSlug(slug);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/claim/${slug}/${action}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Claim for ${slug} has been ${action}ed.`);
        // Refresh data to show updated status
        fetchClaims();
      } else {
        throw new Error(data.message || `Failed to ${action} the claim.`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessingSlug(null);
    }
  };

  const filteredClaims = claims.filter(
    (c) =>
      c.listing_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.listing_slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-white p-8 pt-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-[#1F3A4C]">
                Claims Management
              </h1>
            </div>
            <p className="text-gray-500">
              Verify business ownership through submitted documentation.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by listing name or slug..."
              className="pl-10 h-11 border-gray-200 rounded-xl focus-visible:ring-[#93C01F]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Section */}

        <div className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[250px] font-bold text-[#1F3A4C]">
                  Listing Detail
                </TableHead>
                <TableHead className="font-bold text-[#1F3A4C]">
                  Claimant
                </TableHead>
                <TableHead className="font-bold text-[#1F3A4C]">Role</TableHead>
                <TableHead className="font-bold text-[#1F3A4C]">
                  Evidence
                </TableHead>
                <TableHead className="font-bold text-[#1F3A4C]">
                  Status
                </TableHead>
                <TableHead className="text-right font-bold text-[#1F3A4C]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-[#93C01F]" />
                      <p className="text-sm text-gray-400">
                        Loading claims database...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredClaims.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-64 text-center text-gray-400"
                  >
                    No pending claims found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClaims.map((claim) => (
                  <TableRow
                    key={claim.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell>
                      <div className="font-bold text-[#1F3A4C]">
                        {claim.listing_name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                        {claim.listing_slug}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-600">
                      {claim.user_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-lg px-2 py-0.5 border-gray-200 text-gray-500 font-bold text-[10px] uppercase"
                      >
                        {claim.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <a
                        href={claim.document_url}
                        target="_blank"
                        className="flex items-center gap-1.5 text-xs font-bold text-[#93C01F] hover:text-[#7ea919] transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        VIEW DOCUMENT
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                          claim.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : claim.status === "rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                          >
                            <MoreVertical className="h-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-xl p-2"
                        >
                          <DropdownMenuLabel className="text-xs text-gray-400">
                            Review Claim
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleClaimAction(claim.listing_slug, "approve")
                            }
                            disabled={processingSlug === claim.listing_slug}
                            className="text-emerald-600 font-bold focus:bg-emerald-50 focus:text-emerald-600 cursor-pointer rounded-lg"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve Claim
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleClaimAction(claim.listing_slug, "reject")
                            }
                            disabled={processingSlug === claim.listing_slug}
                            className="text-rose-600 font-bold focus:bg-rose-50 focus:text-rose-600 cursor-pointer rounded-lg"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject Claim
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
