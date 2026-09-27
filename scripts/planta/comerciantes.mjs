// Comerciantes do Mercado Municipal de Curitiba e seus boxes.
//
// Levantamento feito em 27/09/2026 a partir das páginas de comerciantes do
// site oficial (mercadomunicipaldecuritiba.com.br/comerciante/…), lidas via
// mecanismo de busca porque o site não estava acessível diretamente, e de
// guias públicos (applocal, Yelp, páginas das próprias lojas) para o número
// do box quando o site não o trazia. `fonte` indica quando não é o oficial.
//
// Pavimento: números 01–19 existem nos dois andares. Restaurantes e
// lanchonetes desses números foram postos na área rosa do pavimento superior
// (praça de alimentação); os demais no inferior. Ver `obs` de cada um.
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
  servicos: { nome: 'Variedades e serviços', cor: '#4a5a73' },
};

const c = (nome, categoria, slug, extra = {}) => ({ nome, categoria, url: slug ? OFICIAL + slug + '/' : undefined, boxes: [], ...extra });

export const COMERCIANTES = [
  // ================================================ pavimento inferior
  c('Casa de Carnes Pé de Boi', 'acougue', 'casa-de-carnes-pe-de-boi', {
    boxes: ['inf-box-02', 'inf-box-03'], telefone: '(41) 3264-4890',
    descricao: 'Carnes bovina, suína e de aves, carnes exóticas e ingredientes para feijoada, desde 1963.',
    fonte: 'guias públicos (applocal, Yelp)',
  }),
  c('DAP Boutique de Carnes', 'acougue', 'dap-boutique-de-carnes', {
    boxes: ['inf-box-04', 'inf-box-05'],
    descricao: 'Carnes exóticas: cordeiro, coelho, pato, jacaré, rã, codorna.',
    fonte: 'guias públicos (Bendito Guia)',
  }),
  c('Espaço Angus Prime', 'acougue', 'espaco-angus-prime', {
    boxes: ['inf-box-06', 'inf-box-07'], telefone: '(41) 3264-4163 · delivery (41) 99642-9398',
    horario: 'Ter a Sáb 8h–18h · Dom 8h–13h',
    descricao: 'Boutique de carnes 100% Angus e carnes exóticas.',
    fonte: 'guias públicos',
  }),
  c('Peixaria Keli Mozer', 'peixaria', 'peixaria-keli-mozer', {
    boxes: ['inf-box-10'], telefone: '(41) 3264-1523 · (41) 99566-7702',
    descricao: 'Pescados e frutos do mar, com estrutura totalmente reformada.',
  }),
  c('Peixaria Santa Clara', 'peixaria', 'peixaria-santa-clara-eireli', {
    boxes: ['inf-box-11'], telefone: '(41) 3264-4014',
    descricao: 'Desde 1970: peixes frescos, filés, postas, camarão, lagosta, lagostins e crustáceos importados.',
    fonte: 'guias públicos',
  }),
  c('Celeiro Municipal', 'emporio', 'celeiro-municipal', {
    boxes: ['inf-box-12', 'inf-box-13'], telefone: '(41) 3024-7266',
    descricao: 'Queijos, vinhos, destilados, castanhas, frutas secas e bacalhau.',
  }),
  c('Adega Municipal', 'bebidas', 'adega-municipal', {
    boxes: ['inf-box-15'], telefone: '(41) 3039-1984',
    descricao: 'Vinhos, espumantes, whisky, conhaque e licores.',
    obs: 'A fonte informa "Box 15B"; a planta mostra um único Box 15.',
  }),
  c('Planeta Aquários', 'pet', 'planeta-aquarios', {
    boxes: ['inf-box-16', 'inf-box-18', 'inf-box-20a'],
    descricao: 'Há 15 anos: aquários e peixes ornamentais de água doce e salgada.',
    obs: 'A fonte cita também o Box 20H, que não aparece na planta.',
  }),
  c('Peixaria São José', 'peixaria', 'peixaria-sao-jose', {
    boxes: ['inf-box-21', 'inf-box-22'], telefone: '(41) 3264-1462 · (41) 99870-8373',
    descricao: 'Lagosta, lagostim, polvo, lula, mariscos e peixes variados. Faz entregas.',
  }),
  c('Cia. do Tempero', 'especiarias', 'cia-do-tempero', {
    boxes: ['inf-box-23', 'inf-box-24'], telefone: '(41) 3363-1527',
    descricao: 'Temperos e castanhas.',
  }),
  c('Cereais e Especiarias Sissi', 'especiarias', 'cereais-e-especiarias-sissi', {
    boxes: ['inf-box-25', 'inf-box-26'], telefone: '(41) 3264-5271',
    descricao: 'Azeites, especiarias e conservas nacionais e importados.',
    fonte: 'guias públicos',
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
    boxes: ['inf-box-41'], descricao: 'Especialista em vinhos, com mais de 1.100 rótulos.',
  }),
  c('Armazém Becker', 'especiarias', 'armazem-becker', {
    boxes: ['inf-box-47', 'inf-box-48'], telefone: '(41) 3263-4565 · WhatsApp (41) 99215-5300',
    descricao: 'Há 32 anos: frutas secas, cereais, farinhas e especiarias.',
  }),
  c('Conversic', 'emporio', 'conversic', {
    boxes: ['inf-box-54', 'inf-box-55'], telefone: '(41) 3022-0802 · WhatsApp (41) 99976-3741',
    descricao: 'Há mais de 30 anos com produtos portugueses.',
  }),
  c('Bon Vivant', 'emporio', 'bon-vivant', {
    boxes: ['inf-box-56', 'inf-box-57'], telefone: '(41) 99673-7753 · (41) 3013-7753',
    descricao: 'Mais de 300 queijos nacionais e importados, de leite de vaca, cabra, ovelha e búfala, e embutidos artesanais.',
    fonte: 'guias públicos (Bom Gourmet)',
  }),
  c('Empório Barion', 'emporio', 'emporio-barion', {
    boxes: ['inf-box-63', 'inf-box-64'], telefone: '(41) 99267-0609',
    descricao: 'Ingredientes diferenciados, queijos nacionais e importados, tábuas de frios e cestas de café.',
    fonte: 'guias públicos',
  }),
  c('Empório Bon Appétit', 'emporio', 'emporio-bon-appetit', {
    boxes: ['inf-box-68', 'inf-box-69'], telefone: '(41) 3363-5750',
    descricao: 'Frios, queijos, azeitonas, bacalhau, azeites, massas e frutas secas.',
    fonte: 'guias públicos',
  }),
  c('Mercearia Sansei', 'emporio', 'mercearia-sansei', {
    boxes: ['inf-box-73'], telefone: '(41) 3264-1673 · (41) 99668-8860',
    descricao: 'Produtos da culinária oriental, doces típicos, bebidas e utensílios.',
  }),
  c('Vô Milano Cachaçaria', 'bebidas', 'vo-milano-cachacaria', {
    boxes: ['inf-box-74'],
    descricao: 'Única loja de Curitiba 100% especializada em cachaça, com mais de 400 rótulos.',
    obs: 'O site cita os boxes 73/74; o 73 aparece como Mercearia Sansei em outras fontes.',
  }),
  c('Flora Cristiane', 'flores', 'flora-cristiane', {
    boxes: ['inf-box-77', 'inf-box-79', 'inf-box-80'], telefone: '(41) 3264-2324 · (41) 98845-0161',
    descricao: 'Floricultura fundada em 5 de agosto de 1966: árvores frutíferas e ornamentais, sementes e plantas.',
  }),
  c("D'Fuhrmann Chocolates", 'doces', 'dfuhrmann-chocolates', {
    boxes: ['inf-box-295', 'inf-box-296'], telefone: '(41) 3154-5999 · (41) 99677-8821',
    descricao: 'Chocolates de tradição alemã feitos em Curitiba.',
  }),
  c('Temperamento', 'especiarias', 'temperamento', {
    boxes: ['inf-box-299', 'inf-box-301'], telefone: '(41) 3030-2728 · WhatsApp (41) 99827-1827',
    descricao: 'Especiarias, molhos, azeites, pimentas, sais e utensílios culinários.',
  }),
  c('Empório Metropolitano', 'emporio', 'emporio-metropolitano', {
    boxes: ['inf-box-304', 'inf-box-306'], telefone: '(41) 3250-7742',
    descricao: 'Espaço de apoio a pequenos produtores artesanais, manuais e semi-industriais.',
    fonte: 'Portal Locais da Prefeitura',
  }),
  c('Box do Ademir', 'hortifruti', 'box-do-ademir', {
    boxes: ['inf-box-358'], telefone: '(41) 3262-9414 · WhatsApp (41) 99528-7690 / 99962-4073',
  }),
  c('ICAB Chocolates', 'doces', 'icab-chocolates', {
    boxes: ['inf-box-370'], telefone: '(41) 3049-0136',
    descricao: 'Fundada em 1930: chocolates, biscoitos e bombons.',
  }),
  c('Empório do Sabor', 'especiarias', 'emporio-do-sabor', {
    boxes: ['inf-box-372'], telefone: '(41) 3264-1543',
    descricao: 'Há 17 anos: especiarias, condimentos, cereais, conservas, frutas secas e importados.',
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
  // bancas do salão central
  c('Cereais Mistura Fina', 'especiarias', 'cereais-mistura-fina', {
    boxes: ['inf-banca-17'], telefone: '(41) 3362-6150 · (41) 99880-9647',
    descricao: 'Frutas desidratadas, castanhas torradas, cereais, conservas e especiarias.',
  }),
  c('Banca da Júlia', 'hortifruti', 'banca-da-julia', {
    boxes: ['inf-banca-33', 'inf-banca-34', 'inf-banca-35', 'inf-banca-42', 'inf-banca-43', 'inf-banca-44'],
    descricao: 'Frutas e verduras nacionais e importadas, sem agrotóxicos, com entrega.',
    fonte: 'guias públicos',
  }),
  c('Urbano 52 CWB', 'hortifruti', 'urbano-52-cwb', { boxes: ['inf-banca-52'], descricao: 'Frutas e verduras.' }),
  c('Banca da Maria', 'hortifruti', 'banca-da-maria', {
    boxes: ['inf-banca-53'], telefone: '(41) 99989-1674', descricao: 'Há 10 anos no hortifrúti do Mercado.',
  }),
  c('Banca 63 Produtos Coloniais', 'emporio', 'banca-63-produtos-coloniais', {
    boxes: ['inf-banca-63'], descricao: 'Produtos coloniais: conservas, queijos, salames, doces.',
  }),
  c('SN Frutas e Verduras', 'hortifruti', 'sn-frutas-e-verduras', {
    boxes: ['inf-banca-86'], descricao: 'Há 30 anos no Mercado: folhas, frutas, verduras, legumes e cogumelos.',
  }),
  c('Yamasaki Verduras', 'hortifruti', 'yamasaki-verduras-2', {
    boxes: ['inf-banca-98', 'inf-banca-99', 'inf-banca-100'], telefone: '(41) 3264-4533 · (41) 99937-6822',
    descricao: 'Há 40 anos no hortifrúti do Mercado.',
  }),

  // ================================================ pavimento superior
  c('Box do Eliseu', 'lanchonete', 'box-do-eliseu', {
    boxes: ['sup-box-12', 'sup-box-13'],
    descricao: 'Há 39 anos no Mercado: comida caseira, pastéis, sanduíches, sucos e café. Famoso pela almôndega de carne.',
    obs: 'Boxes 12–13 do pavimento inferior pertencem ao Celeiro Municipal; o Eliseu foi posto na praça de alimentação.',
  }),
  c('Restaurante Anarco', 'lanchonete', 'restaurante-anarco', {
    boxes: ['sup-box-16'], telefone: '(41) 3336-0049',
    descricao: 'Cozinha italiana, fundado em 1991.',
    obs: 'Box 16 do inferior pertence à Planeta Aquários; o Anarco foi posto na praça de alimentação.',
    fonte: 'site do restaurante',
  }),
  c('Restaurante Box Curitiba', 'lanchonete', 'restaurante-box-curitiba', {
    boxes: ['sup-box-19'], telefone: '(41) 3015-8240',
    descricao: 'Massas, risotos e saladas.',
    obs: 'Pavimento assumido: praça de alimentação.',
    fonte: 'guias públicos (Guia da Semana)',
  }),
  c("Box's Celulares", 'servicos', 'boxs-celulares-ltda', {
    boxes: ['sup-box-341'], descricao: 'Assistência técnica de celulares e acessórios, desde 2005.',
    fonte: 'guias públicos (applocal)',
  }),
  c('Nippon Boutique', 'servicos', 'nippon-boutique', {
    boxes: ['sup-box-352', 'sup-box-353'],
    descricao: 'Desde 1977: revistas e livros japoneses e ofurôs, no pavimento superior perto da praça de alimentação.',
  }),
  c("The Bootlegger's", 'bebidas', null, {
    boxes: ['sup-box-518'], fonte: 'resumo de busca do diretório oficial; categoria não confirmada',
  }),
  c("Taurino's Organic", 'organicos', 'taurinos-organic', {
    boxes: ['sup-box-521', 'sup-box-522'], telefone: '(41) 3095-0123 · (41) 98851-9391',
    horario: 'Ter a Sáb 8h–18h · Dom 8h–13h (setor de orgânicos, acesso pela Rua da Paz, 608)',
    descricao: 'Primeiro açougue orgânico certificado do Brasil, no setor de orgânicos desde 2009.',
    fonte: 'guias públicos',
  }),

  // ================================================ número fora das plantas
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
  c('Banca do Adalto', 'hortifruti', 'banca-do-adalto', {
    boxesForaDaPlanta: ['111', '113'], descricao: 'Frutas e verduras frescas com entrega.',
  }),

  // ================================================ sem número de box nas fontes
  c('Casabianco Empório Gourmet', 'emporio', 'emporio-gourmet'),
  c('Domo Empório Gourmet', 'emporio', 'emporio-curitibano', { descricao: 'Queijos, frios, vinhos, espumantes, destilados e mercearia.' }),
  c('Empório 56', 'emporio', 'emporio-56-2'),
  c('Empório Top Mix', 'doces', 'emporio-top-mix', { descricao: 'Desde 2011: geleias, azeites, frutas secas, patês, azeitonas e doces.' }),
  c('A Faca e o Queijo', 'emporio', 'mercearia-imperial', { descricao: 'Mais de 200 queijos, bacalhau, azeitonas, azeites, castanhas e nozes.' }),
  c('Mafo Com. de Alimentos', 'emporio', 'mafo-com-de-alimentos'),
  c('Lá de Minas', 'emporio', 'la-de-minas', { descricao: 'Produtos de Minas Gerais: cachaças, doces, queijos e artesanato.' }),
  c('Banca do Mário', 'hortifruti', 'banca-do-mario'),
  c('Banca do Zé Mario', 'hortifruti', 'banca-do-ze-mario'),
  c('Banca do Hiro', 'hortifruti', 'banca-do-hiro', { telefone: '(41) 99944-4334' }),
  c('Oliveiras Hortifruti', 'hortifruti', 'oliveiras-hortifruti'),
  c('Dinho Wine and Spirits', 'bebidas', 'dinho-wine-and-spirits', { telefone: '(41) 98783-5900' }),
  c('Adega Brasil', 'bebidas', 'adega-brasil', { obs: 'Uma fonte cita endereço na Rua da Paz, 643, ao lado do Mercado.' }),
  c('Restaurante Takê', 'lanchonete', 'restaurante-take', { descricao: 'Comida japonesa por quilo.' }),
  c('Café do Jorge e da Aurea', 'lanchonete', 'cafe-do-jorge-e-da-aurea'),
  c('Café do Mercado', 'lanchonete', 'cafe-do-mercado'),
  c('Confeitaria Colônia Cecília', 'doces', 'confeitaria-colonia-cecilia', { descricao: 'Desde 2003, na entrada pela Av. Sete de Setembro. Café colonial aos domingos.' }),
  c('Casa da Bolacha Caseira', 'doces', 'casa-da-bolacha-caseira', { descricao: 'Bolachas, doces caseiros e biscoitos de polvilho.' }),
  c("Nico's Empório Orgânico", 'organicos', 'nicos-emporio-organico'),
  c('Espaço Orgânico', 'organicos', 'espaco-organico'),
  c('Organique Essentiel', 'organicos', 'organique-essentiel'),
  c('Cativa Natureza', 'organicos', 'cativa-natureza', { telefone: '(41) 99281-1275', descricao: 'Cosméticos com insumos orgânicos rastreados, desde 2008.' }),
  c('Couve & Flor', 'organicos', 'couve-flor'),
  c('Rei do Kão', 'pet', 'rei-do-kao', { telefone: '(41) 3262-7136', descricao: 'Único pet shop do Mercado.' }),
];
