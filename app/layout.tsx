"use client";

import "./globals.css";
import AppLayout from "@/components/layout/AppLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔥 importante: useState para que no recree el cliente en cada render
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="es">
      <body>
        <QueryClientProvider client={queryClient}>
          <AppLayout>{children}</AppLayout>
{/* 🔥 TOASTER */}
        <Toaster
  position="top-center"
  toastOptions={{
  style: {
    background: "#111827",
    color: "#e5e7eb",
    border: "1px solid #374151",
    padding: "10px 20px",
    fontSize: "13px",
    borderRadius: "6px",
    textAlign: "center",
  },
}}
/>

        </QueryClientProvider>
      </body>
    </html>
  );
}