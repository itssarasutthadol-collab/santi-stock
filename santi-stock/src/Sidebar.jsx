import { useTheme } from '../hooks/useTheme';
import Icons from './Icons';
import { NAV_ITEMS, FONT } from '../lib/tokens';

export default function Sidebar({ activePage, onNavigate, enabledModules }) {
  const { theme, collapsed, toggleSidebar, lang } = useTheme();

  // Filter nav items: always show dashboard/users/settings, show modules only if enabled
  const nonModulePages = ['dashboard', 'users', 'settings'];
  const visibleNav = NAV_ITEMS.filter(item =>
    nonModulePages.includes(item.id) || !enabledModules || enabledModules.includes(item.id)
  );

  return (
    <aside style={{
      width: collapsed ? 56 : 200,
      background: theme.card,
      borderRight: `1px solid ${theme.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      <nav style={{ flex: 1, padding: '6px', overflowY: 'auto' }}>
        {visibleNav.map(item => {
          const active = activePage === item.id;
          const Icon = Icons[item.icon];
          const label = lang === 'th' ? item.labelTH : item.labelEN;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: collapsed ? '9px' : '9px 10px',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 8,
                background: active ? theme.accentLight : 'transparent',
                color: active ? theme.accentDark : theme.text500,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
                marginBottom: 1,
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
              }}
            >
              {active && (
                <div style={{
                  position: 'absolute', left: 0, top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3, height: 18, borderRadius: 2,
                  background: theme.accent,
                }} />
              )}
              {Icon && Icon(active ? theme.accent : theme.text400)}
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      <button onClick={toggleSidebar} style={{
        padding: 12,
        background: 'none',
        border: 'none',
        borderTop: `1px solid ${theme.border}`,
        cursor: 'pointer',
        color: theme.text400,
        fontSize: 11,
        fontFamily: FONT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}>
        <span style={{
          transform: collapsed ? 'rotate(0)' : 'rotate(180deg)',
          transition: 'transform 0.2s',
          display: 'inline-flex',
        }}>
          {Icons.chevron(theme.text400)}
        </span>
        {!collapsed && <span>{lang === 'th' ? 'ย่อ' : 'Collapse'}</span>}
      </button>
    </aside>
  );
}
