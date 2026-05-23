"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import StandingsTable from "@/components/StandingsTable";
import Footer from "@/components/Footer";
import { Team } from "@/types";
import { supabase } from "@/lib/supabase";
import { HiArrowPath } from "react-icons/hi2";

export default function PosicionesPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandings();

    // Suscribirse a cambios en los equipos para actualizar la tabla en vivo
    const channel = supabase
      .channel('standings_sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teams'
      }, () => {
        fetchStandings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchStandings() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: false })
        .order('goals_for', { ascending: false });
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching standings:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen pb-24">
      <Header />
      
      {/* Page Header */}
      <section className="pt-32 pb-12 px-4 text-center">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic text-white leading-none">
          TABLA DE <br /> <span className="text-accent text-3xl sm:text-5xl">CLASIFICACIÓN</span>
        </h1>
        <p className="mt-4 text-white/40 text-xs sm:text-sm font-bold uppercase tracking-[0.3em]">
          El camino al título se decide en la cancha
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-4 space-y-12">
        {loading ? (
          <div className="py-20 text-center animate-pulse">
            <HiArrowPath className="w-12 h-12 text-white/10 mx-auto animate-spin" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/20">Calculando Tabla Real...</p>
          </div>
        ) : teams.length > 0 ? (
          <StandingsTable teams={teams} />
        ) : (
          <div className="py-20 text-center space-y-4">
            <p className="text-white/20 text-xs font-black uppercase tracking-[0.3em]">No hay equipos registrados aún</p>
            <p className="text-[10px] text-white/10 font-black uppercase tracking-widest">Inscribe clubes en la sección de Equipos para ver la tabla</p>
          </div>
        )}
        
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(255,59,59,0.5)]" />
            <span>Zona de Campeón</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-silver" />
            <span>Podio de Plata</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-bronze" />
            <span>Podio de Bronce</span>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
