'use client';

import React from 'react';
import { Search, Zap, Globe, AlertTriangle, ShieldCheck, Waves, Users, Activity, Navigation, Radio } from 'lucide-react';

export default function HeroDashboardMockup() {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#f8fafc] text-slate-800 font-sans overflow-hidden flex flex-col shadow-2xl rounded-3xl">
      {/* Header Tabs */}
      <div className="h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center px-4 justify-between z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-500" />
            <span className="font-black text-slate-800 tracking-wide text-sm">AEGISFLOW <span className="text-emerald-500">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 ml-6 text-sm font-semibold text-slate-500">
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs font-black">BETA</span>
            <span className="text-slate-800 border-b-2 border-emerald-500 py-4">Tổng quan</span>
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Cảnh báo</span>
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Bản đồ</span>
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Điều phối</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 text-xs text-slate-500 w-64 shadow-inner">
            <Search size={14} className="mr-2 text-slate-400" /> Tìm kiếm vùng...
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300"></div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative bg-[#E8F0F8]">
        {/* Map Area (Simulated) */}
        <div className="absolute inset-0 overflow-hidden">
           {/* Water Background */}
           <div className="absolute inset-0 bg-[#A6C9E2]"></div>
           {/* Land Mass */}
           <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 600">
              <path d="M 0,0 L 400,0 L 450,150 Q 480,200 550,250 T 700,300 L 1000,300 L 1000,600 L 0,600 Z" fill="#D4E4C8" />
              <path d="M 450,150 Q 500,220 480,300 T 550,500 L 550,600 L 400,600 L 300,500 L 400,300 Z" fill="#D4E4C8" />
              {/* Roads */}
              <path d="M 0,300 Q 200,350 400,300 T 700,400" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.6" />
              <path d="M 200,600 Q 250,450 450,400 T 800,200" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
              <path d="M 450,150 L 550,250 L 550,600" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
           </svg>
           
           {/* Zones */}
           <div className="absolute top-[25%] left-[30%] w-32 h-32 bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center pointer-events-none">
             <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
           </div>
           
           <div className="absolute top-[20%] right-[35%] w-36 h-36 bg-orange-500/20 border-2 border-orange-500/50 flex items-center justify-center pointer-events-none">
             <span className="text-[10px] font-bold text-orange-700 bg-orange-100/80 px-1 rounded">AH17</span>
           </div>

           <div className="absolute bottom-[35%] left-[45%] text-[10px] font-bold text-slate-500 bg-white/50 px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1">
             <Radio size={10} className="text-blue-500" /> Sân bay quốc tế Đà Nẵng (DAD)
           </div>
        </div>

        {/* Left Panel */}
        <div className="w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200 z-10 flex flex-col p-4 shadow-2xl h-full ml-4 mt-4 rounded-xl mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs font-black text-red-500 tracking-wider">LIVE</span>
            <span className="text-[10px] text-slate-400 ml-auto">Real-time Flood Map Đà Nẵng</span>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col items-center justify-center mb-6 shadow-sm">
            <span className="text-3xl font-black text-orange-500">2</span>
            <span className="text-[10px] font-bold text-orange-600 uppercase">Cảnh báo</span>
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Critical</span>
                <span className="text-slate-500">1,200 người</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[80%] rounded-full"></div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Warning</span>
                <span className="text-slate-500">780 người</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 w-[50%] rounded-full"></div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Warning</span>
                <span className="text-slate-500">430 người</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 w-[30%] rounded-full"></div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Safe</span>
                <span className="text-slate-500">0 Bình thường</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-[100%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Floating Panels */}
        <div className="absolute right-4 top-4 bottom-4 w-72 z-10 flex flex-col gap-4 pointer-events-none">
           {/* Teams Panel */}
           <div className="bg-white/95 border border-slate-200 backdrop-blur-xl rounded-xl shadow-2xl pointer-events-auto flex flex-col overflow-hidden h-[calc(100%-80px)]">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500">12 Teams</span>
                  <span className="text-[10px] text-slate-400">Available for dispatch</span>
                </div>
              </div>
              <div className="flex-1 p-4 flex flex-col gap-5 overflow-y-auto">
                {/* Item 1 */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">#1 Điểm sơ tán</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">THPT Hoà Vang</h4>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Users size={12} className="text-slate-400" /> 450</span>
                    <span className="flex items-center gap-1"><Navigation size={12} className="text-slate-400" /> 2.3km</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden my-1">
                    <div className="h-full bg-emerald-500 w-[80%] rounded-full"></div>
                  </div>
                  <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-md">
                    <Navigation size={12} /> Điều phối
                  </button>
                </div>
                <div className="h-px bg-slate-100"></div>
                {/* Item 2 */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-orange-500">#2 Cứu trợ khẩn</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">BV Quận Liên Chiểu</h4>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Users size={12} className="text-slate-400" /> 150</span>
                    <span className="flex items-center gap-1"><Navigation size={12} className="text-slate-400" /> 4.1km</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden my-1">
                    <div className="h-full bg-orange-500 w-[40%] rounded-full"></div>
                  </div>
                  <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-md">
                    <Navigation size={12} /> Điều phối
                  </button>
                </div>
                <div className="h-px bg-slate-100"></div>
                {/* Item 3 */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">#3 Hub cứu trợ</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Trung tâm CĐ Đà Nẵng</h4>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><Users size={12} className="text-slate-400" /> 300</span>
                    <span className="flex items-center gap-1"><Navigation size={12} className="text-slate-400" /> 6.7km</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden my-1">
                    <div className="h-full bg-emerald-500 w-[90%] rounded-full"></div>
                  </div>
                  <button className="bg-indigo-500/50 text-white text-xs font-bold py-2 rounded-lg cursor-not-allowed flex items-center justify-center gap-1">
                    <Navigation size={12} /> Đang bận
                  </button>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
