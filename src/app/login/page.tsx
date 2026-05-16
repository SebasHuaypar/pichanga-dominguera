"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HiLockClosed, HiEnvelope, HiEye, HiEyeSlash, HiArrowLeft } from "react-icons/hi2";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Login oficial de Isaias
    if (email === "Isaias" && password === "Isaias123") {
      // Simulamos un delay de red para que se vea pro
      await new Promise(resolve => setTimeout(resolve, 800));
      localStorage.setItem("pichanga_admin", "true");
      router.push("/");
      router.refresh();
    } else {
      setError("Credenciales incorrectas. Solo el administrador Isaias tiene acceso.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <Link 
        href="/" 
        className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 p-2 text-white/40 hover:text-white transition-all text-xs font-black uppercase tracking-widest z-50 group"
      >
        <HiArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        <span className="hidden sm:block">Volver al Barrio</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="relative w-20 h-20 sm:w-32 sm:h-32">
            <Image 
              src="/images/logo_vecinos.svg" 
              alt="Logo" 
              fill 
              className="object-contain"
            />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle Watermark */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 opacity-[0.03] pointer-events-none">
            <HiLockClosed className="w-full h-full rotate-12" />
          </div>

          <div className="relative z-10 space-y-6 sm:space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
                ACCESO <span className="text-accent">ADMIN</span>
              </h1>
              <p className="text-white/20 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                Solo para organizadores del torneo
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Usuario</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors">
                    <HiEnvelope className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Isaias"
                    className="w-full bg-background border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white font-bold focus:outline-none focus:border-accent/50 transition-all placeholder:text-white/5"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Contraseña</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors">
                    <HiLockClosed className="w-5 h-5" />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-background border border-white/5 rounded-2xl pl-14 pr-14 py-4 text-white font-bold focus:outline-none focus:border-accent/50 transition-all placeholder:text-white/5"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPassword ? <HiEyeSlash className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-accent text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                  {error}
                </p>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary py-5 text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? "Verificando..." : "Entrar al Panel"}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-8 text-center text-white/10 text-[9px] font-black uppercase tracking-[0.2em]">
          Si olvidaste tu clave, contacta al soporte técnico del barrio.
        </p>
      </motion.div>
    </main>
  );
}
