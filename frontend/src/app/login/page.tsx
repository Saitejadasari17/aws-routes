"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push("/console/hosted-zones");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f3f3] flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* AWS Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M7.5 21L3 16.5L7.5 12" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 16.5H16.5C18.1 16.5 19.6 15.9 20.7 14.8C21.8 13.7 22.5 12.2 22.5 10.5C22.5 8.8 21.8 7.3 20.7 6.2C19.6 5.1 18.1 4.5 16.5 4.5H12" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#232f3e]">Sign in</h1>
        </div>

        <div className="bg-white border border-[#d5dbdb] rounded-lg p-8 shadow-sm">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-[#d13212] text-sm px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="aws-label">Username</label>
              <input
                type="text"
                className="aws-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
              />
            </div>

            <div className="mb-6">
              <label className="aws-label">Password</label>
              <input
                type="password"
                className="aws-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-[#ec7211] hover:bg-[#eb5f07] text-white text-sm font-bold rounded border-0 cursor-pointer disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#eaeded] text-center">
            <p className="text-xs text-[#545b64]">
              Default credentials: <strong>admin</strong> / <strong>admin123</strong>
            </p>
          </div>
        </div>

        <p className="text-xs text-[#545b64] text-center mt-4">
          Route 53 Clone — Built with Next.js & FastAPI
        </p>
      </div>
    </div>
  );
}
