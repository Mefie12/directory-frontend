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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Claim {
  id: string;
  listing_slug: string;
  listing_name: string;
  user_name: string;
  role: string;
  document_url: string;
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
        // Note: using /api/claims for list
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        const claimsData = Array.isArray(data)
          ? data
          : data.data || data.claims || [];

        const normalizedClaims = claimsData.map((c: any) => ({
          id: c.id || c.claim_id || Math.random().toString(),
          listing_slug:
            c.listing_slug || c.slug || c.listing?.slug || c.listing_name || "",
          listing_name:
            c.listing_name || c.name || c.listing?.name || "Unknown Listing",
          user_name:
            c.user_name ||
            c.claimant_name ||
            c.claimed_by ||
            c.user?.name ||
            "Anonymous",
          role: c.role || "Claimant",
          document_url:
            c.document_url ||
            c.document?.url ||
            c.document ||
            c.evidence ||
            "#",
          status: c.status?.toLowerCase() || "pending",
          created_at: c.created_at || c.date_made || "",
        }));

        setClaims(normalizedClaims);
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

  // --- 2. Action Handler (Integrated with claim/{listing}/approve) ---
  const handleClaimAction = async (
  slug: string,
  action: "approve" | "reject",
) => {
  if (!slug) {
    toast.error("Invalid listing slug.");
    return;
  }

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

    // Try to parse the response even if it's not OK to get error details
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      toast.success(data.message || `Claim for ${slug} ${action}ed.`);
      await fetchClaims();
    } else {
      // Log the full error for debugging
      console.error("API Error:", {
        status: response.status,
        data: data,
        url: `${API_URL}/api/claim/${slug}/${action}`
      });
      
      throw new Error(data.message || `Failed to ${action} claim (${response.status}).`);
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1F3A4C]">
              Claims Management
            </h1>
            <p className="text-gray-500 mt-1">
              Verify business ownership through submitted documentation.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by listing or slug..."
              className="pl-10 h-11 border-gray-200 rounded-xl focus-visible:ring-[#93C01F]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
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
                <TableHead className="font-bold text-[#1F3A4C]">
                  Evidence
                </TableHead>
                <TableHead className="font-bold text-[#1F3A4C]">
                  Status
                </TableHead>
                <TableHead className="font-bold text-[#1F3A4C]">Date</TableHead>
                <TableHead className="text-right font-bold text-[#1F3A4C]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#93C01F] mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">
                      Loading claims...
                    </p>
                  </TableCell>
                </TableRow>
              ) : filteredClaims.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-64 text-center text-gray-400"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredClaims.map((claim) => (
                  <TableRow key={claim.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="font-bold text-[#1F3A4C]">
                        {claim.listing_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-600">
                      {claim.user_name}
                    </TableCell>
                    <TableCell>
                      <a
                        href={claim.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold text-[#93C01F] hover:text-[#7ea919]"
                      >
                        <FileText className="w-4 h-4" /> VIEW DOCUMENT{" "}
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
                    <TableCell className="text-sm font-medium text-gray-600">
                      {new Date(claim.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full"
                          >
                            <MoreVertical className="h-4 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-xl p-2"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              handleClaimAction(claim.listing_slug, "approve")
                            }
                            disabled={
                              processingSlug === claim.listing_slug ||
                              claim.status === "approved"
                            }
                            className="text-emerald-600 font-bold cursor-pointer rounded-lg"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                            Claim
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleClaimAction(claim.listing_slug, "reject")
                            }
                            disabled={
                              processingSlug === claim.listing_slug ||
                              claim.status === "rejected"
                            }
                            className="text-rose-600 font-bold cursor-pointer rounded-lg"
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Reject Claim
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
