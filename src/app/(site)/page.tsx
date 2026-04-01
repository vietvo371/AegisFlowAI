'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CloudSun, 
  Activity, 
  AlertTriangle, 
  Bell, 
  Database, 
  BarChart3, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  iconBg, 
  iconColor 
}: { 
  icon: React.ElementType, 
  title: string, 
  description: string, 
  iconBg: string, 
  iconColor: string 
}) => (
  <div className="group relative p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1">
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", iconBg)}>
      <Icon className={cn("w-7 h-7", iconColor)} />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">{title}</h3>
    <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
  </div>
);

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      {/* ── Background Effects ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] pointer-events-none overflow-hidden">
        <div className="aurora-glow top-[-10%] left-[-10%] animate-aurora" />
        <div className="aurora-glow top-[20%] right-[-10%] animate-aurora" style={{ animationDelay: '-5s', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)' }} />
      </div>

      {/* ── Hero Section ── */}
      <section className="relative pt-20 pb-0 lg:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-bold mb-8 animate-fade-in">
            <ShieldCheck size={14} />
            <span>AEGISFLOW AI V1.0 • ĐÀ NẴNG</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-gray-900 leading-[1.1] tracking-[-0.04em] mb-8 animate-fade-in-up">
            Ứng phó lũ lụt với <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Trí tuệ Nhân tạo</span>
          </h1>

          {/* Subtext */}
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 leading-relaxed mb-10 animate-fade-in-up delay-1">
            Giải pháp Digital Twin tiên phong giúp dự báo, giám sát và ứng phó thiên tai 
            thông minh, chính xác theo thời gian thực tại Việt Nam.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in-up delay-2">
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-primary-500/25 flex items-center justify-center gap-2 group active:scale-95"
            >
              Vào Dashboard
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 border border-gray-100 rounded-2xl font-bold text-lg transition-all flex items-center justify-center active:scale-95 shadow-sm"
            >
              Xem Tính năng
            </Link>
          </div>

          {/* 3D Perspective Preview */}
          <div className="relative max-w-6xl mx-auto perspective-2000 animate-fade-in-up delay-3">
            <div className="relative transform-style-3d rotate-x-15 transition-transform duration-700 hover:rotate-x-12">
              {/* Glass Shadow */}
              <div className="absolute -inset-4 bg-primary-500/10 blur-3xl opacity-50 -z-10" />
              
              <div className="relative rounded-[2rem] overflow-hidden border-[12px] border-white/80 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] bg-white/40 backdrop-blur-md">
                <Image 
                  src="/images/dashboard-real.png"
                  alt="AegisFlow Real-time Dashboard"
                  width={1400}
                  height={800}
                  className="w-full h-auto"
                />
              </div>

              {/* Floating Elements (Visual Polish) */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/50 hidden lg:flex flex-col justify-between items-start animate-bounce-slow">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Zap className="text-orange-500 w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời gian thật</div>
                  <div className="text-xl font-black text-gray-900 tracking-tight">99.9%</div>
                </div>
              </div>

              <div className="absolute -bottom-10 -left-10 w-48 h-24 bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-2xl border border-white/50 hidden lg:flex items-center gap-4 animate-bounce-slow" style={{ animationDelay: '-2s' }}>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Globe className="text-emerald-500 w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500">Giám sát</div>
                  <div className="text-lg font-black text-gray-900 leading-none">Toàn quốc</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section id="features" className="py-32 lg:py-48">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
              Giải pháp toàn diện nhất
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Đột phá trong quản lý rủi ro thiên tai nhờ sự kết hợp giữa dữ liệu lớn và AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={CloudSun}
              title="Dự báo Chính xác"
              description="Hệ thống radar thủy văn giúp dự báo chính xác lượng mưa trong 6h tới tại từng khu vực."
              iconBg="bg-blue-50/50"
              iconColor="text-blue-600"
            />
            <FeatureCard 
              icon={Activity}
              title="Giám sát Thời gian thực"
              description="Giải pháp AI tiên phong giúp dự báo, giám sát và ứng phó theo biến động thực tế."
              iconBg="bg-purple-50/50"
              iconColor="text-purple-600"
            />
            <FeatureCard 
              icon={AlertTriangle}
              title="Phân tích Nguy cơ"
              description="Phân tích trực quan tình hình tại từng phân khu, đánh giá nguy cơ lũ quét tức thì."
              iconBg="bg-indigo-50/50"
              iconColor="text-indigo-600"
            />
            <FeatureCard 
              icon={Bell}
              title="Cảnh báo Tức thì"
              description="Hệ thống thông báo đẩy nhanh chóng đến từng khu vực có rủi ro cao."
              iconBg="bg-amber-50/50"
              iconColor="text-amber-600"
            />
            <FeatureCard 
              icon={Database}
              title="Quản lý Tài nguyên"
              description="Điều phối hiệu quả các nguồn lực cứu hộ, kho bãi và đội cơ động trên bản đồ."
              iconBg="bg-sky-50/50"
              iconColor="text-sky-600"
            />
            <FeatureCard 
              icon={BarChart3}
              title="Báo cáo & Phân tích"
              description="Cung cấp báo cáo dữ liệu chi tiết, phân tích xu hướng thiên tai đa chiều."
              iconBg="bg-violet-50/50"
              iconColor="text-violet-600"
            />
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="pb-32 px-4 shadow-inner">
        <div className="max-w-6xl mx-auto rounded-[3rem] bg-gray-900 p-12 lg:p-24 text-center relative overflow-hidden">
          <div className="aurora-glow bg-primary-500 opacity-20 left-1/2 -top-1/2" />
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8 leading-tight">
            Sẵn sàng bảo vệ <br /> cộng đồng của bạn?
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Gia nhập cùng 50+ đối tác quản lý thiên tai hàng đầu tại Việt Nam ngay hôm nay.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard" className="px-10 py-5 bg-white text-gray-900 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all active:scale-95 shadow-lg">
              Bắt đầu miễn phí
            </Link>
            <Link href="/contact" className="px-10 py-5 bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all active:scale-95">
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
