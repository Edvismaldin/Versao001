// Smoke check of the actual PDF drawing methods, without database changes.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync('src/cartoes/cartoes.service.ts', 'utf8');
const start = source.indexOf('  async gerarPdf(');
const end = source.indexOf('  async bloquear(', start);
const js = ts.transpile('class Preview {' + source.slice(start, end) + '}', { target: ts.ScriptTarget.ES2022 });
const Preview = new Function('PDFDocument', 'QRCode', 'Buffer', 'existsSync', 'join', js + ';return Preview;')(
  require('pdfkit'), require('qrcode'), Buffer, fs.existsSync, path.join,
);
async function check() {
  for (const nome of ['Estudante de Exemplo', 'Estudante com nome completo muito comprido para verificar a disposição do cartão']) {
    const service = new Preview();
    service.buscarPorId = async () => ({
      id: 1, estudanteId: 1, numeroCartao: 'UCM-2026-620817', qrToken: 'exemplo-validacao', dataValidade: new Date('2028-12-31'),
      estudante: { nomeCompleto: nome, codigo: '7012202026', foto: null, curso: { nome: 'Tecnologia de Informação', faculdade: { sigla: 'FEG' } } },
    });
    const result = await service.gerarPdf(1, { perfil: 'ADMIN' });
    const pdf = await require('pdf-lib').PDFDocument.load(result.buffer);
    if (pdf.getPageCount() !== 2) throw new Error('O cartão deve ter uma página para a frente e outra para o verso.');
    const { width, height } = pdf.getPage(0).getSize();
    if (Math.abs(width - 242.65) > 1 || Math.abs(height - 153.07) > 1) {
      throw new Error('O PDF deve utilizar o tamanho CR80 em orientação horizontal.');
    }
    console.log(`PDF válido: ${result.buffer.length} bytes, duas páginas CR80; nome com ${nome.length} caracteres.`);
  }
}
check().catch(error => { console.error(error); process.exitCode = 1; });
