"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--gd-color-forest)",
          color: "white",
          borderRadius: "16px",
          padding: "16px 20px",
          fontSize: "14px",
          fontWeight: "600",
          boxShadow: "0 20px 40px rgba(45, 80, 22, 0.3)",
        },
        success: {
          iconTheme: {
            primary: "var(--gd-color-leaf)",
            secondary: "white",
          },
          style: {
            background: "linear-gradient(135deg, var(--gd-color-avocado) 0%, var(--gd-color-leaf) 100%)",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--gd-color-apple)",
            secondary: "white",
          },
          style: {
            background: "linear-gradient(135deg, var(--gd-color-apple) 0%, var(--gd-color-strawberry) 100%)",
          },
        },
      }}
    />
  );
}

