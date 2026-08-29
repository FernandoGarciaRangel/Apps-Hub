# Apps-Hub

Página estática (`index.html` + `tokens.css` + `styles.css`, sem build, sem dependências npm) com links para apps publicados em repositórios separados:

- WeightChartS → https://weight-charts.vercel.app/
- Refeição Livre → https://refeicao-livre.vercel.app/
- Calculadora TMB → https://calculadora-tmb-five.vercel.app/

Deploy: Vercel, projeto estático, root = `index.html`. Sem variáveis de ambiente.

**Em produção: https://apps-hub-beta.vercel.app**

Se essa URL sumir daqui de novo, ela está no campo `homepage` do repositório no GitHub, preenchido pela integração da Vercel:

```bash
curl -s https://api.github.com/repos/FernandoGarciaRangel/Apps-Hub | grep homepage
```

O mesmo vale para os outros repos. Não há `.vercel/project.json` local em nenhum deles — nunca rodaram `vercel link` aqui.

## Sistema de design

`tokens.css` é uma **cópia** dos tokens compartilhados pelos apps do workspace (preto + laranja, temas escuro e claro). A spec canônica é o `DESIGN-SYSTEM.md` **deste repo**, que serve todos — como cada um tem deploy Vercel separado, não existe CSS compartilhado em runtime; cada repo carrega a sua cópia. Ao mudar um token, mude na spec e em todos os repos.

`DESIGN-SYSTEM.md` e `design-canvas/` estão no `.vercelignore`: versionados aqui, mas fora do deploy. O hub é servido da raiz, então sem essa exclusão eles iriam para o domínio público. Se mexer no `vercel.json`, não derrube isso.

`styles.css` define só tokens locais do hub (`--card-bg`, `--h1-gradient`, `--icon-bg`, `--dot-grid`) e o estilo dos componentes. Não coloque hex de cor solto fora dessas duas camadas.

Duas regras do sistema que valem aqui:

- **Texto sobre preenchimento laranja é `--on-accent` (quase-preto), nunca branco** — branco sobre `#f97316` dá 2,8:1 e reprova AA.
- **`--accent-text`, não `--accent`, quando o laranja for texto** — no tema claro ele vira `#c2410c`, porque `#f97316` sobre `#fafafa` dá 2,7:1.

O tema é lido do `localStorage` (`appshub_theme`) por um script inline no `<head>`, antes do CSS — é isso que evita o flash de tema errado ao recarregar.

## Pitfall: o h1 some se transbordar

`.intro h1` usa `background-clip: text` com `color: transparent`. Se o texto passar da largura da caixa, o excedente fica **invisível** — sem scrollbar, sem erro, sem aviso. Aconteceu ao adicionar o botão de tema na mesma linha do título: o botão roubou 60px e "Ferramentas" perdeu as últimas letras.

Por isso o botão vive numa `.page-bar` própria acima do título, e há um `@media (max-width: 360px)` reduzindo o h1. Ao mexer no título ou em `--step-4`, meça: o texto precisa de ~10,2× o font-size em Syne 800.

## Pitfall: case sensitivity em produção

Windows/NTFS ignora maiúscula/minúscula em nomes de arquivo; a Vercel (Linux) não. Um `href`/`src` que não bate exatamente com o nome do arquivo no disco funciona local e quebra em produção sem aviso nenhum (404 silencioso — a página sobe sem CSS/asset, sem erro visível no build).

Já aconteceu aqui: `index.html` referenciava `styles.css` enquanto o arquivo era `Styles.css`. Corrigido. Antes de commitar qualquer novo arquivo ou referência, confirma que o nome bate letra por letra — não confia no fato de "funcionar local".

A mesma família de falha, sem envolver caixa: **arquivo novo e a referência a ele têm que entrar no mesmo commit.** Se o `index.html` que referencia `tokens.css` subir sem o `tokens.css` junto, o deploy passa, o build fica verde e a página sobe sem tokens — 404 silencioso. Como `tokens.css` nasceu não rastreado (`??`), é fácil o `git add` pegar só os modificados e deixar o novo para trás.

Verificação depois de qualquer deploy que adicione arquivo, contra a URL de produção acima:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://apps-hub-beta.vercel.app/tokens.css
```

Cuidado ao testar caminhos: o `vercel.json` tem `cleanUrls: true`, então `.html` responde **308** e não 404. Sem seguir o redirect (`curl -L`) parece que o arquivo existe.

## SEO e descoberta por IA

Além dos três arquivos do site, a raiz tem uma camada de descoberta — toda deployada:

| Arquivo | Para quê |
|---|---|
| `robots.txt` | Libera geral, lista os rastreadores de IA um a um, aponta o sitemap |
| `sitemap.xml` | Uma URL só (o hub é página única) |
| `llms.txt` | Resumo em markdown para LLM, na convenção do llmstxt.org |
| `site.webmanifest` | Nome, ícones, cores — A2HS no Android |
| `favicon.svg` | Ícone de arquivo, no lugar do antigo data-URI inline |
| `og.png` (1200×630) | Card social do WhatsApp/LinkedIn/etc. |
| `apple-touch-icon.png` (180×180), `icon-512.png` (512×512) | Ícones do manifest e do iOS |

No `<head>` do `index.html`: `canonical`, `robots`, Open Graph completo, Twitter Card e um bloco
JSON-LD (`WebSite` + `Person` + `CollectionPage` com um `ItemList` de três `WebApplication`).

### A URL de produção está escrita à mão em três arquivos

Sem build, não há variável para interpolar. `https://apps-hub-beta.vercel.app` aparece literal em
**`index.html`** (canonical, `og:url`, `og:image`, todos os `@id` do JSON-LD), em **`robots.txt`**
(linha `Sitemap:`) e em **`sitemap.xml`** (`<loc>`). Trocar de domínio é um find-and-replace nesses
três — nenhum outro arquivo do repo tem URL absoluta própria.

O perigo real não é esquecer os três, é mudar **um** e não os outros: aí o buscador recebe dois
endereços para a mesma página e nada quebra visivelmente. O passo 10 do smoke compara o host do
`canonical` com o que está no `robots.txt` e no `sitemap.xml` e falha se divergirem.

### O JSON-LD tem de dizer o mesmo que os cards

Nome e URL de cada app estão em dois lugares: no HTML dos `.entry` e no `ItemList` do JSON-LD.
Se divergirem, quem ganha é o JSON-LD — o buscador acredita nele, não no texto. O passo 9 do smoke
extrai os dois e exige que batam, contra a mesma `const APPS` do passo 2. Mexeu num card, mexa no
JSON-LD.

### Como regerar `og.png` e os ícones

As fontes são `design-canvas/og/og.html` e `design-canvas/og/icon.html` — dentro de
`design-canvas/`, logo **fora do deploy**, mas servidas pelo servidor local do driver. Os PNG
gerados ficam na raiz e esses sim vão para produção.

```bash
OUT_DIR=. node .claude/skills/run-apps-hub/driver.mjs repl
size 1200 630 1
goto /design-canvas/og/og.html
sleep 3000
shot og.png
size 180 180 1
goto /design-canvas/og/icon.html
shot apple-touch-icon.png
size 512 512 1
goto /design-canvas/og/icon.html
shot icon-512.png
quit
```

**O `1` no fim do `size` é obrigatório aqui.** O `page.viewport()` do driver usa
`deviceScaleFactor: 2` por omissão — o certo para inspecionar UI, e o motivo de a primeira
tentativa ter saído em 2400×1260 em vez de 1200×630. Asset social e ícone têm de bater
**exatamente** com o tamanho declarado no `og:image:width` e no `site.webmanifest`; por isso o
comando `size` do repl passou a aceitar o fator como terceiro argumento.

O `sleep 3000` antes do `shot og.png` é para o Syne e o Nunito carregarem do Google Fonts. Sem
ele a imagem sai com a fonte de fallback, e nada avisa.

### O nome do app é `h2`, não `span`

`.entry-title` era um `<span>`; virou `<h2>` para o documento ter hierarquia (`h1` → `h2`) em vez
de um `h1` solto. O CSS reseta `margin` e fixa `line-height` — sem isso o default do browser abre
o card e muda o ritmo da lista. O smoke checa a tag no passo 2.

### Doc interna saiu do deploy

`CLAUDE.md` e `Readme.md` estavam sendo servidos em produção, como texto cru, e apareciam para
qualquer rastreador. Entraram no `.vercelignore` junto com `.claude/`. O `robots.txt` tem um
`Disallow` para os mesmos caminhos, como segunda barreira caso a exclusão caia num refactor.

### O que não foi feito, e por quê

- **`favicon.ico`**: não existe. `favicon.svg` + `apple-touch-icon.png` cobrem todo navegador
  atual; um `/favicon.ico` só seria pedido por bot antigo, e o 404 dele não custa nada.
- **Conteúdo longo (FAQ, páginas por app)**: a página segue com ~90 palavras. Foi decisão de
  design — o hub é minimalista de propósito. O texto denso vive no `llms.txt`, que é lido por
  LLM sem custo visual nenhum. Se um dia o ranqueamento importar mais que a estética, é aqui
  que se mexe.
- **Domínio próprio**: continua em `apps-hub-beta.vercel.app`. Enquanto for um subdomínio
  `vercel.app`, o teto de ranqueamento é baixo por mais correto que esteja o resto — nenhuma
  autoridade de domínio se acumula num host de terceiros. É a mudança de maior impacto que
  ficou de fora.

## Decisão: não unificar domínio com WeightChartS e Calculadora TMB

Avaliamos servir todos sob um domínio único via rewrite/proxy do Vercel (`/peso/*` → `weight-charts.vercel.app/*` etc.) e descartamos por enquanto. Motivo: o WeightChartS registra o service worker com path absoluto (`navigator.serviceWorker.register('/sw.js')`, em `index.html`). Sob um domínio compartilhado, isso tentaria registrar em `/sw.js` da raiz do domínio — não no subpath — o que gera 404 ou, pior, um service worker de escopo `/` controlando todas as páginas (hub incluído).

Antes de tentar essa unificação de novo, o registro do SW no WeightChartS precisa virar relativo ao path atual (ou condicional por `location.pathname`). Até lá, este hub continua sendo só links externos — não é uma limitação técnica desta pasta, é uma decisão tomada sabendo do trade-off.
