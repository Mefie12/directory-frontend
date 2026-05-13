"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Loader2, UploadCloud, X as XIcon } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

// --- Types ---
interface Category {
  id: number;
  slug: string;
  name: string;
  type: "subCategory" | "mainCategory" | "tag";
  description?: string | null;
  parent_slug: string | null;
  is_top_category?: boolean | null;
  featured_image?: string | null;
}

interface CategoryFormData {
  name: string;
  type: "subCategory" | "mainCategory" | "tag";
  description: string;
  is_main: boolean;
  parent_slug: string | null;
  make_top_cat: boolean;
  imageFile?: File | null;
}

// --- API ---
const categoryApi = {
  getCategories: async (params?: Record<string, string>): Promise<Category[]> => {
    const token = localStorage.getItem("authToken");
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    const response = await fetch(`/api/categories${qs}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch categories");
    const data = await response.json();
    return data.data || data.categories || [];
  },

  createCategory: async (formData: CategoryFormData): Promise<Category> => {
    const token = localStorage.getItem("authToken");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
    const body = new FormData();
    body.append("name", formData.name);
    body.append("type", formData.type);
    body.append("description", formData.description || "");
    if (!formData.is_main && formData.parent_slug) body.append("parent_id", formData.parent_slug);
    if (formData.make_top_cat) body.append("is_top_category", "1");
    if (formData.imageFile) body.append("featured_image", formData.imageFile);
    const response = await fetch(`${API_URL}/api/categories`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to create category");
    }
    return (await response.json()).data;
  },

  updateCategory: async (slug: string, formData: CategoryFormData): Promise<Category> => {
    const token = localStorage.getItem("authToken");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
    const body = new FormData();
    body.append("name", formData.name);
    body.append("type", formData.type);
    body.append("description", formData.description || "");
    body.append("parent_id", formData.is_main ? "" : (formData.parent_slug || ""));
    body.append("is_top_category", formData.make_top_cat ? "1" : "0");
    if (formData.imageFile) body.append("featured_image", formData.imageFile);
    const response = await fetch(`${API_URL}/api/categories/${slug}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to update category");
    }
    return (await response.json()).data;
  },

  deleteCategory: async (slug: string): Promise<void> => {
    const token = localStorage.getItem("authToken");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
    const response = await fetch(`${API_URL}/api/categories/${slug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to delete category");
    }
  },
};

// --- Component ---
export default function CategoriesPage() {
  const { loading: authLoading } = useAuth();

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<Category | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Dialog state
  const [typeSelectOpen, setTypeSelectOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  // null = edit mode, "main" | "sub" = add mode
  const [addingType, setAddingType] = useState<"main" | "sub" | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    type: "subCategory",
    description: "",
    is_main: false,
    parent_slug: null,
    make_top_cat: false,
    imageFile: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mainCategories = allCategories.filter(
    (cat) => cat.type === "mainCategory" || cat.parent_slug === null
  );
  const subCategories = selectedMainCategory
    ? allCategories.filter((cat) => cat.parent_slug === selectedMainCategory.slug)
    : [];

  const loadCategories = useCallback(async () => {
    if (authLoading) return;
    setIsLoadingCategories(true);
    try {
      const categories = await categoryApi.getCategories();
      setAllCategories(categories);
      setSelectedMainCategory((prev) => {
        if (prev) return prev;
        return categories.find((c) => c.type === "mainCategory" || c.parent_slug === null) || null;
      });
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setIsLoadingCategories(false);
    }
  }, [authLoading]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const resetForm = () => {
    setFormData({ name: "", type: "subCategory", description: "", is_main: false, parent_slug: null, make_top_cat: false, imageFile: null });
    setImagePreview(null);
  };

  // ADD: open type chooser
  const handleAddCategoryClick = () => {
    setEditingSlug(null);
    resetForm();
    setTypeSelectOpen(true);
  };

  // ADD: after type is chosen
  const handleTypeChosen = (type: "main" | "sub") => {
    setAddingType(type);
    setFormData((prev) => ({
      ...prev,
      is_main: type === "main",
      type: type === "main" ? "mainCategory" : "subCategory",
      parent_slug: type === "sub"
        ? (selectedMainCategory?.slug || mainCategories[0]?.slug || null)
        : null,
    }));
    setTypeSelectOpen(false);
    setFormDialogOpen(true);
  };

  // EDIT: open form directly (existing behaviour)
  const handleEditCategoryClick = (category: Category) => {
    setAddingType(null);
    setEditingSlug(category.slug);
    setImagePreview(category.featured_image || null);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || "",
      is_main: category.type === "mainCategory",
      parent_slug: category.parent_slug,
      make_top_cat: category.is_top_category || false,
      imageFile: null,
    });
    setFormDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, imageFile: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) { toast.error("Category name is required"); return; }
    if (!formData.is_main && !formData.parent_slug) {
      toast.error("Please select a parent category"); return;
    }
    if (formData.is_main && formData.make_top_cat && !formData.imageFile && !imagePreview) {
      toast.error("Please upload an image for the top category"); return;
    }

    setIsSavingCategory(true);
    try {
      if (editingSlug) {
        const updated = await categoryApi.updateCategory(editingSlug, formData);
        setAllCategories((prev) => prev.map((c) => (c.slug === editingSlug ? updated : c)));
        toast.success("Category updated successfully");
      } else {
        const created = await categoryApi.createCategory(formData);
        setAllCategories((prev) => [...prev, created]);
        if (formData.is_main && mainCategories.length === 0) setSelectedMainCategory(created);
        toast.success("Category created successfully");
      }
      setFormDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete?.slug) return;
    setIsDeletingCategory(true);
    try {
      await categoryApi.deleteCategory(categoryToDelete.slug);
      setAllCategories((prev) => prev.filter((c) => c.slug !== categoryToDelete.slug));
      if (selectedMainCategory?.slug === categoryToDelete.slug) setSelectedMainCategory(null);
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsDeletingCategory(false);
      setCategoryToDelete(null);
    }
  };

  // Is the form showing a main-category context?
  const isMainContext = addingType === "main" || (editingSlug !== null && formData.is_main);

  const dialogTitle = editingSlug
    ? "Edit category"
    : addingType === "main"
    ? "Add Main Category"
    : "Add Sub Category";

  return (
    <div className="p-2 lg:p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Categories</h1>

      <div className="space-y-6">
        <div className="flex justify-end">
          <Button className="bg-[#93C01F] hover:bg-[#7ea919] text-white gap-2" onClick={handleAddCategoryClick}>
            <Plus className="w-4 h-4" /> Add category
          </Button>
        </div>

        {isLoadingCategories ? (
          <div className="text-center py-8">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Categories */}
            <div className="border border-gray-200 rounded-xl bg-white p-6 h-fit">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Main Category</h2>
              <div className="space-y-3">
                {mainCategories.map((cat) => (
                  <div
                    key={cat.slug}
                    className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors border group ${
                      selectedMainCategory?.slug === cat.slug
                        ? "bg-[#F4F9E8] border-[#93C01F] text-gray-900 font-medium"
                        : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedMainCategory(cat)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{cat.name}</span>
                      {cat.is_top_category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#93C01F]/15 text-[#5F8B0A]">
                          Top Category
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 text-gray-400 hover:text-gray-600" onClick={(e) => { e.stopPropagation(); handleEditCategoryClick(cat); }}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); setCategoryToDelete(cat); }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {mainCategories.length === 0 && (
                  <div className="text-center text-gray-500 py-4">No main categories found</div>
                )}
              </div>
            </div>

            {/* Sub Categories */}
            <div className="border border-gray-200 rounded-xl bg-white p-6 h-fit min-h-[500px]">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {selectedMainCategory ? `${selectedMainCategory.name} — Sub Categories` : "Sub Categories"}
              </h2>
              <Button variant="secondary" onClick={handleAddCategoryClick} className="w-full bg-gray-50 text-gray-600 border border-gray-100 mb-6 gap-2">
                <Plus className="w-4 h-4" /> Add sub category
              </Button>
              <div className="space-y-3">
                {subCategories.map((sub) => (
                  <div key={sub.slug} className="flex items-center justify-between group border-b border-gray-50 pb-3 last:border-0">
                    <span className="text-gray-700 text-sm">{sub.name}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 text-gray-400 hover:text-gray-600" onClick={() => handleEditCategoryClick(sub)}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600" onClick={() => setCategoryToDelete(sub)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {subCategories.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    {selectedMainCategory ? `No sub categories for ${selectedMainCategory.name}` : "Select a main category"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── STEP 1: Type Chooser (Add only) ── */}
      <Dialog open={typeSelectOpen} onOpenChange={setTypeSelectOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add a category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500 -mt-2">What type of category would you like to add?</p>
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => handleTypeChosen("main")}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-[#93C01F] hover:bg-[#93C01F]/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-[#93C01F]/10 flex items-center justify-center group-hover:bg-[#93C01F]/20 transition-colors">
                <Plus className="w-6 h-6 text-[#93C01F]" />
              </div>
              <span className="font-semibold text-gray-900 text-sm">Main Category</span>
              <span className="text-[11px] text-gray-400 text-center">Top-level category visible in navigation</span>
            </button>
            <button
              onClick={() => handleTypeChosen("sub")}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-[#93C01F] hover:bg-[#93C01F]/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-[#93C01F]/20 transition-colors">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-[#93C01F]" />
              </div>
              <span className="font-semibold text-gray-900 text-sm">Sub Category</span>
              <span className="text-[11px] text-gray-400 text-center">Nested under an existing main category</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── STEP 2 / EDIT: Category Form ── */}
      <Dialog open={formDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setFormDialogOpen(open); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{dialogTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Sub category: parent first */}
            {(!isMainContext) && (
              <div className="space-y-2">
                <Label className="text-gray-600">Parent Category</Label>
                <Select
                  value={formData.parent_slug || ""}
                  onValueChange={(v) => setFormData((p) => ({ ...p, parent_slug: v }))}
                >
                  <SelectTrigger className="w-full text-gray-500">
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainCategories.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                    {mainCategories.length === 0 && (
                      <SelectItem value="none" disabled>No main categories available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-gray-600">Category name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Category name"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-gray-600">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
                className="placeholder:text-gray-400"
              />
            </div>

            {/* Edit mode only: is_main toggle (keep existing behaviour) */}
            {editingSlug && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_main_cat"
                  checked={formData.is_main}
                  onCheckedChange={(checked) =>
                    setFormData((p) => ({
                      ...p,
                      is_main: !!checked,
                      type: checked ? "mainCategory" : "subCategory",
                      parent_slug: checked ? null : (selectedMainCategory?.slug || mainCategories[0]?.slug || null),
                      make_top_cat: checked ? p.make_top_cat : false,
                    }))
                  }
                  className="data-[state=checked]:bg-[#93C01F] data-[state=checked]:border-[#93C01F]"
                />
                <label htmlFor="edit_main_cat" className="text-sm font-medium leading-none">
                  Set as main category
                </label>
              </div>
            )}

            {/* Edit mode & sub: parent category */}
            {editingSlug && !formData.is_main && (
              <div className="space-y-2">
                <Label className="text-gray-600">Parent Category</Label>
                <Select
                  value={formData.parent_slug || ""}
                  onValueChange={(v) => setFormData((p) => ({ ...p, parent_slug: v }))}
                >
                  <SelectTrigger className="w-full text-gray-500">
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainCategories.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Main category only: Make top category */}
            {isMainContext && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="make_top_cat"
                    checked={formData.make_top_cat}
                    onCheckedChange={(checked) =>
                      setFormData((p) => ({ ...p, make_top_cat: !!checked, imageFile: checked ? p.imageFile : null }))
                    }
                    className="data-[state=checked]:bg-[#93C01F] data-[state=checked]:border-[#93C01F]"
                  />
                  <label htmlFor="make_top_cat" className="text-sm font-medium leading-none">
                    Make top category
                  </label>
                </div>

                {/* Image uploader — revealed when make_top_cat is checked */}
                {formData.make_top_cat && (
                  <div className="space-y-2">
                    <Label className="text-gray-600">Category Image</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    {imagePreview ? (
                      <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setImagePreview(null); setFormData((p) => ({ ...p, imageFile: null })); }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#93C01F] hover:bg-[#93C01F]/5 transition-all text-gray-400 hover:text-[#93C01F]"
                      >
                        <UploadCloud className="w-8 h-8" />
                        <span className="text-sm font-medium">Click to upload image</span>
                        <span className="text-xs">PNG, JPG, WebP up to 5MB</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => { setFormDialogOpen(false); resetForm(); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700">
              Cancel
            </Button>
            <Button className="bg-[#93C01F] hover:bg-[#7da815] text-white" onClick={handleSaveCategory} disabled={isSavingCategory}>
              {isSavingCategory ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : editingSlug ? "Save Changes" : "Add category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION ── */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category{" "}
              <strong>{categoryToDelete?.name}</strong> and potentially affect associated listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCategory}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteCategoryConfirm(); }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingCategory}
            >
              {isDeletingCategory ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</> : "Delete Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
