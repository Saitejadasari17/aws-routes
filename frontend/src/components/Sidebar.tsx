"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/console/dashboard", icon: "📊" },
  { label: "Hosted zones", href: "/console/hosted-zones", icon: "🌐" },
  { label: "Health checks", href: "/console/health-checks", icon: "💚" },
  { label: "Traffic policies", href: "/console/traffic-policies", icon: "🔀" },
  { label: "Resolver", href: "/console/resolver", icon: "🔍" },
  { label: "Profiles", href: "/console/profiles", icon: "👤" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-[#232f3e] text-white fixed left-0 top-[40px] bottom-0 overflow-y-auto z-40">
      <nav className="pt-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-5 py-2 text-[13px] transition-colors no-underline ${
                isActive
                  ? "bg-[#0972d3] text-white"
                  : "text-[#d5dbdb] hover:bg-[#2a3f5f] hover:text-white"
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#3b4a61] mt-4 pt-4 px-5">
        <div className="text-xs text-[#8d9bae] uppercase tracking-wider mb-2">
          Resources
        </div>
        <a
          href="#"
          className="block text-xs text-[#8d9bae] hover:text-white py-1 no-underline"
        >
          Documentation
        </a>
        <a
          href="#"
          className="block text-xs text-[#8d9bae] hover:text-white py-1 no-underline"
        >
          Getting started
        </a>
      </div>
    </aside>
  );
}
