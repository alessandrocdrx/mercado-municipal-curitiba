// Comerciantes do Mercado Municipal de Curitiba e seus boxes.
//
// Levantamento feito em 27/09/2026 a partir das páginas de comerciantes do
// site oficial (mercadomunicipaldecuritiba.com.br/comerciante/…), lidas via
// mecanismo de busca porque o site não estava acessível diretamente. Onde o
// número do box veio de outro guia público, `fonte` diz qual.
// ⚠ Confirme no local: comerciantes mudam de box, e alguns números divergem
// entre fontes (ver `obs`).
//
// boxes: ids dos módulos gerados pela planta (inf-box-XX, inf-banca-XX, sup-box-XXX)
// boxesForaDaPlanta: número informado pela fonte, mas que não aparece nas plantas

const OFICIAL = 'https://www.mercadomunicipaldecuritiba.com.br/comerciante/';

export const CATEGORIAS = {
  acougue: { nome: 'Açougue', cor: '#8e2f2f' },
  peixaria: { nome: 'Peixaria', cor: '#23577f' },
  hortifruti: { nome: 'Hortifrúti', cor: '#3c7a34' },
  emporio: { nome: 'Empório e mercearia', cor: '#9a6b1f' },
  especiarias: { nome: 'Cereais e especiarias', cor: '#7a4a24' },
  bebidas: { nome: 'Bebidas', cor: '#5b2e63' },
  lanchonete: { nome: 'Lanchonete e restaurante', cor: '#b0561d' },
  flores: { nome: 'Flores e plantas', cor: '#a33d6b' },
  doces: { nome: 'Doces e chocolates', cor: '#6b3a2a' },
  organicos: { nome: 'Orgânicos', cor: '#2f7d32' },
  pet: { nome: 'Pet shop', cor: '#4c5f7a' },
  servicos: { nome: 'Serviços', cor: '#4a4f57' },
};

const c = (nome, categoria, slug, extra = {}) => ({ nome, categoria, url: slug ? OFICIAL + slug + '/' : undefined, boxes: [], ...extra });

export const COMERCIANTES = [
  // ---------------------------------------------------- com box na planta
  c('Casa de Carnes Pé de Boi', 'acougue', 'casa-de-carnes-pe-de-boi', {
    boxes: ['inf-box-02', 'inf-box-03'], telefone: '(41) 3264-4890',
    descricao: 'Carnes bovina, suína e de aves, carnes exóticas e ingredientes para feijoada, desde 1963.',
    fonte: 'número do box: guias públicos (applocal, Yelp)',
  }),
  c('Espaço Angus Prime', 'acougue', 'espaco-angus-prime', {
    boxes: ['inf-box-06', 'inf-box-07'], telefone: '(41) 3264-4163 · delivery (41) 99642-9398',
    horario: 'Ter a Sáb 8h–18h · Dom 8h–13h',
    descricao: 'Boutique de carnes 100% Angus e carnes exóticas.',
    fonte: 'número do box: guias públicos',
  }),
  c('Peixaria Keli Mozer', 'peixaria', 'peixaria-keli-mozer', {
    boxes: ['inf-box-10'], telefone: '(41) 3264-1523 · (41) 99566-7702',
    descricao: 'Pescados e frutos do mar, com estrutura totalmente reformada.',
  }),
  c('Box do Eliseu', 'lanchonete', 'box-do-eliseu', {
    boxes: ['inf-box-12', 'inf-box-13'],
    descricao: 'Há 39 anos no Mercado: comida caseira, pastéis, sanduíches, sucos e café. Famoso pela almôndega de carne.',
  }),
  c('Adega Municipal', 'bebidas', 'adega-municipal', {
    boxes: ['inf-box-15'], telefone: '(41) 3039-1984 · (41) 98870-1977',
    descricao: 'Vinhos, espumantes, whisky, conhaque e licores.',
    obs: 'A fonte informa "Box 15B"; a planta mostra um único box 15.',
  }),
  c('Peixaria São José', 'peixaria', 'peixaria-sao-jose', {
    boxes: ['inf-box-21', 'inf-box-22'], telefone: '(41) 3264-1462 · (41) 99870-8373',
    descricao: 'Lagosta, lagostim, polvo, lula, mariscos e peixes variados. Faz entregas.',
  }),
  c('Armazém da Zelma', 'especiarias', 'armazem-da-zelma', {
    boxes: ['inf-box-28', 'inf-box-29', 'inf-box-30'],
    descricao: 'No Mercado desde 1º de novembro de 1960: azeites, bacalhau, castanhas, frutas secas, especiarias, conservas e cereais.',
  }),
  c('Mercearia MMM', 'emporio', null, {
    boxes: ['inf-box-37', 'inf-box-38'],
    fonte: 'resumo de busca do diretório oficial; página própria não localizada',
  }),
  c('Box 41 Vinhos', 'bebidas', 'box-41-vinhos', {
    boxes: ['inf-box-41'],
    descricao: 'Especialista em vinhos, com mais de 1.100 rótulos.',
  }),
  c('Armazém Becker', 'especiarias', 'armazem-becker', {
    boxes: ['inf-box-47', 'inf-box-48'], telefone: '(41) 3263-4565 · WhatsApp (41) 99215-5300',
    descricao: 'Há 32 anos: frutas secas, cereais, farinhas e especiarias.',
  }),
  c('Conversic', 'emporio', 'conversic', {
    boxes: ['inf-box-54', 'inf-box-55'], telefone: '(41) 3022-0802 · WhatsApp (41) 99976-3741',
    descricao: 'Há mais de 30 anos com produtos portugueses.',
  }),
  c('Vô Milano Cachaçaria', 'bebidas', 'vo-milano-cachacaria', {
    boxes: ['inf-box-73', 'inf-box-74'],
    descricao: 'Única loja de Curitiba 100% especializada em cachaça, com mais de 400 rótulos.',
    obs: 'A Mercearia Sansei também aparece no Box 73 em outra página; confirmar.',
  }),
  c('Flora Cristiane', 'flores', 'flora-cristiane', {
    boxes: ['inf-box-77', 'inf-box-79', 'inf-box-80'], telefone: '(41) 3264-2324 · (41) 98845-0161',
    descricao: 'Floricultura fundada em 5 de agosto de 1966: árvores frutíferas e ornamentais, sementes e plantas.',
  }),
  c('Box do Ademir', 'hortifruti', 'box-do-ademir', {
    boxes: ['inf-box-358'], telefone: '(41) 3262-9414 · WhatsApp (41) 99528-7690 / 99962-4073',
  }),
  c('Empório do Sabor', 'especiarias', 'emporio-do-sabor', {
    boxes: ['inf-box-372'], telefone: '(41) 3264-1543',
    descricao: 'Há 17 anos: especiarias, condimentos, cereais, conservas, frutas secas e importados.',
  }),
  c('Temperamento', 'especiarias', 'temperamento', {
    boxes: ['inf-box-299', 'inf-box-301'], telefone: '(41) 3030-2728 · WhatsApp (41) 99827-1827',
    descricao: 'Especiarias, molhos, azeites, pimentas, sais e utensílios culinários.',
  }),
  c('Furuta Cereais', 'especiarias', 'furuta-cereais', {
    boxes: ['inf-box-429', 'inf-box-430', 'inf-box-431', 'inf-box-432'],
  }),
  c('Daimaru Bebidas', 'bebidas', 'daimaru-bebidas', {
    boxes: ['inf-box-433', 'inf-box-434'], telefone: '(41) 3363-8275',
    descricao: 'Cachaças, vinhos nacionais e importados, licores, xaropes e destilados.',
  }),
  c('Empório Kaveh Kanes', 'emporio', 'emporio-kaveh-kanes', {
    boxes: ['inf-box-456', 'inf-box-457'],
  }),
  c('Urbano 52 CWB', 'hortifruti', 'urbano-52-cwb', { boxes: ['inf-banca-52'], descricao: 'Frutas e verduras.' }),
  c('Banca 63 Produtos Coloniais', 'emporio', 'banca-63-produtos-coloniais', {
    boxes: ['inf-banca-63'], descricao: 'Produtos coloniais: conservas, queijos, salames, doces.',
  }),
  c('SN Frutas e Verduras', 'hortifruti', 'sn-frutas-e-verduras', {
    boxes: ['inf-banca-86'], descricao: 'Há 30 anos no Mercado: folhas, frutas, verduras, legumes e cogumelos.',
  }),
  c("The Bootlegger's", 'bebidas', null, {
    boxes: ['sup-box-518'], fonte: 'resumo de busca do diretório oficial; categoria não confirmada',
  }),

  // ---------------------------------------------------- número fora das plantas
  c("Miranda's Mercearia", 'emporio', 'mirandas-mercearia', {
    boxesForaDaPlanta: ['189'], telefone: '(41) 99700-4977',
    descricao: 'Produtos paranaenses: chocolates artesanais, doces e cafés.',
  }),
  c('Maia Box Sanduicheria', 'lanchonete', 'maia-box-sanduicheria', {
    boxesForaDaPlanta: ['194'], descricao: 'Desde 2000, famosa pelo sanduíche de mortadela.',
  }),
  c('Restaurante Ohana', 'lanchonete', null, { boxesForaDaPlanta: ['201'] }),
  c('Ninki Pastéis & Delícias', 'lanchonete', 'ninki-pasteis-delicias', {
    boxesForaDaPlanta: ['205'], telefone: '(41) 99179-1197 · (41) 99663-2026',
    descricao: 'Há 25 anos: pastéis, bolinhos artesanais e bebidas.',
  }),

  // ---------------------------------------------------- sem número de box nas fontes
  c('Casabianco Empório Gourmet', 'emporio', 'emporio-gourmet'),
  c('Domo Empório Gourmet', 'emporio', 'emporio-curitibano', { descricao: 'Queijos, frios, vinhos, espumantes, destilados e mercearia.' }),
  c('Empório Barion', 'emporio', 'emporio-barion', { descricao: 'Ingredientes diferenciados e queijos nacionais e importados.' }),
  c('Empório Bon Appétit', 'emporio', 'emporio-bon-appetit', { descricao: 'Frios, queijos, azeitonas, bacalhau, azeites, massas e frutas secas.' }),
  c('Empório Metropolitano', 'emporio', 'emporio-metropolitano'),
  c('Empório 56', 'emporio', 'emporio-56-2'),
  c('Empório Top Mix', 'doces', 'emporio-top-mix', { descricao: 'Desde 2011: chocolates, doces e itens gourmet.' }),
  c('A Faca e o Queijo', 'emporio', 'mercearia-imperial', { descricao: 'Queijos, bacalhau, azeitonas, azeites, castanhas e nozes.' }),
  c('Bon Vivant', 'emporio', 'bon-vivant', { telefone: '(41) 99673-7753', descricao: 'Queijos do mundo todo.' }),
  c('Mercearia Sansei', 'emporio', 'mercearia-sansei', { descricao: 'Produtos da culinária oriental e doces típicos.', obs: 'Uma fonte cita o Box 73.' }),
  c('Mafo Com. de Alimentos', 'emporio', 'mafo-com-de-alimentos'),
  c('Cereais e Especiarias Sissi', 'especiarias', 'cereais-e-especiarias-sissi', { descricao: 'Azeites, especiarias e conservas nacionais e importados.' }),
  c('Cereais Mistura Fina', 'especiarias', 'cereais-mistura-fina', { descricao: 'Frutas desidratadas, castanhas torradas, cereais e especiarias.' }),
  c('Cia. do Tempero', 'especiarias', 'cia-do-tempero'),
  c('Celeiro Municipal', 'especiarias', 'celeiro-municipal'),
  c('DAP Boutique de Carnes', 'acougue', 'dap-boutique-de-carnes', { descricao: 'Carnes exóticas: cordeiro, coelho, pato, jacaré, rã, codorna.' }),
  c('Nippon Boutique', 'acougue', 'nippon-boutique'),
  c('Lá de Minas', 'emporio', 'la-de-minas'),
  c('Peixaria Santa Clara', 'peixaria', 'peixaria-santa-clara-eireli', { descricao: 'Peixes frescos, filés, camarão, lagosta e crustáceos importados.' }),
  c('Banca da Júlia', 'hortifruti', 'banca-da-julia', { descricao: 'Frutas e verduras nacionais e importadas, sem agrotóxicos, com entrega.' }),
  c('Banca do Mário', 'hortifruti', 'banca-do-mario'),
  c('Banca do Zé Mario', 'hortifruti', 'banca-do-ze-mario'),
  c('Banca da Maria', 'hortifruti', 'banca-da-maria', { descricao: 'Há 10 anos no hortifrúti do Mercado.' }),
  c('Banca do Hiro', 'hortifruti', 'banca-do-hiro'),
  c('Banca do Adalto', 'hortifruti', 'banca-do-adalto', { descricao: 'Frutas e verduras frescas com entrega.' }),
  c('Yamasaki Verduras', 'hortifruti', 'yamasaki-verduras-2', { telefone: '(41) 3264-4533 · (41) 99937-6822', descricao: 'Há 40 anos no hortifrúti do Mercado.' }),
  c('Oliveiras Hortifruti', 'hortifruti', 'oliveiras-hortifruti'),
  c('Dinho Wine and Spirits', 'bebidas', 'dinho-wine-and-spirits'),
  c('Adega Brasil', 'bebidas', 'adega-brasil'),
  c('Restaurante Box Curitiba', 'lanchonete', 'restaurante-box-curitiba', { descricao: 'Massas, risotos e saladas.' }),
  c('Restaurante Takê', 'lanchonete', 'restaurante-take', { descricao: 'Comida japonesa por quilo.' }),
  c('Restaurante Anarco', 'lanchonete', 'restaurante-anarco', { descricao: 'Gastronomia italiana, temperos e vinhos.' }),
  c('Café do Jorge e da Aurea', 'lanchonete', 'cafe-do-jorge-e-da-aurea'),
  c('Café do Mercado', 'lanchonete', 'cafe-do-mercado'),
  c('Confeitaria Colônia Cecília', 'doces', 'confeitaria-colonia-cecilia', { descricao: 'Café colonial aos domingos e bolos por encomenda.' }),
  c("D'Fuhrmann Chocolates", 'doces', 'dfuhrmann-chocolates'),
  c('ICAB Chocolates', 'doces', 'icab-chocolates', { descricao: 'Fundada em 1930.' }),
  c('Casa da Bolacha Caseira', 'doces', 'casa-da-bolacha-caseira'),
  c("Taurino's Organic", 'organicos', 'taurinos-organic', { descricao: 'Primeiro açougue orgânico certificado do Brasil, no setor de orgânicos desde 2009.' }),
  c("Nico's Empório Orgânico", 'organicos', 'nicos-emporio-organico'),
  c('Espaço Orgânico', 'organicos', 'espaco-organico'),
  c('Organique Essentiel', 'organicos', 'organique-essentiel'),
  c('Cativa Natureza', 'organicos', 'cativa-natureza', { descricao: 'Cosméticos com insumos orgânicos rastreados, desde 2008.' }),
  c('Couve & Flor', 'organicos', 'couve-flor'),
  c('Rei do Kão', 'pet', 'rei-do-kao', { telefone: '(41) 3262-7136', descricao: 'Único pet shop do Mercado.' }),
  c('Planeta Aquários', 'pet', 'planeta-aquarios'),
  c("Box's Celulares", 'servicos', 'boxs-celulares-ltda', { descricao: 'Assistência técnica de celulares e acessórios, desde 2005.' }),
];
