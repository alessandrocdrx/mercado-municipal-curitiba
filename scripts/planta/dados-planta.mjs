// Digitalização das plantas afixadas no Mercado Municipal de Curitiba
// (fotos em public/tour/plantas/). Coordenadas em PIXELS de uma imagem de
// 2000 × 1500 px de cada planta; o gerador converte para metros com `escala`.
//
// ⚠ Precisão: as fotos têm leve perspectiva. A escala (m/px) e a orientação
// foram calibradas pelo contorno do prédio no OpenStreetMap (ver PAVIMENTOS);
// com uma medida no local (ex.: comprimento do corredor B com trena/laser),
// ajuste `escala` e rode `npm run planta` de novo.
//
// facing = para onde a frente do box aponta na planta:
//   0 = para cima da planta (Rua da Paz) · 90 = direita · 180 = baixo · 270 = esquerda

// Escala e orientação vêm do contorno do prédio no OpenStreetMap (ver
// CONTORNOS_OSM abaixo). As plantas estão giradas: o "cima" delas (Rua da Paz)
// aponta para o rumo real `rumoCima` (graus a partir do norte); a Av. Sete de
// Setembro fica à esquerda e a Rua General Carneiro embaixo.
// `ancora` liga um ponto da planta (px) ao mesmo ponto no mapa (lon, lat).
export const PAVIMENTOS = [
  {
    id: 'inferior',
    titulo: 'Pavimento inferior',
    planta: 'plantas/planta-inferior.jpg', // esquemática, medidas do tour 3D (foto original: pavimento-inferior.jpg)
    // largura do bloco principal (General Carneiro → fundo dos boxes 21–43) e
    // distância salão de hortifrúti → canto diagonal sudeste
    escala: 0.063, // m por px
    rumoCima: 66,
    ancora: { px: [1857, 1143], lonLat: [-49.2568914, -25.435487] }, // canto General Carneiro × diagonal sudeste
    inicio: 'inf-b-04',
    // coordenadas do tour 3D oficial (X, Y em m) → metros desta planta
    tour3d: {"o": [49.97999, 14.4389], "ex": [-0.8056, -0.00605], "ey": [-0.07016, -0.93012]},
  },
  {
    id: 'superior',
    titulo: 'Pavimento superior',
    planta: 'plantas/planta-superior.jpg', // esquemática, medidas do tour 3D (foto original: pavimento-superior.jpg)
    // fachada da Av. Sete de Setembro → ponta sudeste, General Carneiro → Rua da Paz
    escala: 0.0725, // m por px
    rumoCima: 66,
    ancora: { px: [978, 478], lonLat: [-49.2565894, -25.4346528] }, // centro do setor de orgânicos = centro do prédio "Mercado Municipal - Orgânicos"
    inicio: 'sup-escada',
    tour3d: {"o": [63.17751, -12.47285], "ex": [-0.8709, -0.03092], "ey": [0.11189, -0.97151]},
    // o que se vê olhando para baixo onde não há piso: o pavimento inferior, ~4,5 m abaixo (desnível ESTIMADO)
    abaixo: { pavimento: 'inferior', desnivel: 4.5 },
  },
  {
    // 3º nível (administração e auditório): mesmo referencial do pavimento superior
    id: 'nivel3',
    titulo: '3º nível',
    planta: 'plantas/planta-nivel3.jpg',
    escala: 0.0725,
    rumoCima: 66,
    ancora: { px: [978, 478], lonLat: [-49.2565894, -25.4346528] },
    inicio: 'n3-gerencia',
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
    // Hall da entrada Sete de Setembro (praça circular), a oeste da rampa. A
    // planta afixada não o desenha: posições dos marcadores do tour 3D oficial
    // (ver comerciantes.mjs), com o centro do box 16 px atrás da frente.
    // Posições e larguras medidas no piloto do tour 3D (piloto_lojas.csv)
    ...[
      ['193', [106, 527], 180, 32], ['192', [170, 527], 180, 32], ['195', [265, 489], 180, 64],
      ['189', [133, 913], 0, 38], ['190', [82, 921], 0, 39], ['188', [197, 890], 0, 34],
      ['hall-b', [234, 883], 0, 34], ['hall-a', [270, 860], 0, 30], ['185', [342, 808], 0, 32], ['hall-c', [168, 883], 0, 18],
    ].map(([id, em, facing, largura]) => box(id, em, facing, {
      area: 'Hall Sete de Setembro', largura, ...(id.startsWith('hall') && { rotulo: 'Hall Sete de Setembro' }),
    })),
  ],
  nivel3: [],
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
    // entre o 10 e o 08 fica a escada para o hall (não há box 09 no tour 3D)
    // Área verde (bancas 501–512) e boxes 513–522
    ...[[238, '510', '512'], [278, '509', '511'], [360, '506', '508'], [402, '505', '507'], [486, '502', '504'], [528, '501', '503']]
      .flatMap(([y, esq, dir]) => [box(esq, [975, y], 270, { tipo: 'banca', largura: 36 }), box(dir, [1012, y], 90, { tipo: 'banca', largura: 36 })]),
    fileira(['515', '514', '513'], [1092, 215], [1090, 318], 270),
    fileira(seq(522, 519), [1125, 430], [1120, 585], 270),
    fileira(['516', '517'], [960, 730], [1005, 730], 0),
    box('518', [1100, 725], 0, { largura: 120 }),
    // Praças 7 de Setembro (oeste) e Déa (leste) e galeria de restaurantes: posições
    // e larguras medidas no levantamento do piso 2 (tour 3D oficial, p2_lojas.csv)
    ...[
      ['take', [845, 1272], 0, 48, 'Praça 7 de Setembro'], ['pastelaria', [794, 1253], 15, 42, 'Praça 7 de Setembro'],
      ['mister-dea', [903, 842], 195, 102, 'Praça 7 de Setembro'], ['sua-linda', [720, 751], 120, 34, 'Praças Déa / 7 de Setembro'],
      ['fitoterapico', [666, 723], 120, 31, 'Praças Déa / 7 de Setembro'], ['bonna', [591, 866], 180, 120, 'Praça Déa', 1.5],
      ['anarco', [461, 866], 145, 48, 'Praça Déa', 1.5], ['fujii', [524, 1249], 20, 48, 'Praça Déa', 1.5], ['box-curitiba', [616, 1246], 350, 60, 'Praça Déa', 1.5],
      ['201', [1188, 1305], 0, 60, 'Galeria de restaurantes'], ['almasor', [1501, 1300], 0, 60, 'Galeria de restaurantes'],
    ].map(([id, em, facing, largura, area, base]) => box(id, em, facing, { area, largura, base, ...(!/^\d/.test(id) && { rotulo: area }) })),
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
    // Entrada principal, no Hall Sete de Setembro (porta larga; posição ESTIMADA a oeste do ponto de vista do hall)
    { id: 'A', titulo: 'Entrada principal', em: [45, 728], facing: 90, rua: 'Av. Sete de Setembro', largura: 7, altura: 4.2 },
  ],
  nivel3: [],
  superior: [
    { id: 'B', em: [140, 440], facing: 90, rua: 'Avenida Sete de Setembro' },
    { id: 'C', em: [565, 170], facing: 180, rua: 'Rua da Paz' },
    { id: 'D', titulo: 'Porta D · Orgânicos', em: [850, 180], facing: 180, rua: 'Rua da Paz' },
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
    // [x, y] no centro do corredor: y a meio caminho entre as frentes dos boxes/bancas
    // dos dois lados (o corredor B se alarga a leste, depois das ilhas de bancas).
    ...[[470, 541], [620, 541], [835, 541], [995, 541], [1150, 541], [1300, 541], [1460, 542]]
      .map((em, i) => ({ id: `inf-a-${n(i)}`, titulo: `Corredor A (azul) · ${i + 1}`, em, cor: AZUL })),
    ...[[470, 723], [620, 724], [835, 724], [995, 724], [1150, 724], [1310, 724], [1470, 732], [1620, 740], [1780, 740], [1905, 740]]
      .map((em, i) => ({ id: `inf-b-${n(i)}`, titulo: `Corredor B (amarelo) · ${i + 1}`, em, cor: AMARELO })),
    ...[[470, 908], [620, 915], [835, 918], [995, 918], [1150, 920], [1310, 921], [1470, 923], [1620, 925], [1780, 925]]
      .map((em, i) => ({ id: `inf-c-${n(i)}`, titulo: `Corredor C (verde) · ${i + 1}`, em, cor: VERDE })),
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
    { id: 'inf-hall-leste', titulo: 'Hall Sete de Setembro · acesso do salão', em: [335, 705], cor: CINZA },
    { id: 'inf-hall-norte', titulo: 'Hall Sete de Setembro · mesas da Colônia Cecília', em: [218, 624], cor: CINZA },
    { id: 'inf-hall-sul', titulo: 'Hall Sete de Setembro · Miranda\'s e Dahra', em: [228, 823], cor: CINZA },
    { id: 'inf-hall-centro', titulo: 'Hall Sete de Setembro · praça circular', em: [242, 727], cor: CINZA },
    { id: 'inf-hall-oeste', titulo: 'Hall Sete de Setembro · entrada da Av. Sete de Setembro', em: [120, 728], cor: CINZA },
  ],
  nivel3: [
    { id: 'n3-gerencia', titulo: '3º nível · Gerência do Mercado', em: [1170, 673], cor: CINZA },
    { id: 'n3-oeste', titulo: '3º nível · corredor', em: [1150, 500], cor: CINZA },
    { id: 'n3-auditorio', titulo: '3º nível · Auditório', em: [1130, 324], cor: CINZA },
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
    { id: 'sup-rosa-1', titulo: 'Praça de Alimentação Karan · oeste', em: [460, 545], cor: ROSA },
    { id: 'sup-rosa-1b', titulo: 'Praça de Alimentação Karan · leste', em: [688, 572], cor: ROSA },
    { id: 'sup-passagem', titulo: 'Passagem para a área rosa', em: [745, 560], cor: CINZA },
    { id: 'sup-rosa-desce', titulo: 'Área rosa · descida', em: [665, 790], cor: ROSA },
    { id: 'sup-rosa-2', titulo: 'Área rosa · centro', em: [700, 700], cor: ROSA },
    { id: 'sup-rosa-3', titulo: 'Praça 7 de Setembro · Mister Dea', em: [826, 927], cor: ROSA },
    { id: 'sup-rosa-4', titulo: 'Praça 7 de Setembro · centro', em: [841, 1061], cor: ROSA },
    { id: 'sup-p7-take', titulo: 'Praça 7 de Setembro · Takê e Pastelaria', em: [857, 1190], cor: ROSA },
    { id: 'sup-verde-porta-d', titulo: 'Setor de Orgânicos · entrada (Porta D)', em: [870, 240], cor: VERDE_ESC },
    { id: 'sup-verde-1', titulo: 'Setor de Orgânicos · bancas', em: [900, 440], cor: VERDE_ESC },
    { id: 'sup-verde-2', titulo: 'Setor de Orgânicos · lojas', em: [1055, 470], cor: VERDE_ESC },
    { id: 'sup-verde-3', titulo: 'Setor de Orgânicos · praça de mesas', em: [900, 640], cor: VERDE_ESC },
    { id: 'sup-dea-norte', titulo: 'Praça Déa · Bonna Gourmet e Anarco', em: [572, 935], cor: ROSA, base: 1.5 },
    { id: 'sup-dea-centro', titulo: 'Praça Déa · centro', em: [587, 1057], cor: ROSA, base: 1.5 },
    { id: 'sup-dea-sul', titulo: 'Praça Déa · Fujii e Box Curitiba', em: [590, 1170], cor: ROSA, base: 1.5 },
    { id: 'sup-galeria-1', titulo: 'Galeria de restaurantes · 1', em: [1056, 1271], cor: ROSA },
    { id: 'sup-galeria-0', titulo: 'Galeria de restaurantes · acesso', em: [960, 1258], cor: ROSA },
    { id: 'sup-galeria-2', titulo: 'Galeria de restaurantes · 2', em: [1333, 1271], cor: ROSA },
    { id: 'sup-galeria-3', titulo: 'Galeria de restaurantes · 3', em: [1525, 1271], cor: ROSA },
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
  ...cadeia(['inf-rampa', 'inf-hall-leste', 'inf-hall-centro', 'inf-hall-oeste']),
  ['inf-hall-centro', 'inf-hall-norte'], ['inf-hall-centro', 'inf-hall-sul'], ['inf-hall-norte', 'inf-hall-oeste'], ['inf-hall-sul', 'inf-hall-oeste'],
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
  // Praça 7 de Setembro ↔ Praça Déa pelas duas escadas (desnível de 1,5 m)
  ['sup-rosa-4', 'sup-p7-take'], ['sup-rosa-3', 'sup-dea-norte'], ['sup-p7-take', 'sup-dea-sul'],
  ...cadeia(['sup-dea-norte', 'sup-dea-centro', 'sup-dea-sul']),
  ...cadeia(['sup-p7-take', 'sup-galeria-0', 'sup-galeria-1', 'sup-galeria-2', 'sup-galeria-3']),
  ...cadeia(['n3-gerencia', 'n3-oeste', 'n3-auditorio']),
];

// Mobiliário e elementos do piloto (tour 3D oficial, piloto_mobiliario.csv e
// piloto_escada.csv), em coordenadas do tour 3D (X, Y em m). Posições estimadas.
export const MOBILIARIO = {
  // Piso 2: levantamento p2_*.csv (tour 3D oficial). Posições estimadas (±1–2 m).
  superior: [
    // Praça Déa: mezanino 1,5 m acima da Praça 7 de Setembro, piso de granito e tijolo aparente
    { tipo: 'plataforma', pontos: [[22, 48], [43, 48], [43, 79], [22, 79]], altura: 1.5, cor: '#8e8e8a', lateral: '#b5653f' },
    { tipo: 'escada', de: [20, 55.3], ate: [23.6, 55.2], altura: 1.5, largura: 2 },
    { tipo: 'escada', de: [19.4, 74.4], ate: [23.3, 74.5], altura: 1.5, largura: 2 },
    { tipo: 'guarda', de: [22, 57.5], ate: [22, 72], base: 1.5 },
    { tipo: 'mesas', de: [25, 57], ate: [41, 73], n: 42, formato: 'retangular', cor: '#4a2f1e', cadeiras: 4, corCadeira: '#4a2f1e', base: 1.5 },
    { tipo: 'pilar', em: [34, 57], altura: 5, base: 1.5 },
    { tipo: 'pilar', em: [34, 68], altura: 5, base: 1.5 },
    { tipo: 'placa', em: [32, 65], z: 4.2, texto: 'Praça Déa', facing: 90, cor: '#1f4d3a', base: 1.5 },
    // Praça 7 de Setembro: mesas com toalha preta e o poço da escada junto ao Takê
    { tipo: 'mesas', de: [1, 53], ate: [16.5, 76], n: 48, formato: 'retangular', cor: '#1a1a1a', cadeiras: 4, corCadeira: '#1a1a1a' },
    { tipo: 'vao', pontos: [[17, 60], [19.5, 60], [19.5, 68], [17, 68]] },
    { tipo: 'placa', em: [11, 66], z: 4.2, texto: 'Praça 7 de Setembro', facing: 90, cor: '#1f4d3a' },
    // Praça de Alimentação Karan
    { tipo: 'mesas', de: [20, 21], ate: [51, 29], n: 36, formato: 'retangular', cor: '#3a3a3a', cadeiras: 4, corCadeira: '#c9a26b' },
    { tipo: 'guarda', de: [28, 19], ate: [40, 19] },
    { tipo: 'placa', em: [30, 26], z: 5, texto: 'Praça de Alimentação', subtexto: 'Manoel Carlos Karan', facing: 0, largura: 4, cor: '#5b5470' },
    // Galeria de lojas (setor 300)
    { tipo: 'guarda', de: [17, 18.5], ate: [44, 18.5] },
    { tipo: 'mesas', de: [49, 12], ate: [51, 17], n: 4, r: 0.35, alta: true, cor: '#3a2a1e', cadeiras: 3, corCadeira: '#1a1a1a', banquetas: true },
    // Setor de Orgânicos
    { tipo: 'mesas', de: [-13, 29], ate: [-1, 38], n: 18, r: 0.4, cor: '#e8e6e0', cadeiras: 3, corCadeira: '#1a1a1a' },
    { tipo: 'pilar', em: [4.5, 28], altura: 3.5 },
    { tipo: 'pilar', em: [4.5, 33], altura: 3.5 },
    { tipo: 'guarda', de: [8, 20], ate: [8, 45] },
    { tipo: 'escada', de: [7, 41], ate: [4.2, 44.8], altura: 2.6, largura: 1.5, corGuarda: '#1a1a1a' }, // sobe ao 3º nível (1º lance)
    { tipo: 'vaso', em: [-16, 35] },
    { tipo: 'placa', em: [-6, 35], z: 3.6, texto: 'Orgânicas', subtexto: 'Praça de Alimentação', facing: 90, cor: '#8a8a1f' },
    // Galeria de restaurantes sobre a R. General Carneiro
    { tipo: 'guarda', de: [-48, 80], ate: [6, 80] },
    { tipo: 'mesas', de: [-47, 80.5], ate: [5, 81.7], n: 22, formato: 'retangular', cor: '#3a3a3a', cadeiras: 2, corCadeira: '#1a1a1a' },
  ],
  inferior: [
    { tipo: 'praca', em: [37.5, 64.5], r: 6.5, cor: '#B9B4AC', borda: '#A85A5A', degraus: 3 },
    { tipo: 'mesa', em: [33.5, 53.3], r: 0.45, cor: '#E6DCC0', cadeiras: 4, corCadeira: '#4A2F1E' },
    { tipo: 'mesa', em: [33.5, 55.6], r: 0.45, cor: '#E6DCC0', cadeiras: 4, corCadeira: '#4A2F1E' },
    { tipo: 'mesa', em: [35.9, 53.3], r: 0.45, cor: '#E6DCC0', cadeiras: 4, corCadeira: '#4A2F1E' },
    { tipo: 'mesa', em: [35.9, 55.6], r: 0.45, cor: '#E6DCC0', cadeiras: 4, corCadeira: '#4A2F1E' },
    { tipo: 'mesa', em: [38.3, 53.3], r: 0.45, cor: '#E6DCC0', cadeiras: 4, corCadeira: '#4A2F1E' },
    { tipo: 'mesa', em: [38.3, 55.6], r: 0.45, cor: '#E6DCC0', cadeiras: 4, corCadeira: '#4A2F1E' },
    { tipo: 'mesa', em: [40.7, 53.3], r: 0.45, cor: '#E6DCC0', cadeiras: 4, corCadeira: '#4A2F1E' },
    { tipo: 'mesa', em: [40.7, 55.6], r: 0.45, cor: '#E6DCC0', cadeiras: 4, corCadeira: '#4A2F1E' },
    ...[[27, 65], [28.6, 66.6], [27, 68.2]].map((em) => ({ tipo: 'mesa', em, r: 0.35, cor: '#F2F2F2', cadeiras: 3, corCadeira: '#C9A0B0', banquetas: true })),
    { tipo: 'vaso', em: [41, 63.6] },
    { tipo: 'vaso', em: [41, 65.4] },
    { tipo: 'vaso', em: [42, 63.6] },
    { tipo: 'vaso', em: [42, 65.4] },
    { tipo: 'vaso', em: [43, 63.6] },
    { tipo: 'vaso', em: [43, 65.4] },
    { tipo: 'vaso', em: [44, 63.6] },
    { tipo: 'vaso', em: [44, 65.4] },
    { tipo: 'vaso', em: [45, 63.6] },
    { tipo: 'vaso', em: [45, 65.4] },
    { tipo: 'vaso', em: [46, 63.6] },
    { tipo: 'vaso', em: [46, 65.4] },
    { tipo: 'vaso', em: [47, 63.6] },
    { tipo: 'vaso', em: [47, 65.4] },
    { tipo: 'vaso', em: [48, 63.6] },
    { tipo: 'vaso', em: [48, 65.4] },
    { tipo: 'helicoidal', em: [42, 56.5], r: 1.3, altura: 2.5, cor: '#F2F2F2' },
    // Corredor da General Carneiro: cercadinhos com mesas na calçada, em frente aos cafés e bares.
    // Posições ESTIMADAS a partir das lojas (Daimaru, Café do Mercado, The Bootleggers); ajuste x0/y0 no local.
    ...cercadinho(2, 94.2, '#c0392b'),
    ...cercadinho(-24.4, 94.2, '#d68910'),
    ...cercadinho(-71, 94.2, '#1f6f8b'),
  ],
};

/** Cercadinho de calçada (X, Y do tour 3D): cerca baixa com entrada, 6 mesas, guarda-sóis e vasos. */
function cercadinho(x0, y0, corSol) {
  const L = 10;
  const D = 5.3;
  const x1 = x0 + L;
  const y1 = y0 + D;
  const cerca = { alt: 0.9, cor: '#3a3f45' };
  const itens = [
    { tipo: 'guarda', de: [x0, y0], ate: [x0 + L / 2 - 1, y0], ...cerca },
    { tipo: 'guarda', de: [x0 + L / 2 + 1, y0], ate: [x1, y0], ...cerca },
    { tipo: 'guarda', de: [x1, y0], ate: [x1, y1], ...cerca },
    { tipo: 'guarda', de: [x1, y1], ate: [x0, y1], ...cerca },
    { tipo: 'guarda', de: [x0, y1], ate: [x0, y0], ...cerca },
  ];
  for (let i = 0; i < 3; i++) {
    const cx = x0 + 1.7 + i * 3;
    itens.push({ tipo: 'guardasol', em: [cx, y0 + 2.6], r: 1.7, cor: corSol });
    for (let j = 0; j < 2; j++) {
      itens.push({ tipo: 'mesa', em: [cx, y0 + 1.5 + j * 2.2], r: 0.45, cor: '#f2f2f2', cadeiras: 4, corCadeira: '#2f3a44' });
    }
  }
  for (const [vx, vy] of [[x0 - 0.5, y0 - 0.5], [x1 + 0.5, y0 - 0.5], [x0 - 0.5, y1 + 0.5], [x1 + 0.5, y1 + 0.5]]) itens.push({ tipo: 'vaso', em: [vx, vy] });
  return itens;
}

// Escadas entre pavimentos (direção informada à mão: não há planta comum).
export const ESCADAS = [
  { de: 'inf-a-00', para: 'sup-escada', yaw: 160, rotulo: 'Escada · subir ao pavimento superior' },
  { de: 'sup-escada', para: 'inf-a-00', yaw: 180, rotulo: 'Escada · descer ao pavimento inferior' },
  { de: 'sup-verde-2', para: 'n3-auditorio', yaw: 90, rotulo: 'Escada · subir ao 3º nível' },
  { de: 'n3-auditorio', para: 'sup-verde-2', yaw: 270, rotulo: 'Escada · descer ao pavimento superior' },
  // Escada do anexo (em frente à Satine, ao lado da Adega Brasil) ↔ galeria do piso 2, na frente da Calçados Vila Rica
  { de: 'inf-anexo-3', para: 'sup-escada', yaw: 42, rotulo: 'Escada do anexo · subir à galeria de lojas (Vila Rica)' },
  { de: 'sup-escada', para: 'inf-anexo-3', yaw: 102, rotulo: 'Escada · descer ao anexo (Adega Brasil, Satine)' },
  // Escada do corredor da General Carneiro (junto à Porta I) ↔ galeria de restaurantes (mezanino)
  { de: 'inf-lig-i', para: 'sup-galeria-2', yaw: 162, rotulo: 'Escada · subir à galeria de restaurantes' },
  { de: 'sup-galeria-2', para: 'inf-lig-i', yaw: 180, rotulo: 'Escada · descer ao corredor da General Carneiro' },
  // Escadas medidas no levantamento do piso 2 (p2_escadas.csv)
  { de: 'sup-rosa-4', para: 'inf-b-00', yaw: 285, rotulo: 'Escada junto ao Takê · descer ao térreo' },
  { de: 'inf-b-00', para: 'sup-rosa-4', yaw: 22, rotulo: 'Escada · subir à Praça 7 de Setembro' },
  { de: 'sup-verde-3', para: 'n3-gerencia', yaw: 211, rotulo: 'Escada dos Orgânicos · subir ao 3º nível' },
  { de: 'n3-gerencia', para: 'sup-verde-3', yaw: 180, rotulo: 'Escada · descer ao Setor de Orgânicos' },
  { de: 'inf-hall-norte', para: 'sup-dea-norte', yaw: 301, rotulo: 'Escada helicoidal · subir à Praça Déa' },
  { de: 'sup-dea-norte', para: 'inf-hall-norte', yaw: 261, rotulo: 'Escada helicoidal · descer ao Hall Sete de Setembro' },
];

// ---------------------------------------------------------------- paredes e obras de arte
// Paredes retas (px da planta) que ladeiam a entrada principal. Posições ESTIMADAS.
export const PAREDES = {
  inferior: [
    { de: [45, 560], ate: [45, 673], altura: 4.5 },
    { de: [45, 783], ate: [45, 890], altura: 4.5 },
  ],
};

// Painéis de azulejo de Poty Lazzarotto no Mercado. Fatos: painéis "Cenas do Largo da Ordem" (1996,
// ~11 m², azulejos pintados, ala de alimentação com entrada pela Av. Sete de Setembro) e "O Quitandeiro"
// (1997, azulejos). A parede exata NÃO foi confirmada: posições ESTIMADAS. A obra não é reproduzida
// (direitos autorais): o painel mostra legenda; para uma foto autorizada use `media.src` no module.json.
const FONTE_POTY = 'https://www.patrimoniocultural.pr.gov.br/Bem-Tombado/Obras-de-Poty-Lazzarotto-Paineis-e-Murais-em-Curitiba';
export const OBRAS = {
  inferior: [
    {
      id: 'poty-largo-da-ordem', titulo: 'Cenas do Largo da Ordem', autor: 'Poty Lazzarotto', ano: 1996,
      em: [47.6, 616], facing: 90, largura: 5.5, altura: 2.0,
      descricao: 'Painel de Poty Lazzarotto (1996), de cerca de 11 m², pintado sobre azulejos com tintas especiais, na ala de alimentação com entrada pela Av. Sete de Setembro. Posição no tour estimada; a obra não é reproduzida aqui.',
      url: FONTE_POTY,
    },
    {
      id: 'poty-quitandeiro', titulo: 'O Quitandeiro', autor: 'Poty Lazzarotto', ano: 1997,
      em: [47.6, 836], facing: 90, largura: 3.4, altura: 2.4,
      descricao: 'Painel de azulejos de Poty Lazzarotto (1997) que retrata um quitandeiro japonês e o trabalho do homem. Posição no tour estimada; a obra não é reproduzida aqui.',
      url: FONTE_POTY,
    },
  ],
};

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
    {
      // lado oeste: a entrada principal do Hall (posição do meio-fio ESTIMADA)
      nome: 'Av. Sete de Setembro',
      de: [45, 0], ate: [45, 1500],
      lado: 'direita',
      calcada: 110, pista: 200, calcadaOposta: 80,
      faixasPedestres: [728], // distância em px ao longo da rua, a partir de `de`
    },
    {
      // acima do estacionamento que fica em frente à Porta E (posição ESTIMADA pelo contorno do OpenStreetMap)
      nome: 'Rua da Paz',
      de: [0, -250], ate: [2000, -250],
      lado: 'norte',
      calcada: 60, pista: 140, calcadaOposta: 50,
    },
  ],
  superior: [
    {
      // lado norte: portas C e D (setor de Orgânicos); a rua fica acima da planta
      nome: 'Rua da Paz',
      de: [0, 179], ate: [2000, 179],
      lado: 'norte',
      calcada: 55, pista: 110, calcadaOposta: 40,
      faixasPedestres: [565, 850],
    },
    {
      nome: 'Av. Sete de Setembro',
      de: [124, 0], ate: [124, 1500],
      lado: 'direita',
      calcada: 55, pista: 140, calcadaOposta: 45,
      faixasPedestres: [440],
    },
  ],
};

// Área coberta de cada pavimento (px): o teto só é desenhado aqui dentro.
export const AREA_COBERTA = {
  inferior: { de: [0, 100], ate: [2000, 1145] },
  superior: { de: [100, 160], ate: [1600, 1400] },
  nivel3: { de: [1000, 250], ate: [1260, 760] },
};

// ---------------------------------------------------------------- OpenStreetMap
// Contornos do OpenStreetMap desenhados no minimapa (tracejados). Mostram o
// prédio atual, inclusive partes que as plantas afixadas (de ~2011) não
// desenham. Coordenadas em scripts/planta/osm-dados.json; para atualizar:
//   npm run osm && npm run planta
// © OpenStreetMap contributors, licença ODbL (openstreetmap.org/copyright).
export const CONTORNOS_OSM = [
  { way: 24776455, nome: 'Mercado Municipal (prédio)', tipo: 'predio', pavimentos: ['inferior', 'superior'] },
  { way: 128976784, nome: 'Mercado de Orgânicos (prédio)', tipo: 'organicos', pavimentos: ['inferior', 'superior'] },
  { way: 128976783, nome: 'Estacionamento', tipo: 'estacionamento', pavimentos: ['inferior', 'superior'] },
  { way: 696383653, nome: 'Boxes de hortifrúti', tipo: 'hortifruti', pavimentos: ['inferior'] },
  { way: 696383650, nome: 'Praça de alimentação', tipo: 'praca', pavimentos: ['superior'] },
  { way: 696383651, nome: 'Praça de alimentação', tipo: 'praca', pavimentos: ['superior'] },
];
