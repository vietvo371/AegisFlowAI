'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { signInSchema, type SignInInput } from '@/lib/validations/auth';
import { AUTH_ACTOR_BY_SLUG, type AuthActorSlug } from '@/lib/auth-actors';
import { getPortalForRole, setPortalToken } from '@/lib/auth-sessions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Mail, Lock, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

type ApiError = {
  name?: string;
  code?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
};

export default function ActorSignInPage() {
  const t = useTranslations('auth');
  const params = useParams<{ actor: string }>();
  const router = useRouter();
  const actor = AUTH_ACTOR_BY_SLUG[params.actor as AuthActorSlug];
  const Icon = actor?.icon;

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<SignInInput>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof SignInInput, string>>>({});

  React.useEffect(() => {
    if (!actor) router.replace('/signin');
  }, [actor, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof SignInInput]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!actor) return;

    setErrors({});
    setIsLoading(true);

    try {
      const validated = signInSchema.parse(formData);

      const api = (await import('@/lib/api')).default;
      const res = await api.post('/auth/login', validated);

      if (res.data?.success) {
        const { token, user: userData } = res.data.data;
        const role: string = userData?.role ?? userData?.roles?.[0] ?? 'citizen';

        if (role !== actor.role) {
          toast.error(t('actorMismatch', { actor: t(`roles.${actor.labelKey}`) }));
          return;
        }

        setPortalToken(getPortalForRole(role), token);

        toast.success(t('loginSuccess'));
        await new Promise(r => setTimeout(r, 100));
        window.location.replace(actor.portalHref);
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof SignInInput, string>> = {};
        error.issues.forEach(err => {
          const fieldName = err.path[0] as keyof SignInInput;
          if (fieldName) fieldErrors[fieldName] = err.message;
        });
        setErrors(fieldErrors);
        toast.error(t('loginValidationError'));
      } else if ((error as ApiError)?.name === 'AbortError' || (error as ApiError)?.code === 'ERR_CANCELED') {
        // Ignore
      } else {
        toast.error((error as ApiError)?.response?.data?.message || t('loginError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!actor || !Icon) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/20 to-indigo-500/20 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
          <Icon size={28} className="text-primary" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <Link
          href="/signin"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          {t(`roles.${actor.labelKey}`)}
          <ChevronDown size={13} />
        </Link>
        <h2 className="text-3xl font-black tracking-tight">{t('actorWelcome', { actor: t(`roles.${actor.labelKey}`) })}</h2>
        <p className="text-sm text-muted-foreground">{t(`roles.${actor.descKey}`)}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
            {t('email')}
          </Label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              className={`h-12 rounded-2xl bg-muted/40 pl-10 border-border/50 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all ${
                errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
              }`}
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 pl-1">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
            {t('password')}
          </Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              className={`h-12 rounded-2xl bg-muted/40 pl-10 pr-11 border-border/50 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all ${
                errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
              }`}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 pl-1">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20" />
            <span className="text-xs text-muted-foreground font-medium">{t('rememberMe')}</span>
          </label>
          <Link href="/reset-password" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            {t('forgotPassword')}
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 font-bold rounded-2xl text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
        >
          {isLoading
            ? <><Loader2 size={18} className="animate-spin mr-2" />{t('signingIn')}</>
            : t('signIn')
          }
        </Button>
      </form>
    </div>
  );
}
