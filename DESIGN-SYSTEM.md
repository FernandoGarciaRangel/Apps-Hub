# Sistema de design — Preto & Laranja

Fonte da verdade para os quatro apps do workspace: **Apps-Hub**, **Calculadora TMB**, **Refeição Livre** e **WeightChartS**.

Canvas visual: https://claude.ai/code/artifact/88c7c1c9-02de-491c-a929-16c941029fd9
Fontes do canvas: `design-canvas/*.dc.html` (nesta mesma pasta).

> Os quatro são repositórios Git independentes com deploys Vercel separados. **Não existe CSS compartilhado em runtime** — cada repo carrega a sua própria cópia de `tokens.css`. Este arquivo é a referência que mantém as cópias iguais; quando um token mudar, muda aqui primeiro e depois nos quatro.

> **Onde este arquivo vive.** No repo **Apps-Hub**, junto de `design-canvas/`. Ficava solto na raiz do workspace, que não é repositório git — a spec e os artboards não tinham histórico nem backup. O `.vercelignore` do hub exclui os dois do deploy: eles são versionados, não publicados. De outro repo, o caminho é `../Apps-Hub/DESIGN-SYSTEM.md`.

## Decisão: um canvas só, não um por app

O canvas acima é a **única** fonte visual do sistema. Quem for implementar num dos apps trabalha contra os artboards existentes (página *Telas*) — não cria um canvas próprio.

Motivo: um canvas por app significaria três URLs desenhando as mesmas telas, e qualquer mudança de token exigiria atualizar todas. Com um só, a mudança acontece num lugar e as três implementações continuam olhando para a mesma referência.

Se uma tela que você precisa não estiver desenhada, peça o artboard em vez de abrir um canvas paralelo.

---

## 1. Tokens

Copie este bloco para o `tokens.css` do repo, sem alterar valores.

> **Nunca ponha caminho relativo dentro do `tokens.css`.** O arquivo é byte-idêntico em todos os repos, mas o layout de cada um é diferente — no Apps-Hub ele fica na raiz, no WeightChartS em `src/css/`. Um `../DESIGN-SYSTEM.md` que resolve certo num resolve errado no outro, e a byte-identidade garante que o texto errado seja copiado junto. Foi o que aconteceu: o caminho apontava para `WeightChartS/src/DESIGN-SYSTEM.md`, que nunca existiu. Referências dentro deste arquivo citam repo e nome, nunca caminho.

```css
:root {
  /* superfícies */
  --bg: #09090b;
  --surface: #161618;
  --surface-2: #1d1d21;
  --border: #27272a;
  --border-hover: rgba(249, 115, 22, 0.45);

  /* texto */
  --text: #f4f4f5;
  --text-dim: #a1a1aa;
  --text-faint: #71717a;

  /* acento */
  --accent: #f97316;
  --accent-soft: #fb923c;
  --accent-dim: #c2410c;
  --accent-text: #f97316;
  --on-accent: #09090b;
  --accent-tint: rgba(249, 115, 22, 0.12);
  --accent-glow: rgba(249, 115, 22, 0.18);

  /* forma */
  --radius: 1rem;
  --radius-sm: 0.625rem;
  --radius-xs: 0.5rem;

  /* tipografia */
  --font-display: 'Syne', system-ui, sans-serif;
  --font-body: 'Nunito', system-ui, sans-serif;
  --step--1: 0.8125rem;
  --step-0: 0.9375rem;
  --step-1: 1.0625rem;
  --step-2: 1.375rem;
  --step-3: 1.875rem;
  --step-4: clamp(1.95rem, 7vw, 2.9rem);
}

:root[data-theme="light"] {
  --bg: #fafafa;
  --surface: rgba(255, 255, 255, 0.75);
  --surface-2: #f4f4f5;
  --border: #e4e4e7;

  --text: #18181b;
  --text-dim: #52525b;
  --text-faint: #71717a;

  --accent-text: #c2410c;
  --accent-tint: rgba(249, 115, 22, 0.06);
  --accent-glow: rgba(249, 115, 22, 0.10);
}
```

`--accent`, `--accent-soft`, `--on-accent` e todos os tokens de forma/tipografia **não mudam** entre temas. O tema claro redefine só o que precisa mudar — é o que impede o tema claro de virar uma lista de exceções.

---

## 2. As duas regras de contraste

Razões WCAG calculadas, não estimadas. Estas duas mudam o visual que existe hoje.

### 2.1 Laranja como texto: nunca `--accent` no tema claro

| Par | Razão | Veredito |
|---|---|---|
| `#f97316` sobre `#09090b` | **7,1:1** | AAA — pode |
| `#f97316` sobre `#fafafa` | **2,7:1** | reprova AA |
| `#c2410c` sobre `#fafafa` | **5,0:1** | AA — pode |

Por isso existe `--accent-text` separado de `--accent`. Sempre que o laranja for **texto**, use `--accent-text`. Quando for **preenchimento, borda, ícone ou traço de gráfico**, use `--accent` (que não muda).

**E isso vale para `:hover` e `:focus`, não só para o estado em repouso.** É onde a regra escapa: no tema escuro o instinto é clarear o laranja no hover, o que funciona (`--accent-soft` sobre `--bg` dá 8,8:1). No tema claro, clarear **quebra** — o hover fica menos legível que o repouso.

Medido num caso real (`.btn-link` do WeightChartS, tema claro):

| Estado | Cor | Razão | |
|---|---|---|---|
| repouso | `--accent-text` `#c2410c` | 5,2:1 | passa |
| hover | `--accent` `#f97316` | **2,8:1** | reprova |

No claro, **hover escurece**. Uma auditoria que só mede o estado em repouso não pega isso — meça hover e foco também.

### 2.2 Texto sobre laranja é quase-preto, nunca branco

| Par | Razão | Veredito |
|---|---|---|
| `#ffffff` sobre `#f97316` | **2,8:1** | reprova AA |
| `#09090b` sobre `#f97316` | **7,1:1** | AAA — pode |

Todo botão, chip ou toggle preenchido de laranja leva `color: var(--on-accent)`.

Onde isso aparece hoje:
- **Calculadora TMB** — `.sex-toggle button.active` usa `#fff`.
- **WeightChartS** — 7 ocorrências de `bg-orange-500` combinadas com `text-white` no `index.html`.

### 2.3 `--text-faint` não é cor de texto

`#71717a` medido contra cada superfície:

| Sobre | Escuro | Claro |
|---|---|---|
| `--bg` | 4,1:1 | 4,6:1 |
| `--surface` | **3,8:1** | 4,7:1 |
| `--surface-2` | **3,5:1** | **4,4:1** |

Só um desses seis pares chega perto do AA de 4,5:1 com folga. A regra prática é simples: **`--text-faint` é para elementos não-textuais** — setas, divisores, chevrons, ícones decorativos — e para texto grande (≥24px, ou ≥18,66px bold), onde o limite cai para 3:1.

Rodapé, legenda, unidade, metadado e qualquer texto pequeno usam `--text-dim` (6,6:1 sobre `--surface-2` no escuro).

Isto foi corrigido depois de a spec já estar publicada: a tabela da §4 mandava `unit` usar `--text-faint`, contradizendo esta seção. A §4 abaixo está certa; se você viu a versão antiga, o `unit` é `--text-dim`.

### 2.4 Tint laranja: `--accent-tint`, e no claro ele precisa ser fraco

O padrão "texto laranja sobre pílula laranja translúcida" (eyebrow, badge, chip) é traiçoeiro: quanto mais tint, mais escuro fica o fundo composto e menor o contraste com `--accent-text`.

Medido, texto `#c2410c` sobre o tint composto com `#fafafa`:

| Alpha | Razão | |
|---|---|---|
| 0,14 | 4,32:1 | reprova |
| 0,12 | 4,41:1 | reprova |
| 0,10 | 4,49:1 | reprova por um fio |
| **0,08** | 4,59:1 | passa |
| **0,06** | 4,68:1 | passa — valor adotado |

No escuro o problema não existe (0,12 dá 6,2:1), por isso o token é **assimétrico**: `0.12` no escuro, `0.06` no claro.

Nunca escreva `rgba(249,115,22,0.12)` direto num componente — use `var(--accent-tint)`. Um valor fixo funciona num tema e reprova no outro, silenciosamente.

**E não use `--accent-glow` como preenchimento.** São dois tokens laranja translúcidos e é fácil pegar o errado:

| Token | Para quê |
|---|---|
| `--accent-tint` | **preenchimento** de pílula, chip, badge, cartão de destaque |
| `--accent-glow` | **sombra**, gradiente de fundo, `::selection` — nunca fundo de algo com texto por cima |

O `--accent-glow` no claro é 0,10 — o valor que dá 4,49:1 e reprova por um fio. Um cartão que o use como fundo pode passar por acaso, se estiver sobre uma superfície mais clara que `--bg`, e reprovar quando alguém mudar o contexto. Esse caso foi encontrado de verdade no `.stat-accent` do WeightChartS.

### 2.5 Como medir sem inventar reprovação

As razões acima só valem se forem medidas direito. Três armadilhas já produziram falso alarme aqui — as três em sessões diferentes, com a mesma conclusão errada de "isto reprova".

**Espere a transição acabar.** Os apps animam `background-color` e `color` em 0,2s. Ler `getComputedStyle` logo depois de trocar `data-theme` devolve o valor **interpolado**, não o final — dá para ver o `html` já claro e o `body` ainda escuro no mesmo instante. Um `sleep` de ~600ms resolve; injetar `* { transition: none !important }` antes de medir resolve de forma determinística e é melhor. Esta é a reincidente: mordeu três vezes.

**Filtre o que está ocluso.** Revelar várias telas ao mesmo tempo para medir tudo de uma vez faz medir texto que está por baixo de um scrim, contra o fundo errado. Meça uma camada de cada vez, ou descarte elementos que não sejam o topo em `document.elementFromPoint` no próprio centro.

**Não confie no pixel; confie na medição.** Três falsos alarmes nesta série vieram de olhar imagem reduzida: um laranja "mais claro" que era idêntico, uns numerais "achatados" que são o desenho do Syne, e um gráfico "sem linha" que era artefato de captura de página inteira com `<canvas>`. Em todos, o pixel mentiu e o número acertou.

O corolário útil: quando a medição e a imagem discordam, **investigue antes de reportar**. Nenhum dos três era bug.

---

## 3. Tipografia

| Papel | Fonte | Pesos | Onde |
|---|---|---|---|
| Display | **Syne** | 600, 700, 800 | títulos, números grandes de resultado, nome de app |
| Corpo | **Nunito** | 400, 600, 700 | corpo, labels, botões, toda a interface |

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Syne:wght@600;700;800&display=swap" rel="stylesheet">
```

`body` usa `--font-body`. Syne entra por seleção explícita (`--font-display`), nunca em bloco de texto corrido.

Escala: `--step--1` (13px) é o piso — nada de texto abaixo disso.

**Cuidado com `--step-4` + gradiente.** Título grande em Syne 800 é largo: "Ferramentas" ocupa 473px a 46,4px. Se o título usar `background-clip: text` e transbordar a caixa, o trecho que passa fica **invisível** — sem aviso, sem scrollbar. O mínimo do clamp é 1,95rem justamente para caber numa coluna de 33rem a 375px de viewport. Se aumentar esse mínimo, confira o título mais longo do app numa tela estreita.

---

## 4. Componentes

Mesmos nomes e mesmo comportamento em todos os apps.

| Classe | Anatomia |
|---|---|
| `btn-primary` | altura ≥44px, `--radius-sm`, `background: var(--accent)`, `color: var(--on-accent)`, peso 700 |
| `btn-secondary` | altura ≥44px, `--radius-sm`, `background: var(--surface-2)`, `border: 1px solid var(--border)`, `color: var(--text)`, peso 600 |
| `btn-ghost` | sem fundo nem borda, `color: var(--text-dim)`, peso 600 |
| `field` | `label` (13px, 600, `--text-dim`) + `input-row` |
| `input-row` | altura 46–48px, `--radius-sm`, `background: var(--surface-2)`, `border: 1px solid var(--border)`; foco troca a borda para `--accent` + `box-shadow: 0 0 0 3px var(--accent-glow)` |
| `unit` | sufixo dentro do `input-row`, 13px/700, `--text-dim`, separado por `border-left` |
| `card` | `--radius`, `background: var(--surface)`, `border: 1px solid var(--border)` |
| `eyebrow` | pílula, 11px/700, `letter-spacing: .14em`, maiúsculas, `--accent-text`, fundo `var(--accent-tint)` (**nunca um rgba fixo** — ver §2.4), com ponto de 6px em `--accent` |
| `stat` | rótulo pequeno em `--text-dim` + número em `--font-display` 800 |
| `list-row` | linhas separadas por `border-top: 1px solid var(--border)` dentro de um container com `--radius-sm` |
| `segmented` | trilho `--surface-2` com `--radius-sm` e padding 5px; item ativo é `btn-primary` em miniatura |

Alvos de toque: **mínimo 44px** de altura em qualquer controle.

### `btn-back` — a volta para o portal

Os apps têm deploys separados, e o hub aponta **só de ida**: abre cada um com `target="_blank"` e fica na aba de trás. Isso mascara o problema no navegador, mas o beco sem saída é real em três situações:

- **PWA instalado** — o WeightChartS é `display: standalone`; instalado, não existe aba de hub nenhuma
- acesso direto por URL ou favorito
- a aba do hub foi fechada

Por isso cada app que **não** é o portal carrega um `btn-back` no header:

```html
<a href="https://apps-hub-beta.vercel.app"
   class="btn-back"
   aria-label="Voltar para o portal de apps">← Apps</a>
```

Regras:

- É um **link**, não botão — navega de verdade, e navega **na mesma aba**. Sem `target="_blank"`: abrir mais uma aba é o que criou o problema.
- Visual de `btn-secondary`, na mesma linha dos outros controles do header. Altura ≥44px como qualquer controle.
- URL absoluta e literal. Deploys separados: não existe caminho relativo que chegue ao hub.
- O Apps-Hub **não** tem `btn-back` — ele é o destino.

**Uma instância no header não basta.** Toda camada que cobre o header — tela cheia, `fixed inset-0`, overlay com z-index acima — precisa da sua própria. Senão a peça fica inalcançável exatamente onde ela é necessária.

Foi o que aconteceu na primeira versão desta seção, que dizia só "no header". No WeightChartS o `#authScreen` é `z-50` e o `#landingScreen` é `z-[55]`, contra `z-40` do header: os dois tapam o `btn-back` por completo. E `app.js` guarda `weightcharts_skip_landing`, então o usuário recorrente e deslogado cai **direto na tela de login** a cada abertura — vê o formulário e mais nada. No PWA instalado, sem aba de hub por trás, é beco sem saída no cenário mais comum de todos.

A verificação é mecânica: para cada camada de tela cheia do app, pergunte "daqui dá para sair?". Se a resposta depender do botão "voltar" do navegador, a camada precisa de um `btn-back`.

**E onde a camada tem variantes que se alternam, a saída pertence ao contêiner, não à variante.** O painel de auth do WeightChartS troca entre `#loginForm`, `#registerForm` e `#forgotPasswordForm` por `hidden`; um `btn-back` dentro de um deles sumiria ao trocar para "Criar conta" — desapareceria exatamente ao navegar. Ele fica ao nível do painel, presente nas três.

**Não** resolva com um elemento flutuante acima de tudo. Ficaria fora do `aria-modal="true"` do diálogo — leitor de tela ignora conteúdo fora do diálogo ativo, e a saída sumiria justamente para quem mais depende dela.

Se o domínio do hub mudar, são dois arquivos a atualizar. Está registrado em `Apps-Hub/CLAUDE.md`, junto do `curl` que recupera a URL pelo campo `homepage` do GitHub.

#### Em dev, o `btn-back` aponta para o hub local

Com a URL de produção fixa no HTML, clicar em "voltar" durante o desenvolvimento **ejeta você do localhost direto para o site publicado**. Por isso os apps reescrevem o destino quando estão em `localhost`.

Portas fixas — todos precisam rodar ao mesmo tempo para essa navegação existir:

| App | Porta | Como sobe |
|---|---|---|
| Apps-Hub | **8080** | `npx serve . -l 8080` |
| Calculadora TMB | **8081** | `npx serve . -l 8081` |
| Refeição Livre | **8082** | `npx serve . -l 8082` |
| WeightChartS | **3000** | `npm run dev` |

Antes disso eles colidiam: o WeightChartS usa 3000 e os outros diziam `npx serve .`, cujo default também é 3000.

O script vai no fim do `<body>`:

```html
<script>
  (function () {
    var h = location.hostname;
    if (h !== 'localhost' && h !== '127.0.0.1') return;
    var el = document.querySelectorAll('.btn-back');
    for (var i = 0; i < el.length; i++) el[i].href = 'http://localhost:8080/';
  })();
</script>
```

A direção importa: **o HTML carrega a URL de produção e o dev reescreve**, nunca o contrário. Assim o caminho sem JavaScript, e qualquer caminho onde o script falhe, degrada para o comportamento certo em produção — que é o único que os usuários veem.

**A comparação é por igualdade estrita, e isso não é detalhe de estilo.** Trocar por `hostname.indexOf('localhost') !== -1`, `startsWith` ou uma regex frouxa faz `localhost.evil.com` e `127.0.0.1.evil.com` passarem no teste. Aqui o estrago seria pequeno — o link apontaria para a máquina de quem visita em vez do hub —, mas comparar hostname por substring é o mesmo erro que produz falhas graves quando o alvo é verificação de origem em `postMessage` ou em fluxo de autenticação. A forma certa custa o mesmo: compare o hostname inteiro, com `!==`.

Se o hub não estiver de pé, o clique dá erro de conexão. É o sinal certo ("suba o hub"), e melhor que pular silenciosamente para produção.

### Foco — igual em todos, sem exceção

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}
```

### Elevação

A profundidade vem do brilho de acento, não de sombra preta pesada:

```css
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.05),
  0 14px 40px -20px var(--accent-glow),
  0 10px 30px -22px rgba(0, 0, 0, 0.75);
```

No tema claro, troque por sombra neutra — gradiente e brilho escuros sujam fundo claro:

```css
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
```

### Movimento

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

`Apps-Hub/styles.css` já traz uma versão desse bloco — serve de referência.

---

## 5. Tema claro

Aplicado em `document.documentElement.dataset.theme` (`"light"` / `"dark"`), padrão `dark`.

Mecanismo de referência: `WeightChartS/src/js/app.js` → `applyTheme()`. Nos apps sem autenticação, use a mesma forma sem a parte de Firestore.

Chaves de `localStorage` (origens diferentes, então não são compartilhadas):

| App | Chave |
|---|---|
| Apps-Hub | `appshub_theme` |
| Calculadora TMB | `tmb_theme` |
| WeightChartS | `weightcharts_theme_{uid}` (já existe) |

Ao trocar o tema, atualize também:

```js
document.querySelector('meta[name="theme-color"]').content =
  theme === 'light' ? '#fafafa' : '#09090b';
```

Para evitar o flash de tema errado, leia o `localStorage` num script **inline no `<head>`**, antes do CSS:

```html
<script>
  try {
    var t = localStorage.getItem('appshub_theme');
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch (e) { /* ignore */ }
</script>
```

---

## 6. Armadilha: case sensitivity no deploy

Windows/NTFS ignora maiúscula e minúscula em nomes de arquivo. A Vercel roda Linux e **não ignora**. Um `href="tokens.css"` apontando para um arquivo salvo como `Tokens.css` funciona local e desaparece em produção — 404 silencioso, sem erro de build, a página sobe sem estilo.

Já aconteceu neste workspace (`styles.css` vs `Styles.css`, registrado em `Apps-Hub/CLAUDE.md`). Como esta mudança **cria um arquivo novo em cada repo**, confira o nome letra por letra antes de commitar.

Confirmado empiricamente no deploy da Calculadora, não por teoria — mesmo deploy, duas caixas:

```
GET /tokens.css  -> 200   (e o conteúdo servido tem --on-accent)
GET /Tokens.css  -> 404
```

Se o arquivo tivesse sido salvo como `Tokens.css` no Windows, o `href="tokens.css"` daria 404 e a página subiria sem estilo — build verde, deploy "bem-sucedido", site quebrado.

---

## 7. Checklist por app

- [ ] `tokens.css` criado, com os dois blocos (`:root` e `:root[data-theme="light"]`), e referenciado **antes** do CSS do app
- [ ] Syne + Nunito carregados; `body` usando `--font-body`
- [ ] Nenhum hex de cor solto fora de `tokens.css`
- [ ] Nenhum `#fff` sobre preenchimento laranja
- [ ] Nenhum `--accent` puro usado como cor de texto no tema claro
- [ ] Toggle de tema funcionando, com persistência e sem flash ao recarregar
- [ ] `meta[name="theme-color"]` acompanha o tema
- [ ] Foco visível em todo elemento interativo, nos dois temas
- [ ] Bloco `prefers-reduced-motion` presente
- [ ] Controles com altura ≥44px
- [ ] Nome do arquivo novo conferido letra por letra
- [ ] Layout, ids e lógica preservados — esta é uma repaginação visual
