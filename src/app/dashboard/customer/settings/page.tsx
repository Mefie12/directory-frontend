/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Eye,
  EyeOff,
  ChevronDown,
  Info,
  Trash,
  Loader2,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import PreferenceField from "@/components/dashboard/settings/preference-field";
import { useAuth } from "@/context/auth-context";

// --- Components (TabNav, Cards, Inputs, Buttons) ---

const TabNav = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex gap-8">{children}</nav>
    </div>
  );
};

const TabLink = ({
  href,
  active,
  children,
  onClick,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <Link
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
        active ? "text-lime-600" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-600" />
      )}
    </Link>
  );
};

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`bg-white border border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="p-6 pb-4">{children}</div>;
};

const CardContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="px-6 pb-6">{children}</div>;
};

const Input = ({
  type = "text",
  placeholder,
  className = "",
  showEyeIcon = false,
  value,
  onChange,
  name,
}: {
  type?: string;
  placeholder?: string;
  className?: string;
  showEyeIcon?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showEyeIcon && showPassword ? "text" : type;

  return (
    <div className="relative">
      <input
        type={inputType}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent ${className}`}
      />
      {showEyeIcon && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => {
  return (
    <label className="block text-sm font-medium text-gray-900 mb-1.5">
      {children}
    </label>
  );
};

const Button = ({
  children,
  variant = "default",
  disabled = false,
  className = "",
  onClick,
  isLoading = false,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
}) => {
  const baseStyles =
    "px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2";
  const variantStyles =
    variant === "outline"
      ? "bg-white border border-red-400 text-red-500 hover:bg-red-50"
      : disabled || isLoading
      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
      : "bg-lime-500 text-white hover:bg-lime-600";

  return (
    <button
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

const ToggleSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-lime-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
};

interface CountryCodeProps {
  value: string;
  onChange: (code: string) => void;
}

const CountryCodeDropdown = ({ value, onChange }: CountryCodeProps) => {
  const countries = [
    { code: "+1", flag: "🇺🇸" },
    { code: "+44", flag: "🇬🇧" },
    { code: "+233", flag: "🇬🇭" },
    { code: "+234", flag: "🇳🇬" },
    { code: "+91", flag: "🇮🇳" },
  ];

  const selected = countries.find((c) => c.code === value) || countries[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center gap-2 px-3 py-2.5  rounded-l-lg hover:bg-gray-50 transition-colors">
          <span className="text-xl leading-none">{selected.flag}</span>
          <span className="text-sm font-medium text-gray-700">
            {selected.code}
          </span>
          <ChevronDown size={16} className="text-gray-500" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-60 overflow-y-auto ml-10 mt-1">
        {countries.map((country) => (
          <DropdownMenuItem
            key={country.code}
            onClick={() => onChange(country.code)}
            className={`w-full cursor-pointer ${
              selected.code === country.code ? "bg-blue-50" : ""
            }`}
          >
            <div className="w-full flex items-center justify-between gap-2">
              <span className="text-xl leading-none">{country.flag}</span>
              <span className="text-gray-500">{country.code}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function detectCardType(number: string) {
  const cleaned = number.replace(/\D/g, "");
  if (/^4/.test(cleaned)) return "visa";
  if (/^3[47]/.test(cleaned)) return "amex";
  if (/^5[1-5]/.test(cleaned)) return "mastercard";
  if (/^6/.test(cleaned)) return "discover";
  return null;
}

function AddPaymentMethodDialog() {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const cardType = detectCardType(cardNumber);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-6 py-2.5 rounded-lg bg-lime-500 hover:bg-lime-600 text-white font-medium">
          Add payment method
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Add Payment Method
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Card number
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="1234 1234 1234 1234"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {cardType && (
                <Image
                  src={`/images/${cardType}.svg`}
                  alt={cardType}
                  width={40}
                  height={40}
                />
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1.5">
            Card name
          </label>
          <input
            type="text"
            placeholder="Card holder’s name"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              Expiry date
            </label>
            <input
              type="text"
              placeholder="Expiry date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              CVC/CVV
            </label>
            <input
              type="text"
              placeholder="Enter CVC/CVV"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <DialogClose asChild>
            <button className="px-6 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">
              Cancel
            </button>
          </DialogClose>
          <button className="px-6 py-2.5 rounded-lg bg-lime-600 text-white hover:bg-lime-700">
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Success Dialog Component ---
const SuccessDialog = ({
  open,
  onOpenChange,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl flex flex-col items-center text-center p-8">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
          <CheckCircle size={24} />
        </div>
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 w-full">
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Settings Component ---
export default function Settings() {
  const { refetchUser } = useAuth();
  const [activeTab, setActiveTab] = useState("account");

  // Profile State
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- Success Dialog State ---
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: "",
    description: "",
  });

  // --- Load user data directly from API to ensure fields are populated ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
        const response = await fetch(`${API_URL}/api/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Adjust based on your API response structure (e.g. data.data or direct object)
          const userData = data.data || data;

          setFirstName(userData.first_name || "");
          setLastName(userData.last_name || "");
          setEmail(userData.email || "");
          setRole(userData.role || "");
          setPhoneNumber(userData.phone || "");
        }
      } catch (error) {
        console.error("Failed to fetch user details", error);
      }
    };

    fetchUserData();
  }, []);

  // Notification toggles
  const [notifications, setNotifications] = useState({
    newInquiry: false,
    newReview: true,
    listingApproval: false,
    billingReminder: false,
  });

  // --- API Integrations ---

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
      const token = localStorage.getItem("authToken");

      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const body = new FormData();
      body.append("first_name", firstName);
      body.append("last_name", lastName);
      body.append("role", role || "user");
      body.append("phone", phoneNumber);

      // Laravel trick: Send POST with _method="PATCH" to handle FormData files correctly
      body.append("_method", "PATCH");

      if (fileInputRef.current?.files?.[0]) {
        body.append("avatar", fileInputRef.current.files[0]);
      }

      // Use POST for FormData compatibility
      const response = await fetch(`${API_URL}/api/update_user`, {
        method: "POST",
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      // const data = await response.json();

      // Refresh user data in context after successful update
      refetchUser();

      // Trigger Success Dialog
      setSuccessMessage({
        title: "Profile Updated",
        description: "Your profile details have been successfully updated.",
      });
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error(error);
      alert("Error updating profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmitPasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
      const token = localStorage.getItem("authToken");

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const body = {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      };

      // Changed to PATCH
      const response = await fetch(`${API_URL}/api/change_password`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }

      // Trigger Success Dialog
      setSuccessMessage({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });
      setSuccessDialogOpen(true);

      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error changing password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isProfileFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    phoneNumber.trim().length > 0;

  const isPasswordFormValid =
    passwordData.currentPassword.length > 0 &&
    passwordData.newPassword.length > 0 &&
    passwordData.confirmPassword.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-2 lg:p-8">
      {/* --- Success Dialog Instance --- */}
      <SuccessDialog
        open={successDialogOpen}
        onOpenChange={setSuccessDialogOpen}
        title={successMessage.title}
        description={successMessage.description}
      />

      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6 text-gray-900">Settings</h1>

        <TabNav>
          <TabLink
            href="?tab=account"
            active={activeTab === "account"}
            onClick={() => setActiveTab("account")}
          >
            Account
          </TabLink>
          <TabLink
            href="?tab=notifications"
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
          >
            Notifications
          </TabLink>
          <TabLink
            href="?tab=billing"
            active={activeTab === "billing"}
            onClick={() => setActiveTab("billing")}
          >
            Billing
          </TabLink>
          <TabLink
            href="?tab=preferences"
            active={activeTab === "preferences"}
            onClick={() => setActiveTab("preferences")}
          >
            Preferences
          </TabLink>
        </TabNav>

        {/* Account Tab */}
        {activeTab === "account" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Profile Details Card */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Profile Details
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Click on update to change your details
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    <div className="hidden">
                      <input
                        type="file"
                        ref={fileInputRef}
                        name="avatar"
                        accept="image/*"
                      />
                    </div>

                    <div>
                      <Label>First Name</Label>
                      <Input
                        placeholder="Jenny"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Last Name</Label>
                      <Input
                        placeholder="Wilson"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Email address</Label>
                      <Input
                        placeholder="jennywilson@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Phone Number</Label>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <CountryCodeDropdown
                          value={countryCode}
                          onChange={setCountryCode}
                        />
                        <div className="w-px h-12 bg-gray-300" />
                        <input
                          type="tel"
                          placeholder="Enter number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 px-4 py-2.5 outline-none text-sm"
                        />
                      </div>
                    </div>

                    {/* <div>
                        <Label>Profile Picture</Label>
                        <div className="flex items-center gap-4">
                            {user?.avatar && (
                                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                    <Image src={user.avatar} alt="Profile" fill className="object-cover" />
                                </div>
                            )}
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-fit"
                            >
                                <Camera size={16} /> Change Photo
                            </Button>
                        </div>
                    </div> */}

                    <Button
                      onClick={handleUpdateProfile}
                      isLoading={isUpdatingProfile}
                      disabled={!isProfileFormValid}
                    >
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Card */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Security
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    At least 8 characters with either a number or a symbol.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    <div>
                      <Label>Old password</Label>
                      <Input
                        name="currentPassword"
                        type="password"
                        placeholder="Enter old password"
                        showEyeIcon
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>

                    <div>
                      <Label>New password</Label>
                      <Input
                        name="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        showEyeIcon
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>

                    <div>
                      <Label>Confirm password</Label>
                      <Input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        showEyeIcon
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                      />
                    </div>

                    <Button
                      disabled={!isPasswordFormValid}
                      onClick={handleSubmitPasswordChange}
                      isLoading={isChangingPassword}
                    >
                      Change password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Delete Account Card */}
            <Card className="rounded-2xl mt-6">
              <div className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Account
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Make sure your changes are saved before leaving.
                  </p>
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  Delete
                  <Trash size={16} />
                </Button>
              </div>
            </Card>
          </>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="mt-8">
            <Card className="rounded-2xl">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  Notifications
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Click on update to change your details
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* New Inquiry Alert */}
                  <div className="flex items-start justify-between py-6 border border-gray-200 rounded-lg px-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        New Inquiry Alert
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Get notified when a customer sends you a new inquiry on
                        your listing
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={notifications.newInquiry}
                      onChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          newInquiry: checked,
                        })
                      }
                    />
                  </div>

                  {/* New Review Alert */}
                  <div className="flex items-start justify-between py-6 border border-gray-200 rounded-lg px-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        New Review Alert
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Receive an alert when someone leaves a review on your
                        business or event
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={notifications.newReview}
                      onChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          newReview: checked,
                        })
                      }
                    />
                  </div>

                  {/* Listing Approval Update */}
                  <div className="flex items-start justify-between py-6 border border-gray-200 rounded-lg px-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        Listing Approval Update
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        We&apos;ll notify you when your new or edited listing is
                        approved or rejected
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={notifications.listingApproval}
                      onChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          listingApproval: checked,
                        })
                      }
                    />
                  </div>

                  {/* Plan & Billing Reminder */}
                  <div className="flex items-start justify-between py-6 border border-gray-200 rounded-lg px-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        Plan & Billing Reminder
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Be alerted when your subscription is due for renewal or
                        payment fails.
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={notifications.billingReminder}
                      onChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          billingReminder: checked,
                        })
                      }
                    />
                  </div>
                </div>

                <Button className="mt-6">Save changes</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Plan Card */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Current Plan
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Your billing will show here
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Current billing cycle
                      </span>
                      <span className="text-sm text-lime-600 font-medium">
                        (Free)
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Currently not listing any services that require billing
                    </p>
                  </div>

                  <Button>Upgrade plan</Button>
                </CardContent>
              </Card>

              {/* Payment Methods Card */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Payment Methods
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage your payment method
                  </p>
                </CardHeader>
                <CardContent>
                  <AddPaymentMethodDialog />
                </CardContent>
              </Card>
            </div>

            {/* Billing History Card */}
            <Card className="rounded-2xl mt-6">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  Billing History
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  View your payments and invoices.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Info size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Currently have no past payment history yet
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preferences Tab (placeholder) */}
        {activeTab === "preferences" && (
          <div className="mt-8">
            <Card className="rounded-2xl">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">
                  Preferences
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Click on update to change your details
                </p>
              </CardHeader>
              <CardContent>
                <PreferenceField />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
