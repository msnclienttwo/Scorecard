"use client";

export default function LiveIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className="live-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
      </span>
      <span className="text-xs font-bold text-red-500 tracking-wider animate-pulse">
        LIVE
      </span>
      <style jsx>{`
        .live-ping {
          animation: livePing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes livePing {
          0% {
            transform: scale(1);
            opacity: 0.75;
          }
          75%,
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
