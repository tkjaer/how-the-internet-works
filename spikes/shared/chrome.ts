// Shared DOM chrome (breadcrumb, language + level switchers, caption card).
// Plain DOM text: crisp, selectable, screen-reader friendly and RTL-aware in every spike.
import './ui.css';
import { applyDataI18n, getLang, getLevel, languages, onLangChange, onLevelChange, setLevel, t } from './i18n';
import { current, go, onRoute } from './router';

export function mountChrome(spikeName: string) {
  const top = document.createElement('header');
  top.className = 'chrome-top';
  top.innerHTML = `
    <a class="chip gallery-link" href="../../"><span aria-hidden="true">←</span> <span data-i18n="nav.gallery"></span></a>
    <nav class="crumbs" aria-label="breadcrumb"></nav>
    <div class="controls">
      <div class="seg langs" role="group" aria-label="Language"></div>
      <div class="seg level" role="group">
        <button data-level="kid" data-i18n="mode.kid"></button>
        <button data-level="nerd" data-i18n="mode.nerd"></button>
      </div>
    </div>`;
  const badge = document.createElement('div');
  badge.className = 'spike-badge';
  badge.textContent = spikeName;
  const cap = document.createElement('footer');
  cap.className = 'caption';
  cap.innerHTML = `<h2></h2><p></p><small class="hint"></small>`;
  document.body.append(top, cap, badge);

  const langs = top.querySelector('.langs')!;
  for (const l of languages) {
    const b = document.createElement('button');
    b.textContent = l.code.toUpperCase();
    b.title = l.name;
    b.lang = l.code;
    b.onclick = () => go({ lang: l.code }, true);
    langs.append(b);
  }
  top.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((b) => {
    b.onclick = () => setLevel(b.dataset.level as 'kid' | 'nerd');
  });

  const render = () => {
    const { scene } = current();
    const crumbs = top.querySelector('.crumbs')!;
    crumbs.innerHTML = '';
    const home = document.createElement('button');
    home.textContent = t('nav.home');
    home.onclick = () => go({ scene: 'overview' });
    home.className = scene === 'overview' ? 'here' : '';
    crumbs.append(home);
    if (scene !== 'overview') {
      const sep = document.createElement('span');
      sep.className = 'sep';
      sep.textContent = '›';
      const here = document.createElement('span');
      here.className = 'here';
      here.textContent = t(`${scene}.title`);
      crumbs.append(sep, here);
    }
    langs.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.lang === getLang()));
    top.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((b) =>
      b.classList.toggle('on', b.dataset.level === getLevel()));
    cap.classList.remove('show');
    void cap.offsetWidth;
    cap.querySelector('h2')!.textContent = t(`${scene}.title`);
    cap.querySelector('p')!.textContent = t(`${scene}.${getLevel()}`);
    cap.querySelector('.hint')!.textContent = t(scene === 'overview' ? 'hint.tap' : 'hint.zoomOut');
    cap.classList.add('show');
    applyDataI18n(top);
  };
  onRoute(render);
  onLangChange(render);
  onLevelChange(render);
  render();
}
