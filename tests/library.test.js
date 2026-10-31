import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { criarAcervo, validarLivro, SITUACOES } from '../js/library.js';

const memoria = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const livro = { titulo: 'Dom Casmurro', autor: 'Machado de Assis', categoria: 'Romance', ano: '1899' };

describe('cadastro', () => {
  test('cadastra livro válido como disponível', () => {
    const a = criarAcervo(memoria());
    const r = a.adicionar(livro);
    assert.equal(r.ok, true);
    assert.equal(r.livro.situacao, SITUACOES.DISPONIVEL);
    assert.equal(a.listar().length, 1);
  });
  test('rejeita campos obrigatórios vazios', () => {
    const r = criarAcervo(memoria()).adicionar({ titulo: '  ', autor: '', categoria: '' });
    assert.equal(r.ok, false);
    assert.equal(r.erros.length, 3);
  });
  test('rejeita ano negativo, decimal, futuro distante ou texto', () => {
    for (const ano of ['-5', '1999.5', '3000', 'abc']) assert.equal(validarLivro({ ...livro, ano }).ok, false, ano);
  });
  test('ano é opcional', () => assert.equal(validarLivro({ ...livro, ano: '' }).ok, true));
});

describe('edição e exclusão', () => {
  test('atualiza e exclui', () => {
    const a = criarAcervo(memoria());
    const { livro: l } = a.adicionar(livro);
    assert.equal(a.atualizar(l.id, { ...livro, titulo: 'Esaú e Jacó' }).livro.titulo, 'Esaú e Jacó');
    assert.equal(a.remover(l.id).ok, true);
    assert.equal(a.listar().length, 0);
  });
  test('id inexistente retorna erro', () => {
    const a = criarAcervo(memoria());
    assert.equal(a.atualizar('x', livro).ok, false);
    assert.equal(a.remover('x').ok, false);
  });
});

describe('empréstimo', () => {
  test('empresta e devolve', () => {
    const a = criarAcervo(memoria());
    const { livro: l } = a.adicionar(livro);
    assert.equal(a.emprestar(l.id, 'Ana').livro.situacao, SITUACOES.EMPRESTADO);
    assert.equal(a.devolver(l.id).livro.emprestadoPara, null);
  });
  test('não empresta duas vezes nem sem nome', () => {
    const a = criarAcervo(memoria());
    const { livro: l } = a.adicionar(livro);
    assert.equal(a.emprestar(l.id, '').ok, false);
    a.emprestar(l.id, 'Ana');
    assert.equal(a.emprestar(l.id, 'Bia').ok, false);
  });
  test('aceita nome de 80 caracteres e rejeita 81 sem alterar o livro', () => {
    const a = criarAcervo(memoria());
    const { livro: l } = a.adicionar(livro);

    const aceito = a.emprestar(l.id, 'A'.repeat(80));
    assert.equal(aceito.ok, true);
    assert.equal(aceito.livro.emprestadoPara.length, 80);

    const { livro: disponivel } = a.adicionar({ ...livro, titulo: 'Memórias Póstumas' });
    const rejeitado = a.emprestar(disponivel.id, 'B'.repeat(81));
    assert.equal(rejeitado.ok, false);
    assert.deepEqual(rejeitado.erros, ['O nome deve ter até 80 caracteres.']);
    assert.equal(a.obter(disponivel.id).situacao, SITUACOES.DISPONIVEL);
    assert.equal(a.obter(disponivel.id).emprestadoPara, null);
  });
  test('não devolve livro disponível', () => {
    const a = criarAcervo(memoria());
    const { livro: l } = a.adicionar(livro);
    assert.equal(a.devolver(l.id).ok, false);
  });
});

describe('busca e persistência', () => {
  test('pesquisa por autor e filtra por situação', () => {
    const a = criarAcervo(memoria());
    a.adicionar(livro);
    const { livro: o } = a.adicionar({ titulo: 'O Cortiço', autor: 'Aluísio Azevedo', categoria: 'Romance' });
    a.emprestar(o.id, 'Ana');
    assert.equal(a.listar({ busca: 'machado' }).length, 1);
    assert.equal(a.listar({ situacao: 'emprestado' }).length, 1);
  });
  test('dados persistem entre instâncias e JSON corrompido não quebra', () => {
    const s = memoria();
    criarAcervo(s).adicionar(livro);
    assert.equal(criarAcervo(s).listar().length, 1);
    s.setItem('biblioteca:livros', '{quebrado');
    assert.deepEqual(criarAcervo(s).listar(), []);
  });
});

describe('recuperação de armazenamento', () => {
  test('preserva JSON corrompido ou que não seja lista e expõe aviso', () => {
    for (const original of ['{quebrado', '{"livro":1}']) {
      const s = memoria();
      s.setItem('biblioteca:livros', original);
      const a = criarAcervo(s);

      assert.deepEqual(a.listar(), []);
      assert.match(a.obterAvisoArmazenamento(), /cópia foi salva/);
      a.adicionar(livro);
      assert.equal(s.getItem('biblioteca:livros:backup-corrompido'), original);
    }
  });

  test('interrompe a gravação se não conseguir preservar os dados corrompidos', () => {
    const original = '{quebrado';
    const s = {
      getItem: (chave) => chave === 'biblioteca:livros' ? original : null,
      setItem: (chave) => {
        if (chave === 'biblioteca:livros:backup-corrompido') throw new Error('Armazenamento cheio.');
      },
    };
    const a = criarAcervo(s);

    assert.throws(() => a.adicionar(livro), /gravação foi cancelada/);
    assert.equal(s.getItem('biblioteca:livros'), original);
  });
});
