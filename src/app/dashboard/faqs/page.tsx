"use client";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, Loader2, Search } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

interface FAQ {
  id: number;
  slug: string;
  question: string;
  answer: string;
  created_at?: string;
  updated_at?: string;
}

interface FAQFormData {
  question: string;
  answer: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const faqApi = {
  getFaqs: async (params?: Record<string, string>): Promise<{ data: FAQ[]; meta: PaginationMeta }> => {
    const token = localStorage.getItem("authToken");
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    const response = await fetch(`/api/admin/faqs${qs}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch FAQs");
    const data = await response.json();
    return {
      data: data.data || data.faqs || data || [],
      meta: data.meta || data.pagination || {
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: (data.data || data.faqs || data || []).length,
      },
    };
  },

  createFaq: async (formData: FAQFormData): Promise<FAQ> => {
    const token = localStorage.getItem("authToken");
    const response = await fetch("/api/admin/faqs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || err.message || "Failed to create FAQ");
    }
    const result = await response.json();
    return result.data || result;
  },

  updateFaq: async (slug: string, formData: FAQFormData): Promise<FAQ> => {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`/api/admin/faqs/${slug}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || err.message || "Failed to update FAQ");
    }
    const result = await response.json();
    return result.data || result;
  },

  deleteFaq: async (slug: string): Promise<void> => {
    const token = localStorage.getItem("authToken");
    const response = await fetch(`/api/admin/faqs/${slug}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!response.ok && response.status !== 204) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Failed to delete FAQ");
    }
  },
};

const EMPTY_FORM: FAQFormData = { question: "", answer: "" };

export default function FaqsPage() {
  const { loading: authLoading } = useAuth();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState<FAQFormData>(EMPTY_FORM);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadFaqs = useCallback(async () => {
    if (authLoading) return;
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: "10",
      };
      if (debouncedSearch) params.search = debouncedSearch;
      const result = await faqApi.getFaqs(params);
      setFaqs(result.data);
      setMeta(result.meta);
    } catch {
      toast.error("Failed to load FAQs");
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, page, debouncedSearch]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const openAddDialog = () => {
    setEditingSlug(null);
    setFormData(EMPTY_FORM);
    setFormDialogOpen(true);
  };

  const openEditDialog = (faq: FAQ) => {
    setEditingSlug(faq.slug);
    setFormData({ question: faq.question, answer: faq.answer });
    setFormDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.question.trim()) {
      toast.error("Question is required");
      return;
    }
    if (!formData.answer.trim()) {
      toast.error("Answer is required");
      return;
    }
    setIsSaving(true);
    try {
      if (editingSlug) {
        const updated = await faqApi.updateFaq(editingSlug, formData);
        setFaqs((prev) => prev.map((f) => (f.slug === editingSlug ? updated : f)));
        toast.success("FAQ updated successfully");
      } else {
        await faqApi.createFaq(formData);
        toast.success("FAQ created successfully");
        await loadFaqs();
      }
      setFormDialogOpen(false);
      setFormData(EMPTY_FORM);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!faqToDelete) return;
    setIsDeleting(true);
    try {
      await faqApi.deleteFaq(faqToDelete.slug);
      setFaqs((prev) => prev.filter((f) => f.slug !== faqToDelete.slug));
      setMeta((prev) => ({ ...prev, total: prev.total - 1 }));
      toast.success("FAQ deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsDeleting(false);
      setFaqToDelete(null);
    }
  };

  const dialogTitle = editingSlug ? "Edit FAQ" : "Add FAQ";

  return (
    <div className="p-2 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">FAQs</h1>
        <Button
          className="bg-[#93C01F] hover:bg-[#7ea919] text-white gap-2"
          onClick={openAddDialog}
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FAQs..."
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading FAQs...
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {debouncedSearch ? "No FAQs match your search." : "No FAQs yet. Add one to get started."}
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={faq.slug}
              className="group flex items-start gap-4 p-5 border border-gray-200 rounded-xl bg-white hover:border-[#93C01F]/40 hover:bg-[#F4F9E8]/30 transition-colors"
            >
              <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-[#93C01F]/10 text-[#5F8B0A] flex items-center justify-center text-sm font-semibold">
                {(page - 1) * 10 + idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-snug">
                  {faq.question}
                </p>
                <p className="mt-1.5 text-gray-500 text-sm leading-relaxed whitespace-pre-wrap">
                  {faq.answer}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                <button
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                  onClick={() => openEditDialog(faq)}
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                  onClick={() => setFaqToDelete(faq)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Page {meta.current_page} of {meta.last_page} &middot; {meta.total} total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          if (!open) setFormData(EMPTY_FORM);
          setFormDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{dialogTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-gray-600">Question</Label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData((p) => ({ ...p, question: e.target.value }))}
                placeholder="Enter the question"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-600">Answer</Label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData((p) => ({ ...p, answer: e.target.value }))}
                placeholder="Enter the answer"
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setFormDialogOpen(false);
                setFormData(EMPTY_FORM);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#93C01F] hover:bg-[#7da815] text-white"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingSlug ? (
                "Save Changes"
              ) : (
                "Add FAQ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!faqToDelete}
        onOpenChange={(open) => !open && setFaqToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the question:{" "}
              <strong>&ldquo;{faqToDelete?.question}&rdquo;</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete FAQ"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
