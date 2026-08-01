"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Zap,
  BarChart3,
  Users,
  Trophy,
  Share2,
  CreditCard,
  ArrowRight,
  Play,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function CricketBall() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      className="relative w-20 h-20 md:w-32 md:h-32"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-[0_0_60px_rgba(239,68,68,0.4)]">
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/40 -translate-y-1/2" />
          <div className="absolute top-[30%] left-[10%] right-[10%] h-[1px] bg-white/20 rotate-[15deg]" />
          <div className="absolute top-[70%] left-[10%] right-[10%] h-[1px] bg-white/20 -rotate-[15deg]" />
        </div>
      </div>
    </motion.div>
  );
}

const features = [
  {
    icon: Zap,
    title: "Live Scoring",
    desc: "Ball-by-ball scoring with instant updates. Every run, wicket, and boundary reflected in real-time.",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    desc: "Wagon wheels, worm charts, partnerships, and advanced cricket statistics at your fingertips.",
  },
  {
    icon: Users,
    title: "Team Management",
    desc: "Manage squads, track player performance, and analyze team strengths across tournaments.",
  },
  {
    icon: Trophy,
    title: "Tournament Hub",
    desc: "Create and manage tournaments with points tables, fixtures, results, and playoff brackets.",
  },
  {
    icon: Share2,
    title: "Live Sharing",
    desc: "Share live scores via WhatsApp, Twitter, or a public link. Every match gets its own URL.",
  },
  {
    icon: CreditCard,
    title: "Beautiful Scorecards",
    desc: "Crystal-clear scorecards with batting, bowling, fall of wickets, and partnership breakdowns.",
  },
];

const steps = [
  {
    num: "01",
    title: "Create Match",
    desc: "Set up your match in seconds. Choose teams, players, overs, and venue.",
  },
  {
    num: "02",
    title: "Score Live",
    desc: "Tap to score. Wide, no ball, boundary, wicket - everything updates instantly.",
  },
  {
    num: "03",
    title: "Share & Analyze",
    desc: "Share live scores with the world. Dive deep into analytics and statistics.",
  },
];

const faqs = [
  {
    q: "Is ScoreBolt really free?",
    a: "Yes! ScoreBolt is completely free to use. Create unlimited matches, score live, and share with the world. No credit card required.",
  },
  {
    q: "Can I use ScoreBolt for my tournament?",
    a: "Absolutely. ScoreBolt supports full tournament management including points tables, fixtures, playoffs, and live standings.",
  },
  {
    q: "How does live sharing work?",
    a: "Every match gets a unique URL. Share it via WhatsApp, Twitter, or any social platform. Viewers see real-time updates without needing an account.",
  },
  {
    q: "Do you have a mobile app?",
    a: "ScoreBolt is a Progressive Web App that works perfectly on mobile browsers. Install it on your home screen for a native app experience.",
  },
  {
    q: "Can I track player statistics?",
    a: "Yes, ScoreBolt tracks comprehensive player statistics including runs, averages, strike rates, wickets, economy, and much more.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-[#070B14] min-h-screen overflow-hidden">
      <link
        rel="preload"
        as="image"
        href="/Crickbolt.png"
        fetchPriority="high"
      />
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "url('/Crickbolt.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.35)" }}
      />
      <div className="relative z-10">
        <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="relative max-w-5xl mx-auto w-full">
          <div className="flex flex-col items-center gap-12">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center"
            >
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/60 mb-8"
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Now live - Score any match in seconds
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.95] tracking-tight mb-6"
              >
                Live Cricket
                <br />
                <span className="bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Scoring,
                </span>
                <br />
                Reimagined
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg text-white/50 max-w-xl mx-auto mb-8"
              >
                Create matches, score live, and share with the world. The most
                beautiful cricket platform ever built.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row items-center gap-4 justify-center"
              >
                <Link
                  href="/register"
                  className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-lg hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all duration-300"
                >
                  Start Scoring
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login?callbackUrl=/matches"
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-white/70 font-medium hover:bg-white/5 transition-all"
                >
                  <Play className="w-5 h-5" />
                  Watch Live
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <CricketBall />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              From casual weekend matches to professional tournaments, ScoreBolt
              has everything to make cricket scoring effortless.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group p-6 rounded-2xl bg-[#070B14]/65 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:bg-[#070B14]/75 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:from-blue-600/30 group-hover:to-cyan-500/30 transition-all">
                  <f.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How it works
            </h2>
            <p className="text-lg text-white/50">
              Three simple steps to start scoring
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-8"
          >
            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[1px] bg-gradient-to-r from-blue-500/30 to-transparent" />
                )}
                <div className="p-6 rounded-2xl bg-[#070B14]/65 backdrop-blur-sm border border-white/10">
                  <div className="text-5xl font-bold text-white/10 mb-4">
                    {s.num}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently asked questions
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="rounded-2xl bg-[#070B14]/65 backdrop-blur-sm border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white/40 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === i ? "auto" : 0,
                    opacity: openFaq === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-sm text-white/50 leading-relaxed">
                    {faq.a}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to transform your cricket experience?
            </h2>
            <p className="text-lg text-white/50 mb-8 max-w-2xl mx-auto">
              Join thousands of cricket enthusiasts who trust ScoreBolt to
              score, track, and share their matches.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-lg hover:shadow-[0_0_60px_rgba(37,99,235,0.4)] transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
      </div>
    </div>
  );
}
