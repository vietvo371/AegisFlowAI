import {
  BrainCircuit,
  HeartPulse,
  LayoutDashboard,
  RadioTower,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

export type AuthActorSlug =
  | 'city-admin'
  | 'rescue-operator'
  | 'ai-operator'
  | 'rescue-team'
  | 'citizen';

export type AuthActor = {
  slug: AuthActorSlug;
  role: string;
  portalHref: string;
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
};

export const AUTH_ACTORS: AuthActor[] = [
  {
    slug: 'city-admin',
    role: 'city_admin',
    portalHref: '/dashboard',
    icon: LayoutDashboard,
    labelKey: 'cityAdmin',
    descKey: 'cityAdminDesc',
  },
  {
    slug: 'rescue-operator',
    role: 'rescue_operator',
    portalHref: '/dashboard',
    icon: RadioTower,
    labelKey: 'rescueOperator',
    descKey: 'rescueOperatorDesc',
  },
  {
    slug: 'ai-operator',
    role: 'ai_operator',
    portalHref: '/dashboard',
    icon: BrainCircuit,
    labelKey: 'aiOperator',
    descKey: 'aiOperatorDesc',
  },
  {
    slug: 'rescue-team',
    role: 'rescue_team',
    portalHref: '/team',
    icon: ShieldAlert,
    labelKey: 'rescueTeam',
    descKey: 'rescueTeamDesc',
  },
  {
    slug: 'citizen',
    role: 'citizen',
    portalHref: '/citizen',
    icon: HeartPulse,
    labelKey: 'citizen',
    descKey: 'citizenDesc',
  },
];

export const AUTH_ACTOR_BY_SLUG = AUTH_ACTORS.reduce((acc, actor) => {
  acc[actor.slug] = actor;
  return acc;
}, {} as Record<AuthActorSlug, AuthActor>);

export const AUTH_ACTOR_BY_ROLE = AUTH_ACTORS.reduce((acc, actor) => {
  acc[actor.role] = actor;
  return acc;
}, {} as Record<string, AuthActor>);
