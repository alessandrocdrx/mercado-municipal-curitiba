// Opções de visual escolhidas pelo visitante (guardadas no navegador).

const KEY = 'mercado360:texturas';
const listeners = new Set();
let texturas = false;
try { texturas = localStorage.getItem(KEY) === '1'; } catch { /* sem armazenamento: começa desligado */ }

export const settings = {
  get texturas() { return texturas; },
  setTexturas(on) {
    texturas = Boolean(on);
    try { localStorage.setItem(KEY, texturas ? '1' : '0'); } catch { /* ignora */ }
    listeners.forEach((fn) => fn());
  },
  onChange(fn) { listeners.add(fn); },
};
