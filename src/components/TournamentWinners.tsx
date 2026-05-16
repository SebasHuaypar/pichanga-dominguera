import { HiTrophy, HiMiniStar } from "react-icons/hi2";
import { FaCrown } from "react-icons/fa6";
import { Team } from "@/types";

interface TournamentWinnersProps {
  teams: Team[];
}

export default function TournamentWinners({ teams }: TournamentWinnersProps) {
  const sorted = [...teams].sort((a, b) => b.points - a.points).slice(0, 3);
  
  if (sorted.length < 3) return null;

  return (
    <div className="glass-card bg-card border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <HiTrophy className="w-48 h-48 text-accent -rotate-12" />
      </div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3">
          <FaCrown className="w-10 h-10 text-accent animate-pulse" />
          <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">Los Meros Meros</h2>
        </div>

        <div className="grid gap-3">
          {/* 1st Place */}
          <div className="flex items-center justify-between bg-accent/10 p-5 rounded-2xl border border-accent/20 hover:bg-accent/30 transition-all">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-white font-black text-2xl">1</div>
              <span className="text-2xl font-black uppercase italic tracking-tight text-white">{sorted[0].name}</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(i => <HiMiniStar key={i} className="w-5 h-5 text-accent" />)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 2nd Place */}
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-silver rounded-lg flex items-center justify-center text-background font-black text-xl">2</div>
                <span className="text-lg font-bold uppercase italic text-white/90">{sorted[1].name}</span>
              </div>
              <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Plata</span>
            </div>

            {/* 3rd Place */}
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-bronze rounded-lg flex items-center justify-center text-background font-black text-xl">3</div>
                <span className="text-lg font-bold uppercase italic text-white/90">{sorted[2].name}</span>
              </div>
              <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Bronce</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
