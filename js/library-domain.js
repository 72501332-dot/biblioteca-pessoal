export const SITUACOES = { DISPONIVEL: 'disponivel', EMPRESTADO: 'emprestado' };

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
