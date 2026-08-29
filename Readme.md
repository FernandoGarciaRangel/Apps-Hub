
# Apps Hub

Página estática única com links para os apps já publicados:

- [WeightChartS](https://weight-charts.vercel.app/)
- [Refeição Livre](https://refeicao-livre.vercel.app/)
- [Calculadora TMB](https://calculadora-tmb-five.vercel.app/)

Sem build, sem dependências npm — `index.html` + `tokens.css` + `styles.css`.

## Arquivos

| Deployado | O quê |
|---|---|
| `index.html`, `tokens.css`, `styles.css` | O site |
| `robots.txt`, `sitemap.xml`, `llms.txt` | Descoberta por buscador e por IA |
| `site.webmanifest`, `favicon.svg`, `apple-touch-icon.png`, `icon-512.png` | Ícones e metadados de instalação |
| `og.png` | Card social (1200×630) |

Fora do deploy (`.vercelignore`): `DESIGN-SYSTEM.md`, `design-canvas/`, `CLAUDE.md`,
`Readme.md`, `.claude/`.

As imagens são geradas a partir de `design-canvas/og/*.html` — o procedimento está no
`CLAUDE.md`, seção "SEO e descoberta por IA".

## Deploy (Vercel)

1. Cria um repositório novo (ex: `apps-hub`) e sobe os arquivos.
2. Importa o repo na Vercel com as definições por omissão (root = `index.html`).
3. Pronto — sem variáveis de ambiente, sem passos extra.

**Arquivo novo e a referência a ele têm que entrar no mesmo commit.** Se o `index.html` que
aponta para `og.png` subir sem o `og.png`, o build fica verde e o card social sobe quebrado,
sem erro nenhum.

## Rodar localmente

```
npx serve . -l 8080
```

A porta 8080 é fixa por convenção: o `btn-back` dos outros apps aponta para
`http://localhost:8080/` quando roda em localhost. Calculadora TMB usa 8081, Refeição Livre usa
8082 e WeightChartS usa 3000, para todos subirem ao mesmo tempo.

## Testar

```
node .claude/skills/run-apps-hub/driver.mjs smoke
```

27 checagens end-to-end em Chrome headless, sem dependência nenhuma (Node ≥ 22).
