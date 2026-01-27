/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Eye, EyeOff } from "lucide-react";
import VerifyOtp from "./_component/verify-otp";
import { toast } from "sonner";

// Phone Input Imports
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

export default function Signup() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    country_code: "+233", // Initialized to match defaultCountry="gh"
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
  });

  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      password: "",
    };
    let isValid = true;

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
      isValid = false;
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setErrors({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      password: "",
    });

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    const rawPhone = formData.phone.replace(/\D/g, ""); // Remove all non-digits
    const dialCodeDigits = formData.country_code.replace(/\D/g, "");

    const apiPhone = rawPhone.startsWith(dialCodeDigits)
      ? rawPhone.slice(dialCodeDigits.length)
      : rawPhone;

    const payload = {
      ...formData,
      phone: apiPhone, // Send only local digits to API
    };

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload), // Send the cleaned payload
      });

      const data = await response.json();
      if (!response.ok) {
        // If validation failed, display specific server message if available
        throw new Error(
          data.message || "Failed to register. Please check your details.",
        );
      }

      // if (token) {
      //   await login(token);
      //   router.push("/");
      // } else {
      //   setError("Login successful but no token received");
      // }
      // router.refresh();
      setShowOtp(true);
    } catch (err: any) {
      console.error("register failed:", err);
      setError(err.message || "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
      const res = await fetch(`${API_URL}/api/verify_email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");

      const token =
        data.token || data.access_token || data.jwt || data.data?.token;

      if (token) {
        await login(token);

        // 1. Show Success Notification
        toast.success("Account Verified!", {
          description: "Welcome to MeFie. You are now logged in.",
          duration: 3000,
        });

        // 2. Redirect to the landing page (Home)
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      toast.error("Verification Failed", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
      const res = await fetch(`${API_URL}/api/resend_otp`, {
        // Ensure this endpoint matches your API
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend code");

      // You can add a success toast here if you have a toast library installed
    } catch (err: any) {
      setError(err.message || "Could not resend verification code");
      throw err; // Re-throw to let the VerifyOtp component handle the local state (isResending)
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
  };

  const handlePhoneChange = (phone: string, meta: any) => {
    const dialCode = meta.country?.dialCode || "";

    setFormData((prev) => ({
      ...prev,
      phone: phone, // Store the full string so the input works
      country_code: dialCode.startsWith("+") ? dialCode : `+${dialCode}`,
    }));

    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  return (
    <div className="relative h-[98vh] flex items-center justify-center px-4 login-bg rounded-2xl">
      <div className="absolute inset-0 bg-black/30 rounded-2xl" />
      <Card className="relative z-10 w-full max-w-md rounded-2xl shadow-sm bg-white/95 backdrop-blur-md border-none ">
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

            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-[#93C01F] font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
          <div className="space-y-1 mt-0">
            <h2 className="text-4xl font-semibold text-gray-900">
              Let&apos;s get started
            </h2>
            <p className="text-gray-500 text-base">
              Please enter your details to continue
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {!showOtp ? (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name" className="text-sm">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      type="text"
                      placeholder="First Name"
                      className="w-full"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.first_name}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="last_name" className="text-sm">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="last_name"
                      type="text"
                      placeholder="Last Name"
                      className="w-full"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.last_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="phone" className="text-sm">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <PhoneInput
                      defaultCountry="gh"
                      value={formData.phone}
                      onChange={(phone, meta) => handlePhoneChange(phone, meta)}
                      inputClassName="w-full h-11 border border-gray-300 rounded-r-3xl px-4 focus:outline-none focus:ring-2 focus:ring-lime-500 font-sans text-sm text-gray-900"
                      className="w-full"
                      countrySelectorStyleProps={{
                        buttonStyle: {
                          paddingLeft: "12px",
                          paddingRight: "12px",
                          height: "36px", // Matches h-11 height
                          borderColor: "#d1d5db",
                          borderTopLeftRadius: "0.5rem",
                          borderBottomLeftRadius: "0.5rem",
                        },
                      }}
                      required
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <Label htmlFor="email" className="text-sm">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-sm bg-[#93C01F] hover:bg-[#82ab1b] text-white cursor-pointer py-6 rounded-xl"
                >
                  {isLoading ? "Processing..." : "Register"}
                </Button>
              </div>
            </form>
          ) : (
            <VerifyOtp
              email={formData.email}
              isLoading={isLoading}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
