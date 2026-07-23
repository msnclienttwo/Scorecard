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
  Star,
  ChevronRight,
  ChevronDown,
  Check,
  CircleDot,
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

function ScorePreview() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="bg-[#0d1320]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-400 text-xs font-bold uppercase tracking-wider">
          Live
        </span>
        <span className="text-white/30 text-xs ml-auto">IPL 2026</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              IND
            </div>
            <span className="text-white font-medium">India</span>
          </div>
          <span className="text-2xl font-bold text-white">
            187<span className="text-white/40">/</span>
            <span className="text-white/60">4</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center text-xs font-bold text-white">
              AUS
            </div>
            <span className="text-white/60">Australia</span>
          </div>
          <span className="text-lg text-white/40 font-medium">Batting 2nd</span>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs text-white/50">
        <span>Overs: 18.3</span>
        <span>CRR: 8.52</span>
        <span>RRR: 9.45</span>
      </div>
      <div className="mt-3 flex gap-1">
        {["0", "1", "4", "0", "W", "6", "1", "2"].map((ball, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1 + i * 0.1, type: "spring" }}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              ball === "4"
                ? "bg-blue-600 text-white"
                : ball === "6"
                ? "bg-cyan-500 text-white"
                : ball === "W"
                ? "bg-red-600 text-white"
                : ball === "0"
                ? "bg-white/10 text-white/40"
                : "bg-white/20 text-white"
            }`}
          >
            {ball}
          </motion.div>
        ))}
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

const stats = [
  { value: "10M+", label: "Balls Scored" },
  { value: "50K+", label: "Matches Created" },
  { value: "100K+", label: "Players Tracked" },
  { value: "200+", label: "Countries" },
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

const testimonials = [
  {
    name: "Arjun Mehta",
    role: "Tournament Organizer",
    quote:
      "ScoreCast has completely transformed how we run our local cricket tournament. The live scoring is incredibly smooth.",
    avatar: "AM",
  },
  {
    name: "Priya Sharma",
    role: "Cricket Coach",
    quote:
      "The analytics and player statistics help me understand my team's strengths and weaknesses like never before.",
    avatar: "PS",
  },
  {
    name: "Rahul Verma",
    role: "Weekend Cricketer",
    quote:
      "Finally a cricket scoring app that looks amazing and is actually fun to use. My friends love following our matches live.",
    avatar: "RV",
  },
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for casual cricket",
    features: [
      "5 matches per month",
      "Basic scorecard",
      "Up to 10 players",
      "Share live scores",
      "Basic statistics",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    desc: "For serious cricket organizers",
    features: [
      "Unlimited matches",
      "Full scorecard & analytics",
      "Unlimited players",
      "Tournament management",
      "Advanced statistics",
      "Priority support",
      "Custom branding",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For leagues & organizations",
    features: [
      "Everything in Pro",
      "Multi-ground management",
      "API access",
      "Dedicated support",
      "Custom integrations",
      "White-label solution",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const faqs = [
  {
    q: "Is ScoreCast really free?",
    a: "Yes! Our free plan includes 5 matches per month with full scoring capabilities. No credit card required.",
  },
  {
    q: "Can I use ScoreCast for my tournament?",
    a: "Absolutely. ScoreCast supports full tournament management including points tables, fixtures, playoffs, and live standings.",
  },
  {
    q: "How does live sharing work?",
    a: "Every match gets a unique URL. Share it via WhatsApp, Twitter, or any social platform. Viewers see real-time updates without needing an account.",
  },
  {
    q: "Do you have a mobile app?",
    a: "ScoreCast is a Progressive Web App that works perfectly on mobile browsers. Install it on your home screen for a native app experience.",
  },
  {
    q: "Can I track player statistics?",
    a: "Yes, ScoreCast tracks comprehensive player statistics including runs, averages, strike rates, wickets, economy, and much more.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-[#070B14] min-h-screen overflow-hidden">
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]"
          />
          <motion.div
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-[128px]"
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center lg:text-left"
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
                className="text-lg text-white/50 max-w-xl mx-auto lg:mx-0 mb-8"
              >
                Create matches, score live, and share with the world. The most
                beautiful cricket platform ever built.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
              >
                <Link
                  href="/register"
                  className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-lg hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all duration-300"
                >
                  Start Scoring
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/matches"
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-white/70 font-medium hover:bg-white/5 transition-all"
                >
                  <Play className="w-5 h-5" />
                  Watch Live
                </Link>
              </motion.div>
            </motion.div>

            <div className="hidden lg:flex justify-center items-center relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative"
              >
                <CricketBall />
              </motion.div>
              <div className="absolute top-0 right-0">
                <ScorePreview />
              </div>
            </div>
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
              From casual weekend matches to professional tournaments, ScoreCast
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
                className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.06] transition-all duration-300"
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
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  {s.value}
                </div>
                <div className="text-white/40 text-sm">{s.label}</div>
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
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
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
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Loved by cricket enthusiasts
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {t.name}
                    </div>
                    <div className="text-xs text-white/40">{t.role}</div>
                  </div>
                </div>
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
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-white/50">
              Start free, upgrade when you need more
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {pricing.map((p, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`relative p-6 rounded-2xl border ${
                  p.popular
                    ? "bg-white/[0.06] border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.1)]"
                    : "bg-white/[0.03] border-white/[0.06]"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {p.name}
                  </h3>
                  <p className="text-sm text-white/40">{p.desc}</p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">
                    {p.price}
                  </span>
                  {p.period && (
                    <span className="text-white/40">{p.period}</span>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-white/60">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                    p.popular
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-[0_0_30px_rgba(37,99,235,0.3)]"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {p.cta}
                </button>
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
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden"
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
              Join thousands of cricket enthusiasts who trust ScoreCast to
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
  );
}
