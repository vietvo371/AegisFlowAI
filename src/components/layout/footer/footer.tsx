import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: t('footer.solutions'),
      links: [
        { href: '/#live-map', label: t('footer.liveMap') },
        { href: '/#forecast', label: t('footer.floodForecast') },
        { href: '/#risk', label: t('footer.riskAnalysis') },
        { href: '/#rescue', label: t('footer.rescueCoordination') },
      ],
    },
    {
      title: t('footer.company'),
      links: [
        { href: '/about', label: t('footer.aboutUs') },
        { href: '/blog', label: t('footer.blog') },
        { href: '/careers', label: t('footer.careers') },
        { href: '/contact', label: t('footer.contact') },
      ],
    },
    {
      title: t('footer.support'),
      links: [
        { href: '/docs', label: t('footer.docs') },
        { href: '/api-docs', label: t('footer.api') },
        { href: '/status', label: t('footer.systemStatus') },
        { href: '/help', label: t('footer.helpCenter') },
      ],
    },
  ];

  return (
    <footer className="bg-muted/30 pt-16 pb-8 border-t border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <ShieldCheck size={24} />
              </div>
              <span className="text-xl font-bold tracking-tight">
                AegisFlow <span className="text-primary">AI</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              {t('footer.description')}
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all">
                <Facebook size={18} />
              </Link>
              <Link href="#" className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all">
                <Twitter size={18} />
              </Link>
              <Link href="#" className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all">
                <Linkedin size={18} />
              </Link>
              <Link href="#" className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all">
                <Youtube size={18} />
              </Link>
            </div>
          </div>

          {/* Links Columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-5">
              <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">
                {section.title}
              </h3>
              <nav className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary hover:translate-x-1 transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <Separator className="my-12 bg-border/50" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
            <p className="text-sm text-muted-foreground">
              © {currentYear} AegisFlow AI. {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary underline">
                {t('footer.privacyPolicy')}
              </Link>
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary underline">
                {t('footer.termsOfService')}
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('footer.systemStatus')}: Optimal
          </div>
        </div>
      </div>
    </footer>
  );
}
