"use client";

import { useAuth } from "@/lib/auth";
import { useState, useRef, useEffect } from "react";

export default function TopBar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="h-[40px] bg-[#232f3e] flex items-center px-4 text-white text-sm fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7.5 21L3 16.5L7.5 12" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 16.5H16.5C18.1 16.5 19.6 15.9 20.7 14.8C21.8 13.7 22.5 12.2 22.5 10.5C22.5 8.8 21.8 7.3 20.7 6.2C19.6 5.1 18.1 4.5 16.5 4.5H12" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-bold text-[15px] tracking-tight">
            <span className="text-white">aws</span>
          </span>
        </div>

        <span className="text-[#d5dbdb] text-xs">|</span>
        <span className="text-[13px] text-gray-300">Route 53</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-xs text-gray-300 border border-gray-600 rounded px-2 py-0.5">
          US East (N. Virginia)
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-xs text-gray-300 hover:text-white flex items-center gap-1"
          >
            {user?.username || "User"} ▾
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-56 bg-white text-[#16191f] border border-[#d5dbdb] rounded shadow-lg">
              <div className="px-4 py-3 border-b border-[#d5dbdb]">
                <div className="text-xs text-[#545b64]">Account ID</div>
                <div className="text-sm font-medium">{user?.account_id}</div>
              </div>
              <div className="px-4 py-3 border-b border-[#d5dbdb]">
                <div className="text-xs text-[#545b64]">IAM User</div>
                <div className="text-sm">{user?.username}</div>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  window.location.href = "/login";
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-[#f2f3f3] text-[#0972d3]"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
