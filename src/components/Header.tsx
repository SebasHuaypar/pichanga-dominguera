"use client";

import { useState, useEffect } from "react";
import { HiCalendarDays, HiUsers, HiChartBar, HiLockClosed, HiHome, HiCheckBadge, HiArrowRightOnRectangle } from "react-icons/hi2";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";

const navItems = [
  { name: "Barrio", href: "/", icon: HiHome },
  { name: "Cruces", href: "/fixture", icon: HiCalendarDays },
  { name: "Tabla", href: "/posiciones", icon: HiChartBar },
  { name: "Clubes", href: "/equipos", icon: HiUsers },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    // Verificar si es admin (mock localstorage)
    const checkAdmin = () => {
      const auth = localStorage.getItem("pichanga_admin");
      setIsAdmin(auth === "true");
    };

    window.addEventListener("scroll", handleScroll);
    checkAdmin();

    // Escuchar cambios en localStorage (opcional pero útil)
    window.addEventListener("storage", checkAdmin);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", checkAdmin);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("pichanga_admin");
    setIsAdmin(false);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* Top Header - Logo & Admin */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 sm:px-8 py-3",
          isScrolled || pathname !== "/"
            ? "bg-background/90 backdrop-blur-xl" 
            : "bg-transparent"
        )}
      >
        <nav className="max-w-6xl mx-auto flex items-center justify-between relative">
          {/* Logo */}
          <Link href="/" className="flex items-center group relative z-20">
            <div className="relative w-10 h-10 sm:w-14 sm:h-14 transition-transform duration-300">
              <Image 
                src="/images/logo_vecinos.svg" 
                alt="Pichanga Dominguera" 
                fill 
                unoptimized
                className="object-contain"
              />
            </div>
          </Link>

          {/* Desktop Links (Centered) */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1 z-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider whitespace-nowrap",
                    isActive 
                      ? "bg-accent text-white" 
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-accent/60")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Admin Button */}
          <div className="relative z-20">
            {isAdmin ? (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border border-accent/20 bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(255,59,59,0.1)]"
              >
                <HiCheckBadge className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span>Salir</span>
              </button>
            ) : (
              <Link 
                href="/login"
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border border-white/5 bg-white/5 text-white/40 hover:text-accent hover:border-accent/10 transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest"
              >
                <HiLockClosed className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span className="hidden sm:block">Admin</span>
                <span className="sm:hidden">Entrar</span>
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Bottom Navigation - Mobile Optimized */}
      <nav className="md:hidden fixed bottom-6 left-0 right-0 z-50 px-6 pointer-events-none">
        <div className="max-w-[340px] mx-auto pointer-events-auto">
          <div className="glass bg-background/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-1 flex items-center justify-around shadow-2xl shadow-black/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-1.5 rounded-xl transition-all relative",
                    isActive ? "text-accent" : "text-white/20"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                  <span className={cn(
                    "text-[7px] font-black uppercase tracking-widest transition-opacity leading-none",
                    isActive ? "opacity-100" : "opacity-0"
                  )}>
                    {item.name}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabMobile"
                      className="absolute inset-0 bg-accent/5 rounded-xl -z-10"
                      transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
