"use client";

import { useState, useEffect } from "react";
import { Match } from "@/types";
import { cn } from "@/lib/utils";
import { HiShieldCheck, HiMapPin, HiPencilSquare, HiXMark } from "react-icons/hi2";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface FixtureListProps {
  matches: Match[];
}

export default function FixtureList({ matches }: FixtureListProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  useEffect(() => {
    setIsAdmin(localStorage.getItem("pichanga_admin") === "true");
  }, []);

  const handleUpdateScore = async (matchId: string, home_score: number, away_score: number, status: Match['status'], scheduled_date?: string) => {
    try {
      const updateData: any = { home_score, away_score, status };
      if (scheduled_date) updateData.scheduled_date = scheduled_date;

      const { error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId);

      if (error) throw error;

      const { data: allTeams } = await supabase.from('teams').select('id');
      const { data: allMatches } = await supabase.from('matches').select('*').eq('status', 'completed');

      if (allTeams) {
        for (const team of allTeams) {
          const stats = { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 };
          
          allMatches?.forEach(m => {
            const isHome = m.home_team_id === team.id;
            const isAway = m.away_team_id === team.id;
            
            if (isHome || isAway) {
              stats.played++;
              const ownScore = isHome ? (m.home_score || 0) : (m.away_score || 0);
              const rivalScore = isHome ? (m.away_score || 0) : (m.home_score || 0);
              
              stats.goals_for += ownScore;
              stats.goals_against += rivalScore;
              
              if (ownScore > rivalScore) {
                stats.won++;
                stats.points += 3;
              } else if (ownScore < rivalScore) {
                stats.lost++;
              } else {
                stats.drawn++;
                stats.points += 1;
              }
            }
          });

          // Actualizar el equipo en la BD
          await supabase.from('teams').update(stats).eq('id', team.id);
        }
      }

      // Si el partido se marcó como completado, buscar el siguiente y ponerlo en vivo
      if (status === 'completed') {
        const currentIndex = matches.findIndex(m => m.id === matchId);
        if (currentIndex !== -1 && currentIndex < matches.length - 1) {
          const nextMatch = matches[currentIndex + 1];
          if (nextMatch.status === 'scheduled') {
            await supabase
              .from('matches')
              .update({ status: 'live' })
              .eq('id', nextMatch.id);
          }
        }
      }

      setEditingMatch(null);
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Error al actualizar el partido');
    }
  };

  return (
    <div className="relative max-w-5xl mx-auto px-4 pb-20">
      {/* Línea central (Desktop) */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 hidden md:block" />

      <div className="space-y-6 md:space-y-0 relative z-10">
        {matches.map((match, index) => {
          const isEven = index % 2 === 0;
          const isLive = match.status === 'live';
          const isFinished = match.status === 'completed';
          const matchDate = new Date(match.scheduled_date);

          return (
            <div key={match.id} className="relative md:flex items-center">
              {/* Timeline Indicator (Center) */}
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center z-20">
                <div className={cn(
                  "w-4 h-4 rounded-full border-4 border-background transition-all duration-500",
                  isLive ? "bg-accent animate-pulse shadow-[0_0_15px_rgba(255,59,59,0.8)]" : 
                  isFinished ? "bg-white/30" : "bg-white/10"
                )} />
                <div className="absolute top-6 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-white/20">
                  {format(matchDate, 'HH:mm')}
                </div>
              </div>

              {/* Grid Layout Container */}
              <div className={cn(
                "w-full md:grid md:grid-cols-2 md:gap-24 py-0",
                isEven ? "md:text-left" : "md:text-right"
              )}>
                {/* Left Side (Odd Matches) */}
                <div className={cn(
                  "flex flex-col items-center",
                  isEven ? "md:col-start-2 order-2 md:items-start" : "md:col-start-1 order-1 md:items-end justify-end"
                )}>
                  {/* Mobile-only time indicator (Outside & Centered) */}
                  <div className="md:hidden flex justify-center mb-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isLive ? "bg-accent animate-pulse" : "bg-white/10"
                      )} />
                      {format(matchDate, 'HH:mm')}
                    </div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? 20 : -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className={cn(
                      "w-full max-w-md bg-card border border-white/5 rounded-[2.5rem] p-6 sm:p-8 transition-all duration-500 hover:border-accent/20 relative overflow-hidden group",
                      isLive && "ring-1 ring-accent/30 shadow-[0_0_50px_rgba(255,59,59,0.05)]"
                    )}
                  >
                    {/* Admin Edit */}
                    {isAdmin && (
                      <button 
                        onClick={() => setEditingMatch(match)}
                        className={cn(
                          "absolute top-4 p-2 rounded-xl bg-white/5 text-white/20 hover:text-accent hover:bg-accent/10 transition-all z-20",
                          isEven ? "right-4" : "md:right-auto md:left-4 right-4"
                        )}
                      >
                        <HiPencilSquare className="w-5 h-5" />
                      </button>
                    )}

                    {/* Status */}
                    <div className={cn(
                      "flex mb-6",
                      isEven ? "justify-start" : "md:justify-end justify-start"
                    )}>
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                        isLive ? "bg-accent text-white" : 
                        isFinished ? "bg-white/5 text-white/40" : "bg-white/5 text-accent/60"
                      )}>
                        {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        {isLive ? "En Vivo" : isFinished ? "Finalizado" : "Programado"}
                      </div>
                    </div>

                    {/* Score Content */}
                    <div className={cn(
                      "flex items-center justify-between gap-4",
                      isEven ? "" : "md:flex-row-reverse"
                    )}>
                      {/* Team 1 */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-background border border-white/5 flex items-center justify-center p-3">
                          {match.home_team?.logo_url ? (
                            <img src={match.home_team.logo_url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <HiShieldCheck className="w-8 h-8 text-white/5" />
                          )}
                        </div>
                        <span className="text-sm font-black uppercase italic tracking-tighter text-white truncate max-w-[100px]">
                          {match.home_team?.name}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex-1 flex flex-col items-center">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-4xl sm:text-5xl font-black italic tracking-tighter leading-none",
                            (isFinished || isLive) ? "text-white" : "text-white/5"
                          )}>
                            {match.home_score ?? 0}
                          </span>
                          <span className="text-xl font-black text-accent/20 italic">-</span>
                          <span className={cn(
                            "text-4xl sm:text-5xl font-black italic tracking-tighter leading-none",
                            (isFinished || isLive) ? "text-white" : "text-white/5"
                          )}>
                            {match.away_score ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* Team 2 */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-background border border-white/5 flex items-center justify-center p-3">
                          {match.away_team?.logo_url ? (
                            <img src={match.away_team.logo_url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <HiShieldCheck className="w-8 h-8 text-white/5" />
                          )}
                        </div>
                        <span className="text-sm font-black uppercase italic tracking-tighter text-white truncate max-w-[100px]">
                          {match.away_team?.name}
                        </span>
                      </div>
                    </div>

                    </motion.div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingMatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMatch(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setEditingMatch(null)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all"
              >
                <HiXMark className="w-6 h-6" />
              </button>

              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Actualizar Marcador</h2>
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">Gestión de torneo</p>
                </div>

                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1 space-y-4 text-center">
                    <div className="text-[10px] font-black uppercase text-white/30 truncate">{editingMatch.home_team?.name}</div>
                    <input 
                      type="number" 
                      defaultValue={editingMatch.home_score ?? 0}
                      id="home_score"
                      className="w-full bg-background border border-white/5 rounded-2xl py-6 text-4xl font-black text-center text-white focus:border-accent transition-all outline-none"
                    />
                  </div>
                  <div className="text-2xl font-black text-accent italic pt-8">-</div>
                  <div className="flex-1 space-y-4 text-center">
                    <div className="text-[10px] font-black uppercase text-white/30 truncate">{editingMatch.away_team?.name}</div>
                    <input 
                      type="number" 
                      defaultValue={editingMatch.away_score ?? 0}
                      id="away_score"
                      className="w-full bg-background border border-white/5 rounded-2xl py-6 text-4xl font-black text-center text-white focus:border-accent transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Estado del Partido</label>
                  <select 
                    id="match_status"
                    defaultValue={editingMatch.status}
                    className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-accent outline-none appearance-none"
                  >
                    <option value="scheduled">Programado</option>
                    <option value="live">En Vivo</option>
                    <option value="completed">Finalizado</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Hora del Partido (8:30 - 11:30)</label>
                  <input 
                    type="time" 
                    id="match_time"
                    defaultValue={format(new Date(editingMatch.scheduled_date), 'HH:mm')}
                    className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-accent outline-none appearance-none"
                  />
                </div>

                <button 
                  onClick={() => {
                    const h_score = parseInt((document.getElementById('home_score') as HTMLInputElement).value);
                    const a_score = parseInt((document.getElementById('away_score') as HTMLInputElement).value);
                    const status = (document.getElementById('match_status') as HTMLSelectElement).value as Match['status'];
                    const time = (document.getElementById('match_time') as HTMLInputElement).value;
                    
                    const newDate = new Date(editingMatch.scheduled_date);
                    const [hours, minutes] = time.split(':').map(Number);
                    newDate.setHours(hours, minutes);
                    
                    handleUpdateScore(editingMatch.id, h_score, a_score, status, newDate.toISOString());
                  }}
                  className="w-full btn-primary py-5 text-lg"
                >
                  Guardar Resultado
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
