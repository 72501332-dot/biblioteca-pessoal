# Relatório de segurança

## Escopo

Análise estática do projeto front-end, usando [AUDITORIA.md](./AUDITORIA.md) como base. O app não tem backend: os dados ficam no `localStorage`. O site publicado, configurações de hospedagem e histórico Git não foram verificados.

## Achados

| # | Severidade | Arquivo | Linhas | Achado, risco e correção proposta | Confiança |
|---|---|---|---|---|---|
| 1 | 🟡 MEDIUM | [js/app.js](js/app.js), [js/library.js](js/library.js), [README.md](README.md) | 3; 35, 70–78; 18 | Nome de quem pegou o livro e data ficam no `localStorage`, acessível a quem usa o mesmo perfil. Avisar sobre o armazenamento local e não guardar dados que exijam confidencialidade. | 9/10 |
| 2 | 🟡 MEDIUM | [js/library.js](js/library.js), [AUDITORIA.md](AUDITORIA.md) | 5–23, 47–61, 70–87; 9, 28 | Regras de validação e estado dos empréstimos são controlados pelo cliente e podem ser alterados. Isso é compatível com uso pessoal local; não mover para servidor neste escopo. Se os dados precisarem ser compartilhados ou confiáveis, validar e autorizar no servidor. | 9/10 |
| 3 | ⚪ LOW | [js/library.js](js/library.js), [AUDITORIA.md](AUDITORIA.md) | 51, 61, 67, 78, 87; 11, 38–39 | Duas abas podem sobrescrever alterações concorrentes e perder dados. Documentar o limite e não tratar o armazenamento como registro compartilhado; reavaliar a arquitetura se concorrência for necessária. | 9/10 |
| 4 | ⚪ LOW | [js/library.js](js/library.js), [AUDITORIA.md](AUDITORIA.md) | 29–35, 51, 61, 67, 78, 87; 12 | JSON inválido é interpretado como acervo vazio; uma gravação posterior pode substituir os dados. Sinalizar a corrupção e evitar sobrescrever os dados inválidos sem recuperação explícita. | 9/10 |
| 5 | ⚪ LOW — não se aplica | [index.html](index.html), [js/library.js](js/library.js) | 13–24; 5–23 | Preço, desconto e frete não foram encontrados; não há regras comerciais para mover ao servidor. | 9/10 |
| 6 | ⚪ LOW — não se aplica | [index.html](index.html), [js/app.js](js/app.js), [package.json](package.json) | 9–34; 3, 73–80; 1–9 | Permissões, papel de admin e limites de plano não foram encontrados. | 9/10 |
| 7 | ⚪ LOW — não se aplica | [.env.example](.env.example), [.gitignore](.gitignore), [js/app.js](js/app.js) | 1–5; 1–3; 3 | Não foram encontrados segredos ou valores de credenciais. `API_SECRET_KEY` e `DATABASE_URL` aparecem apenas como exemplos comentados; nenhuma rotação é indicada por esta cópia. O histórico e o bundle publicado não foram auditados. | 8/10 |
| 8 | ⚪ LOW — não se aplica | [js/app.js](js/app.js), [js/library.js](js/library.js), [package.json](package.json) | 3; 28–35; 1–9 | Não há banco, tabelas, API de banco, RLS ou policies identificados; os dados ficam no `localStorage`. | 9/10 |

## Validação

`npm test`: 11 testes passaram. Os testes cobrem o módulo de regras, não o site publicado.
