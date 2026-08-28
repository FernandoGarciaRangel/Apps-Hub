
# Apps Hub

Página estática única com dois links para os apps já publicados:

- [WeightChartS](https://weight-charts.vercel.app/)
- [Calculadora TMB](https://calculadora-tmb-five.vercel.app/)

Sem build, sem dependências npm — `index.html` + `styles.css`.

## Deploy (Vercel)

1. Cria um repositório novo (ex: `apps-hub`) e sobe estes dois arquivos.
2. Importa o repo na Vercel com as definições por omissão (root = `index.html`).
3. Pronto — sem variáveis de ambiente, sem passos extra.

## Rodar localmente

```
npx serve . -l 8080
```

A porta 8080 é fixa por convenção: o `btn-back` dos outros dois apps aponta para `http://localhost:8080/` quando roda em localhost. Calculadora TMB usa 8081 e WeightChartS usa 3000, para os três subirem ao mesmo tempo.
