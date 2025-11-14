"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";


export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  // validation
  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
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
      email: "",
      password: "",
    });

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to login");
      }

      // handle successful login
      console.log("login successful:", data);

      router.push("/");
    } catch (error) {
      console.error("login failed:", error);
      setError("Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
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
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-[#93C01F] font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
          <div className="space-y-1 mt-0">
            <h2 className="text-4xl font-semibold text-gray-900">
              Sign in to mefie
            </h2>
            <p className="text-gray-500 text-base">
              Welcome back, please enter your details
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
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
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex item-center justify-between">
                  <Label htmlFor="password" className="text-sm">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-[#93C01F] font-medium hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-sm bg-[#93C01F] text-white cursor-pointer"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              {/* <div className="flex items-center justify-center gap-2 text-xs text-gray-400 my-4">
                <span className="flex-1 border-t" />
                OR
                <span className="flex-1 border-t" />
              </div> */}

              {/* alternative logins */}
              {/* <div className="flex flex-col gap-2 mt-2">
                <Button className="w-full text-sm bg-transparent text-gray-900 border border-gray-200 hover:bg-[#93C01F] hover:text-white cursor-pointer">
                  {" "}
                  Continue with Google{" "}
                  <span>
                    <Image
                      src="/images/icons/google.svg"
                      alt="Google"
                      width={20}
                      height={20}
                    />
                  </span>
                </Button>
                <Button className="w-full text-sm bg-transparent text-gray-900 border border-gray-200 hover:bg-[#93C01F] hover:text-white cursor-pointer">
                  Continue with Facebook
                  <span>
                    <Image
                      src="/images/icons/facebook-2.svg"
                      alt="Facebook"
                      width={20}
                      height={20}
                    />
                  </span>
                </Button>
              </div> */}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
