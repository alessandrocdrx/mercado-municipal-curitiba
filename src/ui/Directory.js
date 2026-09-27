// Lista de comerciantes (tour.json → directory) com busca. Clicar num
// comerciante que tem box na planta leva até o ponto de vista mais próximo,
// já olhando para o box.

export class Directory {
  constructor(root, { onGo }) {
    this.onGo = onGo;
    this.el = document.createElement('aside');
    this.el.className = 'directory';
    this.el.hidden = true;
    this.el.innerHTML = `
      <header>
        <h2>Comerciantes</h2>
        <button class="dir-close" title="Fechar">×</button>
      </header>
      <input id="dir-search" type="search" placeholder="Buscar por nome, ramo ou box" autocomplete="off">
      <p class="dir-count"></p>
      <div class="dir-list"></div>
      <p class="dir-note">Fonte: diretório de comerciantes do site oficial do Mercado. Confirme no local, pois comerciantes podem mudar de box.</p>`;
    root.appendChild(this.el);
    this.$list = this.el.querySelector('.dir-list');
    this.$count = this.el.querySelector('.dir-count');
    this.$search = this.el.querySelector('#dir-search');
    this.$search.addEventListener('input', () => this._render());
    this.el.querySelector('.dir-close').addEventListener('click', () => this.hide());
    this.items = [];
  }

  setItems(items) {
    this.items = items ?? [];
    this._render();
  }

  toggle() {
    this.el.hidden ? this.show() : this.hide();
  }

  show() {
    this.el.hidden = false;
    this.$search.focus({ preventScroll: true });
  }

  hide() {
    this.el.hidden = true;
  }

  _render() {
    const q = normalize(this.$search.value);
    const hits = this.items.filter((it) => !q || normalize(`${it.name} ${it.category} ${it.boxes ?? ''}`).includes(q));
    const onPlan = hits.filter((it) => it.onPlan).length;
    this.$count.textContent = `${hits.length} comerciantes · ${onPlan} localizados na planta`;

    const groups = new Map();
    for (const it of hits) {
      if (!groups.has(it.category)) groups.set(it.category, []);
      groups.get(it.category).push(it);
    }
    this.$list.replaceChildren(...[...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt')).map(([cat, list]) => {
      const sec = document.createElement('section');
      const h = document.createElement('h3');
      h.textContent = cat;
      sec.append(h);
      for (const it of list.sort((a, b) => Number(b.onPlan) - Number(a.onPlan) || a.name.localeCompare(b.name, 'pt'))) {
        // No tour: botão que navega. Fora da planta: link para a página oficial.
        const btn = document.createElement(it.onPlan ? 'button' : it.url ? 'a' : 'div');
        btn.className = it.onPlan ? 'dir-item' : 'dir-item off';
        if (!it.onPlan && it.url) Object.assign(btn, { href: it.url, target: '_blank', rel: 'noopener' });
        const name = document.createElement('strong');
        name.textContent = it.name;
        const meta = document.createElement('span');
        const where = it.onPlan ? `Box ${it.boxes} · ver no tour` : it.boxes ? `Box ${it.boxes} · fora das plantas` : 'Box não informado';
        meta.textContent = !it.onPlan && it.url ? `${where} · site oficial ↗` : where;
        btn.append(name, meta);
        if (it.onPlan) {
          btn.addEventListener('click', () => {
            this.hide();
            this.onGo(it.modules[0]);
          });
        }
        sec.append(btn);
      }
      return sec;
    }));
  }
}

function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
