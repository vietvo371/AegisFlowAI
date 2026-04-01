export type NavItem = {
  label: string;
} & (
  | {
      type: 'link';
      href: string;
    }
  | {
      type: 'dropdown';
      items: { href: string; label: string }[];
    }
);

export const navItems: NavItem[] = [
  {
    type: 'link',
    href: '/',
    label: 'Trang chủ',
  },
  {
    type: 'link',
    label: 'Tính năng',
    href: '/#features',
  },
  {
    type: 'link',
    label: 'Bản đồ trực tuyến',
    href: '/dashboard',
  },
  {
    type: 'link',
    label: 'Liên hệ',
    href: '/contact',
  },
];

export const dashboardNavItems: NavItem[] = [
  {
    type: 'link',
    href: '/dashboard',
    label: 'Tổng quan',
  },
  {
    type: 'link',
    href: '/dashboard#alerts',
    label: 'Cảnh báo',
  },
  {
    type: 'link',
    href: '/dashboard#maps',
    label: 'Bản đồ',
  },
  {
    type: 'link',
    href: '/dashboard#dispatch',
    label: 'Điều phối',
  },
];
