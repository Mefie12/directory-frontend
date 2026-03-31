
"use client";
import { useState, useEffect, useCallback } from "react";
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
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

// --- Types ---
interface Category {
  id: string;
  name: string;
  type: "subCategory" | "mainCategory" | "tag";
  parent_id: string | null;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface CategoryFormData {
  name: string;
  type: "subCategory" | "mainCategory" | "tag";
  description: string;
  is_main: boolean;
  parent_id: string | null;
}

const categoryApi = {
  getCategories: async (): Promise<Category[]> => {
    const token = localStorage.getItem("authToken");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
    const response = await fetch(`${API_URL}/api/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch categories");
    const data = await response.json();
    return data.data || data.categories || [];
  },
  createCategory: async (categoryData: CategoryFormData): Promise<Category> => {
    const token = localStorage.getItem("authToken");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
    const payload = {
      name: categoryData.name,
      type: categoryData.type,
      description: categoryData.description || "",
      parent_id: categoryData.is_main ? null : categoryData.parent_id,
    };
    const response = await fetch(`${API_URL}/api/categories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create category");
    }
    const data = await response.json();
    return data.data;
  },
  updateCategory: async (
    id: string,
    categoryData: CategoryFormData
  ): Promise<Category> => {
    const token = localStorage.getItem("authToken");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
    const payload = {
      name: categoryData.name,
      type: categoryData.type,
      description: categoryData.description,
      parent_id: categoryData.is_main ? null : categoryData.parent_id,
    };
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update category");
    }
    const data = await response.json();
    return data.data;
  },
  deleteCategory: async (id: string): Promise<void> => {
    const token = localStorage.getItem("authToken");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete category");
    }
  },
};

export default function CategoriesPage() {
  const { loading: authLoading } = useAuth();

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] =
    useState<Category | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name: "",
    type: "subCategory",
    description: "",
    is_main: false,
    parent_id: null,
  });

  const mainCategories = allCategories.filter(
    (cat) => cat.type === "mainCategory" || cat.parent_id === null
  );

  const subCategories = allCategories.filter((cat) => {
    if (cat.type !== "subCategory") return false;
    if (!selectedMainCategory) return false;
    const catParentId = cat.parent_id?.toString();
    const selectedParentId = selectedMainCategory.id.toString();
    return catParentId === selectedParentId;
  });

  const loadCategories = useCallback(async () => {
    if (authLoading) return;
    setIsLoadingCategories(true);
    try {
      const categories = await categoryApi.getCategories();
      setAllCategories(categories);
      // Auto-select first main category if none selected
      if (categories.length > 0 && !selectedMainCategory) {
        const firstMainCategory = categories.find(
          (cat) => cat.type === "mainCategory" || cat.parent_id === null
        );
        if (firstMainCategory) {
          setSelectedMainCategory(firstMainCategory);
        }
      }
    } catch (error) {
      toast.error("Failed to load categories");
      console.error("Error loading categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [authLoading, selectedMainCategory]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Update form parent_id when switching main category logic
  useEffect(() => {
    if (!categoryFormData.is_main && selectedMainCategory) {
      setCategoryFormData((prev) => ({
        ...prev,
        parent_id: selectedMainCategory.id,
      }));
    }
  }, [selectedMainCategory, categoryFormData.is_main]);

  const handleAddCategoryClick = () => {
    setEditingCategoryId(null);
    setCategoryFormData({
      name: "",
      type: "subCategory",
      description: "",
      is_main: false,
      parent_id:
        selectedMainCategory?.id ||
        (mainCategories.length > 0 ? mainCategories[0].id : null),
    });
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategoryClick = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryFormData({
      name: category.name,
      type: category.type,
      description: category.description || "",
      is_main: category.type === "mainCategory",
      parent_id: category.parent_id,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete?.id) return;
    setIsDeletingCategory(true);
    try {
      await categoryApi.deleteCategory(categoryToDelete.id);
      setAllCategories((prev) =>
        prev.filter((item) => item.id !== categoryToDelete.id)
      );
      
      // If deleted the selected main category, clear selection
      if (selectedMainCategory?.id === categoryToDelete.id) {
          setSelectedMainCategory(null);
      }

      toast.success("Category deleted successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(errorMessage);
      console.error("Delete error:", error);
    } finally {
        setIsDeletingCategory(false);
        setCategoryToDelete(null);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!categoryFormData.is_main && !categoryFormData.parent_id) {
      toast.error("Please select a parent category for the sub-category");
      return;
    }

    setIsSavingCategory(true);
    try {
      if (editingCategoryId) {
        const updatedCategory = await categoryApi.updateCategory(
          editingCategoryId,
          categoryFormData
        );
        setAllCategories((prev) =>
          prev.map((item) =>
            item.id === editingCategoryId ? updatedCategory : item
          )
        );
        toast.success("Category updated successfully");
      } else {
        const newCategory = await categoryApi.createCategory(categoryFormData);
        setAllCategories((prev) => [...prev, newCategory]);
        if (categoryFormData.is_main && mainCategories.length === 0) {
          setSelectedMainCategory(newCategory);
        }
        toast.success("Category created successfully");
      }
      setIsCategoryDialogOpen(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(errorMessage);
      console.error("Save error:", error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleMainCategoryChange = (checked: boolean) => {
    setCategoryFormData((prev) => ({
      ...prev,
      is_main: checked,
      type: checked ? "mainCategory" : "subCategory",
      parent_id: checked
        ? null
        : selectedMainCategory?.id ||
          (mainCategories.length > 0 ? mainCategories[0].id : null),
    }));
  };

  return (
    <div className="p-2 lg:p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Categories</h1>

      <div className="space-y-6">
        <div className="flex justify-end">
          <Button
            className="bg-[#93C01F] hover:bg-[#7ea919] text-white gap-2"
            onClick={handleAddCategoryClick}
          >
            <Plus className="w-4 h-4" /> Add category
          </Button>
        </div>

        {isLoadingCategories ? (
          <div className="text-center py-8">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Categories Column */}
            <div className="border border-gray-200 rounded-xl bg-white p-6 h-fit">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Main Category
              </h2>
              <div className="space-y-3">
                {mainCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors border group ${
                      selectedMainCategory?.id === cat.id
                        ? "bg-[#F4F9E8] border-[#93C01F] text-gray-900 font-medium"
                        : "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedMainCategory(cat)}
                  >
                    <span>{cat.name}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategoryClick(cat);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategoryToDelete(cat);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {mainCategories.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No main categories found
                  </div>
                )}
              </div>
            </div>

            {/* Sub Categories Column */}
            <div className="border border-gray-200 rounded-xl bg-white p-6 h-fit min-h-[500px]">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Sub Categories
              </h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Showing sub-categories for:{" "}
                  <span className="font-semibold">
                    {selectedMainCategory?.name ||
                      "No main category selected"}
                  </span>
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={handleAddCategoryClick}
                className="w-full bg-gray-50 text-gray-600 border border-gray-100 mb-6 gap-2"
              >
                <Plus className="w-4 h-4" /> Add sub category
              </Button>

              <div className="space-y-6">
                {subCategories.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between group border-b border-gray-50 pb-4 last:border-0"
                  >
                    <span className="text-gray-700">{sub.name}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600"
                        onClick={() => handleEditCategoryClick(sub)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-red-600"
                        onClick={() => setCategoryToDelete(sub)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {subCategories.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    {selectedMainCategory
                      ? "No sub categories found for this main category"
                      : "Select a main category to view sub categories"}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- ADD/EDIT CATEGORY DIALOG --- */}
      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingCategoryId ? "Edit category" : "Adding a new category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="cat_name" className="text-gray-600">
                Category name
              </Label>
              <Input
                id="cat_name"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Category name"
              />
            </div>

            {/* Set as Main Category Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="main_cat"
                checked={categoryFormData.is_main}
                onCheckedChange={handleMainCategoryChange}
                className="data-[state=checked]:bg-[#93C01F] data-[state=checked]:border-[#93C01F]"
              />
              <label
                htmlFor="main_cat"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Set as main category
              </label>
            </div>

            {/* Parent Category Selector (only show for sub-categories) */}
            {!categoryFormData.is_main && (
              <div className="space-y-2">
                <Label htmlFor="parent_category" className="text-gray-600">
                  Parent Category
                </Label>
                <Select
                  value={categoryFormData.parent_id || ""}
                  onValueChange={(value) =>
                    setCategoryFormData((prev) => ({
                      ...prev,
                      parent_id: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full text-gray-500">
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    {mainCategories.length === 0 && (
                      <SelectItem value="none" disabled>
                        No main categories available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Category Type */}
            <div className="space-y-2">
              <Label htmlFor="cat_type" className="text-gray-600">
                Category type
              </Label>
              <Select
                value={categoryFormData.type}
                onValueChange={(
                  value: "subCategory" | "mainCategory" | "tag"
                ) =>
                  setCategoryFormData((prev) => ({
                    ...prev,
                    type: value,
                  }))
                }
              >
                <SelectTrigger className="w-full text-gray-500">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subCategory">Sub Category</SelectItem>
                  <SelectItem value="mainCategory">Main Category</SelectItem>
                  <SelectItem value="tag">Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="desc" className="text-gray-600">
                Description
              </Label>
              <Input
                id="desc"
                placeholder="Description"
                value={categoryFormData.description}
                onChange={(e) =>
                  setCategoryFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="placeholder:text-gray-400"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsCategoryDialogOpen(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#93C01F] hover:bg-[#7da815] text-white"
              onClick={handleSaveCategory}
              disabled={isSavingCategory}
            >
              {isSavingCategory
                ? "Saving..."
                : editingCategoryId
                ? "Save Changes"
                : "Add category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              category {categoryToDelete?.name} and potentially affect associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCategory}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteCategoryConfirm();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingCategory}
            >
              {isDeletingCategory ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                  </>
              ) : "Delete Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}