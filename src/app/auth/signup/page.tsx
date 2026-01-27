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
// Phone Input Imports
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

export default function Signup() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
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

  // validation
  const validateForm = () => {
    const newErrors = {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      password: "",
    };
    let isValid = true;

    // First Name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
      isValid = false;
    }

    // Last Name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
      isValid = false;
    }

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

    try {
      const API_URL = process.env.API_URL || "https://me-fie.co.uk";

      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to register");
      }

      // Handle successful registration
      // console.log("Registration successful:", data);

      // Redirect to login page
      const token =
        data.token || data.access_token || data.jwt || data.data?.token;

      if (token) {
        // console.log('✅ Token found:', token);
        await login(token);
        router.push("/");
      } else {
        // console.error('❌ No token found in response');
        setError("Login successful but no token received");
      }
      router.refresh();
    } catch (error) {
      console.error("register failed:", error);
      setError("Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));

    // Clear error for this field when user starts typing
    if (errors[e.target.id as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [e.target.id]: "",
      }));
    }
  };

  const handlePhoneChange = (value: string) => {
  setFormData((prev) => ({
    ...prev,
    phone: value,
  }));

  // Clear phone error if it exists
  if (errors.phone) {
    setErrors((prev) => ({
      ...prev,
      phone: "",
    }));
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
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 space-x-4">
                <div>
                  <Label htmlFor="first_name" className="text-sm">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    type="text"
                    placeholder="Enter your First Name"
                    className="w-full placeholder:text-xs"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-sm">{errors.first_name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-sm">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    type="text"
                    placeholder="Enter your Last Name"
                    className="w-full  placeholder:text-xs"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-sm">{errors.last_name}</p>
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
                    onChange={handlePhoneChange}
                    inputClassName="w-full h-11 border border-gray-300 rounded-r-3xl px-4 focus:outline-none focus:ring-2 focus:ring-lime-500 font-sans text-sm text-gray-900 bg-gray-300"
                    className="w-full"
                    countrySelectorStyleProps={{
                      buttonStyle: {
                        paddingLeft: "12px",
                        paddingRight: "12px",
                        height: "36px", // Now matches input (h-11 = 44px)
                        borderColor: "#d1d5db", // gray-300
                        borderTopLeftRadius: "0.5rem",
                        borderBottomLeftRadius: "0.5rem",
                      },
                    }}
                    required
                  />
                  {/* <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your Phone Number"
                    className="w-full  placeholder:text-xs"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  /> */}
                  {errors.phone && (
                    <p className="text-red-500 text-sm">{errors.phone}</p>
                  )}
                </div>
                <Label htmlFor="email" className="text-sm">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full  placeholder:text-xs"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
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
                    className="w-full placeholder:text-xs"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-4 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>

                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password}</p>
                  )}
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full text-sm bg-[#93C01F] text-white cursor-pointer"
              >
                {isLoading ? "Registering..." : "Register"}
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
                  <span>
                    <Image
                      src="/images/icons/google.svg"
                      alt="Google"
                      width={20}
                      height={20}
                    />
                  Continue with Google{" "}
                  </span>
                </Button>
                <Button className="w-full text-sm bg-transparent text-gray-900 border border-gray-200 hover:bg-[#93C01F] hover:text-white cursor-pointer">
                <span>
                  <Image
                    src="/images/icons/facebook-2.svg"
                    alt="Facebook"
                    width={20}
                    height={20}
                  />
                </span>
                  Continue with Facebook
                </Button>
              </div> */}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
