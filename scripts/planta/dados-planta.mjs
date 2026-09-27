// Digitalização das plantas afixadas no Mercado Municipal de Curitiba
// (fotos em public/tour/plantas/). Coordenadas em PIXELS de uma imagem de
// 2000 × 1500 px de cada planta; o gerador converte para metros com `escala`.
//
// ⚠ Precisão: as fotos têm leve perspectiva e a escala (m/px) foi ESTIMADA
// pelo tamanho típico de um box (~2,5 m). Ajuste `escala` quando houver uma
// medida real (ex.: comprimento do corredor B com trena/laser) e rode
// `npm run planta` de novo.
//
// facing = para onde a frente do box aponta na planta:
//   0 = para cima da planta (Rua da Paz) · 90 = direita · 180 = baixo · 270 = esquerda

export const PAVIMENTOS = [
  {
    id: 'inferior',
    titulo: 'Pavimento inferior',
    planta: 'plantas/pavimento-inferior.jpg',
    escala: 0.06, // m por px (estimado)
    inicio: 'inf-b-04',
  },
  {
    id: 'superior',
    titulo: 'Pavimento superior',
    planta: 'plantas/pavimento-superior.jpg',
    escala: 0.07, // m por px (estimado)
    inicio: 'sup-escada',
  },
];

// ---------------------------------------------------------------- boxes

/** Fileira de boxes igualmente espaçados entre o centro do primeiro e do último. */
const fileira = (ids, de, ate, facing, extra = {}) => ({ ids, de, ate, facing, ...extra });
/** Box isolado. `largura` em px. */
const box = (id, em, facing, extra = {}) => ({ ids: [id], de: em, ate: em, facing, ...extra });
const seq = (a, b) => {
  const out = [];
  for (let i = a; a <= b ? i <= b : i >= b; i += a <= b ? 1 : -1) out.push(String(i).padStart(2, '0'));
  return out;
};

export const BOXES = {
  inferior: [
    // Parede norte (Rua da Paz), voltados para o corredor A
    fileira(seq(43, 25), [538, 490], [1243, 490], 180),
    fileira(seq(24, 21), [1365, 495], [1480, 495], 180),
    // Coluna oeste, voltados para o corredor lateral azul
    fileira(seq(45, 50), [418, 458], [410, 663], 90),
    fileira(seq(51, 55), [400, 765], [393, 957], 90),
    // Blocos 354–373 (costas com costas)
    fileira(seq(354, 358), [535, 603], [710, 603], 0),
    fileira(seq(359, 363), [530, 662], [708, 662], 180),
    fileira(seq(364, 368), [525, 783], [706, 783], 0),
    fileira(seq(369, 373), [520, 842], [702, 845], 180),
    // Lado leste
    box('11', [1530, 590], 270), box('10', [1530, 637], 270), box('09', [1530, 677], 180),
    fileira(['07', '06'], [1600, 680], [1633, 680], 180),
    fileira(['05', '04'], [1718, 682], [1760, 682], 180),
    fileira(['03', '02'], [1840, 684], [1875, 684], 180),
    box('12', [1535, 800], 0, { largura: 60 }), box('14', [1640, 797], 0, { largura: 130 }),
    fileira(['16', '18'], [1727, 797], [1760, 797], 0), box('20a', [1810, 800], 0, { largura: 55 }),
    box('13', [1535, 852], 180, { largura: 60 }), box('15', [1640, 860], 180, { largura: 130 }),
    fileira(['17', '19'], [1727, 860], [1760, 860], 180), box('20b', [1805, 857], 180, { largura: 55 }),
    fileira(seq(458, 454), [1930, 787], [1880, 962], 250),
    // Parede sul: voltados para o corredor C …
    fileira(seq(56, 61), [512, 967], [712, 967], 0),
    fileira(seq(62, 67), [832, 975], [1038, 975], 0),
    fileira(seq(68, 73), [1160, 982], [1363, 982], 0),
    fileira(seq(74, 80), [1485, 988], [1740, 992], 0),
    // … e, de costas, para o corredor laranja (Rua General Carneiro)
    fileira(seq(429, 434), [512, 1030], [712, 1030], 180),
    fileira(seq(435, 440), [830, 1037], [1040, 1040], 180),
    fileira(seq(441, 446), [1158, 1045], [1367, 1048], 180),
    fileira(seq(447, 453), [1487, 1050], [1742, 1055], 180),
    // Anexo noroeste (área lilás)
    fileira(seq(267, 271), [105, 163], [255, 163], 180),
    fileira(seq(272, 275), [410, 163], [530, 163], 180),
    box('376', [572, 165], 180),
    fileira(seq(294, 290), [60, 213], [38, 403], 90),
    fileira(seq(276, 279), [608, 213], [600, 352], 270),
    box('266', [596, 408], 270),
    fileira(seq(289, 283), [112, 403], [325, 403], 0),
    box('281', [370, 403], 0), box('280', [420, 405], 0),
    fileira(['295', '298', '299', '301', '377', '303', '305', '307', '309'], [140, 259], [505, 259], 0),
    fileira(['296', '297', '300', '302', '378', '304', '306', '308', '310'], [140, 297], [505, 297], 180),
  ],
  superior: [
    box('312', [228, 230], 180),
    fileira(seq(313, 319), [285, 238], [500, 238], 180),
    fileira(seq(320, 323), [605, 245], [718, 245], 180),
    fileira(seq(333, 330), [200, 272], [195, 380], 90),
    fileira(seq(324, 329), [755, 290], [748, 470], 270),
    fileira(['337', '338', '339'], [290, 328], [285, 408], 270),
    fileira(['336', '335', '334'], [325, 328], [323, 408], 90),
    fileira(seq(340, 343), [415, 333], [535, 333], 0),
    fileira(seq(347, 344), [415, 373], [535, 373], 180),
    fileira(['349', '348', '353'], [620, 337], [620, 417], 270),
    fileira(['350', '351', '352'], [660, 337], [660, 417], 90),
    box('311', [182, 500], 0), box('375', [232, 502], 0),
    // Área rosa (lojas 01–19 do pavimento superior)
    fileira(seq(18, 15), [268, 620], [402, 620], 0),
    fileira(seq(14, 11), [515, 625], [645, 625], 0),
    box('19', [692, 517], 180),
    fileira(seq(1, 4), [718, 805], [835, 805], 180),
    box('05', [912, 808], 180, { largura: 110 }),
    fileira(seq(10, 7), [657, 1222], [778, 1222], 0),
    box('06', [920, 1230], 270, { largura: 70 }),
    // Área verde (bancas 501–512) e boxes 513–522
    ...[[238, '510', '512'], [278, '509', '511'], [360, '506', '508'], [402, '505', '507'], [486, '502', '504'], [528, '501', '503']]
      .flatMap(([y, esq, dir]) => [box(esq, [975, y], 270, { tipo: 'banca', largura: 36 }), box(dir, [1012, y], 90, { tipo: 'banca', largura: 36 })]),
    fileira(['515', '514', '513'], [1092, 215], [1090, 318], 270),
    fileira(seq(522, 519), [1125, 430], [1120, 585], 270),
    fileira(['516', '517'], [960, 730], [1005, 730], 0),
    box('518', [1100, 725], 0, { largura: 120 }),
  ],
};

// Ilhas de bancas do salão central (pavimento inferior): 9 colunas, cada uma
// com um bloco superior (voltado ao corredor A/B) e um inferior (B/C).
// Numeração segue o padrão impresso na planta.
const COLUNAS_X = [797, 876, 955, 1032, 1112, 1192, 1272, 1352, 1433];
const BASES = [0, 12, 24, 36, 48, 60, null, 78, 90];
function bloco(x, [yTopo, yL2, yL3, yBase], [topo, e2, d2, e3, d3, base]) {
  const b = (id, xy, facing) => box(id, xy, facing, { tipo: 'banca', largura: 22 });
  return [
    b(topo, [x, yTopo], 0), b(e2, [x - 12, yL2], 270), b(d2, [x + 12, yL2], 90),
    b(e3, [x - 12, yL3], 270), b(d3, [x + 12, yL3], 90), b(base, [x, yBase], 180),
  ];
}
const n = (v) => String(v).padStart(2, '0');
BOXES.inferior.push(...COLUNAS_X.flatMap((x, k) => {
  const b = BASES[k];
  const sup = b === null ? [] : bloco(x, [580, 615, 655, 690], [b + 8, b + 7, b + 9, b + 6, b + 10, b + 5].map(n));
  const inf = bloco(x, [758, 790, 835, 870], (b === null ? [76, 75, 77, 74, 78, 73] : [b + 4, b + 3, b + 11, b + 2, b + 12, b + 1]).map(n));
  return [...sup, ...inf];
}));

// ---------------------------------------------------------------- portas

export const PORTAS = {
  inferior: [
    { id: 'E', em: [1300, 452], facing: 180, rua: 'Rua da Paz' },
    { id: 'J', em: [765, 1112], facing: 0, rua: 'Rua General Carneiro' },
    { id: 'I', em: [1070, 1117], facing: 0, rua: 'Rua General Carneiro' },
    { id: 'H', em: [1425, 1127], facing: 0, rua: 'Rua General Carneiro' },
    { id: 'G', em: [1860, 1035], facing: 315, rua: 'lado leste' },
  ],
  superior: [
    { id: 'B', em: [140, 440], facing: 90, rua: 'Avenida Sete de Setembro' },
    { id: 'C', em: [565, 170], facing: 180, rua: 'Rua da Paz' },
    { id: 'D', em: [850, 180], facing: 180, rua: 'Rua da Paz' },
  ],
};

// ---------------------------------------------------------------- pontos de vista (cenas)
// cor = cor do corredor na planta (vira o piso provisório da cena)

const AZUL = '#2f6fb3';
const AMARELO = '#c9b43a';
const VERDE = '#3f8f3a';
const LARANJA = '#c7803a';
const LILAS = '#8a5a9c';
const VINHO = '#8a4a4a';
const ROSA = '#c98a8a';
const VERDE_ESC = '#2f7d32';
const CINZA = '#6b6f76';

export const CENAS = {
  inferior: [
    ...[470, 620, 835, 995, 1150, 1300, 1460].map((x, i) => ({ id: `inf-a-${n(i)}`, titulo: `Corredor A (azul) · ${i + 1}`, em: [x, 552], cor: AZUL })),
    ...[470, 620, 835, 995, 1150, 1310, 1470, 1620, 1780, 1905].map((x, i) => ({ id: `inf-b-${n(i)}`, titulo: `Corredor B (amarelo) · ${i + 1}`, em: [x, 705], cor: AMARELO })),
    ...[470, 620, 835, 995, 1150, 1310, 1470, 1620, 1780].map((x, i) => ({ id: `inf-c-${n(i)}`, titulo: `Corredor C (verde) · ${i + 1}`, em: [x, 905], cor: VERDE })),
    { id: 'inf-porta-e', titulo: 'Porta E · Rua da Paz', em: [1300, 470], cor: CINZA },
    { id: 'inf-lig-j', titulo: 'Passagem para a Porta J', em: [770, 1000], cor: LARANJA },
    { id: 'inf-lig-i', titulo: 'Passagem para a Porta I', em: [1100, 1003], cor: LARANJA },
    { id: 'inf-lig-h', titulo: 'Passagem para a Porta H', em: [1425, 1008], cor: LARANJA },
    { id: 'inf-sul-00', titulo: 'Corredor sul · oeste', em: [470, 1090], cor: LARANJA },
    { id: 'inf-porta-j', titulo: 'Porta J · Rua General Carneiro', em: [765, 1088], cor: LARANJA },
    { id: 'inf-porta-i', titulo: 'Porta I · Rua General Carneiro', em: [1070, 1092], cor: LARANJA },
    { id: 'inf-porta-h', titulo: 'Porta H · Rua General Carneiro', em: [1425, 1100], cor: LARANJA },
    { id: 'inf-sul-04', titulo: 'Corredor sul · leste', em: [1700, 1110], cor: LARANJA },
    { id: 'inf-sul-05', titulo: 'Corredor sul · esquina leste', em: [1830, 1100], cor: LARANJA },
    { id: 'inf-porta-g', titulo: 'Porta G', em: [1830, 1010], cor: LARANJA },
    { id: 'inf-diagonal', titulo: 'Corredor leste (diagonal)', em: [1870, 860], cor: LARANJA },
    { id: 'inf-rampa', titulo: 'Rampa oeste', em: [360, 705], cor: VINHO },
    { id: 'inf-anexo-1', titulo: 'Anexo · acesso', em: [545, 395], cor: LILAS },
    { id: 'inf-anexo-2', titulo: 'Anexo · nordeste', em: [545, 215], cor: LILAS },
    { id: 'inf-anexo-3', titulo: 'Anexo · norte', em: [330, 213], cor: LILAS },
    { id: 'inf-anexo-4', titulo: 'Anexo · noroeste', em: [88, 215], cor: LILAS },
    { id: 'inf-anexo-5', titulo: 'Anexo · sudoeste', em: [82, 350], cor: LILAS },
    { id: 'inf-anexo-6', titulo: 'Anexo · sul', em: [330, 350], cor: LILAS },
  ],
  superior: [
    { id: 'sup-porta-b', titulo: 'Porta B · Av. Sete de Setembro', em: [165, 440], cor: CINZA },
    { id: 'sup-porta-c', titulo: 'Porta C · Rua da Paz', em: [558, 205], cor: CINZA },
    { id: 'sup-norte-c', titulo: 'Setor 300 · em frente à Porta C', em: [558, 292], cor: CINZA },
    { id: 'sup-norte-1', titulo: 'Setor 300 · norte oeste', em: [245, 290], cor: CINZA },
    { id: 'sup-norte-2', titulo: 'Setor 300 · norte centro', em: [390, 290], cor: CINZA },
    { id: 'sup-norte-3', titulo: 'Setor 300 · norte leste', em: [695, 295], cor: CINZA },
    { id: 'sup-centro-1', titulo: 'Setor 300 · entre ilhas oeste', em: [370, 372], cor: CINZA },
    { id: 'sup-centro-2', titulo: 'Setor 300 · entre ilhas leste', em: [578, 377], cor: CINZA },
    { id: 'sup-sul-1', titulo: 'Setor 300 · sul oeste', em: [245, 445], cor: CINZA },
    { id: 'sup-escada', titulo: 'Escadas · pavimento superior', em: [470, 440], cor: CINZA },
    { id: 'sup-sul-3', titulo: 'Setor 300 · sul leste', em: [695, 445], cor: CINZA },
    { id: 'sup-rosa-1', titulo: 'Área rosa · oeste', em: [460, 545], cor: ROSA },
    { id: 'sup-rosa-1b', titulo: 'Área rosa · leste', em: [688, 572], cor: ROSA },
    { id: 'sup-passagem', titulo: 'Passagem para a área rosa', em: [745, 560], cor: CINZA },
    { id: 'sup-rosa-desce', titulo: 'Área rosa · descida', em: [665, 790], cor: ROSA },
    { id: 'sup-rosa-2', titulo: 'Área rosa · centro', em: [700, 700], cor: ROSA },
    { id: 'sup-rosa-3', titulo: 'Área rosa · corredor', em: [760, 920], cor: ROSA },
    { id: 'sup-rosa-4', titulo: 'Área rosa · sul', em: [760, 1130], cor: ROSA },
    { id: 'sup-verde-porta-d', titulo: 'Área verde · Porta D', em: [870, 240], cor: VERDE_ESC },
    { id: 'sup-verde-1', titulo: 'Área verde · centro', em: [900, 440], cor: VERDE_ESC },
    { id: 'sup-verde-2', titulo: 'Área verde · leste', em: [1055, 470], cor: VERDE_ESC },
    { id: 'sup-verde-3', titulo: 'Área verde · sul', em: [900, 640], cor: VERDE_ESC },
  ],
};

// Ligações entre cenas (vão e volta). Dentro do mesmo pavimento a direção
// da seta é calculada pela planta.
const cadeia = (ids) => ids.slice(1).map((id, i) => [ids[i], id]);
const serie = (p, k) => Array.from({ length: k }, (_, i) => `${p}-${n(i)}`);

export const LIGACOES = [
  ...cadeia(serie('inf-a', 7)),
  ...cadeia(serie('inf-b', 10)),
  ...cadeia(serie('inf-c', 9)),
  // atravessando o salão pelos vãos entre as ilhas
  ...[0, 2, 3, 4, 5, 6].map((i) => [`inf-a-${n(i)}`, `inf-b-${n(i)}`]),
  ...[0, 2, 3, 4, 5, 6, 8].map((i) => [`inf-b-${n(i)}`, `inf-c-${n(i)}`]), // 7: boxes 14/15 no meio
  ['inf-a-05', 'inf-porta-e'],
  ['inf-c-02', 'inf-lig-j'], ['inf-lig-j', 'inf-porta-j'],
  ['inf-c-04', 'inf-lig-i'], ['inf-lig-i', 'inf-porta-i'],
  ['inf-c-06', 'inf-lig-h'], ['inf-lig-h', 'inf-porta-h'],
  ['inf-c-00', 'inf-sul-00'],
  ...cadeia(['inf-sul-00', 'inf-porta-j', 'inf-porta-i', 'inf-porta-h', 'inf-sul-04', 'inf-sul-05', 'inf-porta-g', 'inf-diagonal', 'inf-b-09']),
  ['inf-c-08', 'inf-diagonal'],
  ['inf-b-00', 'inf-rampa'],
  ['inf-a-00', 'inf-anexo-1'],
  ...cadeia(['inf-anexo-1', 'inf-anexo-2', 'inf-anexo-3', 'inf-anexo-4', 'inf-anexo-5', 'inf-anexo-6', 'inf-anexo-1']),
  // pavimento superior
  ['sup-porta-c', 'sup-norte-c'], ['sup-norte-c', 'sup-norte-2'], ['sup-norte-c', 'sup-norte-3'], ['sup-norte-c', 'sup-centro-2'],
  ['sup-norte-1', 'sup-norte-2'], ['sup-norte-1', 'sup-sul-1'],
  ['sup-norte-2', 'sup-centro-1'], ['sup-centro-1', 'sup-escada'],
  ['sup-norte-3', 'sup-sul-3'], ['sup-centro-2', 'sup-escada'],
  ['sup-sul-1', 'sup-porta-b'], ['sup-sul-1', 'sup-escada'], ['sup-escada', 'sup-sul-3'],
  ['sup-escada', 'sup-rosa-1'],
  ...cadeia(['sup-sul-3', 'sup-passagem', 'sup-rosa-2']),
  ...cadeia(['sup-rosa-1', 'sup-rosa-1b', 'sup-rosa-2', 'sup-rosa-desce', 'sup-rosa-3', 'sup-rosa-4']),
  ['sup-rosa-1b', 'sup-passagem'],
  ['sup-rosa-2', 'sup-verde-3'],
  ...cadeia(['sup-verde-porta-d', 'sup-verde-1', 'sup-verde-3']),
  ['sup-verde-1', 'sup-verde-2'],
];

// Escadas entre pavimentos (direção informada à mão: não há planta comum).
export const ESCADAS = [
  { de: 'inf-a-00', para: 'sup-escada', yaw: 160, rotulo: 'Escada · subir ao pavimento superior' },
  { de: 'sup-escada', para: 'inf-a-00', yaw: 180, rotulo: 'Escada · descer ao pavimento inferior' },
];

// ---------------------------------------------------------------- ruas
// Camada de rua do lado de fora do prédio (px da planta). `calcada` = faixa
// entre o prédio e o asfalto; `pista` = asfalto; `portas` recebem faixa de
// pedestres em frente.
export const RUAS = {
  inferior: [
    {
      nome: 'Rua General Carneiro',
      de: [0, 1145], ate: [2000, 1145], // alinhamento do prédio (lado norte da calçada)
      lado: 'sul',                       // a rua fica ao sul (para baixo na planta)
      calcada: 120, pista: 170, calcadaOposta: 70,
      faixasPedestres: [765, 1070, 1425],
    },
  ],
};

// Área coberta de cada pavimento (px): o teto só é desenhado aqui dentro.
export const AREA_COBERTA = {
  inferior: { de: [0, 100], ate: [2000, 1145] },
  superior: { de: [100, 160], ate: [1180, 1400] },
};
