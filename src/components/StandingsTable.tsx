import { Team } from "@/types";
import { cn } from "@/lib/utils";
import { HiShieldCheck, HiArrowSmallRight } from "react-icons/hi2";
import Image from "next/image";

interface StandingsTableProps {
  teams: Team[];
}

export default function StandingsTable({ teams }: StandingsTableProps) {
  const sorted = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goals_for - a.goals_against;
    const gdB = b.goals_for - b.goals_against;
    if (gdB !== gdA) return gdB - gdA;
    return b.goals_for - a.goals_for;
  });

  // Estructura de cuadrícula: Optimizada para que el scroll sea necesario pero los puntos asomen
  const gridLayout = "grid grid-cols-[45px_160px_40px_40px_40px_40px_50px_80px] md:grid-cols-[80px_1fr_60px_60px_60px_60px_80px_100px]";

  return (
    <div className="relative w-full group/table">
      {/* Contenedor con Scroll Horizontal */}
      <div className="overflow-x-auto pb-6 scrollbar-hide cursor-grab active:cursor-grabbing">
        <div className="w-max min-w-full space-y-3 pr-10">
          
          {/* Header */}
          <div className={cn(gridLayout, "px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/20 items-center")}>
            <div className="text-center">Pos</div>
            <div className="pl-10">Club</div>
            <div className="text-center">PJ</div>
            <div className="text-center">G</div>
            <div className="text-center">E</div>
            <div className="text-center">P</div>
            <div className="text-center">DG</div>
            <div className="text-right pr-4 text-accent/40">Pts</div>
          </div>

          <div className="space-y-3">
            {sorted.map((team, index) => {
              const rank = index + 1;
              const gd = team.goals_for - team.goals_against;
              return (
                <div 
                  key={team.id}
                  className={cn(
                    "group relative overflow-hidden transition-all duration-300",
                    "bg-card border border-white/5 rounded-xl md:rounded-2xl hover:border-accent/30"
                  )}
                >
                  {/* Watermark Logo */}
                  <div className="absolute -right-6 -bottom-10 w-48 h-48 opacity-[0.08] pointer-events-none group-hover:opacity-[0.15] transition-opacity grayscale">
                    <Image src="/images/logo_vecinos.svg" alt="" fill unoptimized className="object-contain rotate-12" />
                  </div>

                  <div className={cn(gridLayout, "px-4 py-3 sm:py-4 relative z-10 items-center")}>
                    {/* Position Number */}
                    <div className="text-center">
                      <span className={cn(
                        "text-2xl sm:text-4xl font-black italic tracking-tighter leading-none transition-all duration-500",
                        rank === 1 ? "text-accent drop-shadow-[0_0_10px_rgba(255,59,59,0.5)]" : 
                        rank === 2 ? "text-silver drop-shadow-[0_0_10px_rgba(192,192,192,0.4)]" :
                        rank === 3 ? "text-bronze drop-shadow-[0_0_10px_rgba(205,127,50,0.4)]" :
                        "text-white/10"
                      )}>
                        {rank}
                      </span>
                    </div>

                    {/* Team Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center border border-white/5 overflow-hidden">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <HiShieldCheck className="w-5 h-5 text-white/5" />
                        )}
                      </div>
                      <span className="text-sm sm:text-lg font-black uppercase italic tracking-tight text-white leading-tight truncate">
                        {team.name}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="text-center text-white/40 font-bold text-xs sm:text-base">{team.played}</div>
                    <div className="text-center text-white/40 font-bold text-xs sm:text-base">{team.won}</div>
                    <div className="text-center text-white/40 font-bold text-xs sm:text-base">{team.drawn}</div>
                    <div className="text-center text-white/40 font-bold text-xs sm:text-base">{team.lost}</div>
                    <div className="text-center text-white/60 font-black italic text-xs sm:text-base">{gd > 0 ? `+${gd}` : gd}</div>

                    {/* Points */}
                    <div className="text-right pr-4">
                      <span className={cn(
                        "text-3xl sm:text-5xl font-black italic tracking-tighter leading-none",
                        rank === 1 ? "text-accent" : 
                        rank === 2 ? "text-silver/80" :
                        rank === 3 ? "text-bronze/80" :
                        "text-white/40"
                      )}>
                        {team.points}
                      </span>
                    </div>
                  </div>
                  
                  {/* Highlight bar with position-specific color */}
                  {rank <= 3 && (
                    <div className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full transition-all",
                      rank === 1 ? "bg-accent shadow-[0_0_15px_rgba(255,59,59,0.8)]" :
                      rank === 2 ? "bg-silver shadow-[0_0_15px_rgba(192,192,192,0.6)]" :
                      "bg-bronze shadow-[0_0_15px_rgba(205,127,50,0.6)]"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Guía visual de scroll lateral */}
      <div className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <div className="flex flex-col items-center gap-1 opacity-40">
          <HiArrowSmallRight className="w-5 h-5 text-accent animate-bounce-x" />
          <span className="text-[7px] font-black uppercase tracking-widest text-white [writing-mode:vertical-lr]">Desliza</span>
        </div>
      </div>
    </div>
  );
}
