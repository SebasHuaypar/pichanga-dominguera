"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import TopLeaderboard from "@/components/TopLeaderboard";
import StandingsTable from "@/components/StandingsTable";
import Footer from "@/components/Footer";
import { Team } from "@/types";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { HiArrowPath } from "react-icons/hi2";

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  async function fetchHomeData() {
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
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen pb-20">
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[75vh] min-h-[500px] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/hero_image.webp" 
            alt="Pichanga dominguera" 
            fill 
            unoptimized
            className="object-cover opacity-20 grayscale-[0.5]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 text-center space-y-8 px-6 pt-32 pb-12">
          <h1 className="text-5xl sm:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic text-white">
            PICHANGA <br /> <span className="text-accent">DOMINGUERA</span>
          </h1>
          <p className="text-white/60 text-lg sm:text-lg max-w-2xl mx-auto font-medium tracking-tight leading-relaxed px-6 sm:px-0">
            A sudar la camiseta, bajar la panza y demostrar que el talento no se pierde, solo se oculta bajo un par de años.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 space-y-20 pt-16 relative z-20">
        {loading ? (
          <div className="py-20 text-center animate-pulse">
            <HiArrowPath className="w-12 h-12 text-white/10 mx-auto animate-spin" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/20">Sincronizando con el Barrio...</p>
          </div>
        ) : teams.length > 0 ? (
          <>
            {/* Podium Leaderboard */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black italic uppercase tracking-tight text-white/90">Sin Picarse</h2>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <TopLeaderboard teams={teams} />
            </section>

            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black italic uppercase tracking-tight text-white/90">A contar los puntos</h2>
                <span className="text-accent/30 text-[10px] font-black tracking-widest uppercase">Resultados en vivo</span>
              </div>
              <StandingsTable teams={teams} />
            </section>
          </>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
            <h3 className="text-2xl font-black uppercase italic text-white/20">Aún no hay inscritos</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/10 mt-2">Los equipos están terminando de amarrarse los chimpunes</p>
          </div>
        )}

        <Footer />
      </div>
    </main>
  );
}
