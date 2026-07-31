import Link from "next/link";
import { Zap, Github, Twitter, Linkedin, Instagram } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "About", href: "/about" },
    { label: "API", href: "/api-docs" },
    { label: "Integrations", href: "/integrations" },
    { label: "Changelog", href: "/changelog" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Blog", href: "/blog" },
    { label: "Community", href: "/community" },
    { label: "Support", href: "/support" },
    { label: "Status", href: "/status" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press Kit", href: "/press" },
    { label: "Contact", href: "/contact" },
    { label: "Partners", href: "/partners" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "GDPR", href: "/gdpr" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/scorebolt", label: "Twitter" },
  { icon: Github, href: "https://github.com/scorebolt", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com/company/scorebolt", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com/scorebolt", label: "Instagram" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/6 bg-background">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="grid-pattern absolute inset-0 opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 py-16 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <Zap className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="gradient-text text-xl font-bold">ScoreBolt</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Create. Score. Share Live. The most beautiful cricket scoring platform
              ever built.
            </p>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Stay updated
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  placeholder="you@email.com"
                  className="w-full max-w-[220px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                />
                <button className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-light glow-primary">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground">{category}</h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/6 py-8 sm:flex-row">
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} ScoreBolt. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
