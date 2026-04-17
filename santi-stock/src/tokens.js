/* ═══════════════════════════════════════════════════
   NueaMek เหนือเมฆ — Design Tokens
   Two sky-inspired themes: Golden Hour + Clear Morning
   ═══════════════════════════════════════════════════ */

export const THEMES = {
  golden: {
    id: 'golden',
    name: 'Golden hour',
    nameTH: 'ฟ้ายามเย็น',
    topBar: '#2D2640',
    accent: '#C4875A',
    accentLight: '#F5E6D8',
    accentDark: '#9B6840',
    sky50: '#FDF8F4',
    sky100: '#FAF0E8',
    sky200: '#F2E0D0',
    sky300: '#E5CCB5',
    purple50: '#F5F0FA',
    purple400: '#9678B8',
    statusBar: '#5C4A6B',
    statusText: '#E8D5F0',
    card: '#FFFFFF',
    text900: '#2D2640',
    text700: '#4A3F5C',
    text500: '#8A7E98',
    text400: '#ADA3BA',
    text300: '#D0C8DA',
    border: '#EDE6F0',
    success: '#7A9E5C',
    successLight: '#F0F5EB',
    danger: '#C46B6B',
    dangerLight: '#FAF0F0',
    info: '#6B8AB8',
    infoLight: '#F0F4FA',
    warning: '#C4A04A',
    warningLight: '#FAF5E8',
  },
  morning: {
    id: 'morning',
    name: 'Clear morning',
    nameTH: 'ฟ้าใสยามเช้า',
    topBar: '#1B2A3E',
    accent: '#4A8BC2',
    accentLight: '#E8F2FA',
    accentDark: '#2E6A9E',
    sky50: '#F6FAFE',
    sky100: '#EDF4FB',
    sky200: '#D8E8F5',
    sky300: '#B8D4EA',
    purple50: '#F0F4FA',
    purple400: '#6888B5',
    statusBar: '#2E5478',
    statusText: '#D0E4F5',
    card: '#FFFFFF',
    text900: '#1B2A3E',
    text700: '#34495E',
    text500: '#7A8FA2',
    text400: '#A0B2C2',
    text300: '#C8D6E2',
    border: '#E0EAF2',
    success: '#5A9E6B',
    successLight: '#EBF5EE',
    danger: '#C46B6B',
    dangerLight: '#FAF0F0',
    info: '#4A8BC2',
    infoLight: '#E8F2FA',
    warning: '#C4A04A',
    warningLight: '#FAF5E8',
  },
};

export const FONT = "'Satoshi', 'Noto Sans Thai', system-ui, sans-serif";
export const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

export const RADIUS = { sm: 6, md: 10, lg: 14, xl: 18, pill: 999 };
export const SHADOW = {
  sm: '0 1px 3px rgba(37,36,32,0.06)',
  md: '0 4px 12px rgba(37,36,32,0.08)',
  lg: '0 8px 24px rgba(37,36,32,0.10)',
};

// Module definitions
export const MODULES = [
  { id: 'stock',        labelTH: 'คลังสินค้า',   labelEN: 'Inventory',    icon: 'box' },
  { id: 'sales',        labelTH: 'งานขาย',       labelEN: 'Sales',        icon: 'doc' },
  { id: 'pos',          labelTH: 'POS',           labelEN: 'POS',          icon: 'pos' },
  { id: 'crm',          labelTH: 'สมาชิก',       labelEN: 'Members',      icon: 'crm' },
  { id: 'pack_station', labelTH: 'Pack Station',  labelEN: 'Pack Station', icon: 'pack' },
  { id: 'barcode',      labelTH: 'บาร์โค้ด',     labelEN: 'Barcode',      icon: 'tag' },
];

export const NAV_ITEMS = [
  { id: 'dashboard', labelTH: 'ภาพรวม',      labelEN: 'Overview',      icon: 'grid' },
  ...MODULES,
  { id: 'users',     labelTH: 'ผู้ใช้งาน',    labelEN: 'Users',         icon: 'users' },
  { id: 'settings',  labelTH: 'ตั้งค่า',      labelEN: 'Settings',      icon: 'gear' },
];
