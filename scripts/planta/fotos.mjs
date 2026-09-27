// Fotos de licença livre do Wikimedia Commons (Category:Mercado municipal de Curitiba).
// Arquivos reduzidos em public/tour/fotos/. Crédito obrigatório em cada foto:
// author, license, licenseUrl e url (página do arquivo no Commons).
// Só entram CC0, domínio público, CC BY ou CC BY-SA.

const CC_BY_SA_3 = { license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0' };
const CC_BY_SA_4 = { license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0' };
const commons = (arquivo) => `https://commons.wikimedia.org/wiki/File:${arquivo.replaceAll(' ', '_')}`;

const FOTOS = {
  pracaAlimentacao: {
    file: 'praca-de-alimentacao.jpg',
    caption: 'Praça de alimentação no pavimento superior, sob a cobertura em arcos (2013)',
    author: 'Paulo JC Nogueira',
    ...CC_BY_SA_3,
    url: commons('Mercado Municipal de Curitiba PR - panoramio.jpg'),
  },
  saguao: {
    file: 'saguao.jpg',
    caption: 'Saguão com piso de granito, quiosque Yogutiba e saída para a rua (2013)',
    author: 'Paulo JC Nogueira',
    ...CC_BY_SA_3,
    url: commons('Mercado Municipal de Curitiba - Curitiba PR - panoramio (1).jpg'),
  },
  bonVivant: {
    file: 'bon-vivant.jpg',
    caption: 'Bon Vivant: queijos, frios e empório (2019)',
    author: 'Simplus Menegati',
    ...CC_BY_SA_4,
    url: commons('Mercado municipal de Curitiba.1.jpg'),
  },
  graosPinhao: {
    file: 'graos-pinhao.jpg',
    caption: 'Grãos, castanhas e cortadores de pinhão a granel (2019)',
    author: 'Simplus Menegati',
    ...CC_BY_SA_4,
    url: commons('Mercado municipal de Curitiba.2.jpg'),
  },
  graosGranel: {
    file: 'graos-a-granel.jpg',
    caption: 'Feijões, grãos e castanhas vendidos a granel (2018)',
    author: 'Renato Soares / MTur Destinos',
    license: 'Domínio público',
    url: commons('RenatoSoares MercadoMunicipal Curitiba PR (26275540647).jpg'),
  },
};

/** Foto com src relativo a uma pasta de public/tour (prefixo até public/tour/). */
const comSrc = ({ file, ...foto }, prefixo) => ({ src: `${prefixo}fotos/${file}`, ...foto });

/** Painel "Sobre" (tour.json fica em public/tour/). */
export const FOTOS_MERCADO = Object.values(FOTOS).map((f) => comSrc(f, ''));

/** Fotos de um comerciante, pelo nome em comerciantes.mjs; módulos ficam em public/tour/modules/<id>/. */
export const FOTOS_COMERCIANTES = {
  'Bon Vivant': [comSrc(FOTOS.bonVivant, '../../')],
};
