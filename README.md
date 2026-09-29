# Mercado Municipal de Curitiba · Tour 360° modular

Tour no estilo Google Street View em que **cada parte do ambiente é um módulo
independente**: a foto panorâmica de cada ponto, cada face do cubo (inclusive
teto e piso) e cada box, parede, placa ou teto sobreposto. Para atualizar
qualquer coisa, basta trocar os arquivos de uma pasta. Não é preciso refotografar
o mercado inteiro.

```bash
npm install
npm run dev        # abre em http://localhost:5173
npm run validate   # confere links, módulos e arquivos de mídia
npm run build      # gera o site estático em dist/ (pode ir para qualquer hospedagem)
```

As fotos 360° ainda não existem. Enquanto um ponto não tiver foto, o app monta
uma **maquete 3D** a partir da planta: o chão é a própria planta (corredores A
azul, B amarelo e C verde), há teto, e cada box vira um volume com fachada e
letreiro (nome e ramo). Bancas aparecem como balcões baixos. Quando a foto 360°
de um ponto for adicionada em `base`, aquele ponto passa a mostrar a foto.

## Planta real (já aplicada)

O tour foi montado sobre as **plantas afixadas no próprio mercado** (fotos em
`public/tour/plantas/`), digitalizadas em `scripts/planta/dados-planta.mjs`:

- **Pavimento inferior:** corredores A (azul), B (amarelo) e C (verde), ilhas
  de bancas 01–102, boxes 02–80, 266–310, 354–378 e 429–458, anexo lilás,
  rampa oeste e portas E, G, H, I e J.
- **Pavimento superior:** setor 311–353, área rosa (01–19), área verde
  (501–522) e portas B, C e D.
- **67 pontos de vista**. Anda-se pelo botão **▲** (mostra o próximo ponto na direção do olhar), pelas teclas **W/S** ou com **dois cliques/toques no chão**, sempre para um ponto vizinho **pelo corredor**. Na maquete, o pavimento é montado uma vez e a câmera desliza entre os pontos, sem recarregar. `npm run planta` falha se alguma ligação entre pontos atravessar um box ou banca. A escada tem uma seta para trocar de pavimento.
- **Rua General Carneiro** do lado de fora (calçada, meio-fio, asfalto, faixas de pedestres em frente às portas J, I e H e placas), definida em `RUAS` no `dados-planta.mjs`. O teto só cobre a área em `AREA_COBERTA`.
- **370 módulos** (boxes, bancas e portas), cada um na sua pasta.

A **escala** (metros por pixel) e o **norte** vêm do contorno do prédio no
[OpenStreetMap](https://www.openstreetmap.org/way/24776455): 0,063 m/px no
pavimento inferior e 0,0725 m/px no superior. As plantas estão giradas: o
"cima" delas (Rua da Paz) aponta para o rumo real de 66°, e a seta vermelha do
minimapa mostra o norte. O minimapa também traz, tracejados, os contornos do
OpenStreetMap: o prédio atual, o Mercado de Orgânicos, o estacionamento, os
boxes de hortifrúti (inferior) e as praças de alimentação (superior). Eles
mostram o que as plantas afixadas (de ~2011, durante a ampliação) não desenham,
como o trecho do lado da Av. Sete de Setembro. Os dados ficam em
`scripts/planta/osm-dados.json` (© OpenStreetMap contributors, licença
[ODbL](https://www.openstreetmap.org/copyright)); a lista de contornos e as
âncoras planta ↔ mapa estão em `dados-planta.mjs`. Para atualizar do mapa:

```bash
npm run osm        # baixa de novo os contornos do OpenStreetMap
```

Com uma medida real no local, ajuste `escala` em `dados-planta.mjs` e rode:

```bash
npm run planta     # regenera posições/links sem apagar o que foi preenchido à mão
```

### Comerciantes

`scripts/planta/comerciantes.mjs` lista 184 comerciantes da lista pública de
lojas do Mercado (curitiba.mercadomodelo.com.br), com descrições do site
oficial, conferidos no tour 3D oficial do Mercado (Matterport,
my.matterport.com/show/?m=tgwA2xoKA2y). 173 deles ocupam 265 boxes e bancas
da planta e aparecem com nome e cor do ramo no tour.

Do tour 3D vieram só **fatos** (nomes, telefones e a posição de cada
marcador), nunca imagens. As coordenadas dos marcadores foram ajustadas à
planta pelos ~70 comerciantes comuns às duas fontes (desvio típico de 1–3 m).
Isso confirmou a planta, corrigiu algumas lojas (ex.: Adega Municipal no
box 15), pôs 26 comerciantes novos e acrescentou o **hall da entrada Sete de
Setembro** (praça circular a oeste da rampa), que a planta afixada não
desenha. Lojas em áreas ainda fora da planta (praças Déa / 7 de Setembro,
galeria de restaurantes sobre a General Carneiro, 3º nível) ficam só na lista,
com a localização em `obs`. Boxes sem comerciante identificado ficam cinza. Os demais
aparecem só no botão **Comerciantes** do app.
Rode `npm run planta` depois de editar a lista.

Edições feitas à mão direto num `module.json` (título, info, mídia) são
preservadas: o gerador só sobrescreve arquivos que ele mesmo escreveu e que
ninguém alterou (`autoHash`).

### Detalhes da maquete (o que é medido e o que é estimado)

- **Menu Visual → Cenário:** *Atual* (padrão) ou *Estilizado*. O estilizado usa uma paleta única (`PALETA` em `src/core/textures.js`): lojas com letreiro liso e toldo listrado, teto e chão claros, mobiliário, corrimãos e prédios da rua na mesma família de cores. A escolha fica salva no navegador.
- **Sinalização:** "SAÍDA" sobre cada porta e "cuidado, degrau" no pé de cada escada; tipo `aviso` em `MOBILIARIO` cria outras placas (`escada`, `rampa`, `vao`, `acessivel`).
- **Escadas:** a espiral do Hall Sete de Setembro (`helicoidal`) agora é desenhada; corrimãos e guarda-corpos têm balaústres.
- **Rua General Carneiro:** prédios do outro lado, árvores e postes; três **cercadinhos com mesas e guarda-sóis** na calçada (função `cercadinho` em `dados-planta.mjs`). **Posições estimadas**: ajuste `x0` e `y0` no local.
- **Olhar para baixo no pavimento superior:** onde a planta do piso 2 não tem laje (fora do contorno e nos vãos) o piso fica transparente e aparece o pavimento inferior. O desnível (`abaixo.desnivel`, 4,5 m) é **estimado**; meça e corrija em `dados-planta.mjs`.

## Como funciona (3 camadas)

```
┌──────────────────────────────────────────────────────────────┐
│ 3. Módulos: box, parede, teto, piso, placa (PNG/JPG/vídeo)   │  ← troca frequente
│ 2. Base da cena: panorâmica do ponto (cubo com 6 faces       │  ← troca pontual
│    OU equiretangular de X graus)                             │
│ 1. Planta: posição (x,y) de cada cena e módulo, em metros    │  ← quase nunca muda
└──────────────────────────────────────────────────────────────┘
```

1. **Planta.** Cada cena (ponto de foto) tem `position` em metros e `northYaw`,
   que indica para onde fica o norte na foto. Com isso as setas de navegação,
   o minimapa e a direção do olhar ao "andar" são calculados sozinhos, como no
   Street View.
2. **Base.** É a foto 360° do ponto. Pode ser:
   - `"type": "cube"`: 6 arquivos (`front`, `right`, `back`, `left`, `up`, `down`).
     Dá para trocar **só o teto** (`up`) ou **só o piso** (`down`) de uma cena.
   - `"type": "equirect"`: uma imagem 2:1 ou **parcial de X graus**
     (`"hfov": 200, "vfov": 120`). Útil para fotos que não são 360° completas.
3. **Módulos.** São planos com imagem (PNG com transparência, JPG ou vídeo)
   sobrepostos à base. Existem dois tipos de âncora:
   - **na planta** (`placement` no `module.json`): declarado uma vez e exibido
     automaticamente em todas as cenas num raio de `moduleRadius` metros (30 por
     padrão). Troque a foto da fachada do Box 12 e ela muda em todos os pontos
     de onde o box aparece.
   - **na vista** (`layers` no `scene.json`, com yaw/pitch/distância): ajuste
     fino para uma foto específica. Também serve para sobrescrever a posição ou
     a mídia de um módulo da planta só naquela cena.

## Estrutura de arquivos

```
public/tour/
├── tour.json                        índice: título, cena inicial, lista de cenas e módulos
├── scenes/
│   └── corredor-central-1/
│       ├── scene.json               base + links + layers + posição na planta
│       ├── front.jpg … down.jpg     (faces do cubo, quando houver fotos)
└── modules/
    └── box-04/
        ├── module.json              tipo, título, versão, placement, mídia, info
        └── fachada.jpg
src/
├── core/        Viewer (câmera/controles), geo (coordenadas), textures (cache/placeholder)
├── tour/        TourLoader (lê JSON), SceneBuilder (monta a cena), placement
└── ui/          setas de navegação, minimapa, painel de informações, editor
scripts/validate-tour.mjs
```

### `scene.json`

```jsonc
{
  "title": "Corredor central — trecho 1",
  "position": { "x": 0, "y": 10, "z": 1.6 },   // metros; z = altura da câmera
  "northYaw": 0,                                // yaw da foto que aponta para o norte
  "initialView": { "yaw": 0, "pitch": 0, "fov": 75 },
  "moduleRadius": 30,                           // até onde módulos da planta aparecem
  "base": {
    "type": "cube",
    "version": "2026-09-27",                    // mude para forçar recarregar as fotos
    "faces": { "front": "front.jpg", "up": "teto-2026-10.jpg" /* … */ }
  },
  "links": [{ "to": "corredor-central-2" }],    // yaw calculado pela planta (ou informe "yaw")
  "hideModules": ["piso-corredor"],             // esconde módulos da planta nesta cena
  "layers": [
    { "module": "placa-boas-vindas", "yaw": 0, "pitch": 18, "distance": 8, "width": 5, "height": 1.2 }
  ]
}
```

### `module.json`

```jsonc
{
  "type": "box",                               // box | parede | teto | piso | sinalizacao …
  "title": "Box 04 — Cafés Especiais",
  "version": "2026-09-27",                     // mude a cada troca de imagem
  "enabled": true,                             // false = some de todas as cenas
  "placement": { "x": 3, "y": 10, "z": 1.4, "width": 3.4, "height": 2.8,
                 "facing": 270, "surface": "wall" },  // wall | floor | ceiling
  "media": { "src": "fachada.jpg" },           // ou .png / .mp4; sem src = placeholder
  "info": { "category": "Cafés", "hours": "Seg–Sáb 7h–19h", "description": "…", "url": "…" }
}
```

## Receitas

| Quero… | Faço… |
|---|---|
| Atualizar a fachada de um box | Troco `modules/box-XX/fachada.jpg` e mudo `version` |
| Box mudou de dono | Edito `title`/`info`/`media` do `module.json` |
| Box fechado | `"enabled": false` |
| Refazer só o teto de um ponto | Troco a face `up` daquele `scene.json` |
| Novo ponto de foto | Crio `scenes/<id>/scene.json`, listo em `tour.json` e adiciono `links` |
| Módulo desalinhado numa foto | Uso o editor (tecla **E**) e colo o JSON em `layers` da cena |
| Compartilhar uma vista | A URL guarda cena e direção (`#cena=…&yaw=…`) |

## Editor (tecla E)

- Clique num ponto vazio para ver yaw/pitch e um trecho de `layers` pronto.
- Clique num módulo para selecioná-lo. Ajuste pelo teclado: setas movem,
  `PgUp/PgDn` mudam distância ou altura, `[ ]` mudam a largura, `; '` a altura,
  `, .` giram, e com `Shift` o passo fica 10×. Depois clique em **Copiar JSON** e
  cole no arquivo indicado.
- **R** recarrega os JSON sem perder a vista.

## Como começar no mercado de verdade

1. **Planta.** Consiga (ou desenhe) a planta baixa com os boxes numerados e
   defina uma origem (0,0), por exemplo a entrada principal.
2. **Pontos de foto.** Marque um ponto a cada 5–8 m nos corredores e anote o
   (x,y) de cada um. Cada ponto vira uma cena.
3. **Captura.** Use uma câmera 360° (Insta360, Ricoh Theta) num tripé a 1,60 m,
   sempre com a mesma orientação (por exemplo, a lente virada para o norte, e
   `northYaw: 0`). Fotografe em horário de pouco movimento.
4. **Base.** Exporte a foto equiretangular (`equirect`) ou converta em 6 faces
   de cubo (`cube`) para poder trocar teto e piso separadamente. Ferramentas
   possíveis: PTGui, Hugin ou o pacote `panorama-to-cubemap`.
5. **Módulos.** Fotografe cada fachada de box de frente, recorte em retângulo
   (ou PNG com transparência) e cadastre com `placement` na planta.
6. **Ajuste fino** com o editor e **publique** com `npm run validate && npm run build`.

## Créditos das fotos

Fotos do Wikimedia Commons
([Category:Mercado municipal de Curitiba](https://commons.wikimedia.org/wiki/Category:Mercado_municipal_de_Curitiba)),
só com licença livre (CC0, domínio público, CC BY ou CC BY-SA), reduzidas em
`public/tour/fotos/`. Aparecem no painel **Sobre** (e a da Bon Vivant também no
painel dos boxes 56–57) com o crédito "Foto: autor · licença · Wikimedia
Commons". Os dados ficam em `scripts/planta/fotos.mjs`: `npm run planta` os
leva para `tour.json` e para os `module.json`. Para acrescentar uma foto a um
box, use `info.photos` (`src`, `caption`, `author`, `license`, `licenseUrl`,
`url`); `npm run validate` confere o arquivo e o crédito.

| Arquivo | O que mostra | Autor | Licença | Página |
|---|---|---|---|---|
| `praca-de-alimentacao.jpg` | Praça de alimentação no pavimento superior (2013) | Paulo JC Nogueira | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons](https://commons.wikimedia.org/wiki/File:Mercado_Municipal_de_Curitiba_PR_-_panoramio.jpg) |
| `saguao.jpg` | Saguão com quiosque Yogutiba e saída para a rua (2013) | Paulo JC Nogueira | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons](https://commons.wikimedia.org/wiki/File:Mercado_Municipal_de_Curitiba_-_Curitiba_PR_-_panoramio_(1).jpg) |
| `bon-vivant.jpg` | Bon Vivant, boxes 56–57 (2019) | Simplus Menegati | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Mercado_municipal_de_Curitiba.1.jpg) |
| `graos-pinhao.jpg` | Grãos, castanhas e cortadores de pinhão (2019) | Simplus Menegati | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Mercado_municipal_de_Curitiba.2.jpg) |
| `graos-a-granel.jpg` | Feijões, grãos e castanhas a granel (2018) | Renato Soares / MTur Destinos | Domínio público | [Commons](https://commons.wikimedia.org/wiki/File:RenatoSoares_MercadoMunicipal_Curitiba_PR_(26275540647).jpg) |

As fotos reduzidas são obras derivadas e seguem a mesma licença do original.
Outras três fotos de Renato Soares/MTur Destinos na categoria ficaram de fora:
o Commons as marca só como "Attribution" (`{{Flickrstream MTur Destinos}}`),
que não é uma das licenças acima.

## Próximos passos sugeridos

- Script para converter equiretangular → 6 faces automaticamente.
- Tiles e multirresolução para fotos 8K+ (carregamento progressivo).
- Painel admin (CMS) para lojistas atualizarem seus próprios boxes.
- Histórico de versões ("como era o mercado em 2025").
- Máscaras de oclusão para módulos atrás de pilares.
