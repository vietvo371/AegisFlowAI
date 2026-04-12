'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, Home, MessageSquare, LayoutDashboard } from 'lucide-react';
import { buttonVariants, Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="w-24 h-24 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 animate-pulse">
          <AlertTriangle size={50} />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-3xl md:text-5xl font-black tracking-tight mb-4"
      >
        Đã có sự cố bất ngờ!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground max-w-md mb-12 text-lg font-medium"
      >
        Hệ thống AegisFlow gặp lỗi kỹ thuật khi đang xử lý dữ liệu. Điều này có thể do kết nối mạng hoặc lỗi máy chủ tạm thời.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-sm"
      >
        <Button 
          onClick={() => reset()} 
          size="lg" 
          className="flex-1 rounded-2xl h-14 font-black gap-3 shadow-xl shadow-primary/20"
        >
          <RotateCcw size={20} />
          Thử lại ngay
        </Button>
        <Link 
          href="/dashboard"
          className={buttonVariants({
            variant: "outline", 
            size: "lg",
            className: "flex-1 rounded-2xl h-14 font-black gap-3 border-2"
          })}
        >
          <LayoutDashboard className="w-5 h-5" />
          Bảng điều khiển
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-4 rounded-2xl bg-muted/50 border border-border flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <MessageSquare size={16} />
        </div>
        <span className="text-xs font-bold text-muted-foreground uppercase text-left">
          Lỗi đã được báo cáo hệ thống.<br/>ID: <code className="text-primary">{error.digest?.slice(0, 8) || 'AE-UNKNOWN'}</code>
        </span>
      </motion.div>
    </div>
  );
}
