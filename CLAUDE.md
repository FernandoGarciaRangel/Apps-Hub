# Apps-Hub

Página estática (`index.html` + `styles.css`, sem build, sem dependências npm) com dois links para apps publicados em repositórios separados:

- WeightChartS → https://weight-charts.vercel.app/
- Calculadora TMB → https://calculadora-tmb-five.vercel.app/

Deploy: Vercel, projeto estático, root = `index.html`. Sem variáveis de ambiente.

## Pitfall: case sensitivity em produção

Windows/NTFS ignora maiúscula/minúscula em nomes de arquivo; a Vercel (Linux) não. Um `href`/`src` que não bate exatamente com o nome do arquivo no disco funciona local e quebra em produção sem aviso nenhum (404 silencioso — a página sobe sem CSS/asset, sem erro visível no build).

Já aconteceu aqui: `index.html` referenciava `styles.css` enquanto o arquivo era `Styles.css`. Corrigido. Antes de commitar qualquer novo arquivo ou referência, confirma que o nome bate letra por letra — não confia no fato de "funcionar local".

## Decisão: não unificar domínio com WeightChartS e Calculadora TMB

Avaliamos servir os três sob um domínio único via rewrite/proxy do Vercel (`/peso/*` → `weight-charts.vercel.app/*` etc.) e descartamos por enquanto. Motivo: o WeightChartS registra o service worker com path absoluto (`navigator.serviceWorker.register('/sw.js')`, em `index.html`). Sob um domínio compartilhado, isso tentaria registrar em `/sw.js` da raiz do domínio — não no subpath — o que gera 404 ou, pior, um service worker de escopo `/` controlando as três páginas (hub incluído).

Antes de tentar essa unificação de novo, o registro do SW no WeightChartS precisa virar relativo ao path atual (ou condicional por `location.pathname`). Até lá, este hub continua sendo só dois links externos — não é uma limitação técnica desta pasta, é uma decisão tomada sabendo do trade-off.
