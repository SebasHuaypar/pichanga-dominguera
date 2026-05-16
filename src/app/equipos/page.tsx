"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Team } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { HiShieldCheck, HiPlus, HiXMark, HiPhoto, HiLockClosed, HiPencilSquare, HiArrowPath, HiNoSymbol } from "react-icons/hi2";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

export default function EquiposPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsAdmin(localStorage.getItem("pichanga_admin") === "true");
    fetchTeams();

    if (isOpen || editingTeam) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = 'unset';
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.documentElement.style.overflow = 'unset';
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, editingTeam]);

  async function fetchTeams() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setPreview(team.logo_url || null);
  };

  const handleSaveTeam = async () => {
    try {
      setLoading(true);
      let logo_url = preview;

      // Si hay un preview pero no es una URL (es base64 de un nuevo archivo)
      if (preview && preview.startsWith('data:')) {
        const file = document.querySelector('input[type="file"]') as HTMLInputElement;
        const actualFile = file?.files?.[0];
        if (actualFile) {
          const fileExt = actualFile.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('logos')
            .upload(filePath, actualFile);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath);
          
          logo_url = publicUrl;
        }
      }

      const teamData = {
        name: teamName,
        logo_url: logo_url,
        points: 0, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0
      };

      if (editingTeam) {
        const { error } = await supabase
          .from('teams')
          .update(teamData)
          .eq('id', editingTeam.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('teams')
          .insert([teamData]);
        if (error) throw error;
      }

      fetchTeams();
      setIsOpen(false);
      setEditingTeam(null);
      setPreview(null);
      setTeamName("");
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Error al guardar el equipo. Verifica que el bucket "logos" exista en Supabase.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(team: Team) {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ is_active: !team.is_active })
        .eq('id', team.id);
      
      if (error) throw error;
      fetchTeams();
    } catch (error) {
      console.error('Error toggling team status:', error);
    }
  }

  return (
    <main className="min-h-screen pb-20">
      <Header />
      
      <section className="pt-32 pb-12 px-4 text-center">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic text-white">
          CLUBES <br /> <span className="text-accent text-3xl sm:text-5xl">DEL BARRIO</span>
        </h1>
        <p className="mt-4 text-white/40 text-xs sm:text-sm font-bold uppercase tracking-[0.3em]">
          Los {teams.filter(t => t.is_active).length} grandes que dejan la vida en la cancha
        </p>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        {loading && teams.length === 0 ? (
          <div className="py-20 text-center animate-pulse">
            <HiArrowPath className="w-12 h-12 text-white/10 mx-auto animate-spin" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/20">Cargando Clubes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {teams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative aspect-square bg-card border border-white/5 rounded-3xl overflow-hidden hover:border-accent/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,59,59,0.1)]"
              >
                <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity p-8 pointer-events-none">
                  <Image src="/images/logo_vecinos.svg" alt="" fill unoptimized className="object-contain grayscale scale-125 rotate-12" />
                </div>

                {isAdmin && (
                  <>
                    <button 
                      onClick={() => toggleActive(team)}
                      className={cn(
                        "absolute top-4 left-4 p-2 rounded-xl transition-all z-20",
                        team.is_active 
                          ? "bg-white/5 text-white/20 hover:text-white hover:bg-white/10" 
                          : "bg-accent/20 text-accent hover:bg-accent hover:text-white"
                      )}
                      title={team.is_active ? "Desactivar equipo" : "Activar equipo"}
                    >
                      <HiNoSymbol className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleEditClick(team)}
                      className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 text-white/20 hover:text-accent hover:bg-accent/10 transition-all z-20"
                    >
                      <HiPencilSquare className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 transition-all duration-500",
                  !team.is_active && "opacity-40 grayscale"
                )}>
                  <div className="w-20 h-20 sm:w-28 sm:h-28 bg-background rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-accent/20 transition-all duration-500 relative z-10 group-hover:scale-110">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt="" className="w-full h-full object-contain p-2" />
                    ) : (
                      <HiShieldCheck className="w-12 h-12 text-white/5 group-hover:text-accent transition-colors" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-xl font-black uppercase italic tracking-tighter text-white/90 group-hover:text-white transition-colors">
                      {team.name}
                    </h3>
                    {!team.is_active && (
                      <p className="text-[10px] font-black uppercase text-accent tracking-widest">Inactivo</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add Team Button */}
            {isAdmin && (
              <motion.button
                onClick={() => setIsOpen(true)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative aspect-square bg-transparent border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-accent/40 hover:bg-accent/[0.02] transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                  <HiPlus className="w-6 h-6 text-white/20 group-hover:text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-accent">
                  Inscribir Club
                </span>
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Modal - Restricted Access, Registration or Edit Form */}
      <AnimatePresence>
        {(isOpen || editingTeam) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOpen(false);
                setEditingTeam(null);
                setPreview(null);
                setTeamName("");
              }}
              className="absolute inset-0 bg-background/90 backdrop-blur-xl"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-card border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl overflow-hidden"
            >
              {isAdmin ? (
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white">
                      {editingTeam ? "Editar Club" : "Nuevo Club"}
                    </h2>
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        setEditingTeam(null);
                        setPreview(null);
                        setTeamName("");
                      }} 
                      className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                      <HiXMark className="w-6 h-6 text-white/40" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Nombre</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Real Vecinos FC"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full bg-background border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-accent/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Escudo</label>
                      <div className="relative group/upload">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-20"
                        />
                        <div className={cn(
                          "w-full aspect-video rounded-2xl border-2 border-dashed border-white/5 bg-background flex flex-col items-center justify-center gap-2 transition-all",
                          preview ? "border-accent/20 bg-accent/[0.02]" : "group-hover/upload:border-white/20 group-hover/upload:bg-white/[0.02]"
                        )}>
                          {preview ? (
                            <div className="relative w-16 h-16">
                              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <>
                              <HiPhoto className="w-8 h-8 text-white/10 group-hover/upload:text-accent/40 transition-colors" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Elegir Archivo</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full btn-primary py-4 text-base font-black italic uppercase disabled:opacity-50"
                    onClick={handleSaveTeam}
                  >
                    {loading ? "Guardando..." : (editingTeam ? "Guardar Cambios" : "Unirse a la pichanga")}
                  </button>
                </div>
              ) : (
                <div className="relative z-10 text-center space-y-8 py-4">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                      <HiShieldCheck className="w-10 h-10 text-accent" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Acceso Restringido</h2>
                    <p className="text-white/40 text-xs font-bold leading-relaxed">
                      Solo el administrador oficial puede inscribir o editar clubes en el torneo dominguero.
                    </p>
                  </div>

                  <div className="pt-4 space-y-4 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">¿Eres el administrador?</p>
                    <Link 
                      href="/login"
                      className="w-full btn-primary py-4 text-sm flex items-center justify-center gap-2"
                    >
                      <HiLockClosed className="w-4 h-4" />
                      Identificarse ahora
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
