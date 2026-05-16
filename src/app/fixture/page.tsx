"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import FixtureList from "@/components/FixtureList";
import Footer from "@/components/Footer";
import { Match, Team } from "@/types";
import { HiSparkles, HiShieldCheck, HiArrowPath, HiXMark, HiExclamationTriangle, HiTrash } from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { generateRandomFixture } from "@/lib/fixture-generator";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { HiDocumentArrowDown, HiFlag, HiExclamationCircle } from "react-icons/hi2";
import { format } from "date-fns";

export default function FixturePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLotteryOpen, setIsLotteryOpen] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawCount, setDrawCount] = useState(0);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [finishStep, setFinishStep] = useState(1); // 1: report check, 2: final confirm

  useEffect(() => {
    setIsAdmin(localStorage.getItem("pichanga_admin") === "true");
    fetchInitialData();

    // Suscribirse a cambios en el estado del sorteo (Realtime)
    const channel = supabase
      .channel('draw_sync')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'draw_status'
      }, (payload: any) => {
        const newStatus = payload.new.status;
        if (newStatus === 'shuffling') {
          setIsShuffling(true);
          setIsLotteryOpen(true);
        } else if (newStatus === 'completed') {
          setIsShuffling(false);
          setIsLotteryOpen(false);
          setDrawCount(payload.new.draw_count || 0);
          fetchInitialData(); // Recargar partidos
          setIsGenerated(true);
        } else if (newStatus === 'idle') {
          setIsGenerated(false);
          setMatches([]);
        }
      })
      .subscribe();

    // Suscribirse a cambios en los partidos (Resultados y Estados en vivo)
    const matchesChannel = supabase
      .channel('matches_sync')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches'
      }, (payload: any) => {
        setMatches(currentMatches => 
          currentMatches.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m)
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(matchesChannel);
    };
  }, []);

  useEffect(() => {
    if (isResetModalOpen || isLotteryOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isResetModalOpen, isLotteryOpen]);

  async function fetchInitialData() {
    try {
      setLoading(true);
      
      // Obtener equipos
      const { data: teamsData } = await supabase.from('teams').select('*');
      setTeams(teamsData || []);

      // Obtener estado del sorteo
      const { data: drawData } = await supabase.from('draw_status').select('*').eq('id', 1).single();
      if (drawData) {
        setDrawCount(drawData.draw_count || 0);
        if (drawData.status === 'shuffling') {
          setIsShuffling(true);
          setIsLotteryOpen(true);
        }
      }

      // Obtener partidos existentes
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*)
        `)
        .order('round', { ascending: true })
        .order('scheduled_date', { ascending: true })
        .order('id', { ascending: true });
      
      if (matchesData && matchesData.length > 0) {
        setMatches(matchesData as Match[]);
        setIsGenerated(true);
      }
    } catch (error) {
      console.error('Error fetching fixture data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleShuffle = async () => {
    if (teams.length < 2) return alert("Necesitas al menos 2 equipos para el sorteo");

    try {
      setIsShuffling(true);
      setIsLotteryOpen(true);
      
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setMatches([]);
      setIsGenerated(false);

      const { data: currentDraw } = await supabase.from('draw_status').select('*').eq('id', 1).single();
      const lastUpdate = currentDraw?.updated_at ? new Date(currentDraw.updated_at) : new Date(0);
      const isToday = lastUpdate.toDateString() === new Date().toDateString();
      const newCount = isToday ? (currentDraw?.draw_count || 0) + 1 : 1;

      const { error: shuffleError } = await supabase
        .from('draw_status')
        .update({ 
          status: 'shuffling', 
          draw_count: newCount,
          updated_at: new Date().toISOString() 
        })
        .eq('id', 1);

      if (shuffleError) throw shuffleError;

      await new Promise(resolve => setTimeout(resolve, 10000));

      // 4. Generar fixture aleatorio (solo equipos activos)
      const activeTeamIds = teams.filter(t => t.is_active).map(t => t.id);
      const generatedMatches = generateRandomFixture(activeTeamIds);

      // 5. Calcular fechas y horas (Todo el mismo domingo entre 8:30 y 11:30)
      const getNextSunday = (date: Date) => {
        const d = new Date(date);
        d.setDate(d.getDate() + (7 - d.getDay()) % 7);
        return d;
      };

      const baseDate = getNextSunday(new Date());
      baseDate.setHours(8, 30, 0, 0);

      const totalMatches = generatedMatches.length;
      const totalMinutes = 180; // De 8:30 a 11:30 hay 180 minutos
      const interval = totalMatches > 0 ? totalMinutes / totalMatches : 0;

      const finalMatches = generatedMatches.map((m, index) => {
        const matchTime = new Date(baseDate);
        matchTime.setMinutes(baseDate.getMinutes() + (index * interval));
        
        return {
          home_team_id: m.home_team_id,
          away_team_id: m.away_team_id,
          round: m.round,
          status: 'scheduled',
          scheduled_date: matchTime.toISOString(),
          home_score: 0,
          away_score: 0
        };
      });

      // 6. Insertar en Supabase
      const { error: insertError } = await supabase
        .from('matches')
        .insert(finalMatches);
      if (insertError) throw insertError;

      // 7. Notificar finalización
      const { error: completedError } = await supabase
        .from('draw_status')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', 1);

      if (completedError) throw completedError;

      setIsShuffling(false);
      setIsLotteryOpen(false);
      fetchInitialData();
    } catch (error) {
      console.error('Error in lottery:', error);
      alert('Hubo un problema con el sorteo real-time.');
      setIsShuffling(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase
        .from('draw_status')
        .update({ status: 'idle', updated_at: new Date().toISOString() })
        .eq('id', 1);
      
      setMatches([]);
      setIsGenerated(false);
      setIsResetModalOpen(false);
    } catch (error) {
      console.error('Error resetting:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [255, 59, 59];
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 30);
    doc.text('PICHANGA DOMINGUERA', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('EL BARRIO NUNCA SE OLVIDA', 105, 26, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text(`Reporte Oficial • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 32, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text('TABLA DE CLASIFICACIÓN', 20, 45);
    
    const { data: standingsData } = await supabase
      .from('teams')
      .select('*')
      .order('points', { ascending: false })
      .order('goals_for', { ascending: false });

    const standingsRows = (standingsData || []).map((t, i) => [
      i + 1,
      t.name,
      t.played || 0,
      t.won || 0,
      t.drawn || 0,
      t.lost || 0,
      t.goals_for || 0,
      t.goals_against || 0,
      (t.goals_for || 0) - (t.goals_against || 0),
      t.points || 0
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Pos', 'Club', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'PTS']],
      body: standingsRows,
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 40], fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8, halign: 'center', cellPadding: 2 },
      columnStyles: {
        1: { halign: 'left', fontStyle: 'bold', cellWidth: 40 },
        9: { fontStyle: 'bold', fillColor: [240, 240, 240] }
      },
      margin: { left: 20, right: 20 }
    });

    const nextY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.text('FIXTURE Y RESULTADOS', 20, nextY);

    const fixtureRows = matches.map((m) => [
      `Ronda ${m.round}`,
      format(new Date(m.scheduled_date), 'HH:mm'),
      `${m.home_team?.name || 'Local'}`,
      m.status === 'completed' ? `${m.home_score} - ${m.away_score}` : 'vs',
      `${m.away_team?.name || 'Visitante'}`,
      m.status === 'completed' ? 'FINAL' : m.status === 'live' ? 'VIVO' : 'PROG'
    ]);

    autoTable(doc, {
      startY: nextY + 5,
      head: [['Ronda', 'Hora', 'Local', 'Resultado', 'Visitante', 'Estado']],
      body: fixtureRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8, halign: 'center', cellPadding: 2 },
      columnStyles: {
        2: { halign: 'right', cellWidth: 40 },
        3: { fontStyle: 'bold', cellWidth: 25 },
        4: { halign: 'left', cellWidth: 40 }
      },
      margin: { left: 20, right: 20 }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('Pichanga Dominguera • El Honor del Barrio se decide en la cancha', 105, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`Reporte_Vecinos_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleFinishChampionship = async () => {
    try {
      setLoading(true);
      // 1. Borrar todos los partidos
      await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 2. Resetear estadísticas de todos los equipos
      await supabase
        .from('teams')
        .update({
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          points: 0
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // 3. Resetear estado del sorteo
      await supabase
        .from('draw_status')
        .update({ status: 'idle', draw_count: 0, updated_at: new Date().toISOString() })
        .eq('id', 1);

      setMatches([]);
      setIsGenerated(false);
      setIsFinishModalOpen(false);
      setFinishStep(1);
      window.location.reload(); // Recargar para asegurar estado limpio
    } catch (error) {
      console.error('Error finishing championship:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pb-20">
      <Header />
      
      {/* Page Header */}
      <section className="pt-32 pb-12 px-4 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[150%] bg-accent/5 blur-[120px] rounded-full -z-10" />

        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl sm:text-7xl font-black tracking-tighter uppercase italic text-white leading-none">
            FIXTURE <br /> <span className="text-accent text-3xl sm:text-6xl">ALEATORIO</span>
          </h1>
          
          {isGenerated ? (
                <div className="flex flex-col items-center gap-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full"
                  >
                    <HiShieldCheck className="w-4 h-4 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                      Sorteo Verificado • Intento #{drawCount}
                    </span>
                  </motion.div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                    <button 
                      onClick={downloadReport}
                      className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent hover:text-white transition-all"
                    >
                      <HiDocumentArrowDown className="w-4 h-4" />
                      Descargar Reporte
                    </button>
                    
                    {isAdmin && (
                      <div className="flex flex-wrap items-center justify-center gap-4 sm:border-l sm:border-white/10 sm:pl-4 sm:ml-2">
                        <button 
                          onClick={() => setIsResetModalOpen(true)}
                          className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-accent transition-colors px-2 py-1"
                        >
                          Reiniciar Sorteo
                        </button>
                        <button 
                          onClick={() => setIsFinishModalOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all"
                        >
                          <HiFlag className="w-4 h-4" />
                          Finalizar Campeonato
                        </button>
                      </div>
                    )}
                  </div>
                </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="text-white/40 text-xs sm:text-sm font-bold uppercase tracking-[0.3em]">
                {isShuffling ? "Sorteo en curso..." : "El azar decidirá el destino del barrio"}
              </p>
              {isShuffling && (
                <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
              )}
            </div>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4">
        {matches.length > 0 ? (
          <FixtureList matches={matches} />
        ) : (
          <div className="py-20 text-center space-y-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full animate-pulse" />
              <HiSparkles className="w-16 h-16 text-white/10 relative z-10 mx-auto" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase italic text-white/40">
                {isShuffling ? "¡Está pasando!" : "Esperando el sorteo"}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/10">
                {isShuffling ? "Todos están viendo la ruleta en este momento" : "Solo el administrador puede iniciar el azar"}
              </p>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              {isAdmin && !isShuffling && (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setIsLotteryOpen(true)}
                    className="btn-primary py-3.5 px-7 text-sm group flex items-center justify-center mx-auto"
                  >
                    <HiArrowPath className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-700" />
                    Iniciar Sorteo en Vivo
                  </button>
                  {matches.length > 0 && (
                    <button 
                      onClick={() => setIsResetModalOpen(true)}
                      className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-accent transition-colors"
                    >
                      Resetear Fixture
                    </button>
                  )}
                </div>
              )}

              {!isAdmin && isShuffling && (
                <button 
                  onClick={() => setIsLotteryOpen(true)}
                  className="btn-primary py-3.5 px-7 text-sm bg-white/10 hover:bg-white/20 border-white/10 flex items-center justify-center mx-auto"
                >
                  <HiSparkles className="w-5 h-5 mr-2 animate-spin" />
                  Ver Sorteo en Vivo
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lottery Animation Modal */}
      <AnimatePresence>
        {isLotteryOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/95 backdrop-blur-2xl"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg text-center space-y-12"
            >
              {!isShuffling ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-accent/20">
                    <HiArrowPath className="w-10 h-10 text-accent" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">¿Todo listo para el sorteo?</h2>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Se generarán partidos aleatorios para {teams.length} equipos</p>
                  </div>
                  <div className="flex gap-4 max-w-sm mx-auto">
                    <button onClick={() => setIsLotteryOpen(false)} className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancelar</button>
                    <button onClick={handleShuffle} className="flex-1 btn-primary py-4 text-base">Mezclar Bombos</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="relative h-48 flex items-center justify-center overflow-hidden">
                    {/* Spinning Logos Animation */}
                    <div className="flex gap-8 animate-infinite-scroll">
                      {[...teams, ...teams, ...teams].map((team, i) => (
                        <motion.div 
                          key={i}
                          animate={{ 
                            y: [0, -20, 0],
                            rotate: [0, 10, -10, 0]
                          }}
                          transition={{ 
                            duration: 0.5, 
                            repeat: Infinity,
                            delay: i * 0.1
                          }}
                          className="w-20 h-20 bg-card border border-white/10 rounded-2xl flex items-center justify-center p-3 flex-shrink-0"
                        >
                          {team.logo_url ? (
                            <img src={team.logo_url} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <HiShieldCheck className="w-10 h-10 text-white/5" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                    {/* Overlay Gradients */}
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
                  </div>

                  <div className="space-y-3">
                    <motion.h2 
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-2xl font-black italic uppercase tracking-[0.2em] text-accent"
                    >
                      Sorteando Gruces...
                    </motion.h2>
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Generando transparencia total</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsResetModalOpen(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-card border border-white/10 rounded-[2.5rem] p-8 sm:p-10 text-center space-y-8 shadow-[0_0_100px_rgba(255,59,59,0.1)]"
            >
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-accent/20">
                <HiTrash className="w-10 h-10 text-accent" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">¿Borrar fixture?</h2>
                <p className="text-white/40 text-xs font-bold leading-relaxed uppercase tracking-widest">
                  Esta acción eliminará todos los partidos actuales. Esta acción es irreversible.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleReset}
                  disabled={loading}
                  className="w-full btn-primary py-4 text-sm disabled:opacity-50"
                >
                  {loading ? "Borrando..." : "Sí, borrar todo"}
                </button>
                <button 
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Finish Championship Modal */}
      <AnimatePresence>
        {isFinishModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if(!loading) setIsFinishModalOpen(false); }}
              className="absolute inset-0 bg-background/95 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-card border border-white/10 rounded-[2.5rem] p-8 sm:p-10 text-center space-y-8 shadow-[0_0_100px_rgba(255,255,255,0.05)]"
            >
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto ring-1 ring-accent/20">
                {finishStep === 1 ? <HiDocumentArrowDown className="w-10 h-10 text-accent" /> : <HiExclamationCircle className="w-10 h-10 text-accent" />}
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                  {finishStep === 1 ? "¿Descargaste el Reporte?" : "¿Estás 100% seguro?"}
                </h2>
                <p className="text-white/40 text-[10px] font-bold leading-relaxed uppercase tracking-widest">
                  {finishStep === 1 
                    ? "Es vital descargar los resultados finales antes de borrar todo. ¿Deseas descargarlo ahora o ya lo tienes?"
                    : "Esta acción borrará TODOS los partidos y REINICIARÁ los puntos de todos los equipos a cero. No hay vuelta atrás."}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {finishStep === 1 ? (
                  <>
                    <button onClick={downloadReport} className="w-full btn-primary py-4 text-sm bg-white/10 hover:bg-white/20 text-white border-white/10">
                      Descargar Reporte Final
                    </button>
                    <button onClick={() => setFinishStep(2)} className="w-full btn-primary py-4 text-sm">
                      Ya lo descargué, Continuar
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleFinishChampionship}
                      disabled={loading}
                      className="w-full btn-primary py-4 text-sm bg-accent hover:bg-accent-hover text-white shadow-[0_0_30px_rgba(255,59,59,0.3)]"
                    >
                      {loading ? "Finalizando..." : "Sí, Finalizar Campeonato"}
                    </button>
                    <button onClick={() => setFinishStep(1)} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                      Volver atrás
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setIsFinishModalOpen(false)}
                  className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-white/10 hover:text-white transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
