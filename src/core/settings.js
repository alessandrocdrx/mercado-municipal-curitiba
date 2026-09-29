// Opções de visual escolhidas pelo visitante (guardadas no navegador).

const KEY = 'mercado360:estilo';
const listeners = new Set();
let estilo = 'atual';
try { estilo = localStorage.getItem(KEY) === 'estilizado' ? 'estilizado' : 'atual'; } catch { /* sem armazenamento: cenário atual */ }

export const settings = {
  /** 'atual' (padrão) ou 'estilizado'. */
  get estilo() { return estilo; },
  setEstilo(valor) {
    estilo = valor === 'estilizado' ? 'estilizado' : 'atual';
    try { localStorage.setItem(KEY, estilo); } catch { /* ignora */ }
    listeners.forEach((fn) => fn());
  },
  onChange(fn) { listeners.add(fn); },
};
