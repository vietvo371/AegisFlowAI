'use client';

import { Checkbox } from '@/components/ui/inputs/checkbox';
import { Label } from '@/components/ui/label';
import { EyeCloseIcon, EyeIcon } from '@/icons/icons';
import { authValidation } from '@/lib/zod/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

type Inputs = z.infer<typeof authValidation.register>;

/* ── Custom dark-themed input ── */
function DarkInput({
  id,
  type = 'text',
  placeholder,
  disabled,
  error,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        height: 48,
        width: '100%',
        borderRadius: 12,
        border: `1px solid ${error ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`,
        background: 'rgba(255,255,255,0.04)',
        padding: '0 16px',
        fontSize: 13.5,
        color: '#fff',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
        opacity: disabled ? 0.5 : 1,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = error
          ? 'rgba(239,68,68,0.8)'
          : 'rgba(52,211,153,0.5)';
        e.target.style.boxShadow = error
          ? '0 0 0 3px rgba(239,68,68,0.1)'
          : '0 0 0 3px rgba(52,211,153,0.08)';
        e.target.style.background = 'rgba(255,255,255,0.06)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = error
          ? 'rgba(239,68,68,0.6)'
          : 'rgba(255,255,255,0.1)';
        e.target.style.boxShadow = 'none';
        e.target.style.background = 'rgba(255,255,255,0.04)';
      }}
      {...rest}
    />
  );
}

function DarkLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.55)',
        marginBottom: 6,
        letterSpacing: '0.01em',
      }}
    >
      {children}
    </label>
  );
}

export default function SignupForm() {
  const form = useForm<Inputs>({
    resolver: zodResolver(authValidation.register),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function onError(errors: typeof form.formState.errors) {
    const fieldLabels: Record<string, string> = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      password: 'Password',
    };
    Object.entries(errors).forEach(([field, err]) => {
      toast.error(`${fieldLabels[field] ?? field}: ${err?.message ?? 'Invalid value'}`, { duration: 4000 });
    });
  }

  async function onSubmit(data: Inputs) {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success('Account created successfully! Welcome aboard 🎉', { duration: 5000 });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        { duration: 5000 }
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 12px' }}>

          {/* First name */}
          <Controller
            control={form.control}
            name="firstName"
            render={({ field, fieldState }) => (
              <div>
                <DarkLabel htmlFor="firstName">First name</DarkLabel>
                <DarkInput
                  id="firstName"
                  placeholder="Your first name"
                  disabled={isLoading}
                  error={!!fieldState.error}
                  {...field}
                />
                {fieldState.error && (
                  <p style={{ color: '#f87171', fontSize: 11, marginTop: 5 }}>{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Last name */}
          <Controller
            control={form.control}
            name="lastName"
            render={({ field, fieldState }) => (
              <div>
                <DarkLabel htmlFor="lastName">Last name</DarkLabel>
                <DarkInput
                  id="lastName"
                  placeholder="Your last name"
                  disabled={isLoading}
                  error={!!fieldState.error}
                  {...field}
                />
                {fieldState.error && (
                  <p style={{ color: '#f87171', fontSize: 11, marginTop: 5 }}>{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Email */}
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <div style={{ gridColumn: '1 / -1' }}>
                <DarkLabel htmlFor="email">Email address</DarkLabel>
                <DarkInput
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  disabled={isLoading}
                  error={!!fieldState.error}
                  {...field}
                />
                {fieldState.error && (
                  <p style={{ color: '#f87171', fontSize: 11, marginTop: 5 }}>{fieldState.error.message}</p>
                )}
              </div>
            )}
          />

          {/* Password */}
          <div style={{ gridColumn: '1 / -1' }}>
            <DarkLabel htmlFor="signup-password">Password</DarkLabel>
            <div style={{ position: 'relative' }}>
              <DarkInput
                id="signup-password"
                type={isShowPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                disabled={isLoading}
                error={!!form.formState.errors.password}
                {...form.register('password')}
              />
              <button
                type="button"
                title={isShowPassword ? 'Hide password' : 'Show password'}
                aria-label={isShowPassword ? 'Hide password' : 'Show password'}
                onClick={() => setIsShowPassword(!isShowPassword)}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center',
                  padding: 0,
                }}
              >
                {isShowPassword ? <EyeIcon /> : <EyeCloseIcon />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p style={{ color: '#f87171', fontSize: 11, marginTop: 5 }}>
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Remember me - styled for dark */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="signup-remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: 16, height: 16, accentColor: '#34d399',
                cursor: 'pointer', flexShrink: 0,
              }}
            />
            <label
              htmlFor="signup-remember"
              style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', userSelect: 'none' }}
            >
              Keep me logged in
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              gridColumn: '1 / -1',
              height: 48,
              borderRadius: 12,
              border: 'none',
              background: isLoading
                ? 'rgba(52,211,153,0.4)'
                : 'linear-gradient(135deg, #17b26a 0%, #0ea5e9 100%)',
              color: '#fff',
              fontFamily: "'Be Vietnam Pro', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s, transform 0.15s, box-shadow 0.2s',
              boxShadow: isLoading ? 'none' : '0 4px 20px rgba(23,178,106,0.35)',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.opacity = '0.90'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 26px rgba(23,178,106,0.45)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = isLoading ? 'none' : '0 4px 20px rgba(23,178,106,0.35)'; }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{
                  width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite', display: 'inline-block',
                }} />
                Creating account...
              </span>
            ) : 'Create Account →'}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.2) !important; }
      `}</style>
    </>
  );
}
