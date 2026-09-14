"use client";

import { Loader2Icon } from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      closeButton
      theme={theme as ToasterProps["theme"]}
      // Toasts are colour-coded (richColors), so status icons are hidden; Sonner would
      // otherwise fall back to its own. The loading spinner stays, since it shows progress.
      className="toaster group [&_[data-sonner-toast]:not([data-type=loading])_[data-icon]]:hidden!"
      richColors
      icons={{
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#000000",
          "--normal-description": "#1a1a1a",
          "--normal-border": "#e5e5e5",
          "--border-radius": "8px",
          "--error-bg": "#fef2f2",
          "--error-text": "#991b1b",
          "--error-border": "#fecaca",
          "--success-bg": "#f0fdf4",
          "--success-text": "#166534",
          "--success-border": "#bbf7d0",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
