/**
 * Baixa um PDF protegido na versão web.
 * O navegador não aceita o cabeçalho Authorization num link normal, por isso
 * o ficheiro é obtido com fetch antes de criar o download local.
 */
export async function baixarPdfNaWeb(
  url: string,
  nomeArquivo: string,
  token: string,
) {
  const resposta = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resposta.ok) {
    throw new Error('Não foi possível gerar o PDF.');
  }

  const ficheiro = await resposta.blob();

  if (ficheiro.size < 100) {
    throw new Error('O ficheiro PDF recebido está incompleto.');
  }

  const urlLocal = URL.createObjectURL(
    new Blob([ficheiro], { type: 'application/pdf' }),
  );
  const link = document.createElement('a');

  link.href = urlLocal;
  link.download = nomeArquivo;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(urlLocal);
  }, 1000);
}
