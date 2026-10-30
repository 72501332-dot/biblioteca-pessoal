# Meu Acervo — Biblioteca pessoal

> **Sistema publicado:** https://72501332-dot.github.io/biblioteca-pessoal/

Aplicação web para cadastrar os livros que você tem, pesquisar, editar, excluir e registrar empréstimos e devoluções.

## Funcionalidades
- Cadastro, listagem, edição e exclusão de livros (CRUD): título, autor, categoria e ano (opcional).
- Pesquisa por título, autor ou categoria e filtro por situação.
- Empréstimo (com nome da pessoa e data) e devolução.
- Validação: campos obrigatórios, limites de tamanho e ano inteiro entre 1000 e o ano seguinte.
- Mensagens de sucesso e de erro; layout responsivo (computador e celular).

## Tecnologias
Ferramenta de IA utilizada:Ferramenta de IA utilizada: Claude (Anthropic), pelo site claude.ai, para planejar e gerar o código do sistemas.

## Persistência
Os dados ficam no `localStorage` do navegador. Escolha feita porque a atividade pede só HTML/JS e porque não exige conta nem servidor. **Limitações:** os dados são por navegador/dispositivo e somem se o usuário limpar os dados do site.

## Como executar
Abra `index.html` por um servidor local (módulos ES não funcionam via `file://`):
```bash
npx serve .          # ou: python3 -m http.server 8000
```
Depois acesse o endereço indicado (ex.: http://localhost:8000).

## Testes
Requer Node.js 18+. Não precisa instalar dependências.
```bash
npm test
```
Os testes cobrem validação (incluindo entradas inválidas), CRUD, empréstimo/devolução, busca e persistência.

## Publicação (GitHub Pages)
1. Envie o projeto ao GitHub. 2. Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`. 3. Copie o link gerado para o topo deste README.

## Auditoria e qualidade (preencher durante a atividade)
Execute os 4 prompts de `prompts_auditoria_qualidade_ia.txt` neste projeto, nesta ordem, e registre os resultados:

| Ordem | Prompt | Resultado / decisões |
|---|---|---|
| 1 | Prompt 4 — auditoria completa | Salvar como `AUDITORIA.md` |
| 2 | Prompt 1 — segurança | _resumo_ |
| 3 | Prompt 3 — testes de integração | _resumo_ |
| 4 | Prompt 2 — refatoração | _resumo_ |

**Atenção ao interpretar a auditoria:** como não há servidor, qualquer regra roda no navegador e pode ser alterada pelo usuário. Aqui isso é aceitável porque os dados são pessoais e locais, mas o achado deve constar no relatório. Não coloque senhas, tokens ou arquivos `.env` no repositório.

## Estrutura
```
index.html        interface
css/style.css     estilos
js/library.js     regras de negócio e persistência (testável)
js/app.js         interface e eventos
tests/            testes automatizados
```
