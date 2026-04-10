'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Loader2, 
  Clock, 
  Globe,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const t = useTranslations('contact');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate send
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    toast.success('Tin nhắn đã được gửi! Chúng tôi sẽ phản hồi sớm nhất.');
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24">
        {/* Left Side: Info */}
        <div className="space-y-12">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {t('title')}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
              {t('subtitle')}
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-5 group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Mail size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 font-mono">Email Support</div>
                <div className="text-lg font-bold">support@aegisflow.ai</div>
                <div className="text-sm text-muted-foreground mt-0.5">Phản hồi trong vòng 24h</div>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Phone size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 font-mono">Hotline</div>
                <div className="text-lg font-bold">1900 6789</div>
                <div className="text-sm text-muted-foreground mt-0.5">24/7 đối với các tình huống khẩn cấp</div>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <MapPin size={24} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 font-mono">Headquarters</div>
                <div className="text-lg font-bold">Da Nang High-Tech Park</div>
                <div className="text-sm text-muted-foreground mt-0.5">Liên Chiểu, TP. Đà Nẵng, Việt Nam</div>
              </div>
            </div>
          </div>

          {/* Map Placeholder / Small Badge */}
          <div className="p-8 rounded-[2rem] bg-muted/50 border border-border relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                <Globe size={12} />
                Global Infrastructure
              </div>
              <h3 className="text-xl font-bold">Mạng lưới tin cậy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AegisFlow AI được vận hành trên hạ tầng đám mây an toàn, đảm bảo khả năng ứng cứu thiên tai liên tục không gián đoạn.
              </p>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Globe size={120} />
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div>
          <div className="p-8 md:p-12 rounded-[3rem] bg-card border border-border shadow-2xl relative">
            <div className="absolute top-[-20px] left-10 p-4 rounded-2xl bg-primary text-white shadow-xl animate-float">
              <MessageSquare size={24} />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    {t('firstName')}
                  </Label>
                  <Input 
                    id="firstName" 
                    placeholder="Nguyễn" 
                    className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    {t('lastName')}
                  </Label>
                  <Input 
                    id="lastName" 
                    placeholder="Văn A" 
                    className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  {t('email')}
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  className="h-12 rounded-xl bg-muted/30 border-border focus:bg-background transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  {t('message')}
                </Label>
                <Textarea 
                  id="message" 
                  placeholder={t('messagePlaceholder')} 
                  className="min-h-[150px] rounded-xl bg-muted/30 border-border focus:bg-background transition-colors resize-none p-4"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-14 bg-primary hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 text-lg group"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {t('send')}
                    <Send className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={20} />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
