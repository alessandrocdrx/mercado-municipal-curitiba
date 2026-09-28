// Comerciantes do Mercado Municipal de Curitiba e seus boxes.
//
// Fonte principal: lista "Lojas no Mercado Municipal Curitiba" de
// curitiba.mercadomodelo.com.br/lojas-no-mercado-municipal-curitiba/
// (texto colado pelo autor em 27/09/2026). Descrições e links vêm das páginas
// de comerciantes do site oficial (mercadomunicipaldecuritiba.com.br), lidas
// via busca. `fonte` só aparece quando o dado veio de outro lugar.
// Na lista, "Banca N" e "Box Banca N" = bancas do salão central; "Box N" =
// boxes das paredes e do anexo.
//
// Pavimento: números 01–19 existem nos dois andares. Restaurantes e
// lanchonetes desses números foram postos na área rosa do pavimento superior
// (praça de alimentação); os demais no inferior. Ver `obs` de cada um.
// ⚠ Confirme no local: comerciantes mudam de box, e alguns números divergem
// entre fontes (ver `obs`).
//
// boxes: ids dos módulos gerados pela planta (inf-box-XX, inf-banca-XX, sup-box-XXX)
// boxesForaDaPlanta: número informado pela fonte, mas que não aparece nas plantas
//
// Tour 3D oficial (Matterport): as coordenadas dos marcadores de cada loja foram
// ajustadas à planta pelos ~70 comerciantes que as duas fontes têm em comum
// (desvio típico de 1–3 m). Onde divergiam, vale o tour 3D, que é mais recente;
// a lista antiga fica em `obs`.

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

const LISTA = 'lista de lojas do Mercado Municipal (curitiba.mercadomodelo.com.br)';
// Tour 3D oficial (my.matterport.com/show/?m=tgwA2xoKA2y), marcadores lidos em
// 28/09/2026. Usado como referência de nomes e posições; nenhuma imagem dele
// entra no projeto.
const TOUR3D = 'tour 3D oficial do Mercado (Matterport, set/2026)';
const c = (nome, categoria, slug, extra = {}) => ({ nome, categoria, url: slug ? OFICIAL + slug + '/' : undefined, boxes: [], fonte: LISTA, ...extra });
const pad = (n) => String(n).padStart(2, '0');
const ib = (...n) => n.map((x) => `inf-box-${typeof x === 'number' ? pad(x) : x}`);
const ibn = (...n) => n.map((x) => `inf-banca-${pad(x)}`);
const sb = (...n) => n.map((x) => `sup-box-${typeof x === 'number' ? pad(x) : x}`);
const sbn = (...n) => n.map((x) => `sup-banca-${x}`);

export const COMERCIANTES = [
  // ======================= pavimento inferior · boxes das paredes (02–80)
  c('Casa de Carnes Pé de Boi', 'acougue', 'casa-de-carnes-pe-de-boi', { boxes: ib(2, 3), telefone: '(41) 3264-4890 · (41) 99642-9398', descricao: 'Carnes bovina, suína e de aves, carnes exóticas e ingredientes para feijoada, desde 1963.' }),
  c('DAP Boutique de Carnes', 'acougue', 'dap-boutique-de-carnes', { boxes: ib(4, 5), telefone: '(41) 3264-4163 · (41) 99642-9398', descricao: 'Carnes exóticas: cordeiro, coelho, pato, jacaré, rã, codorna.' }),
  c('Espaço Angus Prime', 'acougue', 'espaco-angus-prime', { boxes: ib(6, 7), telefone: '(41) 3264-4163 · (41) 99642-9398', horario: 'Ter a Sáb 8h–18h · Dom 8h–13h', descricao: 'Boutique de carnes 100% Angus e carnes exóticas.' }),
  c('Peixaria Keli Mozer', 'peixaria', 'peixaria-keli-mozer', { boxes: ib(10), telefone: '(41) 3264-1523 · (41) 99566-7702', descricao: 'Pescados e frutos do mar, com estrutura totalmente reformada.' }),
  c('Peixaria Santa Clara', 'peixaria', 'peixaria-santa-clara-eireli', { boxes: ib(11), telefone: '(41) 3264-4014 · (41) 99979-0212', descricao: 'Desde 1970: peixes frescos, filés, postas, camarão, lagosta, lagostins e crustáceos importados.' }),
  c('Celeiro Municipal', 'emporio', 'celeiro-municipal', { boxes: ib(12, 13), telefone: '(41) 3013-6132', descricao: 'Queijos, vinhos, destilados, castanhas, frutas secas e bacalhau.', obs: 'A lista não traz o número do box; boxes 12–13 vêm de guia público.', fonte: 'guia público (applocal)' }),
  c('Adega Municipal', 'bebidas', 'adega-municipal', { boxes: ib(15), telefone: '(41) 3039-1984 · (41) 3039-2776 · (41) 98870-1977', descricao: 'Vinhos, espumantes, whisky, conhaque, licores e tabacaria.', obs: 'A lista informa "Box 15B"; o tour 3D oficial mostra a loja ao lado do Celeiro Municipal. Um guia antigo citava os boxes 267 a 271 do anexo.', fonte: TOUR3D }),
  c('Planeta Aquários', 'pet', 'planeta-aquarios', { boxes: ib(16, 17, 18), telefone: '(41) 3363-4519 · (41) 99996-1419', descricao: 'Aquários e peixes ornamentais de água doce e salgada.', obs: 'A lista cita o box 17; no tour 3D a loja ocupa os boxes vizinhos.' }),
  c('Peixaria São José', 'peixaria', 'peixaria-sao-jose', { boxes: ib(21, 22), telefone: '(41) 3264-1462 · (41) 99870-8373', descricao: 'Lagosta, lagostim, polvo, lula, mariscos e peixes variados. Faz entregas.' }),
  c('Cia. do Tempero', 'especiarias', 'cia-do-tempero', { boxes: ib(23, 24), telefone: '(41) 3363-1527 · (41) 98870-1977', descricao: 'Temperos e castanhas.' }),
  c('Cereais e Especiarias Sissi', 'especiarias', 'cereais-e-especiarias-sissi', { boxes: ib(25, 26), telefone: '(41) 3264-5271 · (41) 99923-2668', descricao: 'Azeites, especiarias e conservas nacionais e importados.' }),
  c('Armazém da Zelma', 'especiarias', 'armazem-da-zelma', { boxes: ib(28, 29, 30), obs: 'A lista cita só o Box 28; o site oficial e o Foursquare citam 28 a 30.', telefone: '(41) 3264-4064 · (41) 99215-5400', descricao: 'No Mercado desde 1º de novembro de 1960: azeites, bacalhau, castanhas, frutas secas, especiarias, conservas e cereais.' }),
  c("Claudio's Mercearia", 'emporio', null, { boxes: ib(31, 32), telefone: '(41) 3026-7468 · (41) 99647-4429' }),
  c('Casa da Azeitona', 'emporio', null, { boxes: ib(33), telefone: '(41) 3264-1132 · (41) 99568-2026' }),
  c('Mercearia MMM', 'emporio', null, { boxes: ib(37, 38), telefone: '(41) 3264-2721 · (41) 99102-2044' }),
  c('Box 41 – Vinhos', 'bebidas', 'box-41-vinhos', { boxes: ib(39, 40, 41, 42), telefone: '(41) 3264-4343 · (41) 99705-4697', descricao: 'Especialista em vinhos, com mais de 1.100 rótulos.', obs: 'A lista informa "Box 40"; guias públicos citam os boxes 39 a 42.' }),
  c('Empório Valência', 'emporio', null, { boxes: ib(43), telefone: '(41) 3262-1584 · (41) 99984-0833', obs: 'A lista cita boxes 43 e 44; o 44 não aparece na planta (canto noroeste).' }),
  c('Armazém Becker', 'especiarias', 'armazem-becker', { boxes: ib(47, 48), telefone: '(41) 3263-4565 · (41) 99215-5300', descricao: 'Há 32 anos: frutas secas, cereais, farinhas e especiarias.' }),
  c('Impactto', 'servicos', null, { boxes: ib(53), telefone: '(41) 3013-0960 · (41) 99102-0201' }),
  c('Conversic', 'doces', 'conversic', { boxes: ib(54, 55), telefone: '(41) 3022-0802 · (41) 99976-3741', descricao: 'Há mais de 30 anos com produtos portugueses.' }),
  c('Bon Vivant', 'emporio', 'bon-vivant', { boxes: ib(56, 57), telefone: '(41) 3013-7753 · (41) 99673-7753', descricao: 'Mais de 300 queijos nacionais e importados e embutidos artesanais.' }),
  c('Empório Francisca', 'emporio', null, { boxes: ib(58, 59), telefone: '(41) 3079-5207 · (41) 99178-8090' }),
  c('Cafe do Mercado Co.', 'lanchonete', 'cafe-do-mercado-co', { boxes: ib(61), telefone: '(41) 3011-1212 · (41) 99235-3196' }),
  c('Empório Barion', 'emporio', 'emporio-barion', { boxes: ib(63, 64), telefone: '(41) 3019-5909', descricao: 'Ingredientes diferenciados, queijos nacionais e importados, tábuas de frios e cestas de café.' }),
  c('Empório do Sabor', 'especiarias', 'emporio-do-sabor', { boxes: ib(66, 67), telefone: '(41) 3264-1543 · (41) 99671-5483', descricao: 'Há 17 anos: especiarias, condimentos, cereais, conservas, frutas secas e importados.' }),
  c('Empório Bon Appétit', 'emporio', 'emporio-bon-appetit', { boxes: ib(68, 69), telefone: '(41) 3363-5750', descricao: 'Frios, queijos, azeitonas, bacalhau, azeites, massas e frutas secas.' }),
  c('Embalagens Municipal', 'servicos', 'embalagens-municipal', { boxes: ib(71, 72), telefone: '(41) 3263-3337 · (41) 98403-2118', descricao: 'Embalagens.' }),
  c('Mercearia Sansei', 'emporio', 'mercearia-sansei', { boxes: ib(73), telefone: '(41) 3264-1673 · (41) 99668-8860', descricao: 'Produtos da culinária oriental, doces típicos, bebidas e utensílios.' }),
  c('Casa da Bolacha Caseira', 'doces', 'casa-da-bolacha-caseira', { boxes: ib(74), telefone: '(41) 99984-8383', descricao: 'Bolachas, doces caseiros e biscoitos de polvilho.' }),
  c('K & M Artesanatos', 'servicos', null, { boxes: ib(75, 76), telefone: '(41) 3082-3434 · (41) 99677-0762' }),
  c('Flora Cristiane', 'flores', 'flora-cristiane', { boxes: ib(77, 78, 79, 80), obs: 'A lista cita o Box 78; o site oficial cita 77, 79 e 80.', telefone: '(41) 3264-5324 · (41) 98871-0868', descricao: 'Floricultura fundada em 5 de agosto de 1966: árvores frutíferas e ornamentais, sementes e plantas.' }),

  // ======================= pavimento inferior · anexo (266–310)
  c('Bonsai Mercearia', 'emporio', null, { boxes: ib(266), telefone: '(41) 3264-9166 · (41) 3030-1673' }),
  c('Adega Brasil', 'bebidas', 'adega-brasil', { boxes: ib(268), telefone: '(41) 3264-4232 · (41) 98901-7114' }),
  c('Darumayá', 'emporio', null, { boxes: ib(272, 273), telefone: '(41) 3264-7496 · (41) 3262-1712' }),
  c('Tepanya – Utilidades Domésticas', 'servicos', null, { boxes: ib(275, 376), telefone: '(41) 3023-2099 · (41) 99975-9265' }),
  c('Empório Gourmet (Casabianco)', 'emporio', 'emporio-gourmet', { boxes: ib(277), telefone: '(41) 3335-4689 · (41) 9984-9896', obs: 'A lista cita os boxes 276 e 277; no tour 3D o 276 aparece como Queijos e Vinhos.' }),
  c('Queijos e Vinhos', 'bebidas', null, { boxes: ib(276), telefone: '(41) 3264-9982 · (41) 99976-5650', fonte: TOUR3D }),
  c('Mercearia O Barracão', 'emporio', null, { boxes: ib(278, 279), telefone: '(41) 3265-4426 · (41) 99580-5340' }),
  c('Mercearia Shizen', 'emporio', null, { boxes: ib(280), telefone: '(41) 3362-9165 · (41) 99196-5622' }),
  c('Casa Nobre Especiarias', 'especiarias', null, { boxes: ib(281, 283), telefone: '(41) 3262-5064 · (41) 99571-0735', obs: 'Na lista aparece como Casa Gourmet (mesmo celular).', fonte: TOUR3D }),
  c('Manfré Cervejas Especiais', 'bebidas', null, { boxes: ib(284, 285), telefone: '(41) 3053-8324 · (41) 99184-9277' }),
  c('Organique Essentiel', 'organicos', 'organique-essentiel', { boxes: ib(286), telefone: '(41) 3363-0040 · (41) 99203-6337', obs: 'A lista cita boxes 286 e 289; o 289 também aparece como Armazém da Serra.' }),
  c('Armazém da Serra', 'especiarias', null, { boxes: ib(288, 289), telefone: '(41) 3264-8769' }),
  c('Empório Curitibano', 'emporio', null, { boxes: ib(291, 292), telefone: '(41) 3222-0477 · (41) 99703-5981' }),
  c('Lá de Minas', 'emporio', 'la-de-minas', { boxes: ib(293, 294), telefone: '(41) 3262-9911', descricao: 'Produtos de Minas Gerais: cachaças, doces, queijos e artesanato.' }),
  c("D'Fuhrmann Chocolates", 'doces', 'dfuhrmann-chocolates', { boxes: ib(295, 296), telefone: '(41) 3154-5999 · (41) 99677-8821', descricao: 'Chocolates de tradição alemã feitos em Curitiba.' }),
  c('Nissei Comércio de Alimentos', 'emporio', null, { boxes: ib(297, 298), telefone: '(41) 3322-0822 · (41) 99787-3590' }),
  c('Temperamento', 'especiarias', 'temperamento', { boxes: ib(299, 301), telefone: '(41) 3030-2728 · (41) 99827-1827', descricao: 'Especiarias, molhos, azeites, pimentas, sais e utensílios culinários.' }),
  c("Empório D'Gust", 'emporio', null, { boxes: ib(300, 302), telefone: '(41) 3231-0569 · (41) 98890-3025', obs: 'A lista cita boxes 300 a 302; o 301 é da Temperamento.' }),
  c('Bordando Sonhos', 'servicos', null, { boxes: ib(303, 305), telefone: '(41) 99688-1790', obs: 'A lista cita boxes 303, 304 e 305; o 304 também aparece como Empório Metropolitano.' }),
  c('Empório Metropolitano', 'emporio', 'emporio-metropolitano', { boxes: ib(304, 306), telefone: '(41) 3239-2762', descricao: 'Espaço de apoio a pequenos produtores artesanais, manuais e semi-industriais.' }),
  c('Galisa Lotérica', 'servicos', null, { boxes: ib(307), telefone: '(41) 3014-7760 · (41) 99845-9535' }),
  c('Empório Manfré', 'bebidas', null, { boxes: ib(308), telefone: '(41) 3053-8323 · (41) 99184-9277' }),
  c('Abranches Lotérica', 'servicos', null, { boxes: ib(309, 310), telefone: '(41) 3014-7760 · (41) 99975-9265', obs: 'Na lista aparece como Lotérica Mercado Municipal (mesmo telefone).', fonte: TOUR3D }),

  // ======================= pavimento inferior · blocos 354–378
  c('Mercearia Imperial (A Faca e o Queijo)', 'emporio', 'mercearia-imperial', { boxes: ib(354), telefone: '(41) 3077-3467', descricao: 'Mais de 200 queijos, bacalhau, azeitonas, azeites, castanhas e nozes.' }),
  c('Mercearia Sayonara', 'emporio', null, { boxes: ib(355), telefone: '(41) 3262-2386 · (41) 98762-8681' }),
  c('Box do Palmito', 'emporio', 'box-do-palmito', { boxes: ib(357, 362), telefone: '(41) 3152-1485 · (41) 99901-1161' }),
  c('Box do Ademir', 'hortifruti', 'box-do-ademir', { boxes: ib(358), telefone: '(41) 3262-9414 · (41) 99528-7690' }),
  c('Empório Top Mix', 'doces', 'emporio-top-mix', { boxes: ib(360), telefone: '(41) 3010-2544 · (41) 99950-5456', descricao: 'Desde 2011: geleias, azeites, frutas secas, patês, azeitonas e doces.' }),
  c('Puro Coco', 'outros', null, { boxes: ib(364, 369), telefone: '(41) 3085-5080 · (41) 99995-0345' }),
  c('Adega Curitibana', 'bebidas', null, { boxes: ib(366, 371), telefone: '(41) 3010-7545 · (41) 99133-7545' }),
  c("Vitaly's Especiarias", 'especiarias', null, { boxes: ib(367, 368), telefone: '(41) 3363-5316 · (41) 99891-8237' }),
  c('ICAB Chocolates', 'doces', 'icab-chocolates', { boxes: ib(370), telefone: '(41) 3049-0136', descricao: 'Fundada em 1930: chocolates, biscoitos e bombons.' }),
  c('Rei do Kão', 'pet', 'rei-do-kao', { boxes: ib(373), telefone: '(41) 3262-7136 · (41) 98422-2464', descricao: 'Único pet shop do Mercado.' }),
  c('Satine Cosméticos', 'servicos', null, { boxes: ib(377), telefone: '(41) 3029-6250 · (41) 99118-0069' }),
  c('Kalloria Zero', 'emporio', null, { boxes: ib(378), telefone: '(41) 3262-8564 · (41) 99191-4882' }),

  // ======================= pavimento inferior · corredor sul (429–458)
  c('Furuta Cereais', 'especiarias', 'furuta-cereais', { boxes: ib(429, 430, 431, 432), telefone: '(41) 3264-6502 · (41) 99883-3951' }),
  c('Daimaru Bebidas', 'bebidas', 'daimaru-bebidas', { boxes: ib(433, 434), telefone: '(41) 3363-8275', descricao: 'Cachaças, vinhos nacionais e importados, licores, xaropes e destilados.' }),
  c('Box Verde', 'emporio', null, { boxes: ib(435, 436), telefone: '(41) 3362-3955 · (41) 99911-6539' }),
  c('Café do Mercado', 'lanchonete', 'cafe-do-mercado', { boxes: ib(438, 439), telefone: '(41) 3011-1212 · (41) 99235-3196' }),
  c('Grander & Shiomi (restaurante)', 'lanchonete', null, { boxes: ib(445, 446), fonte: 'Decreto municipal nº 327/2019 (transferência de permissão de uso)', obs: 'Razão social da permissionária; nome fantasia não identificado.' }),
  c("The Bootlegger's", 'bebidas', null, { boxes: ib(447, 448), telefone: '(41) 99184-8362 · (41) 99184-9277' }),
  c('Revistaria Municipal', 'servicos', null, { boxes: ib(450, 451), telefone: '(41) 3023-7880 · (41) 99755-5243' }),
  c('Farmácia do Mercado – Nellyfarma', 'servicos', null, { boxes: ib(452, 453), telefone: '(41) 3363-2478 · (41) 99139-3770' }),
  c('Empório Kaveh Kanes', 'emporio', 'emporio-kaveh-kanes', { boxes: ib(456, 457), telefone: '(41) 3039-1049' }),

  // ======================= pavimento inferior · bancas do salão central
  c('Agro Comercial Paraná', 'hortifruti', null, { boxes: ibn(1, 13), telefone: '(41) 99944-4334' }),
  c('Tenda Árabe', 'emporio', null, { boxes: ibn(2, 3), telefone: '(41) 3016-0910 · (41) 99911-6842' }),
  c('Banca do Mário', 'hortifruti', 'banca-do-mario', { boxes: ibn(9, 10), telefone: '(41) 3264-2721 · (41) 99102-2044', obs: 'A lista diz "Box 09 e 10"; como o Box 10 é da Peixaria Keli Mozer, foi posta nas bancas 09–10.' }),
  c('Moncloa', 'emporio', null, { boxes: ibn(11, 12), telefone: '(41) 98731-0990 · (41) 3347-7234' }),
  c('Merca Fruty – Produtos Congelados', 'emporio', null, { boxes: ibn(14), telefone: '(41) 3076-7121' }),
  c('Cereais Mistura Fina', 'especiarias', 'cereais-mistura-fina', { boxes: ibn(17), telefone: '(41) 3362-6150 · (41) 99880-9647', descricao: 'Frutas desidratadas, castanhas torradas, cereais, conservas e especiarias.' }),
  c('Banca Tutumi', 'hortifruti', null, { boxes: ibn(22, 30), telefone: '(41) 3264-4274 · (41) 99279-0911', obs: 'A lista diz "Box 22 e 30"; foi posta nas bancas 22 e 30 do salão.' }),
  c('Decaésse Acessórios', 'servicos', null, { boxes: ibn(25) }),
  c('Banca da Helena', 'hortifruti', null, { boxes: ibn(32), telefone: '(41) 3262-7266' }),
  c('Mafo Com. de Alimentos', 'emporio', 'mafo-com-de-alimentos', { boxes: ibn(37) }),
  c('Banca do Demétrio', 'hortifruti', null, { boxes: ibn(41), telefone: '(41) 3352-0601' }),
  c('Banca da Júlia', 'hortifruti', 'banca-da-julia', { boxes: ibn(43, 44), telefone: '(41) 3262-7266 · (41) 99926-1538', descricao: 'Frutas e verduras nacionais e importadas, sem agrotóxicos, com entrega.', obs: 'A lista diz "Box 43 e 44", números dos boxes do Empório Valência; foi posta nas bancas 43–44.' }),
  c('Banca do Fernando', 'hortifruti', null, { boxes: ibn(47), telefone: '(41) 98754-7070 · (41) 98811-7070' }),
  c('Banca do Zé Mario', 'hortifruti', 'banca-do-ze-mario', { boxes: ibn(49), telefone: '(41) 99901-2347', obs: 'A lista cita as bancas 49 e 62; a 62 também aparece como Yueqing Chen.' }),
  c('Urbano 52 CWB', 'hortifruti', 'urbano-52-cwb', { boxes: ibn(52), telefone: '(41) 99654-6053', descricao: 'Frutas e verduras.' }),
  c('Banca da Maria', 'hortifruti', 'banca-da-maria', { boxes: ibn(53), telefone: '(41) 99989-1674', descricao: 'Há 10 anos no hortifrúti do Mercado.' }),
  c('Empório 56', 'emporio', 'emporio-56-2', { boxes: ibn(56, 57), telefone: '(41) 99861-3398' }),
  c('Manga Rosa', 'hortifruti', null, { boxes: ibn(59, 60), telefone: '(41) 98477-8335' }),
  c('Viver Mais', 'emporio', null, { boxes: ibn(61), telefone: '(41) 3276-8525 · (41) 98802-7159' }),
  c('Yueqing Chen', 'emporio', null, { boxes: ibn(62) }),
  c('Banca 63 Produtos Coloniais', 'emporio', 'banca-63-produtos-coloniais', { boxes: ibn(63), telefone: '(41) 98476-5236', descricao: 'Produtos coloniais: conservas, queijos, salames, doces.' }),
  c('Banca da Cirlei', 'hortifruti', null, { boxes: ibn(64, 71), telefone: '(41) 3262-6757' }),
  c('Banca da Leonilda', 'hortifruti', null, { boxes: ibn(65), telefone: '(41) 98867-9897' }),
  c('Osvaldo Cereais', 'especiarias', null, { boxes: ibn(68, 69, 70), obs: 'A lista cita a banca 68; outro guia cita 68 a 70.', telefone: '(41) 3264-5271 · (41) 99923-2668' }),
  c('Vô Milano Cachaçaria', 'bebidas', 'vo-milano-cachacaria', { boxes: ibn(73, 74), telefone: '(41) 99228-2527', descricao: 'Única loja de Curitiba 100% especializada em cachaça, com mais de 400 rótulos.' }),
  c('Fitz', 'hortifruti', null, { boxes: ibn(76, 77, 78), telefone: '(41) 99654-6053' }),
  c('Mel Zum (Mimila)', 'emporio', null, { boxes: ibn(79, 90), telefone: '(41) 3015-0255' }),
  c('Banca do Nei', 'hortifruti', null, { boxes: ibn(83), telefone: '(41) 3262-2678' }),
  c('SN Frutas e Verduras', 'hortifruti', 'sn-frutas-e-verduras', { boxes: ibn(84, 85, 86), telefone: '(41) 3264-6560 · (41) 99618-2000', descricao: 'Há 30 anos no Mercado: folhas, frutas, verduras, legumes e cogumelos.' }),
  c('Empório Nossa Banca', 'doces', null, { boxes: ibn(87, 88), telefone: '(41) 99700-4977' }),
  c('Emporium Nattuvida', 'emporio', null, { boxes: ibn(91, 92), telefone: '(41) 99187-8481' }),
  c('Banca da Isabel', 'hortifruti', null, { boxes: ibn(94), telefone: '(41) 98803-3416' }),
  c('Yamasaki Verduras', 'hortifruti', 'yamasaki-verduras-2', { boxes: ibn(98, 99, 100), telefone: '(41) 3264-4533', descricao: 'Há 40 anos no hortifrúti do Mercado.' }),
  c('Une Toyoda', 'emporio', null, { boxes: ibn(101, 102), obs: 'A lista cita a banca 101; outro guia cita 101 e 102.', telefone: '(41) 3019-5293 · (41) 99245-0122' }),

  // ======================= pavimento superior · setor 300 e praça de alimentação
  c('Le Caffés Especiais', 'lanchonete', null, { boxes: sb(311), telefone: '(41) 99925-5508' }),
  c('Kotobuki Artesanato e Presentes', 'servicos', null, { boxes: sb(313, 333), telefone: '(41) 3362-4973 · (41) 99975-9265' }),
  c('Vetsan Express', 'pet', null, { boxes: sb(314), telefone: '(41) 98819-9892' }),
  c('Ki Bolada Loteria', 'servicos', null, { boxes: sb(320, 321), telefone: '(41) 3263-2841' }),
  c('Artigos Orientais', 'servicos', null, { boxes: sb(322, 323), telefone: '(41) 3264-7914 · (41) 99975-9265' }),
  c('Loja de Presentes Mina de Ouro', 'servicos', null, { boxes: sb(324), telefone: '(41) 3362-9357' }),
  c("Rafa's – Ateliê de Costura", 'servicos', null, { boxes: sb(325, 326), telefone: '(41) 3013-0960 · (41) 99102-0201' }),
  c('Sapataria Rápida Capricho', 'servicos', null, { boxes: sb(327), telefone: '(41) 3026-7082 · (41) 99591-5098' }),
  c('Salão de Cabeleireiro Unissex – Eurides', 'servicos', null, { boxes: sb(329), telefone: '(41) 99936-3253' }),
  c('Vitornis Chapelaria', 'servicos', null, { boxes: sb(332), telefone: '(41) 3013-0960 · (41) 99659-0035' }),
  c('Relojoaria Dajuki', 'servicos', null, { boxes: sb(340), telefone: '(41) 99870-3865' }),
  c("Box's Celulares", 'servicos', 'boxs-celulares-ltda', { boxes: sb(341), descricao: 'Assistência técnica de celulares e acessórios, desde 2005.', fonte: 'guia público (applocal)' }),
  c('Quadrolândia', 'servicos', null, { boxes: sb(343), telefone: '(41) 99948-2823' }),
  c('Calçados Vila Rica', 'servicos', null, { boxes: sb(345), telefone: '(41) 3262-5828' }),
  c('Bazar Cotegipe', 'servicos', null, { boxes: sb(348), telefone: '(41) 3262-5011 · (41) 99592-8110' }),
  c('Nippon Boutique', 'servicos', 'nippon-boutique', { boxes: sb(352, 353), telefone: '(41) 3263-4615 · (41) 99979-1685', descricao: 'Desde 1977: revistas e livros japoneses e ofurôs.' }),
  c('Okashi Sweets & Teas', 'doces', null, { boxes: sb(375), telefone: '(41) 3254-7738' }),
  c('Box do Eliseu', 'lanchonete', 'box-do-eliseu', { boxes: sb(12, 13), descricao: 'Há 39 anos no Mercado: comida caseira, pastéis, sanduíches, sucos e café. Famoso pela almôndega de carne.', obs: 'Boxes 12–13 do pavimento inferior são do Celeiro Municipal; o Eliseu foi posto na praça de alimentação.', fonte: 'site oficial (via busca)' }),
  c('Restaurante Anarco', 'lanchonete', 'restaurante-anarco', { boxes: sb('anarco'), telefone: '(41) 3029-6154', descricao: 'Cozinha italiana, fundado em 1991.', obs: 'No tour 3D oficial fica no mezanino das praças de alimentação Déa / 7 de Setembro, área que a planta afixada não desenha.', fonte: TOUR3D }),
  c('Restaurante Box Curitiba', 'lanchonete', 'restaurante-box-curitiba', { boxes: sb(10), telefone: '(41) 3015-8240', descricao: 'Massas, risotos e saladas.', obs: 'Posição do tour 3D oficial (antes assumida no box 19).', fonte: TOUR3D }),

  // ======================= pavimento superior · setor de orgânicos (501–522)
  c("Nico's Empório Orgânico", 'organicos', 'nicos-emporio-organico', { boxes: sbn(501) }),
  c('Ceccon Produtos Orgânicos', 'organicos', null, { boxes: sbn(505, 507), telefone: '(41) 3362-9044 · (41) 99619-4397' }),
  c('Banca do Kobe', 'organicos', null, { boxes: sbn(506), telefone: '(41) 99846-2846' }),
  c('Espaço Orgânico', 'organicos', 'espaco-organico', { boxes: sbn(508), telefone: '(41) 3088-1403 · (41) 98405-3506' }),
  c('Couve & Flor', 'organicos', 'couve-flor', { boxes: sbn(509, 510), telefone: '(41) 99915-8062 · (41) 3227-4612' }),
  c('Sírius Orgânicos', 'organicos', null, { boxes: sbn(511, 512), telefone: '(41) 99134-4400' }),
  c('Botané Sustentável', 'organicos', null, { boxes: sb(513), telefone: '(41) 3262-0610 · (41) 99126-3383' }),
  c('Cativa Natureza', 'organicos', 'cativa-natureza', { boxes: sb(514, 515), telefone: '(41) 3363-0905 · (41) 99281-1275', descricao: 'Cosméticos com insumos orgânicos rastreados, desde 2008.' }),
  c("Nico's Café Orgânico", 'organicos', null, { boxes: sb(516), telefone: '(41) 99573-3365' }),
  c('Arte Verde Comida Orgânica', 'organicos', null, { boxes: sb(517), telefone: '(41) 3363-5606' }),
  c('Natural Market', 'organicos', null, { boxes: sb(519), telefone: '(41) 3262-2222 · (41) 99987-6186' }),
  c("Taurino's Organic", 'organicos', 'taurinos-organic', { boxes: sb(521, 522), telefone: '(41) 3095-0123 · (41) 98851-9391', descricao: 'Primeiro açougue orgânico certificado do Brasil, no setor de orgânicos desde 2009.' }),

  // ======================= número fora das plantas
  c('Banca do Adonis', 'hortifruti', null, { boxes: ibn(28, 29), telefone: '(41) 99681-3996 · (41) 99918-6927', obs: 'A lista informa as bancas 127 e 224; o tour 3D mostra a banca nos boxes 28 e 29 do salão (falar com Thiago ou Karine).', fonte: TOUR3D }),
  c('Banca do Adalto', 'hortifruti', 'banca-do-adalto', { boxes: ib(363), telefone: '(41) 3362-7698 · (41) 97400-1534', obs: 'A lista informa 111 e 113; posição do tour 3D ("Box do Adalto").', fonte: TOUR3D }),
  // hall da entrada Sete de Setembro: número da lista, posição do tour 3D
  c('Célio Dobrucki (Dobrucki Vintage)', 'servicos', null, { boxes: ib(188), telefone: '(41) 99912-7206', fonte: TOUR3D }),
  c("Miranda's Mercearia", 'emporio', 'mirandas-mercearia', { boxes: ib(189), telefone: '(41) 99700-4977', descricao: 'Produtos paranaenses: chocolates artesanais, doces e cafés.', fonte: TOUR3D }),
  c('Dahra Pedras Brasileiras', 'servicos', null, { boxes: ib(190), telefone: '(41) 99652-5910', fonte: TOUR3D }),
  c('Da Mamma Massas', 'emporio', null, { boxes: ib(192), telefone: '(41) 3262-2768 · (41) 99197-7977', fonte: TOUR3D }),
  c('Casa de Massas Leve Pronto', 'emporio', null, { boxes: ib(193), telefone: '(41) 3264-4990 · (41) 99209-7079', fonte: TOUR3D }),
  c('Maia Box Sanduicheria', 'lanchonete', 'maia-box-sanduicheria', { boxes: sb(201), telefone: '(41) 3362-9065', descricao: 'Desde 2000, famosa pelo sanduíche de mortadela.', obs: 'A lista informa o box 194; o tour 3D mostra o box 201, na galeria de restaurantes do pavimento superior sobre a Rua General Carneiro (fora da planta afixada).', fonte: TOUR3D }),
  c('Confeitaria Colônia Cecília', 'doces', 'confeitaria-colonia-cecilia', { boxes: ib(195), telefone: '(41) 3030-3076', descricao: 'Desde 2003. Café colonial aos domingos.', fonte: TOUR3D }),
  c('Restaurante Ohana', 'lanchonete', null, { boxes: sb(518), obs: 'A lista informa o box 201; posição do tour 3D (setor de orgânicos).', fonte: TOUR3D }),
  c('Ninki Pastéis & Delícias', 'lanchonete', 'ninki-pasteis-delicias', { boxes: sb(15), telefone: '(41) 99179-1197 · (41) 99663-2026', obs: 'A lista informa o box 205; posição do tour 3D (praça de alimentação Karan).', fonte: TOUR3D }),
  c('Café do Jorge e da Aurea', 'lanchonete', 'cafe-do-jorge-e-da-aurea', { boxes: sb(16), telefone: '(41) 3152-6132', obs: 'A lista informa o box 206; posição do tour 3D (praça de alimentação Karan).', fonte: TOUR3D }),
  c('Pachamama', 'servicos', null, { boxesForaDaPlanta: ['428'], telefone: '(41) 3396-3507 · (41) 98871-0662' }),

  // ======================= novos: comerciantes vistos no tour 3D oficial (Matterport)
  // pavimento inferior · salão central
  c('Banca do Oyama', 'hortifruti', null, { boxes: ibn(45), telefone: '(41) 3264-7563', fonte: TOUR3D }),
  c('Banca do Paulo', 'especiarias', null, { boxes: ibn(4), telefone: '(41) 99956-3898', fonte: TOUR3D }),
  c('Banca do João Carlos', 'hortifruti', null, { boxes: ibn(66), fonte: TOUR3D }),
  c('Urnab (Banca do G)', 'hortifruti', null, { boxes: ibn(75), telefone: '(41) 99954-6053', fonte: TOUR3D }),
  c('Banca do Eduardo', 'hortifruti', null, { boxes: ibn(93), telefone: '(41) 98486-8214', obs: 'Na planta do tour: "Eduardo e Daniel".', fonte: TOUR3D }),
  c('Banco de Alimentos', 'servicos', null, { boxes: ibn(97), obs: 'Só o rótulo aparece no tour 3D.', fonte: TOUR3D }),
  c('Empório 365', 'emporio', null, { boxes: ib(365), telefone: '(41) 3010-2544 · (41) 98777-5454', fonte: TOUR3D }),
  c('Mercearia Imperial', 'emporio', null, { boxes: ib(359), telefone: '(41) 3077-3467 · (41) 98762-8681 · (41) 99228-1472', fonte: TOUR3D }),
  c('Skina das Delícias', 'lanchonete', null, { boxes: ib(454), obs: 'Só o rótulo aparece no tour 3D.', fonte: TOUR3D }),
  // pavimento inferior · hall da entrada Sete de Setembro (praça circular)
  c('Oishii', 'lanchonete', null, { boxes: ib(185), obs: 'Crepe japonês.', fonte: TOUR3D }),
  c('Natureba', 'lanchonete', null, { boxes: ib('hall-a'), telefone: '(41) 98875-6461', fonte: TOUR3D }),
  c('Sweet Sobremesas Especiais', 'doces', null, { boxes: ib('hall-b'), telefone: '(41) 3262-3311 · (41) 99997-7070', fonte: TOUR3D }),
  // pavimento superior
  c('Biossana Orgânicos', 'organicos', null, { boxes: sb(520), telefone: '(41) 99936-0224', fonte: TOUR3D }),
  c('Tabacaria Trevo', 'servicos', null, { boxes: sb(330), telefone: '(41) 3264-5445 · (41) 99242-4662', fonte: TOUR3D }),
  c('Lule Salão de Cabelos', 'servicos', null, { boxes: sb(318), telefone: '(41) 99644-2203', fonte: TOUR3D }),
  c('Ascesme', 'servicos', null, { boxes: sb(328), telefone: '(41) 3363-3764', descricao: 'Associação dos comerciantes do Mercado Municipal.', fonte: TOUR3D }),
  c('Max Dandy', 'lanchonete', null, { boxes: sb(14), telefone: '(41) 98457-8041', fonte: TOUR3D }),
  c('Espaço Fitoterápico', 'servicos', null, { boxes: sb(11), obs: 'Só o rótulo aparece no tour 3D.', fonte: TOUR3D }),
  c('Bonna Gourmet', 'lanchonete', null, { boxes: sb('bonna'), fonte: TOUR3D }),
  c('Pastelaria Curitiba', 'lanchonete', null, { boxes: sb(8), telefone: '(41) 99734-9001 · (41) 3363-0522', fonte: TOUR3D }),
  // fora da planta afixada (áreas que ela não desenha)
  c('Fujii Cozinha Japonesa', 'lanchonete', null, { boxes: sb('fujii'), telefone: '(41) 3114-8393', obs: 'Praças de alimentação Déa / 7 de Setembro, a oeste dos boxes 07–10 do pavimento superior.', fonte: TOUR3D }),
  c('Mister Dea', 'lanchonete', null, { boxes: sb('mister-dea'), telefone: '(41) 3264-4911 · (41) 98832-0583', obs: 'Praças de alimentação Déa / 7 de Setembro, junto aos boxes 01–04 do pavimento superior.', fonte: TOUR3D }),
  c('Curitiba Sua Linda', 'servicos', null, { obs: 'Galeria do pavimento superior, entre a área rosa e o setor de orgânicos. Só o rótulo aparece no tour 3D.', fonte: TOUR3D }),
  c('Restaurante Al Almasor', 'lanchonete', null, { boxes: sb('almasor'), telefone: '(41) 3155-1844', descricao: 'Comida árabe e brasileira.', obs: 'Galeria de restaurantes do pavimento superior, sobre a Rua General Carneiro.', fonte: TOUR3D }),
  c('Gerência do Mercado (Prefeitura)', 'servicos', null, { telefone: '(41) 3264-6020 · (41) 3264-6224 · (41) 3264-6024', obs: '3º nível, junto ao auditório.', fonte: TOUR3D }),

  // ======================= sem número de box
  c('Dinho Wine and Spirits', 'bebidas', 'dinho-wine-and-spirits', { telefone: '(41) 98783-5900' }),
  c('Banca do Hiro', 'hortifruti', 'banca-do-hiro', { boxes: ib(62), telefone: '(41) 99944-4334', fonte: TOUR3D }),
  c('Domo Empório Gourmet', 'emporio', 'emporio-curitibano', { descricao: 'Queijos, frios, vinhos, espumantes, destilados e mercearia.', fonte: 'site oficial (via busca)' }),
  c('Restaurante Takê', 'lanchonete', 'restaurante-take', { boxes: sb(7), telefone: '(41) 3362-7571', descricao: 'Comida japonesa por quilo.', fonte: TOUR3D }),
  c('Oliveiras Hortifruti', 'hortifruti', 'oliveiras-hortifruti', { fonte: 'site oficial (via busca)' }),
];
