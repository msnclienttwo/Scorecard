"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Sponsor {
  id?: string;
  name: string;
  logo: string;
  website?: string;
  tier?: string;
}

interface SponsorGridProps {
  sponsors: Sponsor[];
}

export default function SponsorGrid({ sponsors }: SponsorGridProps) {
  if (!sponsors || sponsors.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-white/30">
        No sponsors yet
      </div>
    );
  }

  const tiers = sponsors.reduce((acc: Record<string, Sponsor[]>, s) => {
    const tier = s.tier || "partner";
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(s);
    return acc;
  }, {});

  const tierOrder = ["title", "gold", "silver", "partner", "associate"];
  const sortedTiers = Object.keys(tiers).sort(
    (a, b) => tierOrder.indexOf(a) - tierOrder.indexOf(b)
  );

  return (
    <div className="space-y-8">
      {sortedTiers.map((tier) => (
        <motion.div
          key={tier}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="text-xs uppercase tracking-wider text-white/40 mb-4 text-center">
            {tier} sponsors
          </h4>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {tiers[tier].map((sponsor, i) => (
              <motion.a
                key={sponsor.id || i}
                href={sponsor.website}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors"
              >
                <Image
                  src={sponsor.logo}
                  alt={sponsor.name}
                  width={200}
                  height={80}
                  className="h-8 md:h-12 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
                />
              </motion.a>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export { SponsorGrid };
