import { useTheme } from '../hooks/useTheme';
import Icons from './Icons';
import { FONT } from '../lib/tokens';

export default function TopBar({ tenantName, userInitials = 'IT' }) {
  const { theme, toggleLang, lang } = useTheme();

  return (
    <header style={{
      background: theme.topBar,
      padding: '0 20px',
      height: 54,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      {/* Left: Logo + brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.purple400})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 2px 8px ${theme.accent}40`,
        }}>{Icons.cloud('#fff')}</div>
        <div>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#fff', letterSpacing: 0.5, fontFamily: FONT }}>
            NueaMek
          </span>
          <span style={{ fontSize: 11, color: theme.text400, marginLeft: 8, letterSpacing: 0.3 }}>
            เหนือเมฆ
          </span>
        </div>
      </div>

      {/* Right: Search + bell + lang + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.1)',
          width: 200,
        }}>
          {Icons.search('rgba(255,255,255,0.4)')}
          <input
            placeholder={lang === 'th' ? 'ค้นหา...' : 'Search...'}
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: FONT, flex: 1,
            }}
          />
        </div>

        <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 4 }}>
          {Icons.bell('rgba(255,255,255,0.45)')}
          <div style={{
            position: 'absolute', top: 2, right: 2,
            width: 7, height: 7, borderRadius: 4,
            background: theme.danger,
            border: `2px solid ${theme.topBar}`,
          }} />
        </button>

        <button onClick={toggleLang} style={{
          padding: '3px 10px', borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 11, cursor: 'pointer', fontFamily: FONT,
          fontWeight: 600, letterSpacing: 0.5,
        }}>
          {lang === 'th' ? 'EN' : 'TH'}
        </button>

        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: theme.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 600, fontSize: 12,
          border: '2px solid rgba(255,255,255,0.2)',
        }}>
          {userInitials}
        </div>
      </div>
    </header>
  );
}
