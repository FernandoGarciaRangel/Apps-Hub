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

## Decisão: não unificar domínio com WeightChartS e Calculadora TMB

Avaliamos servir todos sob um domínio único via rewrite/proxy do Vercel (`/peso/*` → `weight-charts.vercel.app/*` etc.) e descartamos por enquanto. Motivo: o WeightChartS registra o service worker com path absoluto (`navigator.serviceWorker.register('/sw.js')`, em `index.html`). Sob um domínio compartilhado, isso tentaria registrar em `/sw.js` da raiz do domínio — não no subpath — o que gera 404 ou, pior, um service worker de escopo `/` controlando todas as páginas (hub incluído).

Antes de tentar essa unificação de novo, o registro do SW no WeightChartS precisa virar relativo ao path atual (ou condicional por `location.pathname`). Até lá, este hub continua sendo só links externos — não é uma limitação técnica desta pasta, é uma decisão tomada sabendo do trade-off.
