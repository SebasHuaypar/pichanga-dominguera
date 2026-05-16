"use client";

import { Team } from "@/types";
import { motion } from "framer-motion";
import { HiShieldCheck } from "react-icons/hi2";
import { cn } from "@/lib/utils";

interface TopLeaderboardProps {
  teams: Team[];
}

export default function TopLeaderboard({ teams }: TopLeaderboardProps) {
  const sorted = [...teams].sort((a, b) => b.points - a.points).slice(0, 3);
  
  if (sorted.length < 3) return null;

  // Reorder to have #2, #1, #3 for the layout with their respective metal colors
  const displayTeams = [
    { 
      ...sorted[1], 
      rank: 2, 
      colorClass: "border-silver/30", 
      textClass: "text-silver",
      glowClass: "bg-silver",
      tilt: -4 
    },
    { 
      ...sorted[0], 
      rank: 1, 
      colorClass: "border-accent", 
      textClass: "text-accent",
      glowClass: "bg-accent",
      tilt: 0 
    },
    { 
      ...sorted[2], 
      rank: 3, 
      colorClass: "border-bronze/30", 
      textClass: "text-bronze",
      glowClass: "bg-bronze",
      tilt: 4 
    },
  ];

  return (
    <div className="flex flex-row items-end justify-center gap-2 sm:gap-6 pt-10 px-2 sm:px-0">
      {displayTeams.map((team, index) => {
        const isFirst = team.rank === 1;
        const isSecond = team.rank === 2;
        const isThird = team.rank === 3;

        return (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20, rotate: team.tilt }}
            animate={{ opacity: 1, y: 0, rotate: team.tilt }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={cn(
              "relative group flex-1 min-w-0 max-w-[200px] sm:max-w-64 aspect-[3/4.5] sm:aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-500 hover:scale-105 hover:z-30",
              team.colorClass,
              isFirst ? "bg-accent/[0.03] z-20 scale-105 -mb-2 sm:-mb-0 sm:-mt-12 shadow-[0_0_30px_rgba(255,59,59,0.1)]" : 
              isSecond ? "bg-white/[0.02] z-10 shadow-[0_0_20px_rgba(192,192,192,0.05)]" : 
              "bg-white/[0.01] z-10 shadow-[0_0_20px_rgba(205,127,50,0.05)]"
            )}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <div className={cn(
                "absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-accent)_1px,_transparent_1px)]",
                isFirst ? "bg-[size:10px_10px] sm:bg-[size:20px_20px]" : "bg-[size:15px_15px] opacity-50"
              )} />
            </div>

            {/* Card Content */}
            <div className="relative h-full p-2.5 sm:p-6 flex flex-col justify-between items-center text-center">
              {/* Rank & Stats */}
              <div className="w-full flex justify-between items-start">
                <div className={cn(
                  "text-2xl sm:text-5xl font-black italic leading-none drop-shadow-lg",
                  team.textClass
                )}>
                  {team.rank}
                </div>
                <div className="text-right">
                  <div className="text-[7px] sm:text-[10px] font-black uppercase text-white/20 tracking-widest">Points</div>
                  <div className={cn(
                    "text-lg sm:text-2xl font-black leading-none",
                    isFirst ? "text-white" : "text-white/60"
                  )}>{team.points}</div>
                </div>
              </div>

              {/* Logo Area */}
              <div className="relative w-16 h-16 sm:w-28 sm:h-28 flex items-center justify-center my-2">
                <div className={cn(
                  "absolute inset-0 rounded-full blur-xl sm:blur-3xl opacity-10 sm:opacity-30 transition-all duration-500 group-hover:opacity-50",
                  team.glowClass
                )} />
                {team.logo_url ? (
                  <img src={team.logo_url} alt="" className="w-full h-full object-contain relative z-10" />
                ) : (
                  <HiShieldCheck className={cn(
                    "w-full h-full relative z-10",
                    team.textClass,
                    "opacity-80 group-hover:opacity-100 transition-opacity"
                  )} />
                )}
              </div>

              {/* Team Info */}
              <div className="space-y-0.5 sm:space-y-1 w-full overflow-hidden">
                <h3 className={cn(
                  "text-xs sm:text-2xl font-black uppercase italic tracking-tighter leading-none truncate",
                  isFirst ? "text-white" : "text-white/80"
                )}>
                  {team.name}
                </h3>
                <div className="flex items-center justify-center gap-1 sm:gap-3 text-[7px] sm:text-[10px] font-black uppercase text-white/20 tracking-wider">
                  <span>{team.won}G</span>
                  <span className="hidden sm:block w-0.5 h-0.5 bg-white/10 rounded-full" />
                  <span>{team.drawn}E</span>
                  <span className="hidden sm:block w-0.5 h-0.5 bg-white/10 rounded-full" />
                  <span>{team.lost}P</span>
                </div>
              </div>

              {/* Bottom Accent Bar */}
              <div className={cn(
                "absolute bottom-0 left-0 right-0 h-1 sm:h-1.5",
                isFirst ? "bg-accent shadow-[0_-4px_10px_rgba(255,59,59,0.3)]" :
                isSecond ? "bg-silver/40" : "bg-bronze/40"
              )} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
