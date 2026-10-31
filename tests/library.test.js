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

describe('cadastro — limites e repetição', () => {
  test('aceita os tamanhos máximos dos campos e os anos nos extremos válidos', () => {
    const a = criarAcervo(memoria());
    const atual = new Date().getFullYear();

    for (const ano of [1000, atual + 1]) {
      const resultado = a.adicionar({
        titulo: 'T'.repeat(120),
        autor: 'A'.repeat(80),
        categoria: 'C'.repeat(40),
        ano: String(ano),
      });

      assert.equal(resultado.ok, true);
      assert.equal(resultado.livro.titulo.length, 120);
      assert.equal(resultado.livro.autor.length, 80);
      assert.equal(resultado.livro.categoria.length, 40);
      assert.equal(resultado.livro.ano, ano);
    }

    assert.equal(a.listar().length, 2);
  });

  test('rejeita campos textuais acima do limite sem gravar o livro', () => {
    const a = criarAcervo(memoria());
    const entradas = [
      { ...livro, titulo: 'T'.repeat(121) },
      { ...livro, autor: 'A'.repeat(81) },
      { ...livro, categoria: 'C'.repeat(41) },
    ];

    for (const entrada of entradas) {
      assert.equal(a.adicionar(entrada).ok, false);
      assert.equal(a.listar().length, 0);
    }
  });

  test('persiste registros distintos ao cadastrar duas vezes o mesmo livro', () => {
    const a = criarAcervo(memoria());
    const primeiro = a.adicionar(livro);
    const segundo = a.adicionar(livro);

    assert.equal(primeiro.ok, true);
    assert.equal(segundo.ok, true);
    assert.notEqual(primeiro.livro.id, segundo.livro.id);
    assert.equal(a.listar().length, 2);
  });
});

describe('edição — validação, repetição e isolamento', () => {
  test('rejeita limites excedidos ou anos fora do intervalo sem alterar o livro original', () => {
    const a = criarAcervo(memoria());
    const { livro: original } = a.adicionar(livro);
    const atual = new Date().getFullYear();
    const entradasInvalidas = [
      { ...livro, titulo: 'T'.repeat(121) },
      { ...livro, autor: 'A'.repeat(81) },
      { ...livro, categoria: 'C'.repeat(41) },
      { ...livro, ano: '999' },
      { ...livro, ano: String(atual + 2) },
    ];

    for (const entrada of entradasInvalidas) {
      assert.equal(a.atualizar(original.id, entrada).ok, false);
      assert.deepEqual(a.obter(original.id), original);
    }
  });

  test('aceita os tamanhos máximos dos campos e os anos nos extremos válidos', () => {
    const a = criarAcervo(memoria());
    const atual = new Date().getFullYear();
    const { livro: original } = a.adicionar(livro);

    for (const ano of [1000, atual + 1]) {
      const resultado = a.atualizar(original.id, {
        titulo: 'T'.repeat(120),
        autor: 'A'.repeat(80),
        categoria: 'C'.repeat(40),
        ano: String(ano),
      });

      assert.equal(resultado.ok, true);
      assert.equal(resultado.livro.titulo.length, 120);
      assert.equal(resultado.livro.autor.length, 80);
      assert.equal(resultado.livro.categoria.length, 40);
      assert.equal(resultado.livro.ano, ano);
    }
  });

  test('preserva situação e dados de empréstimo ao editar um livro emprestado', () => {
    const a = criarAcervo(memoria());
    const { livro: cadastrado } = a.adicionar(livro);
    const emprestado = a.emprestar(cadastrado.id, 'Ana', new Date('2024-06-15T12:00:00Z')).livro;
    const dadosEmprestimo = {
      situacao: emprestado.situacao,
      emprestadoPara: emprestado.emprestadoPara,
      dataEmprestimo: emprestado.dataEmprestimo,
    };

    const resultado = a.atualizar(cadastrado.id, { ...livro, titulo: 'Esaú e Jacó' });

    assert.equal(resultado.ok, true);
    assert.deepEqual(
      {
        situacao: resultado.livro.situacao,
        emprestadoPara: resultado.livro.emprestadoPara,
        dataEmprestimo: resultado.livro.dataEmprestimo,
      },
      dadosEmprestimo,
    );
  });

  test('atualizar repetidamente o mesmo ID não cria registros nem altera outros livros', () => {
    const a = criarAcervo(memoria());
    const { livro: alvo } = a.adicionar(livro);
    const { livro: outro } = a.adicionar({ ...livro, titulo: 'O Cortiço' });
    const edicao = { ...livro, titulo: 'Esaú e Jacó' };

    assert.equal(a.atualizar(alvo.id, edicao).ok, true);
    assert.equal(a.atualizar(alvo.id, edicao).ok, true);
    assert.equal(a.obter(alvo.id).titulo, 'Esaú e Jacó');
    assert.deepEqual(a.obter(outro.id), outro);
    assert.equal(a.listar().length, 2);
  });
});

describe('exclusão — repetição e isolamento', () => {
  test('a segunda exclusão retorna erro e mantém os demais registros', () => {
    const a = criarAcervo(memoria());
    const { livro: alvo } = a.adicionar(livro);
    const { livro: outro } = a.adicionar({ ...livro, titulo: 'O Cortiço' });

    assert.equal(a.remover(alvo.id).ok, true);
    assert.deepEqual(a.remover(alvo.id), { ok: false, erros: ['Livro não encontrado.'] });
    assert.deepEqual(a.obter(outro.id), outro);
    assert.equal(a.listar().length, 1);
  });
});

describe('empréstimo — ID e isolamento', () => {
  test('rejeita ID inexistente sem alterar os registros existentes', () => {
    const a = criarAcervo(memoria());
    const { livro: cadastrado } = a.adicionar(livro);

    assert.deepEqual(a.emprestar('inexistente', 'Ana'), { ok: false, erros: ['Livro não encontrado.'] });
    assert.deepEqual(a.obter(cadastrado.id), cadastrado);
  });

  test('emprestar um livro não altera os demais registros', () => {
    const a = criarAcervo(memoria());
    const { livro: alvo } = a.adicionar(livro);
    const { livro: outro } = a.adicionar({ ...livro, titulo: 'O Cortiço' });

    assert.equal(a.emprestar(alvo.id, 'Ana').ok, true);
    assert.deepEqual(a.obter(outro.id), outro);
  });
});

describe('devolução — ID, repetição e isolamento', () => {
  test('rejeita ID inexistente sem alterar os registros existentes', () => {
    const a = criarAcervo(memoria());
    const { livro: cadastrado } = a.adicionar(livro);

    assert.deepEqual(a.devolver('inexistente'), { ok: false, erros: ['Livro não encontrado.'] });
    assert.deepEqual(a.obter(cadastrado.id), cadastrado);
  });

  test('a segunda devolução retorna erro e não altera os demais registros', () => {
    const a = criarAcervo(memoria());
    const { livro: alvo } = a.adicionar(livro);
    const { livro: outro } = a.adicionar({ ...livro, titulo: 'O Cortiço' });
    a.emprestar(alvo.id, 'Ana');

    assert.equal(a.devolver(alvo.id).ok, true);
    assert.deepEqual(a.devolver(alvo.id), { ok: false, erros: ['Este livro não está emprestado.'] });
    assert.deepEqual(a.obter(outro.id), outro);
  });
});

describe('busca — campos e critérios combinados', () => {
  test('pesquisa por título e categoria sem diferenciar maiúsculas de minúsculas', () => {
    const a = criarAcervo(memoria());
    const { livro: domCasmurro } = a.adicionar(livro);
    const { livro: cortico } = a.adicionar({ ...livro, titulo: 'O Cortiço', categoria: 'Drama' });

    assert.deepEqual(a.listar({ busca: 'DOM CASMURRO' }).map((l) => l.id), [domCasmurro.id]);
    assert.deepEqual(a.listar({ busca: 'dRaMa' }).map((l) => l.id), [cortico.id]);
  });

  test('combina busca e situação, retornando apenas registros que atendem aos dois critérios', () => {
    const a = criarAcervo(memoria());
    const { livro: emprestado } = a.adicionar(livro);
    const { livro: disponivel } = a.adicionar({ ...livro, titulo: 'Dom Casmurro — segunda cópia' });
    a.emprestar(emprestado.id, 'Ana');

    assert.deepEqual(
      a.listar({ busca: 'dom casmurro', situacao: SITUACOES.EMPRESTADO }).map((l) => l.id),
      [emprestado.id],
    );
    assert.deepEqual(
      a.listar({ busca: 'dom casmurro', situacao: SITUACOES.DISPONIVEL }).map((l) => l.id),
      [disponivel.id],
    );
  });
});

describe('persistência — alterações entre instâncias', () => {
  test('outra instância observa edições e exclusões feitas no mesmo armazenamento', () => {
    const s = memoria();
    const escritor = criarAcervo(s);
    const leitor = criarAcervo(s);
    const { livro: alvo } = escritor.adicionar(livro);
    const { livro: outro } = escritor.adicionar({ ...livro, titulo: 'O Cortiço' });

    escritor.atualizar(alvo.id, { ...livro, titulo: 'Esaú e Jacó' });
    assert.equal(leitor.obter(alvo.id).titulo, 'Esaú e Jacó');

    escritor.remover(outro.id);
    assert.equal(leitor.obter(outro.id), null);
    assert.equal(leitor.listar().length, 1);
  });

  test('outra instância observa os estados de empréstimo e devolução', () => {
    const s = memoria();
    const escritor = criarAcervo(s);
    const leitor = criarAcervo(s);
    const { livro: cadastrado } = escritor.adicionar(livro);

    escritor.emprestar(cadastrado.id, 'Ana', new Date('2024-06-15T12:00:00Z'));
    assert.deepEqual(
      {
        situacao: leitor.obter(cadastrado.id).situacao,
        emprestadoPara: leitor.obter(cadastrado.id).emprestadoPara,
        dataEmprestimo: leitor.obter(cadastrado.id).dataEmprestimo,
      },
      { situacao: SITUACOES.EMPRESTADO, emprestadoPara: 'Ana', dataEmprestimo: '2024-06-15' },
    );

    escritor.devolver(cadastrado.id);
    assert.deepEqual(
      {
        situacao: leitor.obter(cadastrado.id).situacao,
        emprestadoPara: leitor.obter(cadastrado.id).emprestadoPara,
        dataEmprestimo: leitor.obter(cadastrado.id).dataEmprestimo,
      },
      { situacao: SITUACOES.DISPONIVEL, emprestadoPara: null, dataEmprestimo: null },
    );
  });
});
