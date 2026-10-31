# Meu Acervo — Biblioteca pessoal

> **Sistema publicado:** https://72501332-dot.github.io/biblioteca-pessoal/
> **Repositório:** https://github.com/72501332-dot/biblioteca-pessoal

Aplicação web para cadastrar os livros que você tem, pesquisar, editar, excluir e registrar empréstimos e devoluções.

## Funcionalidades
- Cadastro, listagem, edição e exclusão de livros (CRUD): título, autor, categoria e ano (opcional).
- Pesquisa por título, autor ou categoria e filtro por situação (disponível ou emprestado).
- Empréstimo (com nome da pessoa e data) e devolução.
- Validação: campos obrigatórios, limites de tamanho (inclusive 80 caracteres para o nome no empréstimo) e ano inteiro entre 1000 e o ano seguinte.
- Mensagens de sucesso e de erro; layout responsivo (computador e celular).
- Aviso e cópia de segurança quando os dados salvos no navegador estão corrompidos.
- A tela se atualiza sozinha quando o acervo é alterado em outra aba.

## Tecnologias
HTML, CSS e JavaScript puro (módulos ES). Sem framework e sem back-end. Testes com o executor nativo do Node.js (`node:test`).

**Ferramentas de IA utilizadas:** Claude (Anthropic), pelo site claude.ai, para planejar e gerar o código do sistema; GitHub Copilot, no VS Code, para executar os prompts de auditoria, segurança, testes e refatoração.

## Persistência
Os dados ficam no `localStorage` do navegador. A escolha foi feita porque a atividade pede só HTML/JS e porque não exige conta nem servidor.

**Limitações conhecidas (aceitas para um acervo pessoal):**
- Os dados são por navegador e por dispositivo, e somem se o usuário limpar os dados do site.
- Tudo roda no navegador, então quem usa o sistema pode ler e alterar os dados (inclusive o nome de quem pegou um livro emprestado) pelas ferramentas do navegador. Por isso, não guarde informações confidenciais aqui. Para dados compartilhados ou confiáveis seria necessário um servidor que valide e autorize as operações.
- Duas abas gravando ao mesmo tempo podem sobrescrever uma à outra, porque o `localStorage` não tem transações. A tela se atualiza entre abas, mas a gravação simultânea não é bloqueada.

## Como executar
Abra `index.html` por um servidor local (módulos ES não funcionam via `file://`):
```bash
npx serve .          # ou: python3 -m http.server 8000
```
Depois acesse o endereço indicado (ex.: http://localhost:3000).

## Testes
Requer Node.js 18 ou mais novo. Não precisa instalar dependências. Comando único para rodar todos os testes:
```bash
npm test
```
São 30 testes em 12 grupos: validação (inclusive entradas inválidas e limites), CRUD, empréstimo e devolução, busca, persistência entre instâncias e recuperação de dados corrompidos.

## Publicação (GitHub Pages)
Settings → Pages → Branch `main`, pasta `/ (root)`.

## Estrutura
```
index.html               interface
css/style.css            estilos
js/app.js                interface e eventos
js/library.js            fachada pública e serviço do acervo (busca e persistência)
js/library-domain.js     regras de negócio: validação, empréstimo e devolução
js/library-storage.js    leitura, gravação e backup de dados corrompidos
tests/library.test.js    testes automatizados
AUDITORIA.md             relatório do Prompt 4
SECURITY-REVIEW.md       relatório do Prompt 1
evidencias/              capturas de tela
.env.example             sem variáveis: o projeto não usa segredos
```

## Auditoria e qualidade com IA

Os quatro prompts foram aplicados nesta ordem, com o código já funcionando.

| Ordem | Prompt | O que apareceu | O que eu decidi |
|---|---|---|---|
| 1 | Prompt 4 — auditoria completa (`AUDITORIA.md`) | Como não há servidor, banco, pagamentos nem segredos, a maioria dos itens não se aplica. Riscos reais: regras e dados sob controle do navegador, dados de empréstimo legíveis, escritas concorrentes entre abas, JSON corrompido virando lista vazia e testes só do módulo. | Seguir para o Prompt 1 sem adicionar backend, porque não é necessário para um acervo pessoal. |
| 2 | Prompt 1 — segurança (`SECURITY-REVIEW.md`) | Achados 1 e 2 (dados e regras no navegador): médio. Achados 3 e 4 (abas concorrentes e JSON corrompido): baixo. Os demais: não se aplica. | Corrigi o 4 (backup do dado corrompido e aviso na tela), o 3 (atualização entre abas pelo evento `storage`) e acrescentei o limite de 80 caracteres no nome do empréstimo. Os achados 1 e 2 ficaram documentados como limites conhecidos. |
| 3 | Prompt 3 — testes de integração | Os 14 testes existentes deixavam lacunas: repetição, limites, operações em outros registros, ids inexistentes e persistência entre instâncias. | Aprovei as frases de comportamento e a IA escreveu 16 testes novos, sem alterar os antigos. Total: 30 passando. Nenhum bug real foi encontrado. |
| 4 | Prompt 2 — refatoração segura | O `js/library.js` misturava regras de negócio e armazenamento (candidato nº 1 do `AUDITORIA.md`). | Dividi em três passos, rodando `npm test` e testando no navegador a cada um: `library-storage.js`, `library-domain.js` (validação) e regras de empréstimo e devolução. O comportamento não mudou. |

**Lista de bugs encontrados (sem correção, anotados):** o programa considera válida qualquer lista salva no `localStorage`, sem conferir os itens. Uma lista com `null` ou itens sem título faria a listagem dar erro. Só acontece se alguém editar os dados à mão.

## Relato final

*(Revise e ajuste com suas palavras antes de entregar.)*

**O que a IA acertou:** montou um sistema completo e funcional, separou a lógica da interface de modo que dava para testar, e nos prompts de auditoria não inventou vulnerabilidades de servidor que não existiam. Marcou o que não verificou, como o histórico do Git e o site publicado.

**O que precisei corrigir ou decidir:**
- Na correção do JSON corrompido, a primeira proposta da IA lançava um erro, o que quebraria um teste existente e deixaria a tela em branco. Pedi uma alternativa: guardar uma cópia dos dados corrompidos e mostrar um aviso.
- Pedi que a atualização entre abas também funcionasse quando os dados são limpos em outra aba (`event.key` nulo).
- Percebi que o campo do nome no empréstimo não tinha limite de tamanho e pedi a correção com teste.
- Nos testes de integração, decidi que cadastrar o mesmo livro duas vezes é permitido, porque posso ter duas cópias.
- Na refatoração, exigi que o `library.js` continuasse existindo como fachada e que os imports tivessem a extensão `.js`, senão o site publicado não carregaria.

**O que aprendi:**
- Tudo que roda no navegador pode ser lido e alterado, então regras importantes precisam estar em um servidor quando os dados forem compartilhados.
- Um teste que passa não prova que a tela funciona: testei também no navegador a cada passo.
- Refatorar é mover código sem mudar comportamento, com os testes como rede de segurança, e bug encontrado no meio do caminho vai para uma lista, não para a correção imediata.
- Aceitar sugestões da IA sem ler é arriscado: conferi cada mudança, e a primeira proposta nem sempre era a melhor.