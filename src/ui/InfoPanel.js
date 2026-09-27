// Painel lateral com informações de um módulo (box, placa, etc.).

export class InfoPanel {
  constructor(root) {
    this.el = document.createElement('aside');
    this.el.className = 'info-panel';
    this.el.hidden = true;
    root.appendChild(this.el);
  }

  show(module) {
    const info = module.info ?? {};
    this.el.replaceChildren();
    const close = button('×', 'info-close', () => this.hide());
    const title = element('h2', module.title ?? module.id);
    this.el.append(close, title);
    const label = info.category ?? { box: 'Box', banca: 'Banca', porta: 'Porta' }[module.type] ?? module.type;
    if (label) this.el.append(element('p', label, 'info-type'));
    if (info.description) this.el.append(element('p', info.description));
    const rows = [['Endereço', info.address], ['Horário', info.hours], ['Telefone', info.phone], ['Categoria', info.category], ['Localização', info.location]].filter(([, v]) => v);
    if (rows.length) {
      const dl = document.createElement('dl');
      for (const [k, v] of rows) dl.append(element('dt', k), element('dd', v));
      this.el.append(dl);
    }
    if (info.note) this.el.append(element('p', info.note, 'info-version'));
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
    if (info.url) {
      const a = element('a', 'Saiba mais');
      a.href = info.url;
      a.target = '_blank';
      a.rel = 'noopener';
      this.el.append(a);
    }
    if (module.version) this.el.append(element('p', `Atualizado: ${module.version}`, 'info-version'));
    this.el.hidden = false;
  }

  hide() {
    this.el.hidden = true;
  }
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
