"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import Notifications from "@/components/Notifications";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f3f3]">
        <div className="text-sm text-[#545b64]">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <TopBar />
      <Sidebar />
      <Notifications />
      <main className="ml-[220px] mt-[40px] min-h-[calc(100vh-40px)] p-6">
        {children}
      </main>
    </>
  );
}
