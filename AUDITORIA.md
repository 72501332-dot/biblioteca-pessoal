# Auditoria do Meu Acervo

## Escopo e resumo

Auditoria estática dos arquivos presentes no workspace e execução da suíte local `npm test`. Não foram feitas alterações no código da aplicação, instalações, migrations, chamadas a serviços externos nem verificações no site publicado. Como o projeto é uma aplicação estática que armazena dados no navegador, os fluxos de servidor, banco de dados, pagamento e autenticação não existem no escopo verificado.

### Cinco achados de maior relevância

1. **As regras e os dados ficam sob controle do navegador (médio).** Validação, empréstimos e CRUD são executados no cliente e persistidos no `localStorage`. Isso é coerente com o uso local descrito pelo projeto, mas não oferece integridade contra o próprio usuário ou uma fronteira de segurança para dados compartilhados.
2. **Dados pessoais do empréstimo ficam acessíveis no perfil do navegador (médio).** Nomes de pessoas e datas são persistidos sem proteção da aplicação. Qualquer pessoa com acesso ao mesmo perfil/origem do navegador pode inspecioná-los ou alterá-los.
3. **Escritas concorrentes entre abas podem perder atualizações (médio).** As operações fazem leitura, alteração e gravação separadas; `localStorage` não torna essa sequência uma transação.
4. **JSON inválido é interpretado como acervo vazio (baixo).** A recuperação evita que a interface quebre, mas não sinaliza a corrupção; uma gravação posterior pode substituir os dados que ainda estavam no valor inválido.
5. **Os testes não exercitam a aplicação no navegador nem uma rota real (baixo no desenho atual).** Os 11 testes passam, mas usam armazenamento em memória e cobrem o módulo de regras. Não há servidor ou rota para testes de integração; portanto, fluxos remotos não foram testados.

## 1. Testes de integração

| Achado | Risco | Arquivo e linha | Correção sugerida |
|---|---|---|---|
| A ferramenta configurada é o runner nativo do Node (`node --test`); `npm test` executou 11 testes: 11 passaram, 0 falharam e 0 foram ignorados. | Baixo | [`package.json`](package.json#L6), [`tests/library.test.js`](tests/library.test.js#L1) | Manter `npm test` como comando da suíte atual. Não há necessidade de banco de teste enquanto não houver backend. |
| Os testes chamam diretamente as funções do acervo com um `Map` em memória; não dirigem a aplicação no navegador nem chamam uma rota real. | Baixo | [`tests/library.test.js`](tests/library.test.js#L5), [`tests/library.test.js`](tests/library.test.js#L8) | Se a aplicação ganhar rotas ou backend, criar testes de integração contra ambiente e banco de teste separados. No desenho atual, não há rota para esse tipo de teste. |
| Cadastro, edição, exclusão, empréstimo, devolução, validação, busca e persistência têm testes unitários do módulo. Login, checkout, assinatura e webhooks não foram encontrados. | Baixo | [`tests/library.test.js`](tests/library.test.js#L8), [`js/library.js`](js/library.js#L47) | Nenhuma ação para login/pagamento é necessária no app atual. Se forem adicionados, cobrir os fluxos e erros antes de publicar a funcionalidade. |
| Não existe banco de dados no projeto; portanto, banco de teste separado de produção não se aplica. | Baixo | [`README.md`](README.md#L17), [`js/app.js`](js/app.js#L3) | Se um banco for introduzido, configurar credenciais e dados de teste isolados antes de executar a suíte contra ele. |

## 2. Confiança no cliente

| Achado | Risco | Arquivo e linha | Correção sugerida |
|---|---|---|---|
| Validação de campos e ano, estado disponível/emprestado e operações CRUD são decididos no JavaScript do navegador. O usuário pode alterar o código e o `localStorage`; não há servidor que recalcule ou autorize mudanças. | Médio | [`js/library.js`](js/library.js#L5), [`js/library.js`](js/library.js#L47), [`js/app.js`](js/app.js#L73) | Para o uso atual, registrar como limite aceito de uma aplicação local, sem contas ou dados compartilhados. Se os dados passarem a ser confiáveis ou compartilhados, mover validação e autorização para um backend e validar novamente no servidor. |
| O acervo, incluindo nome da pessoa que tomou o livro emprestado e data, é salvo em texto JSON no `localStorage` da origem. | Médio | [`js/app.js`](js/app.js#L3), [`js/library.js`](js/library.js#L28), [`js/library.js`](js/library.js#L70), [`README.md`](README.md#L17) | Informar que os dados são locais e legíveis por quem usa o mesmo perfil do navegador. Não guardar ali dados que exijam confidencialidade ou controle de acesso; para isso, usar armazenamento autenticado no servidor. |
| Não foram encontradas chaves ou tokens de serviços nos arquivos de aplicação examinados. `.env.example` contém apenas nomes comentados, e `.gitignore` ignora `.env` e `.env.*`, exceto o exemplo. Histórico Git e bundle do site publicado não foram auditados; por isso, ausência de exposição passada não está verificada. | Baixo | [`.env.example`](.env.example#L1), [`.gitignore`](.gitignore#L1) | Nenhuma rotação é indicada por um segredo encontrado nesta cópia. Para confirmar exposição anterior, revisar histórico e artefato publicado antes de concluir que nunca houve publicação. |
| Não foi encontrado Supabase, outro banco exposto por API, schema, RLS ou policy. A chave `service_role` não aparece no código examinado; seu uso fora desta cópia não foi verificado. | Baixo | [`package.json`](package.json#L1), [`js/app.js`](js/app.js#L3) | Sem ação de policy ou migration aplicável. Se um banco/API for adicionado, revisar RLS e garantir que chaves administrativas permaneçam apenas no servidor. |
| A interface usa `textContent` para inserir texto do acervo, em vez de interpretar esses valores como HTML. | Baixo | [`js/app.js`](js/app.js#L19), [`js/app.js`](js/app.js#L38) | Nenhuma correção identificada neste ponto. Manter a inserção de conteúdo não confiável como texto. |

## 3. Race condition

| Achado | Risco | Arquivo e linha | Correção sugerida |
|---|---|---|---|
| Adicionar, atualizar, remover, emprestar e devolver leem o array, alteram uma cópia em memória e depois gravam o array inteiro. Duas abas da mesma origem podem ler o mesmo estado e a última gravação pode apagar a alteração da outra. O código não usa constraint, transação ou lock de linha; nenhum lock em memória/Redis foi encontrado. | Médio | [`js/library.js`](js/library.js#L28), [`js/library.js`](js/library.js#L47), [`js/library.js`](js/library.js#L54), [`js/library.js`](js/library.js#L70) | Para o escopo local, documentar o limite e evitar tratar o acervo como registro compartilhado concorrente. Se concorrência e integridade forem requisitos, usar operações atômicas em armazenamento de servidor; um banco com transação/atualização condicional pode proteger a regra sem depender de lock em memória. |
| Há uma checagem de estado antes de emprestar/devolver, mas ela não é atômica junto com a gravação. Em uma única aba, a interface redesenha após a ação; entre abas, a checagem não impede disputa ou sobrescrita. | Médio | [`js/library.js`](js/library.js#L70), [`js/app.js`](js/app.js#L39), [`js/app.js`](js/app.js#L57) | A mesma recomendação de persistência atômica se múltiplas abas/usuários precisarem operar sobre o mesmo acervo. O teste atual valida repetição sequencial, não simultânea. |

## 4. Idempotência

| Achado | Risco | Arquivo e linha | Correção sugerida |
|---|---|---|---|
| Não há webhook, gateway de pagamento ou endpoint no projeto; verificação de assinatura por corpo bruto, registro único de eventos e chave de idempotência de gateway não se aplicam. | Baixo | [`index.html`](index.html#L35), [`package.json`](package.json#L1) | Nenhuma ação aplicável. Se pagamentos/webhooks forem introduzidos, verificar assinatura no servidor e persistir o ID único do evento antes de aplicar efeitos. |
| Empréstimo repetido é recusado quando o estado já aparece como emprestado; a proteção é uma checagem cliente e não cobre duas abas concorrentes. Exclusão repetida retorna erro de livro não encontrado. | Baixo | [`js/library.js`](js/library.js#L64), [`tests/library.test.js`](tests/library.test.js#L42) | Adequado ao fluxo local sequencial. Não tratar essas checagens como idempotência ou proteção transacional para ações concorrentes. |

## 5. Separação de responsabilidades

| Achado | Risco | Arquivo e linha | Correção sugerida |
|---|---|---|---|
| `js/app.js` concentra renderização, manipulação do formulário, eventos e chamadas ao módulo de acervo. Não contém acesso direto a serviço externo. | Baixo | [`js/app.js`](js/app.js#L1), [`js/app.js`](js/app.js#L30), [`js/app.js`](js/app.js#L59) | A divisão atual entre UI e módulo de acervo já é razoável para o tamanho do app. Evitar refatoração ampla sem necessidade funcional. |
| `js/library.js` é o arquivo mais longo encontrado (91 linhas) e reúne validação/regras do domínio com leitura e gravação do `localStorage`. | Baixo | [`js/library.js`](js/library.js#L5), [`js/library.js`](js/library.js#L28), [`js/library.js`](js/library.js#L47) | Candidato número 1 para uma futura extração pequena do adaptador de persistência, caso o projeto cresça ou receba outro armazenamento. No tamanho atual, a separação existente é testável e não exige refatoração imediata. |
| Não foram identificados serviços externos, duplicação relevante ou lock global em memória. O estado de tela `editandoId` é local ao módulo da UI. | Baixo | [`js/app.js`](js/app.js#L3), [`js/app.js`](js/app.js#L59) | Nenhuma correção necessária no escopo atual. |

## Próximo prompt recomendado

**Prompt 1 — Auditoria de segurança**, limitado a confirmar e registrar os achados aplicáveis ao modelo local. Não há vulnerabilidade de servidor ou banco identificada para corrigir neste projeto. Antes de executar correções que adicionem backend ou mudem a persistência, confirme que essa mudança de arquitetura é desejada; ela não é necessária para o uso pessoal local descrito no README.