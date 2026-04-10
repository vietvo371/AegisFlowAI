'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SignInWithGithub, SignInWithGoogle } from '../_components/social-auth';
import SignInForm from './signin-form';
import { Shield, Activity, ArrowRight, MapPin, LogIn } from 'lucide-react';

const LIVE_ALERTS = [
  { district: 'Lien Chieu',    text: 'Water level: Alert 3', color: '#f04438', bg: 'rgba(240,68,56,0.15)',  border: 'rgba(240,68,56,0.3)'  },
  { district: 'Hai Chau',      text: 'High flood risk',      color: '#f04438', bg: 'rgba(240,68,56,0.15)',  border: 'rgba(240,68,56,0.3)'  },
  { district: 'Ngu Hanh Son',  text: 'Storm surge level 2',  color: '#f04438', bg: 'rgba(240,68,56,0.15)',  border: 'rgba(240,68,56,0.3)'  },
  { district: 'Thanh Khe',     text: 'Moderate rain, watch', color: '#f79009', bg: 'rgba(247,144,9,0.15)',  border: 'rgba(247,144,9,0.3)'  },
  { district: 'Hoa Vang',      text: 'Rain 140mm/6h',        color: '#f79009', bg: 'rgba(247,144,9,0.15)',  border: 'rgba(247,144,9,0.3)'  },
  { district: 'Cam Le',        text: 'Moderate risk',        color: '#f79009', bg: 'rgba(247,144,9,0.15)',  border: 'rgba(247,144,9,0.3)'  },
  { district: 'Son Tra',       text: 'Stable, monitoring',   color: '#17b26a', bg: 'rgba(23,178,106,0.15)', border: 'rgba(23,178,106,0.3)' },
];

const STATS = [
  { value: '94.7%', label: 'AI Accuracy' },
  { value: '< 5min', label: 'Alert Time' },
  { value: '500K+', label: 'People Protected' },
];

export default function SignInPage() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleNavTo = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setLeaving(true);
    setTimeout(() => router.push(href), 420);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'Be Vietnam Pro', sans-serif",
      background: '#0a0a14',
      opacity: mounted && !leaving ? 1 : 0,
      transform: mounted && !leaving ? 'none' : 'translateX(36px)',
      transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.4,0,0.2,1)',
    }}>

      {/* ══════════════════════════════════════════
          CỘT TRÁI — Text / Brand / Alerts
      ══════════════════════════════════════════ */}
      <div style={{
        width: 360, flexShrink: 0, display: 'none', flexDirection: 'column',
        padding: '48px 36px',
        background: 'linear-gradient(160deg, #08080f 0%, #0a0818 50%, #050508 100%)',
        position: 'relative', overflow: 'hidden',
      }}
        className="lg-left-col"
      >
        {/* Glow orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: '-15%', right: '-20%',
            width: 380, height: 380, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(105,56,239,0.15) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', left: '-15%',
            width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(23,178,106,0.1) 0%, transparent 70%)',
            filter: 'blur(55px)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.025,
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }} />
          {/* Right-edge fade to blend seamlessly with map */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 80,
            background: 'linear-gradient(to right, transparent, rgba(5,5,8,0.95))',
          }} />
        </div>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', position: 'relative', zIndex: 10, marginBottom: 40 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 0 20px rgba(105,56,239,0.5)',
            position: 'relative', flexShrink: 0,
          }}>
            <Image src="/logo-aegisflow.png" alt="AegisFlow" fill sizes="40px" priority style={{ objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: 19, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
            AegisFlow AI
          </span>
        </Link>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18,
            background: 'rgba(105,56,239,0.15)', border: '1px solid rgba(105,56,239,0.3)',
            borderRadius: 99, padding: '5px 12px', width: 'fit-content',
          }}>
            <Activity size={10} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Real-time Early Warning System
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 30, fontWeight: 900, color: '#fff',
            lineHeight: 1.2, letterSpacing: '-0.035em', margin: '0 0 12px',
          }}>
            Protect communities<br />
            <span style={{
              background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              against disasters
            </span>
          </h1>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, margin: '0 0 28px' }}>
            AI-powered Digital Twin platform for flood forecasting, rescue coordination and early warning in Da Nang.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  fontSize: 17, fontWeight: 900, color: '#fff',
                  minWidth: 70,
                }}>{value}</div>
                <div style={{
                  flex: 1, height: 1,
                  background: 'rgba(255,255,255,0.06)',
                }} />
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.38)', fontWeight: 500, textAlign: 'right' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Live alerts panel */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Live Alerts
                </span>
              </div>
              <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.22)' }}>09:47 AM</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {LIVE_ALERTS.map(a => (
                <div key={a.district} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  borderRadius: 9, background: a.bg, border: `1px solid ${a.border}`,
                }}>
                  <MapPin size={9} style={{ color: a.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', flex: 1 }}>{a.district}</span>
                  <span style={{ fontSize: 10, color: a.color, fontWeight: 500 }}>{a.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 6, marginTop: 24 }}>
          <Shield size={10} style={{ color: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.15)' }}>AegisFlow AI · © 2025</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CỘT GIỮA — Map Image
      ══════════════════════════════════════════ */}
      <div style={{
        flex: 1, display: 'none', position: 'relative', overflow: 'hidden',
      }}
        className="lg-mid-col"
      >
        <Image
          src="/signin-bg.png"
          alt="Bản đồ AI giám sát lũ lụt Đà Nẵng"
          fill
          sizes="(min-width: 1024px) 40vw, 0px"
          priority
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* Side gradients — blend left into dark panel, right into white form */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(5,5,8,0.85) 0%, rgba(5,5,8,0.2) 12%, transparent 30%, transparent 80%, rgba(255,255,255,0.12) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Bottom label */}
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10,10,20,0.65)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99,
          padding: '5px 14px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <MapPin size={10} style={{ color: '#a78bfa' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            Digital Twin · AI Flood Risk Visualization
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CỘT PHẢI — Form đăng nhập
      ══════════════════════════════════════════ */}
      <div style={{
        width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 44px', background: '#fff', overflowY: 'auto',
        flexShrink: 0,
      }}
        className="auth-right-panel"
      >
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #6938ef, #4e6ef5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LogIn size={18} style={{ color: '#fff' }} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0f0a2e', margin: 0, letterSpacing: '-0.03em' }}>
              Welcome back
            </h2>
          </div>
          <p style={{ fontSize: 13.5, color: '#667085', margin: 0, lineHeight: 1.6 }}>
            Sign in to continue monitoring and protecting your community.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 22 }}>
          <SignInWithGoogle />
          <SignInWithGithub />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{ flex: 1, height: 1, background: '#eaecf0' }} />
          <span style={{ fontSize: 11.5, color: '#98a2b3', fontWeight: 500, whiteSpace: 'nowrap' }}>
            Or sign in with email
          </span>
          <div style={{ flex: 1, height: 1, background: '#eaecf0' }} />
        </div>

        <SignInForm />

        <div style={{ marginTop: 22, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#667085', margin: 0 }}>
            Don&apos;t have an account?{' '}
            <a
              href="/signup"
              onClick={handleNavTo('/signup')}
              style={{
                fontWeight: 700, color: '#6938ef', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer',
              }}
              className="signup-link"
            >
              Sign up free <ArrowRight size={12} />
            </a>
          </p>
        </div>

        <div style={{
          marginTop: 24, padding: '11px 15px',
          background: '#f9fafb', border: '1px solid #eaecf0',
          borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Shield size={14} style={{ color: '#17b26a', flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: '#667085', margin: 0, lineHeight: 1.5 }}>
            Your data is encrypted with <strong style={{ color: '#344054' }}>AES-256</strong> and protected under <strong style={{ color: '#344054' }}>ISO 27001</strong> standards.
          </p>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (min-width: 1200px) {
          .lg-left-col  { display: flex !important; }
          .lg-mid-col   { display: block !important; }
          .auth-right-panel { max-width: 480px !important; }
        }
        @media (min-width: 900px) and (max-width: 1199px) {
          .lg-left-col  { display: flex !important; width: 320px !important; }
          .lg-mid-col   { display: none !important; }
          .auth-right-panel { max-width: 480px !important; }
        }
        @media (max-width: 899px) {
          .auth-right-panel {
            max-width: 100% !important;
            padding: 40px 24px !important;
          }
        }
        .signup-link:hover { color: #7c3aed !important; }
      `}</style>
    </div>
  );
}
