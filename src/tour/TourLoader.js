// Lê os arquivos JSON do tour. Cada cena e cada módulo mora na sua própria
// pasta, então substituir/atualizar algo = trocar os arquivos daquela pasta.
//
//   tour/tour.json                      índice: cenas, módulos, cena inicial
//   tour/scenes/<id>/scene.json         panorâmica base + links + camadas
//   tour/modules/<id>/module.json       box, parede, teto, placa... (reutilizável)

export class TourLoader {
  constructor(tourUrl) {
    this.tourUrl = new URL(tourUrl, window.location.href).toString();
    this._cache = new Map();
  }

  /** Descarta o cache de JSON (use após editar arquivos). */
  reload() {
    this._cache.clear();
  }

  async tour() {
    const tour = await this._json(this.tourUrl);
    tour.scenes ??= [];
    tour.modules ??= [];
    tour.startScene ??= tour.scenes[0];
    return tour;
  }

  async scene(id) {
    const url = new URL(`scenes/${id}/scene.json`, this.tourUrl).toString();
    const scene = await this._json(url);
    return { id, layers: [], links: [], hideModules: [], ...scene, _baseUrl: url };
  }

  async module(id) {
    const url = new URL(`modules/${id}/module.json`, this.tourUrl).toString();
    const mod = await this._json(url);
    return { id, enabled: true, ...mod, _baseUrl: url };
  }

  /** Todas as cenas (usado pelo minimapa e para calcular direções dos links). */
  async allScenes() {
    const tour = await this.tour();
    return Promise.all(tour.scenes.map((id) => this.scene(id)));
  }

  async allModules() {
    const tour = await this.tour();
    const mods = await Promise.all(tour.modules.map((id) => this.module(id).catch((err) => {
      console.warn(`[tour] módulo "${id}" ignorado:`, err.message);
      return null;
    })));
    return mods.filter(Boolean);
  }

  _json(url) {
    if (!this._cache.has(url)) {
      // Build de arquivo único (npm run build:single): os JSON vêm embutidos na página.
      const embedded = window.__TOUR_FILES__?.[url.slice(new URL('.', this.tourUrl).href.length)];
      const promise = embedded ? Promise.resolve(embedded) : fetch(url, { cache: 'no-store' }).then((res) => {
        if (!res.ok) throw new Error(`${res.status} ao carregar ${url}`);
        return res.json();
      });
      promise.catch(() => this._cache.delete(url));
      this._cache.set(url, promise);
    }
    // Cópia para que edições em memória (modo editor) não contaminem o cache.
    return this._cache.get(url).then((data) => structuredClone(data));
  }
}
