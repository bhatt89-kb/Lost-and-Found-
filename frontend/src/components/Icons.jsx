import React from 'react';

const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' };
const mk = (paths) => ({ size = 16, ...p }) => (
  <svg width={size} height={size} {...base} {...p} aria-hidden="true">{paths}</svg>
);

export const ClockIcon = mk(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const CheckIcon = mk(<path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="2.6" />);
export const TrashIcon = mk(<path d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />);
export const PlusIcon = mk(<path d="M12 5v14M5 12h14" />);
export const SearchIcon = mk(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>);
export const PinIcon = mk(<><path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>);
export const CloseIcon = mk(<path d="M6 6l12 12M18 6L6 18" />);
export const ArrowLeftIcon = mk(<path d="M19 12H5m6-6l-6 6 6 6" />);
export const ArrowRightIcon = mk(<path d="M5 12h14m-6-6l6 6-6 6" />);
export const UsersIcon = mk(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.6a3.5 3.5 0 010 6.8M18 14.2a6.5 6.5 0 013.5 5.8" /></>);
export const UserIcon = mk(<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />);
export const MailIcon = mk(<path d="M3 8l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />);
export const LockIcon = mk(<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />);
export const EyeIcon = mk(<><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.5 12C3.8 7.9 7.5 5 12 5s8.2 2.9 9.5 7c-1.3 4.1-5 7-9.500 7s-8.200-2.900-9.500-7z" /></>);
export const EyeOffIcon = mk(<path d="M13.9 18.8A10 10 0 0112 19c-4.500 0-8.300-2.900-9.500-7a10 10 0 011.600-3m5.800.9a3 3 0 114.200 4.200M9.900 9.900l4.200 4.200M3 3l18 18" />);
