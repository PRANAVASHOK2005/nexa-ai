import { useState } from "react";
import {
  Bell,
  LogOut,
  Search,
  User,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";


export default function Navbar() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [profileOpen, setProfileOpen] =
    useState(false);


  const handleLogout = () => {
    logout();

    setProfileOpen(false);

    navigate("/login");
  };


  const userName =
    user?.name || "User";

  const userEmail =
    user?.email || "";


  const userInitial =
    userName
      .charAt(0)
      .toUpperCase();


  return (
    <header className="fixed right-0 top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:left-64">

      {/* Search */}

      <div className="hidden items-center gap-3 rounded-xl bg-slate-100 px-4 py-2.5 md:flex">

        <Search
          size={18}
          className="text-slate-400"
        />

        <input
          type="text"
          placeholder="Search..."
          className="w-64 bg-transparent text-sm outline-none"
        />

        <span className="rounded-md border bg-white px-2 py-1 text-xs text-slate-400">
          ⌘ K
        </span>

      </div>


      {/* Right side */}

      <div className="ml-auto flex items-center gap-4">

        {/* Notification */}

        <button
          type="button"
          className="relative rounded-xl p-2.5 hover:bg-slate-100"
        >

          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />

        </button>


        {/* User menu */}

        <div className="relative">

          <button
            type="button"
            onClick={() =>
              setProfileOpen(
                !profileOpen
              )
            }
            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-100"
          >

            {/* Avatar */}

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 font-semibold text-white">

              {userInitial}

            </div>


            {/* User info */}

            <div className="hidden text-left sm:block">

              <p className="text-sm font-semibold">

                {userName}

              </p>

              <p className="text-xs text-slate-500">

                Free Plan

              </p>

            </div>

          </button>


          {/* Dropdown */}

          {profileOpen && (

            <div className="absolute right-0 top-14 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

              {/* Account info */}

              <div className="border-b border-slate-100 px-4 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 font-semibold text-white">

                    {userInitial}

                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-semibold text-slate-900">

                      {userName}

                    </p>

                    <p className="truncate text-xs text-slate-500">

                      {userEmail}

                    </p>

                  </div>

                </div>

              </div>


              {/* Profile */}

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
              >

                <User size={17} />

                Profile & Settings

              </button>


              {/* Logout */}

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
              >

                <LogOut size={17} />

                Logout

              </button>

            </div>

          )}

        </div>

      </div>

    </header>
  );
}