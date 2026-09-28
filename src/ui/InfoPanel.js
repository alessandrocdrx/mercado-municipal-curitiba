// Painel lateral com informações de um módulo (box, placa, etc.).

import { resolveUrl } from '../core/textures.js';

export class InfoPanel {
  constructor(root) {
    this.el = document.createElement('aside');
    this.el.className = 'info-panel';
    this.el.hidden = true;
    root.appendChild(this.el);
    this.viewer = new PhotoViewer(root);
  }

  show(module) {
    const info = module.info ?? {};
    this.el.replaceChildren();
    this.el.style.setProperty('--cat', info.color ?? 'var(--accent)');
    this.el.classList.toggle('has-cat', Boolean(info.color));
    const close = button('×', 'info-close', () => this.hide());
    close.setAttribute('aria-label', 'Fechar');
    const kind = info.category ?? module.type;
    if (kind) this.el.append(element('p', kind, 'info-type'));
    this.el.append(close, element('h2', module.title ?? module.id));
    if (info.location) this.el.append(element('p', `📍 ${info.location}`, 'info-where'));

    const actions = document.createElement('div');
    actions.className = 'info-actions';
    const text = [info.phone, info.description, info.note].filter(Boolean).join(' ');
    const phones = [...(info.phone ?? '').matchAll(/\(?(\d{2})\)?\s*(\d{4,5})-?(\d{4})/g)].map((m) => ({ ddd: m[1], num: m[2] + m[3], label: `(${m[1]}) ${m[2]}-${m[3]}` }));
    const fixo = phones.find((t) => t.num.length === 8) ?? phones[0];
    const cel = phones.find((t) => t.num.length === 9 && t.num.startsWith('9'));
    if (fixo) actions.append(action('📞 Ligar', `tel:+55${fixo.ddd}${fixo.num}`));
    if (cel) actions.append(action('💬 WhatsApp', `https://wa.me/55${cel.ddd}${cel.num}`));
    const ig = text.match(/@([A-Za-z0-9_.]{3,30})/);
    if (ig) actions.append(action('📷 Instagram', `https://instagram.com/${ig[1].replace(/\.$/, '')}`));
    if (info.url) actions.append(action(module.type === 'box' || module.type === 'banca' ? '🔗 Site oficial' : '🔗 Saiba mais', info.url));
    if (actions.childElementCount) this.el.append(actions);

    if (info.description) this.el.append(element('p', info.description, 'info-desc'));
    const rows = [['Horário', info.hours], ['Telefone', phones.length ? phones.map((t) => t.label).join('\n') : info.phone], ['Endereço', info.address]].filter(([, v]) => v);
    if (rows.length) {
      const dl = document.createElement('dl');
      for (const [k, v] of rows) dl.append(element('dt', k), element('dd', v));
      this.el.append(dl);
    }
    if (info.photos?.length) this.el.append(this.photos(info.photos, module._baseUrl ?? window.__TOUR_ROOT__));
    if (info.note) this.el.append(element('p', info.note, 'info-note'));
    if (info.sources?.length) {
      const list = document.createElement('ul');
      list.className = 'info-sources';
      for (const src of info.sources) {
        const a = element('a', src.title);
        Object.assign(a, { href: src.url, target: '_blank', rel: 'noopener' });
        const li = document.createElement('li');
        li.append(a);
        list.append(li);
      }
      this.el.append(element('p', 'Fontes', 'info-type'), list);
    }
    if (info.source) {
      const det = document.createElement('details');
      det.className = 'info-source';
      det.append(element('summary', 'Sobre estes dados'), element('p', `Fonte: ${info.source}`));
      this.el.append(det);
    }
    this.el.hidden = false;
  }

  hide() {
    this.el.hidden = true;
    this.viewer.hide();
  }

  /** Miniaturas com crédito; tocar abre a foto ampliada. */
  photos(photos, baseUrl) {
    const list = document.createElement('div');
    list.className = 'info-photos';
    for (const photo of photos) {
      const src = resolveUrl(photo.src, baseUrl);
      const fig = document.createElement('figure');
      const img = document.createElement('img');
      Object.assign(img, { src, alt: photo.caption ?? '', loading: 'lazy' });
      const open = document.createElement('button');
      open.className = 'info-photo';
      open.title = 'Ampliar foto';
      open.append(img);
      open.addEventListener('click', () => this.viewer.show(src, photo));
      const cap = document.createElement('figcaption');
      if (photo.caption) cap.append(element('span', photo.caption), document.createElement('br'));
      cap.append(credit(photo));
      fig.append(open, cap);
      list.append(fig);
    }
    return list;
  }
}

/** Foto ampliada sobre o tour; fecha ao tocar fora, no × ou com Esc. */
class PhotoViewer {
  constructor(root) {
    this.el = document.createElement('div');
    this.el.className = 'photo-viewer';
    this.el.hidden = true;
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.hide(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.hide(); });
    root.appendChild(this.el);
  }

  show(src, photo) {
    const img = document.createElement('img');
    Object.assign(img, { src, alt: photo.caption ?? '' });
    const cap = document.createElement('p');
    if (photo.caption) cap.append(element('strong', photo.caption), ' · ');
    cap.append(credit(photo));
    this.el.replaceChildren(button('×', 'info-close', () => this.hide()), img, cap);
    this.el.hidden = false;
  }

  hide() {
    this.el.hidden = true;
  }
}

/** "Foto: autor · licença · Wikimedia Commons", com links para a licença e a página. */
function credit(photo) {
  const span = document.createElement('span');
  span.className = 'photo-credit';
  const link = (text, href) => {
    if (!href) return text;
    const a = element('a', text);
    Object.assign(a, { href, target: '_blank', rel: 'noopener' });
    return a;
  };
  span.append(`Foto: ${photo.author} · `, link(photo.license, photo.licenseUrl), ' · ', link(photo.source ?? 'Wikimedia Commons', photo.url));
  return span;
}

function element(tag, text, className) {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  return el;
}

function button(text, className, onClick) {
  const el = element('button', text, className);
  el.addEventListener('click', onClick);
  return el;
}

function action(label, href) {
  const a = element('a', label, 'info-action');
  Object.assign(a, { href, target: '_blank', rel: 'noopener' });
  return a;
}
