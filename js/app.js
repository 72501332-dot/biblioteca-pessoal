import { criarAcervo, SITUACOES, CHAVE_ACERVO } from './library.js';

const acervo = criarAcervo(window.localStorage);
const $ = (s) => document.querySelector(s);
const form = $('#form-livro'), lista = $('#lista'), aviso = $('#aviso');
let editandoId = null;
let avisoInicialExibido = false;

function mostrarAviso(texto, tipo = 'ok') {
  aviso.textContent = texto;
  aviso.dataset.tipo = tipo;
  aviso.hidden = false;
  clearTimeout(mostrarAviso.t);
  mostrarAviso.t = setTimeout(() => (aviso.hidden = true), 5000);
}
const erro = (r) => mostrarAviso(r.erros.join(' '), 'erro');

function el(tag, texto, classe) {
  const e = document.createElement(tag);
  if (texto != null) e.textContent = texto; // textContent evita injeção de HTML
  if (classe) e.className = classe;
  return e;
}
function botao(texto, fn, classe = '') {
  const b = el('button', texto, classe);
  b.type = 'button';
  b.addEventListener('click', fn);
  return b;
}

function render() {
  let livros;
  try {
    livros = acervo.listar({ busca: $('#busca').value, situacao: $('#filtro').value });
  } catch (e) {
    lista.replaceChildren();
    $('#vazio').hidden = true;
    if (!avisoInicialExibido) mostrarAviso(e instanceof Error ? e.message : String(e), 'erro');
    avisoInicialExibido = true;
    return;
  }
  if (!avisoInicialExibido) {
    const aviso = acervo.obterAvisoArmazenamento();
    if (aviso) mostrarAviso(aviso, 'erro');
    avisoInicialExibido = true;
  }
  lista.replaceChildren();
  $('#vazio').hidden = livros.length > 0;
  for (const l of livros) {
    const li = el('li', null, 'livro');
    li.dataset.situacao = l.situacao;
    const info = el('div', null, 'info');
    info.append(el('h3', l.titulo), el('p', `${l.autor} · ${l.categoria}${l.ano ? ` · ${l.ano}` : ''}`));
    const emp = l.situacao === SITUACOES.EMPRESTADO;
    info.append(el('span', emp ? `Emprestado a ${l.emprestadoPara} em ${l.dataEmprestimo.split('-').reverse().join('/')}` : 'Disponível', 'selo'));
    const acoes = el('div', null, 'acoes');
    acoes.append(
      emp ? botao('Devolver', () => executarAcao(() => acervo.devolver(l.id), 'Livro devolvido.'))
          : botao('Emprestar', () => {
              const nome = window.prompt('Emprestar para quem?');
              if (nome !== null) executarAcao(() => acervo.emprestar(l.id, nome), 'Empréstimo registrado.');
            }),
      botao('Editar', () => editar(l), 'sec'),
      botao('Excluir', () => {
        if (window.confirm(`Excluir "${l.titulo}"?`)) executarAcao(() => acervo.remover(l.id), 'Livro excluído.');
      }, 'perigo'),
    );
    li.append(info, acoes);
    lista.append(li);
  }
}
function acao(r, msg) { r.ok ? (mostrarAviso(msg), render()) : erro(r); }
function executarAcao(operacao, msg) {
  try { acao(operacao(), msg); }
  catch (e) { mostrarAviso(e instanceof Error ? e.message : String(e), 'erro'); }
}

function editar(l) {
  editandoId = l.id;
  for (const c of ['titulo', 'autor', 'categoria']) form.elements[c].value = l[c];
  form.elements.ano.value = l.ano ?? '';
  $('#titulo-form').textContent = 'Editar livro';
  $('#cancelar').hidden = false;
  form.elements.titulo.focus();
}
function limpar() {
  editandoId = null; form.reset();
  $('#titulo-form').textContent = 'Novo livro';
  $('#cancelar').hidden = true;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(form));
  try {
    const r = editandoId ? acervo.atualizar(editandoId, dados) : acervo.adicionar(dados);
    if (!r.ok) return erro(r);
    mostrarAviso(editandoId ? 'Livro atualizado.' : 'Livro cadastrado.');
    limpar(); render();
  } catch (e) {
    mostrarAviso(e instanceof Error ? e.message : String(e), 'erro');
  }
});
$('#cancelar').addEventListener('click', limpar);
$('#busca').addEventListener('input', render);
$('#filtro').addEventListener('change', render);
window.addEventListener('storage', (event) => {
  if (event.storageArea === window.localStorage && (event.key === null || event.key === CHAVE_ACERVO)) render();
});
render();
