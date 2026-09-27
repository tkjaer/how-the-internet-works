// Reactive wrapper around the shared i18n lookup: any template calling tr() re-renders on language change.
import { getLang, getLevel, onLangChange, onLevelChange, t, type Level } from '../shared/i18n';

export const loc = $state<{ lang: string; level: Level }>({ lang: getLang(), level: getLevel() });
onLangChange((l) => (loc.lang = l));
onLevelChange((l) => (loc.level = l));

export function tr(key: string) {
  void loc.lang;
  return t(key);
}
