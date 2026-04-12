'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldAlert, Home, Map as MapIcon, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
      <motion.div
        initial={{ opacity: 0, rotate: -20, scale: 0.5 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20 
        }}
        className="relative mb-12"
      >
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
          <ShieldAlert size={80} />
        </div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -bottom-4 -right-4 bg-background border-2 border-primary/20 rounded-2xl px-4 py-2 shadow-2xl font-black text-3xl text-primary"
        >
          404
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl md:text-6xl font-black tracking-tighter mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent"
      >
        {t('title')}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground max-w-lg mb-12 text-lg md:text-xl font-medium leading-relaxed"
      >
        {t('description')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-5"
      >
        <Button 
          render={<Link href="/dashboard" />} 
          size="lg" 
          className="rounded-2xl h-14 px-10 font-black gap-3 shadow-xl shadow-primary/25 hover:scale-105 transition-transform active:scale-95"
        >
          <Home size={22} />
          {t('backHome')}
        </Button>
        <Button 
          render={<Link href="/dashboard/map" />} 
          variant="outline" 
          size="lg" 
          className="rounded-2xl h-14 px-10 font-black gap-3 border-2 hover:bg-muted/50 transition-all"
        >
          <MapIcon size={22} />
          Xem Bản đồ
        </Button>
      </motion.div>

      {/* Background Decorative Waves */}
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-40">
        <svg className="absolute bottom-0 left-0 w-full h-64 text-primary/5" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,192L48,176C96,160,192,128,288,144C384,160,480,224,576,218.7C672,213,768,139,864,122.7C960,107,1056,149,1152,154.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );
}
