import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "GrowSume — AI Cold Email Platform",
  description:
    "AI-powered cold email automation platform. Manage campaigns, leads, inboxes, and analytics in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0b0f1a] text-slate-100 antialiased">
        <AppProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto bg-[#0b0f1a]">
                {children}
              </main>
            </div>
          </div>
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#111827",
                border: "1px solid #1f2d45",
                color: "#f1f5f9",
              },
            }}
          />
        </AppProvider>
      </body>
    </html>
  );
}
