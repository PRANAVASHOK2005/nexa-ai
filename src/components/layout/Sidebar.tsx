import {
  BarChart3,
  FileText,
  History,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "AI Chat",
    icon: MessageSquare,
    path: "/chat",
  },
  {
    label: "Documents",
    icon: FileText,
    path: "/documents",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    path: "/analytics",
  },
  {
    label: "History",
    icon: History,
    path: "/history",
  },
  {
    label: "API Keys",
    icon: KeyRound,
    path: "/api-keys",
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-slate-800 bg-slate-950 text-white lg:block">

      <div className="flex h-full flex-col">

        {/* Logo */}
        <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950">
            <Sparkles size={21} />
          </div>

          <div>
            <h1 className="text-lg font-bold">
              NexaAI
            </h1>

            <p className="text-xs text-slate-400">
              AI Workspace
            </p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-2 px-4 py-6">

          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-slate-950"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`
                }
              >
                <Icon size={19} />

                {item.label}
              </NavLink>
            );
          })}

        </nav>

        {/* Bottom */}
        <div className="border-t border-slate-800 p-4">

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-white text-slate-950"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`
            }
          >
            <Settings size={19} />
            Settings
          </NavLink>

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-900 p-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-semibold text-slate-950">
              P
            </div>

            <div>
              <p className="text-sm font-medium">
                Pranav
              </p>

              <p className="text-xs text-slate-500">
                Free Plan
              </p>
            </div>

          </div>

        </div>

      </div>

    </aside>
  );
}