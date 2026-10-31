import { criarPersistenciaAcervo } from './library-storage.js';
import { SITUACOES, validarLivro } from './library-domain.js';

// Lógica de negócio do acervo (sem DOM). Funciona no navegador e no Node (testes).
export { SITUACOES, validarLivro } from './library-domain.js';
export const CHAVE_ACERVO = 'biblioteca:livros';

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
