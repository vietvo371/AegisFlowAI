'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SignupForm from './signup-form';
import {
  Shield, Activity, Users, MapPin, Zap, CheckCircle2,
  UserPlus, ArrowRight, Sparkles,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { icon: Zap,    text: 'Early warning under 5 minutes', color: '#fbbf24' },
  { icon: Users,  text: 'Real-time rescue coordination', color: '#60a5fa' },
  { icon: MapPin, text: 'High-accuracy AI flood mapping', color: '#34d399' },
  { icon: Shield, text: 'AES-256 & ISO 27001 encrypted',  color: '#a78bfa' },
];

const TESTIMONIAL = {
  avatar: 'TN',
  name: 'Tran Ngoc Hai',
  role: 'Head of Flood Prevention, Da Nang City',
  quote: '"AegisFlow AI helped us respond 3× faster than before — truly life-saving."',
};

const STATS = [
  { value: '94.7%', label: 'AI Accuracy' },
  { value: '< 5min', label: 'Alert Time' },
  { value: '500K+',  label: 'People Protected' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function SignUpPage() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  /* signup enters from LEFT, exits to LEFT  */
  /* signin enters from RIGHT, exits to RIGHT */
  /* → when going signin→signup: signin exits right, signup enters from left ✓ */
  const handleNavTo = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setLeaving(true);
    setTimeout(() => router.push(href), 400);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: "'Be Vietnam Pro', sans-serif",
        background: '#07070f',
        /* enter: slide in from left; exit: slide out to left */
        opacity:   mounted && !leaving ? 1 : 0,
        transform: mounted && !leaving
          ? 'none'
          : leaving
            ? 'translateX(-36px)'
            : 'translateX(-36px)',
        transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1), transform 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}
    >

      {/* ══════════════════════════════════════════
          COL LEFT — FORM  (opposite of signin)
      ══════════════════════════════════════════ */}
      <div
        style={{
          width: '100%', maxWidth: 500,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '40px 48px',
          background: 'linear-gradient(160deg, #0d0d1a 0%, #0a0a16 100%)',
          overflowY: 'auto', flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
        className="auth-form-panel"
      >
        {/* Back link */}
        <a
          href="/"
          onClick={handleNavTo('/')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
            textDecoration: 'none', marginBottom: 32, transition: 'color 0.15s',
            cursor: 'pointer',
          }}
          className="back-link"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to home
        </a>

        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #17b26a, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(23,178,106,0.4)',
            }}>
              <UserPlus size={19} style={{ color: '#fff' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>
                Create account
              </h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Start protecting your community today
              </p>
            </div>
          </div>
        </div>

        {/* Social auth — dark-styled */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {[
            {
              label: 'Sign up with Google',
              icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              ),
            },
            {
              label: 'Sign up with Github',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              ),
            },
          ].map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                width: '100%', height: 44,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                color: 'rgba(255,255,255,0.75)',
                fontSize: 13.5, fontWeight: 500,
                fontFamily: "'Be Vietnam Pro', sans-serif",
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.25)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            Or sign up with email
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Form */}
        <SignupForm />

        {/* Sign in link */}
        <div style={{ marginTop: 22, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Already have an account?{' '}
            <a
              href="/signin"
              onClick={handleNavTo('/signin')}
              style={{ fontWeight: 700, color: '#34d399', textDecoration: 'none', cursor: 'pointer' }}
              className="auth-link"
            >
              Sign in
            </a>
          </p>
        </div>

        {/* Terms */}
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          By signing up, you agree to our{' '}
          <Link href="/terms" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: 600 }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>.
        </p>

        {/* Security badge */}
        <div style={{
          marginTop: 20, padding: '10px 14px',
          background: 'rgba(23,178,106,0.07)', border: '1px solid rgba(23,178,106,0.15)',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Shield size={13} style={{ color: '#34d399', flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.5 }}>
            Encrypted with <strong style={{ color: 'rgba(255,255,255,0.6)' }}>AES-256</strong> · Protected under <strong style={{ color: 'rgba(255,255,255,0.6)' }}>ISO 27001</strong>
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          COL MID — IMAGE
      ══════════════════════════════════════════ */}
      <div
        style={{ flex: 1, display: 'none', position: 'relative', overflow: 'hidden' }}
        className="lg-mid-col"
      >
        <Image
          src="/signup-bg.png"
          alt="Rescue operations during flood"
          fill
          sizes="(min-width: 1024px) 40vw, 0px"
          priority
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* Blend left→dark-form, right→dark-brand */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(7,7,15,0.55) 0%, transparent 20%, transparent 75%, rgba(5,5,8,0.85) 100%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 60%, rgba(7,7,15,0.5) 100%)',
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
          <Activity size={10} style={{ color: '#34d399' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            Join for free · No credit card required
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          COL RIGHT — BRAND  (opposite of signin)
      ══════════════════════════════════════════ */}
      <div
        style={{
          width: 380, flexShrink: 0, display: 'none', flexDirection: 'column',
          padding: '48px 36px',
          background: 'linear-gradient(160deg, #08080f 0%, #0a0818 50%, #050508 100%)',
          position: 'relative', overflow: 'hidden',
        }}
        className="lg-right-col"
      >
        {/* Glow orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: '-15%', left: '-20%',
            width: 380, height: 380, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(23,178,106,0.15) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', right: '-15%',
            width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(105,56,239,0.1) 0%, transparent 70%)',
            filter: 'blur(55px)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.025,
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }} />
          {/* Left-edge fade to blend with image */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 80,
            background: 'linear-gradient(to left, transparent, rgba(5,5,8,0.95))',
          }} />
        </div>

        {/* Logo */}
        <Link href="/" onClick={handleNavTo('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', position: 'relative', zIndex: 10, marginBottom: 40 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 0 20px rgba(23,178,106,0.5)',
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
            background: 'rgba(23,178,106,0.15)', border: '1px solid rgba(23,178,106,0.3)',
            borderRadius: 99, padding: '5px 12px', width: 'fit-content',
          }}>
            <Sparkles size={10} style={{ color: '#34d399' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Join the Community
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 30, fontWeight: 900, color: '#fff',
            lineHeight: 1.2, letterSpacing: '-0.035em', margin: '0 0 12px',
          }}>
            Together<br />
            <span style={{
              background: 'linear-gradient(90deg, #34d399, #60a5fa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              protect lives
            </span>
          </h1>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, margin: '0 0 28px' }}>
            Thousands of officers and volunteers are using AegisFlow AI to respond faster and save more lives.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', minWidth: 70 }}>{value}</div>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.38)', fontWeight: 500, textAlign: 'right' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {FEATURES.map(({ icon: Icon, text, color }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `rgba(${color === '#fbbf24' ? '251,191,36' : color === '#60a5fa' ? '96,165,250' : color === '#34d399' ? '52,211,153' : '167,139,250'},0.12)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{text}</span>
                <CheckCircle2 size={11} style={{ marginLeft: 'auto', color: 'rgba(52,211,153,0.5)', flexShrink: 0 }} />
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '14px 16px', marginTop: 14,
          }}>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, margin: '0 0 12px', fontStyle: 'italic' }}>
              {TESTIMONIAL.quote}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #17b26a, #6938ef)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#fff',
              }}>
                {TESTIMONIAL.avatar}
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff' }}>{TESTIMONIAL.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{TESTIMONIAL.role}</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 1 }}>
                {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#fbbf24', fontSize: 12 }}>★</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 6, marginTop: 24 }}>
          <Shield size={10} style={{ color: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.15)' }}>AegisFlow AI · © 2025</span>
        </div>
      </div>

      {/* ── Global Styles ── */}
      <style>{`
        @media (min-width: 1200px) {
          .lg-right-col { display: flex !important; }
          .lg-mid-col   { display: block !important; }
          .auth-form-panel { max-width: 500px !important; }
        }
        @media (min-width: 900px) and (max-width: 1199px) {
          .lg-right-col { display: flex !important; width: 340px !important; }
          .lg-mid-col   { display: none !important; }
          .auth-form-panel { max-width: 500px !important; }
        }
        @media (max-width: 899px) {
          .auth-form-panel {
            max-width: 100% !important;
            padding: 40px 24px 52px !important;
            background: linear-gradient(160deg, #0d0d1a 0%, #0a0a16 100%) !important;
          }
        }
        .back-link:hover { color: rgba(255,255,255,0.7) !important; }
        .auth-link:hover  { color: #6ee7b7 !important; }
      `}</style>
    </div>
  );
}
