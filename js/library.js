import { criarPersistenciaAcervo } from './library-storage.js';

// Lógica de negócio do acervo (sem DOM). Funciona no navegador e no Node (testes).
export const SITUACOES = { DISPONIVEL: 'disponivel', EMPRESTADO: 'emprestado' };
export const CHAVE_ACERVO = 'biblioteca:livros';

export function validarLivro(d, anoAtual = new Date().getFullYear()) {
  const erros = [];
  const titulo = String(d?.titulo ?? '').trim();
  const autor = String(d?.autor ?? '').trim();
  const categoria = String(d?.categoria ?? '').trim();
  if (!titulo) erros.push('Informe o título.');
  else if (titulo.length > 120) erros.push('O título deve ter até 120 caracteres.');
  if (!autor) erros.push('Informe o autor.');
  else if (autor.length > 80) erros.push('O autor deve ter até 80 caracteres.');
  if (!categoria) erros.push('Informe a categoria.');
  else if (categoria.length > 40) erros.push('A categoria deve ter até 40 caracteres.');
  let ano = null;
  if (d?.ano !== '' && d?.ano != null) {
    ano = Number(d.ano);
    if (!Number.isInteger(ano) || ano < 1000 || ano > anoAtual + 1) {
      erros.push(`O ano deve ser um número inteiro entre 1000 e ${anoAtual + 1}.`);
    }
  }
  return { ok: erros.length === 0, erros, dados: { titulo, autor, categoria, ano } };
}

const novoId = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function criarAcervo(storage, chave = CHAVE_ACERVO) {
  const persistencia = criarPersistenciaAcervo(storage, chave);
  const { carregar, salvar } = persistencia;
  const falha = (...erros) => ({ ok: false, erros });

  return {
    obterAvisoArmazenamento: persistencia.obterAvisoArmazenamento,
    listar({ busca = '', situacao = '' } = {}) {
      const q = busca.trim().toLowerCase();
      return carregar()
        .filter((l) => !situacao || l.situacao === situacao)
        .filter((l) => !q || [l.titulo, l.autor, l.categoria].some((c) => c.toLowerCase().includes(q)))
        .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
    },
    obter: (id) => carregar().find((l) => l.id === id) ?? null,
    adicionar(entrada) {
      const v = validarLivro(entrada);
      if (!v.ok) return falha(...v.erros);
      const livro = { id: novoId(), ...v.dados, situacao: SITUACOES.DISPONIVEL, emprestadoPara: null, dataEmprestimo: null };
      const livros = carregar(); livros.push(livro); salvar(livros);
      return { ok: true, livro };
    },
    atualizar(id, entrada) {
      const livros = carregar();
      const i = livros.findIndex((l) => l.id === id);
      if (i < 0) return falha('Livro não encontrado.');
      const v = validarLivro(entrada);
      if (!v.ok) return falha(...v.erros);
      livros[i] = { ...livros[i], ...v.dados };
      salvar(livros);
      return { ok: true, livro: livros[i] };
    },
    remover(id) {
      const livros = carregar();
      if (!livros.some((l) => l.id === id)) return falha('Livro não encontrado.');
      salvar(livros.filter((l) => l.id !== id));
      return { ok: true };
    },
    emprestar(id, pessoa, hoje = new Date()) {
      const livros = carregar();
      const livro = livros.find((l) => l.id === id);
      if (!livro) return falha('Livro não encontrado.');
      const nome = String(pessoa ?? '').trim();
      if (!nome) return falha('Informe para quem o livro foi emprestado.');
      if (nome.length > 80) return falha('O nome deve ter até 80 caracteres.');
      if (livro.situacao === SITUACOES.EMPRESTADO) return falha('Este livro já está emprestado.');
      Object.assign(livro, { situacao: SITUACOES.EMPRESTADO, emprestadoPara: nome, dataEmprestimo: hoje.toISOString().slice(0, 10) });
      salvar(livros);
      return { ok: true, livro };
    },
    devolver(id) {
      const livros = carregar();
      const livro = livros.find((l) => l.id === id);
      if (!livro) return falha('Livro não encontrado.');
      if (livro.situacao !== SITUACOES.EMPRESTADO) return falha('Este livro não está emprestado.');
      Object.assign(livro, { situacao: SITUACOES.DISPONIVEL, emprestadoPara: null, dataEmprestimo: null });
      salvar(livros);
      return { ok: true, livro };
    },
  };
}
