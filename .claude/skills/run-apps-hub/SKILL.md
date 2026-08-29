---
name: run-apps-hub
description: Roda, pilota e tira screenshot do Apps-Hub (portal estático de links, HTML/CSS/JS puro). Use para iniciar/subir o hub, abrir em localhost, clicar na UI, testar tema claro/escuro, medir se o h1 com background-clip cabe na caixa, capturar tela, rodar o smoke test end-to-end, ou confirmar que uma mudança funciona na página de verdade. Palavras-chave: run, start, dev, serve, screenshot, driver, headless, e2e, smoke, hub, portal.
---

# Rodar e pilotar o Apps-Hub

Página estática de uma tela: `index.html` + `tokens.css` + `styles.css`. **Sem
build, sem npm, sem dependências** — o repo inteiro é servido como arquivo
estático. As fontes (Syne, Nunito) vêm do Google Fonts por CDN; o resto é local.

O caminho do agente é o **driver**: `.claude/skills/run-apps-hub/driver.mjs`.
Ele sobe um servidor estático, lança o Chrome headless e fala CDP direto pelo
`WebSocket` nativo do Node — **zero dependências**, nada de Playwright.

Todos os caminhos abaixo são relativos a `Apps-Hub/`.

## Pré-requisitos

Só Node ≥ 22 (pelo `WebSocket` global) e o Chrome instalado. Não existe
`package.json` neste repo — não há `npm install` para rodar, nem lint, nem
testes unitários. O driver acha o Chrome sozinho em
`C:/Program Files/Google/Chrome/Application/chrome.exe` (também tenta Program
Files (x86), LocalAppData, Edge e os caminhos de Linux); se estiver noutro
lugar, `CHROME=<caminho do exe>`.

## Run (caminho do agente) — comece por aqui

### Smoke test end-to-end

27 checagens: carrega a página, confere as entradas e os seus `href`, mede o
`h1` em quatro larguras, alterna o tema nos dois sentidos, confirma o contraste
do laranja no tema claro e verifica que todo CSS local responde 200. Depois a
camada de SEO: `canonical`, Open Graph e Twitter Card completos, `og:image`
absoluta, o JSON-LD casando com os cards, e os oito arquivos de descoberta
(`robots.txt`, `sitemap.xml`, `llms.txt`, `site.webmanifest`, `favicon.svg`,
`og.png`, `apple-touch-icon.png`, `icon-512.png`) respondendo 200 — mais a
conferência de que `robots.txt` e `sitemap.xml` apontam para o mesmo host do
`canonical`. Gera 3 screenshots em `.claude-shots/`.

```bash
node .claude/skills/run-apps-hub/driver.mjs smoke
```

Saída atual: `OK: 27/27 checagens passaram`.

**O assert das entradas é uma lista literal.** Ao acrescentar ou remover um app
do hub, o passo 2 falha até você atualizar a lista no `cmdSmoke`. É de
propósito — é o que obriga a revisar o portal quando ele muda —, mas não
confunda com regressão. Já ficou para trás uma vez, quando "Refeição Livre"
entrou no `index.html` e o driver continuou esperando duas entradas.

### REPL: um comando por linha no stdin

```bash
node .claude/skills/run-apps-hub/driver.mjs repl <<'EOF'
goto /
size 320 700
fit .intro h1
eval [...document.querySelectorAll('.entry')].length
text .eyebrow
click #btnTheme
eval document.documentElement.dataset.theme
errors
quit
EOF
```

Saída real desse bloco:

```
ok goto http://127.0.0.1:49651/
ok size 320 700
ok fit {"textW":277.5,"boxW":280,"fontSize":27.2,"folga":2.5,"ratio":10.2}
ok eval 3
ok text "FERNANDO GARCIA RANGEL"
ok click #btnTheme {"x":278,"y":92}
ok eval "light"
ok errors 0
```

Cada linha responde `ok …` ou `err …`. Comandos:

| Comando | O que faz |
|---|---|
| `goto <rota>` | navega, espera `load` + 2 frames de raf |
| `click <sel>` | clique real de mouse no centro; **recusa** elemento invisível ou `disabled` |
| `fill <sel> <valor>` | seta `.value` e dispara `input`+`change` |
| `press Enter\|Tab\|Escape` | tecla de verdade |
| `text <sel>` | `innerText` |
| `eval <js>` | avalia (com `await` de promise) e imprime JSON |
| `wait <js>` | espera a expressão virar truthy (8 s) |
| `fit <sel>` | mede largura do texto vs. da caixa — **o comando que importa aqui** |
| `shot <a.png>` / `shotfull <a.png>` | screenshot do viewport / da página inteira |
| `size <w> <h> [dsf]` | muda o viewport (default 420×900, dsf 2, mobile). O `dsf` opcional é o `deviceScaleFactor`: deixe em 2 para inspecionar UI, passe `1` para gerar asset cujo tamanho em pixel tem de ser exato (`og.png`, ícones) |
| `console` / `errors` | despeja o que a página logou / exceções não capturadas |
| `sleep <ms>` / `quit` | |

O seletor pode ter espaço (`fit .intro h1`): o comando pega o resto da linha.

Screenshots caem em `.claude-shots/` (gitignorado). `OUT_DIR=<dir>` muda.
`HEADFUL=1` abre uma janela de verdade em vez de headless.


**Gerar `og.png` e os ícones** é o caso em que o `dsf` importa: com o default 2
a captura sai com o dobro do lado (1200×630 vira 2400×1260) e deixa de bater com
o `og:image:width` declarado no `index.html`. As fontes das imagens estão em
`design-canvas/og/` — fora do deploy, mas servidas pelo servidor local. O
procedimento completo está no `CLAUDE.md`, seção "SEO e descoberta por IA".

### Screenshot rápido

```bash
node .claude/skills/run-apps-hub/driver.mjs shot hub.png
```

## `fit`: o único jeito de pegar o bug do h1

`.intro h1` usa `background-clip: text` com `-webkit-text-fill-color:
transparent`. Se o texto passar da largura da caixa, **o excedente fica
invisível** — sem scrollbar, sem erro, sem aviso no console. E
`scrollWidth === clientWidth` continua `true`, ou seja, a checagem óbvia de
overflow **não detecta**. O smoke prova as duas coisas (passo 4).

`fit <sel>` mede o texto com `Range.getBoundingClientRect()` contra a caixa e
devolve `folga` (px sobrando) e `ratio` (largura ÷ font-size):

```
ok fit {"textW":277.5,"boxW":280,"fontSize":27.2,"folga":2.5,"ratio":10.2}
```

`folga >= 0` passa. A 320px de viewport a folga é de **2,5px** — é o ponto mais
apertado do layout, e é por isso que existe o `@media (max-width: 360px)`
reduzindo o `h1` e o mínimo de `1.95rem` no `--step-4`. Ao mexer no título, no
`--step-4` ou em qualquer coisa que roube largura da linha do título, meça nas
quatro larguras do smoke (420 / 390 / 360 / 320).

**O `ratio` de 10,2× é da Syne 800.** Ele só vale se a fonte tiver realmente
carregado — ela vem do Google Fonts por CDN, então uma execução sem rede cai no
`system-ui` e mede outra largura. Confirme antes de acreditar num `fit`
apertado:

```
eval document.fonts.check("800 27px Syne")   # → true
```

## Gotchas

- **`offline` não serve para nada aqui.** O comando existe no driver (é o mesmo
  harness dos três apps) e bloqueia CDN e endpoints do Firebase. O hub não usa
  Firebase; o comando roda, responde `ok` e não muda nada. O que ele *não*
  bloqueia é o Google Fonts — se quiser testar sem as fontes, é outro caminho.
- **O botão de tema não está dentro de `.intro`.** Ele vive numa `.page-bar`
  própria acima do título, e isso é assert do smoke (passo 5), não acaso: quando
  ficava na mesma linha do `h1`, roubava ~60px e "Ferramentas" perdia as últimas
  letras — invisivelmente, pelo motivo da seção acima.
- **O tema é `appshub_theme` no `localStorage`**, aplicado por um script inline
  no `<head>` antes do CSS (é o que evita o flash). Cada `launch` cria um perfil
  de Chrome novo em `%TEMP%`, então o `localStorage` começa vazio e o tema
  inicial é sempre `dark`.
- **Os três links saem com `target="_blank"`** e apontam para as URLs de
  produção dos outros apps. O driver não os segue; clicar num `.entry` abre uma
  aba que o driver não controla. Para testar destino, leia o `href` (é o que o
  smoke faz).
- **O hub não tem `btn-back`** — ele é o destino da navegação, não a origem.
  Não procure por um.
- **`shotfull` pinta elementos `fixed`/`sticky` na altura do viewport**, não no
  topo da imagem — é como o `captureBeyondViewport` do CDP funciona. Para um
  screenshot limpo do topo, use `shot`.

## Troubleshooting

| Sintoma | Causa / correção |
|---|---|
| `FALHOU entradas` no smoke | Lista literal desatualizada no `cmdSmoke`. Atualize-a para as entradas atuais do `index.html`. |
| `fit` com `folga` negativa | O `h1` está truncando invisivelmente. Reduza `--step-4`, encurte o título, ou devolva largura à caixa. |
| `fit` com números estranhos | A Syne pode não ter carregado (sem rede). Cheque `document.fonts.check("800 27px Syne")`. |
| Tudo responde `forbidden` / página em branco | `APP_DIR` com barras trocadas. O driver normaliza com `path.resolve`; se sobrescrever à mão, passe caminho absoluto. |
| `Chrome não encontrado` | `CHROME=<caminho do chrome.exe>`. |
| `Chrome não abriu a porta de debug em 20000ms` | Sobrou um Chrome do driver travado: `taskkill //F //IM chrome.exe` (fecha o seu browser também) ou reinicie. |
