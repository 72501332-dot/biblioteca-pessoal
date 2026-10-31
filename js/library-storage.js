export function criarPersistenciaAcervo(storage, chave) {
  let avisoArmazenamento = '';
  const preservarCorrompido = (valor) => {
    const base = `${chave}:backup-corrompido`;
    for (let indice = 0; ; indice++) {
      const chaveBackup = indice === 0 ? base : `${base}:${indice}`;
      const existente = storage.getItem(chaveBackup);
      if (existente === valor) return chaveBackup;
      if (existente === null) {
        try {
          storage.setItem(chaveBackup, valor);
        } catch {
          throw new Error('Não foi possível salvar uma cópia dos dados corrompidos; a gravação foi cancelada.');
        }
        return chaveBackup;
      }
    }
  };
  const carregar = () => {
    const bruto = storage.getItem(chave);
    if (bruto === null) return [];
    let v;
    try { v = JSON.parse(bruto); } catch {}
    if (Array.isArray(v)) return v;
    const chaveBackup = preservarCorrompido(bruto);
    avisoArmazenamento = `Os dados do acervo estavam corrompidos. Uma cópia foi salva em "${chaveBackup}".`;
    return [];
  };
  const salvar = (livros) => storage.setItem(chave, JSON.stringify(livros));

  return {
    carregar,
    salvar,
    obterAvisoArmazenamento: () => avisoArmazenamento,
  };
}
