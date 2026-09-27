// Comerciantes do Mercado Municipal de Curitiba e seus boxes.
//
// Levantamento feito em 27/09/2026 a partir das páginas de comerciantes do
// site oficial (mercadomunicipaldecuritiba.com.br/comerciante/…), lidas via
// mecanismo de busca porque o site não estava acessível diretamente, e de
// guias públicos (applocal, Yelp, páginas das próprias lojas) para o número
// do box quando o site não o trazia. `fonte` indica quando não é o oficial.
// DIRETORIO = lista "Lojas – Telefones e Boxs" (encontracuritiba.com.br /
// mercadomodelo.com.br), consultada por número de box via busca, pois o site
// oficial e o Wayback Machine estavam inacessíveis nesta rede.
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
  outros: { nome: 'Outros', cor: '#5d5a6e' },
};

const DIRETORIO = 'lista de lojas e boxes (encontracuritiba / mercadomodelo)';
const c = (nome, categoria, slug, extra = {}) => ({ nome, categoria, url: slug ? OFICIAL + slug + '/' : undefined, boxes: [], ...extra });

export const COMERCIANTES = [
  // ================================================ pavimento inferior
  c('Casa de Carnes Pé de Boi', 'acougue', 'casa-de-carnes-pe-de-boi', {
    boxes: ['inf-box-02', 'inf-box-03'], telefone: '(41) 3264-4890 · (41) 99642-9398',
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
    boxes: ['inf-box-25', 'inf-box-26'], telefone: '(41) 3264-5271 · (41) 99923-2668',
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
    boxes: ['inf-box-39', 'inf-box-40', 'inf-box-41', 'inf-box-42'], telefone: '(41) 3264-4343 · (41) 99705-4697',
    descricao: 'Especialista em vinhos, com mais de 1.100 rótulos.',
    fonte: DIRETORIO,
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
    boxes: ['inf-banca-73', 'inf-banca-74'],
    descricao: 'Única loja de Curitiba 100% especializada em cachaça, com mais de 400 rótulos.',
    obs: 'O site cita "bancas 73/74". Os boxes 73 e 74 aparecem como Mercearia Sansei e Casa da Bolacha Caseira, então foi posta nas bancas 73–74 do salão; confirmar.',
  }),
  c('Casa da Bolacha Caseira', 'doces', 'casa-da-bolacha-caseira', {
    boxes: ['inf-box-74'], telefone: '(41) 99984-8383', descricao: 'Bolachas, doces caseiros e biscoitos de polvilho.', fonte: DIRETORIO,
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
    boxes: ['inf-box-429', 'inf-box-430', 'inf-box-431', 'inf-box-432'], telefone: '(41) 3264-6502 · (41) 99883-3951',
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
    boxes: ['inf-banca-84', 'inf-banca-85', 'inf-banca-86'], telefone: '(41) 3264-6560 · (41) 99618-2000', fonte: DIRETORIO, descricao: 'Há 30 anos no Mercado: folhas, frutas, verduras, legumes e cogumelos.',
  }),
  c('Yamasaki Verduras', 'hortifruti', 'yamasaki-verduras-2', {
    boxes: ['inf-banca-98', 'inf-banca-99', 'inf-banca-100'], telefone: '(41) 3264-4533 · (41) 99937-6822',
    descricao: 'Há 40 anos no hortifrúti do Mercado.',
  }),

  // ---- levantados pela lista de lojas por número de box
  c("Claudio's Mercearia", 'emporio', null, { boxes: ['inf-box-31', 'inf-box-32'], telefone: '(41) 3026-7468 · (41) 99647-4429', fonte: DIRETORIO }),
  c('Casa da Azeitona', 'emporio', null, { boxes: ['inf-box-33', 'inf-box-34', 'inf-box-35', 'inf-box-36'], telefone: '(41) 3264-1132 · (41) 99568-2026', fonte: DIRETORIO }),
  c('Empório Valência', 'emporio', null, { boxes: ['inf-box-43', 'inf-box-44'], telefone: '(41) 3262-1584 · (41) 99984-0833', fonte: DIRETORIO }),
  c('Empório Francisca', 'emporio', null, { boxes: ['inf-box-58', 'inf-box-59'], telefone: '(41) 3079-5207 · (41) 99178-8090', fonte: DIRETORIO }),
  c('Manga Rosa', 'outros', null, { boxes: ['inf-box-60'], telefone: '(41) 98477-8335', obs: 'A lista cita boxes 59 e 60; o 59 também aparece como Empório Francisca.', fonte: DIRETORIO }),
  c('Embalagens Municipal', 'servicos', 'embalagens-municipal', { boxes: ['inf-box-70', 'inf-box-71', 'inf-box-72'], descricao: 'Embalagens.' }),
  c('K & M Artesanatos', 'servicos', null, { boxes: ['inf-box-75', 'inf-box-76'], telefone: '(41) 3082-3434 · (41) 99677-0762', fonte: DIRETORIO }),
  c('Mercearia O Barracão', 'emporio', null, { boxes: ['inf-box-278', 'inf-box-279'], telefone: '(41) 3265-4426 · (41) 99580-5340', fonte: DIRETORIO }),
  c('Manfré Cervejas Especiais', 'bebidas', null, { boxes: ['inf-box-284', 'inf-box-285'], fonte: DIRETORIO }),
  c('Empório Curitibano', 'emporio', null, { boxes: ['inf-box-291', 'inf-box-292'], telefone: '(41) 3222-0477 · (41) 99703-5981', fonte: DIRETORIO }),
  c('Nissei Comércio de Alimentos', 'emporio', null, { boxes: ['inf-box-297', 'inf-box-298'], fonte: DIRETORIO }),
  c("Empório D'Gust", 'emporio', null, { boxes: ['inf-box-300', 'inf-box-302'], telefone: '(41) 3231-0569 · (41) 98890-3025', obs: 'A lista cita boxes 300 a 302; o 301 aparece como Temperamento.', fonte: DIRETORIO }),
  c('Bordando Sonhos', 'servicos', null, { boxes: ['inf-box-303', 'inf-box-305'], telefone: '(41) 99688-1790', obs: 'A lista cita boxes 303 a 305; o 304 aparece como Empório Metropolitano.', fonte: DIRETORIO }),
  c('Galisa', 'outros', null, { boxes: ['inf-box-307'], telefone: '(41) 3014-7760 · (41) 99845-9535', fonte: DIRETORIO }),
  c('Lotérica Mercado Municipal', 'servicos', null, { boxes: ['inf-box-309', 'inf-box-310'], telefone: '(41) 3014-7760', fonte: DIRETORIO }),
  c('Mercearia Sayonara', 'emporio', null, { boxes: ['inf-box-355'], telefone: '(41) 3262-2386 · (41) 98762-8681', fonte: DIRETORIO }),
  c('Puro Coco', 'outros', null, { boxes: ['inf-box-364', 'inf-box-369'], telefone: '(41) 3085-5080 · (41) 99995-0345', fonte: DIRETORIO }),
  c("Vitaly's Especiarias", 'especiarias', null, { boxes: ['inf-box-367', 'inf-box-368'], telefone: '(41) 3363-5316 · (41) 99891-8237', fonte: DIRETORIO }),
  c('Tepanya Utilidades Domésticas', 'servicos', null, { boxes: ['inf-box-376'], telefone: '(41) 3023-2099 · (41) 99975-9265', fonte: DIRETORIO }),
  c('Satine Cosméticos', 'servicos', null, { boxes: ['inf-box-377'], telefone: '(41) 3029-6250 · (41) 99118-0069', fonte: DIRETORIO }),
  c('Café do Mercado', 'lanchonete', 'cafe-do-mercado', { boxes: ['inf-box-61'], telefone: '(41) 3011-1212 · (41) 99235-3196', obs: 'Outra fonte (Foursquare) cita os boxes 437 a 439.', fonte: DIRETORIO }),
  c('Grander & Shiomi (restaurante)', 'lanchonete', null, {
    boxes: ['inf-box-445', 'inf-box-446'],
    fonte: 'Decreto municipal nº 327/2019 (transferência de permissão de uso)',
    obs: 'Razão social da permissionária; nome fantasia não identificado.',
  }),
  c("The Bootlegger's Box", 'bebidas', null, { boxes: ['inf-box-447', 'inf-box-448'], telefone: '(41) 99184-8362 · (41) 99184-9277', fonte: DIRETORIO }),
  c('Banca do Zé Mario', 'hortifruti', 'banca-do-ze-mario', { boxes: ['inf-banca-49', 'inf-banca-62'], telefone: '(41) 99901-2347', fonte: DIRETORIO }),
  c('Empório 56', 'emporio', 'emporio-56-2', { boxes: ['inf-banca-56', 'inf-banca-57'], telefone: '(41) 99861-3398', fonte: DIRETORIO }),
  c('Merca Fruty – Produtos Congelados', 'emporio', null, { boxes: ['inf-banca-14'], telefone: '(41) 3076-7121', fonte: DIRETORIO }),

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

  c('Kotobuki Artesanato e Presentes', 'servicos', null, { boxes: ['sup-box-313', 'sup-box-333'], telefone: '(41) 3362-4973 · (41) 99975-9265', fonte: DIRETORIO }),
  c('Artigos Orientais', 'servicos', null, { boxes: ['sup-box-322', 'sup-box-323'], telefone: '(41) 3264-7914 · (41) 99975-9265', fonte: DIRETORIO }),
  c('Mina de Ouro Presentes', 'servicos', null, { boxes: ['sup-box-324'], telefone: '(41) 3362-9357', fonte: DIRETORIO }),
  c("Rafa's Ateliê de Costura", 'servicos', null, { boxes: ['sup-box-326'], telefone: '(41) 3013-0960 · (41) 99102-0201', fonte: DIRETORIO }),
  c('Vitornis Chapelaria', 'servicos', null, { boxes: ['sup-box-332'], telefone: '(41) 99659-0035', fonte: DIRETORIO }),
  c('Relojoaria Dajuki', 'servicos', null, { boxes: ['sup-box-340'], telefone: '(41) 99870-3865', fonte: DIRETORIO }),
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
  c('Dahra Pedras Brasileiras', 'servicos', null, { boxesForaDaPlanta: ['190'], telefone: '(41) 99652-5910', fonte: DIRETORIO }),
  c('Moncloa Bank', 'servicos', null, {
    boxesForaDaPlanta: ['11–12'], telefone: '(41) 98731-0990 · (41) 3347-7234', fonte: DIRETORIO,
    obs: 'Os boxes 11 e 12 do térreo aparecem como Peixaria Santa Clara e Celeiro Municipal; pode ser outro setor.',
  }),
  c('4 Estações', 'outros', null, {
    boxesForaDaPlanta: ['Bloco 02 – lojas 25, 26, 27, 45, 46'], telefone: '(41) 3346-4635',
    obs: '"Bloco 02" não corresponde à numeração das plantas; os boxes 25–26 do salão são da Sissi.', fonte: DIRETORIO,
  }),
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
  c('Empório Top Mix', 'doces', 'emporio-top-mix', { descricao: 'Desde 2011: geleias, azeites, frutas secas, patês, azeitonas e doces.' }),
  c('A Faca e o Queijo', 'emporio', 'mercearia-imperial', { descricao: 'Mais de 200 queijos, bacalhau, azeitonas, azeites, castanhas e nozes.' }),
  c('Mafo Com. de Alimentos', 'emporio', 'mafo-com-de-alimentos'),
  c('Lá de Minas', 'emporio', 'la-de-minas', { descricao: 'Produtos de Minas Gerais: cachaças, doces, queijos e artesanato.' }),
  c('Banca do Mário', 'hortifruti', 'banca-do-mario'),
  c('Banca do Hiro', 'hortifruti', 'banca-do-hiro', { telefone: '(41) 99944-4334' }),
  c('Oliveiras Hortifruti', 'hortifruti', 'oliveiras-hortifruti'),
  c('Dinho Wine and Spirits', 'bebidas', 'dinho-wine-and-spirits', { telefone: '(41) 98783-5900' }),
  c('Adega Brasil', 'bebidas', 'adega-brasil', { obs: 'Uma fonte cita endereço na Rua da Paz, 643, ao lado do Mercado.' }),
  c('Restaurante Takê', 'lanchonete', 'restaurante-take', { descricao: 'Comida japonesa por quilo.' }),
  c('Café do Jorge e da Aurea', 'lanchonete', 'cafe-do-jorge-e-da-aurea'),
  c('Confeitaria Colônia Cecília', 'doces', 'confeitaria-colonia-cecilia', { descricao: 'Desde 2003, na entrada pela Av. Sete de Setembro. Café colonial aos domingos.' }),
  c("Nico's Empório Orgânico", 'organicos', 'nicos-emporio-organico'),
  c('Espaço Orgânico', 'organicos', 'espaco-organico'),
  c('Organique Essentiel', 'organicos', 'organique-essentiel'),
  c('Cativa Natureza', 'organicos', 'cativa-natureza', { telefone: '(41) 99281-1275', descricao: 'Cosméticos com insumos orgânicos rastreados, desde 2008.' }),
  c('Couve & Flor', 'organicos', 'couve-flor'),
  c('Rei do Kão', 'pet', 'rei-do-kao', { telefone: '(41) 3262-7136', descricao: 'Único pet shop do Mercado.' }),
];
