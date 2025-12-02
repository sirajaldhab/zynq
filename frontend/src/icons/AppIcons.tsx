import React from 'react';
import type { SVGProps } from 'react';

const baseProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
};

const merge = (props: SVGProps<SVGSVGElement>) => ({
  ...baseProps,
  ...props,
  className: `inline-block ${props.className || ''}`.trim(),
});

export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...merge(props)}>
      <rect x="3" y="3" width="7" height="7" rx="2" fill="#8B5CF6" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" fill="#F472B6" />
      <rect x="3" y="14" width="5" height="7" rx="1.5" fill="#34D399" />
      <rect x="11" y="11" width="10" height="10" rx="2" fill="#60A5FA" />
    </svg>
  );
}

export function FinanceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...merge(props)}>
      <rect x="2.5" y="5" width="19" height="14" rx="3" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.5" />
      <path d="M6 12h3l2-3 3 4 2-2h2" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="16" r="1.6" fill="#F472B6" />
      <circle cx="16" cy="16" r="1.6" fill="#34D399" />
    </svg>
  );
}

export function HrIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...merge(props)}>
      <circle cx="12" cy="7" r="4" fill="#FB7185" />
      <path d="M4.5 20.5c1.2-3.8 4.2-6 7.5-6s6.3 2.2 7.5 6" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      <circle cx="6" cy="18" r="1.7" fill="#60A5FA" />
      <circle cx="18" cy="18" r="1.7" fill="#34D399" />
    </svg>
  );
}

export function ProjectsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...merge(props)}>
      <rect x="3" y="9" width="6" height="12" rx="2" fill="#F97316" />
      <rect x="10" y="3" width="5" height="18" rx="2" fill="#38BDF8" />
      <rect x="16" y="12" width="5" height="9" rx="1.5" fill="#A78BFA" />
      <path d="M3 9l9-6 9 9" stroke="#1E40AF" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function DocumentsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...merge(props)}>
      <path d="M6 3h9l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#2563EB" />
      <path d="M15 3v4h4" fill="#3B82F6" />
      <rect x="7" y="11" width="10" height="1.8" rx="0.9" fill="#BAE6FD" />
      <rect x="7" y="15" width="8" height="1.8" rx="0.9" fill="#C7D2FE" />
    </svg>
  );
}

export function AdminIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...merge(props)}>
      <circle cx="12" cy="12" r="9" fill="#0F172A" stroke="#F472B6" strokeWidth="1.5" />
      <path d="M12 7v5l3 2" stroke="#FACC15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.4" fill="#34D399" />
    </svg>
  );
}

export function AnalyticsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...merge(props)}>
      <rect x="4" y="4" width="16" height="16" rx="4" fill="#111827" />
      <path d="M7 15l3-4 3 2 4-6" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="11" r="1" fill="#F87171" />
      <circle cx="13" cy="13" r="1" fill="#FACC15" />
      <circle cx="17" cy="9" r="1" fill="#34D399" />
    </svg>
  );
}

export function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...merge(props)}>
      <circle cx="12" cy="8" r="4" fill="#F472B6" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      <rect x="4" y="17" width="16" height="4" rx="2" fill="#1D4ED8" opacity="0.3" />
    </svg>
  );
}
