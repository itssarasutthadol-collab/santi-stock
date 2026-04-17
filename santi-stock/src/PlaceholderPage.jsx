import { useTheme } from '../hooks/useTheme';
import Icons from './Icons';
import { NAV_ITEMS, FONT, RADIUS, SHADOW } from '../lib/tokens';

export default function PlaceholderPage({ pageId, onBack }) {
  const { theme, lang } = useTheme();
  const item = NAV_ITEMS.find(n => n.id === pageId);
  const Icon = Icons[item?.icon];

  return (
    <div style={{
      background: theme.card,
      borderRadius: RADIUS.lg,
      border: `1px solid ${theme.border}`,
      padding: '60px 20px',
      textAlign: 'center',
      boxShadow: SHADOW.sm,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: theme.accentLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
      }}>
        {Icon && Icon(theme.accent)}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: theme.text700 }}>
        {item ? (lang === 'th' ? item.labelTH : item.labelEN) : pageId}
      </div>
      <div style={{ fontSize: 13, color: theme.text400, marginTop: 6 }}>
        {lang === 'th' ? 'พร้อมสร้างหน้านี้' : 'Ready to build this page'}
      </div>
      {onBack && (
        <button onClick={onBack} style={{
          marginTop: 16, padding: '8px 20px',
          borderRadius: RADIUS.md,
          border: `1px solid ${theme.text300}`,
          background: theme.card,
          color: theme.text500,
          fontSize: 13, cursor: 'pointer', fontFamily: FONT,
        }}>
          {lang === 'th' ? '← กลับภาพรวม' : '← Back to overview'}
        </button>
      )}
    </div>
  );
}
