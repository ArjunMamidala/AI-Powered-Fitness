// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import assets from "../assets/assets";
import { useClerk, useUser, UserButton } from "@clerk/clerk-react";

const links = [
  { name: "Home", path: "/" },
  {name: "Dashboard", path: "/dashboard"},
  { name: "Classes", path: "/classes" },
  { name: "Memberships", path: "/memberships" },
  { name: "Trainers", path: "/trainers" },
  { name: "Nutrition", path: "/nutrition" },
  { name: "Contact", path: "/contact" },
  { name: "Form Checker", path: "/form-checker" },
  { name: "Find Gyms", path: "/find-gyms"}
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { openSignIn, openSignUp } = useClerk();
  const { user } = useUser();

  useEffect(() => {
    if (location.pathname !== '/') {
      setIsScrolled(true);
      return;
    }
    else {
      setIsScrolled(false);
    }
    setIsScrolled(prev => location.pathname !== '/' ? true : prev);
    const onScroll = () => {
        setIsScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  return (
    <>
      {/* Skip link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 h-16 transition-all duration-300 ${
          isScrolled
            ? "shadow-md backdrop-blur-md bg-black/30"
            : "shadow-none bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-2 sm:px-4">
          {/* Left: Logo */}
          <Link
            to="/"
            className="ml-0 flex items-center gap-2 font-bold text-xl text-white"
          >
            <img
              src={assets.MorrisvilleTownFitnessCenter}
              alt="Morrisville Town Fitness Center"
              className={`h-10 w-auto object-contain ${
                isScrolled ? "opacity-90" : ""
              }`}
            />
            <span className="hidden sm:inline">AI-Powered Fitness</span>
          </Link>

          {/* Middle: Desktop links */}
          <ul className={`hidden md:flex items-center gap-8 transition-colors ${
            isScrolled ? "text-white/90" : "text-white"
        }`}>
            {links.map((l) => (
              <li key={l.path}>
                <NavLink
                  to={l.path}
                  className={({ isActive }) =>
                    [
                      "transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/70 rounded",
                      isActive
                        ? "font-semibold underline underline-offset-4"
                        : "opacity-95",
                    ].join(" ")
                  }
                >
                  {l.name}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              aria-label="Search"
              className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-white/70 text-white"
            >
              <Search className="h-5 w-5" />
            </button>

            {user ? (
              <UserButton />
            ) : (
              <>
                <button
                  onClick={openSignIn}
                  className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/70"
                >
                  Login
                </button>
                <button
                  onClick={openSignUp}
                  className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/70"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile: menu button */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden bg-black/40 backdrop-blur-md border-t border-white/10">
            <div className="mx-auto max-w-7xl px-4 py-4">
              <ul className="flex flex-col gap-4 text-white">
                {links.map((l) => (
                  <li key={l.path}>
                    <NavLink
                      to={l.path}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        [
                          "block w-full py-2",
                          "focus:outline-none focus:ring-2 focus:ring-white/70 rounded",
                          isActive
                            ? "font-semibold underline underline-offset-4"
                            : "",
                        ].join(" ")
                      }
                    >
                      {l.name}
                    </NavLink>
                  </li>
                ))}

                <li className="flex flex-col gap-2 mt-2">
                  {user ? (
                    <UserButton />
                  ) : (
                    <>
                      <button onClick={openSignIn}>Login</button>
                      <button onClick={openSignUp}>Sign Up</button>
                    </>
                  )}
                </li>
              </ul>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
