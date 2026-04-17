import { useTheme } from '../hooks/useTheme';
import Icons from './Icons';
import { MODULES, FONT, RADIUS, SHADOW } from '../lib/tokens';

export default function DashboardPage({ onNavigate, stats, enabledModules, moduleStats }) {
  const { theme, lang } = useTheme();

  const defaultStats = [
    { labelTH: 'ยอดขายวันนี้', labelEN: "Today's revenue", value: '฿0', sub: '', color: theme.success },
    { labelTH: 'ออเดอร์', labelEN: 'Orders', value: '0', sub: '', color: theme.info },
    { labelTH: 'สินค้าใกล้หมด', labelEN: 'Low stock', value: '0', sub: '', color: theme.warning },
    { labelTH: 'แพคแล้ว', labelEN: 'Packed', value: '0', sub: '', color: theme.accent },
  ];

  const displayStats = stats || defaultStats;

  const moduleColors = {
    stock: { color: theme.success, bg: theme.successLight },
    sales: { color: theme.info, bg: theme.infoLight },
    pos: { color: theme.warning, bg: theme.warningLight },
    crm: { color: theme.accent, bg: theme.accentLight },
    pack_station: { color: theme.danger, bg: theme.dangerLight },
    barcode: { color: theme.purple400, bg: theme.purple50 },
  };

  const visibleModules = MODULES.filter(m =>
    !enabledModules || enabledModules.includes(m.id)
  );

  return (
    <div>
      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}>
        {displayStats.map((s, i) => (
          <div key={i} style={{
            background: theme.card,
            borderRadius: RADIUS.lg,
            padding: '16px 18px',
            border: `1px solid ${theme.border}`,
            borderLeft: `4px solid ${s.color}`,
            boxShadow: SHADOW.sm,
          }}>
            <div style={{
              fontSize: 11, color: theme.text400,
              letterSpacing: 0.3, marginBottom: 6,
              textTransform: 'uppercase',
            }}>
              {lang === 'th' ? s.labelTH : s.labelEN}
            </div>
            <div style={{
              fontSize: 26, fontWeight: 700, color: theme.text900,
              letterSpacing: -0.5, lineHeight: 1,
            }}>
              {s.value}
            </div>
            {s.sub && (
              <div style={{ fontSize: 11, color: theme.text500, marginTop: 6 }}>
                {s.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Module grid */}
      <h2 style={{
        fontSize: 13, fontWeight: 600, color: theme.text500,
        margin: '0 0 10px', letterSpacing: 0.5,
        textTransform: 'uppercase', fontFamily: FONT,
      }}>
        {lang === 'th' ? 'โมดูล' : 'Modules'}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap: 10,
      }}>
        {visibleModules.map(mod => {
          const mc = moduleColors[mod.id] || { color: theme.accent, bg: theme.accentLight };
          const Icon = Icons[mod.icon];
          const stat = moduleStats?.[mod.id] || '';

          return (
            <button
              key={mod.id}
              onClick={() => onNavigate(mod.id)}
              style={{
                background: theme.card,
                borderRadius: RADIUS.lg,
                padding: '16px',
                border: `1px solid ${theme.border}`,
                boxShadow: SHADOW.sm,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textAlign: 'left',
                fontFamily: FONT,
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: mc.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {Icon && Icon(mc.color)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.text900 }}>
                  {lang === 'th' ? mod.labelTH : mod.labelEN}
                </div>
                {stat && (
                  <div style={{ fontSize: 11, color: theme.text400, marginTop: 1 }}>
                    {stat}
                  </div>
                )}
              </div>
              {Icons.chevron(theme.text300)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
