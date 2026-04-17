import { createContext, useContext, useState, useEffect } from 'react';
import { THEMES } from '../lib/tokens';

const ThemeContext = createContext(null);

export function ThemeProvider({ children, supabase }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem('nueamek_theme') || 'golden');
  const [lang, setLang] = useState(() => localStorage.getItem('nueamek_lang') || 'th');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('nueamek_sidebar') === 'true');

  const theme = THEMES[themeId] || THEMES.golden;

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('nueamek_theme', themeId); }, [themeId]);
  useEffect(() => { localStorage.setItem('nueamek_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('nueamek_sidebar', collapsed); }, [collapsed]);

  // Sync to Supabase user_preferences (fire-and-forget)
  useEffect(() => {
    if (!supabase) return;
    const sync = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('user_preferences').upsert({
        user_id: user.id,
        theme: themeId,
        lang,
        sidebar_collapsed: collapsed,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    };
    sync().catch(() => {});
  }, [themeId, lang, collapsed, supabase]);

  // Load from Supabase on mount
  useEffect(() => {
    if (!supabase) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_preferences')
        .select('theme, lang, sidebar_collapsed')
        .eq('user_id', user.id)
        .single();
      if (data) {
        if (data.theme && THEMES[data.theme]) setThemeId(data.theme);
        if (data.lang) setLang(data.lang);
        if (data.sidebar_collapsed !== null) setCollapsed(data.sidebar_collapsed);
      }
    };
    load().catch(() => {});
  }, [supabase]);

  const t = (th, en) => lang === 'th' ? th : en;
  const toggleLang = () => setLang(l => l === 'th' ? 'en' : 'th');
  const toggleSidebar = () => setCollapsed(c => !c);

  return (
    <ThemeContext.Provider value={{
      theme, themeId, setThemeId,
      lang, setLang, toggleLang, t,
      collapsed, toggleSidebar,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
