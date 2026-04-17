import { useTheme } from '../hooks/useTheme';
import Icons from './Icons';

export default function StatusBar({ tenantName, moduleCount }) {
  const { theme, lang } = useTheme();

  return (
    <footer style={{
      background: theme.statusBar,
      color: theme.statusText,
      padding: '8px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 11,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icons.cloud(theme.statusText)}
        <span>NueaMek</span>
        <span style={{
          display: 'inline-block', width: 6, height: 6,
          borderRadius: 3, background: '#7CBA7A', marginLeft: 2,
        }} />
        <span style={{ opacity: 0.7 }}>
          {lang === 'th' ? 'ระบบปกติ' : 'System OK'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.7 }}>
        <span>{tenantName}</span>
        <span>·</span>
        <span>{moduleCount} {lang === 'th' ? 'โมดูล' : 'modules'}</span>
        <span>·</span>
        <span>v1.0</span>
      </div>
    </footer>
  );
}
