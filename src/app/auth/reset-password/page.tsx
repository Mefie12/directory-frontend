"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePassword() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    // current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({
    // current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const validateForm = () => {
    const newErrors = {
      //   current_password: "",
      new_password: "",
      confirm_password: "",
    };
    let isValid = true;

    // if (!formData.current_password) {
    //   newErrors.current_password = "Current password is required";
    //   isValid = false;
    // }

    if (!formData.new_password) {
      newErrors.new_password = "New password is required";
      isValid = false;
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your password";
      isValid = false;
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);
    setErrors({
      //   current_password: "",
      new_password: "",
      confirm_password: "",
    });

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

      // console.log("🚀 Sending request to:", `${API_URL}/api/change-password`);

      const response = await fetch(`${API_URL}/api/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add auth token if needed
          // "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          //   current_password: formData.current_password,
          new_password: formData.new_password,
          confirm_password: formData.confirm_password,
        }),
      });

      const data = await response.json();
      console.log("📥 Response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      console.log("✅ Password changed successfully");
      setSuccess(true);

      // Clear form
      setFormData({
        // current_password: "",
        new_password: "",
        confirm_password: "",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error) {
      console.error("❌ Change password failed:", error);
      setError(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    if (errors[id as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [id]: "",
      }));
    }

    if (error) {
      setError("");
    }
  };

  return (
    <div className="relative h-[98vh] flex items-center justify-center px-4 login-bg rounded-2xl">
      <div className="absolute inset-0 bg-black/30 rounded-2xl" />
      <Card className="relative z-10 w-full max-w-md rounded-2xl shadow-sm bg-white/95 backdrop-blur-md border-none">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Image
                src="/images/logos/login-logo.png"
                alt="MeFie Logo"
                width={110}
                height={50}
                className="object-cover"
              />
            </Link>
          </div>
          <div className="space-y-1 mt-0">
            <h2 className="text-4xl font-semibold text-gray-900">
              Change Password
            </h2>
            <p className="text-gray-500 text-sm">
              Enter your current password and choose a new one
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-green-800">
                      Password changed successfully!
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your password has been updated. Redirecting...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* <div className="space-y-2">
                  <Label htmlFor="current_password" className="text-sm">
                    Current Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="current_password"
                    type="password"
                    placeholder="Enter your current password"
                    className="w-full"
                    value={formData.current_password}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.current_password && (
                    <p className="text-red-500 text-sm">{errors.current_password}</p>
                  )}
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="new_password" className="text-sm">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="Enter your new password"
                    className="w-full"
                    value={formData.new_password}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.new_password && (
                    <p className="text-red-500 text-sm">
                      {errors.new_password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-sm">
                    Confirm New Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm your new password"
                    className="w-full"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.confirm_password && (
                    <p className="text-red-500 text-sm">
                      {errors.confirm_password}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-sm bg-[#93C01F] text-white cursor-pointer hover:bg-[#7da519] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Changing Password..." : "Change Password"}
                </Button>

                <div className="flex items-center justify-center">
                  <Link
                    href="/dashboard"
                    className="text-sm text-gray-600 hover:text-[#93C01F] transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Log in
                  </Link>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
