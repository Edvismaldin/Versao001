const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync('src/cartoes/cartoes.service.ts', 'utf8');
const start = source.indexOf('  async gerarPdf(');
const end = source.indexOf('  async bloquear(', start);
const js = ts.transpile(
  'class Preview {' + source.slice(start, end) + '}',
  { target: ts.ScriptTarget.ES2022 },
);

const Preview = new Function(
  'PDFDocument',
  'QRCode',
  'Buffer',
  'existsSync',
  'join',
  js + ';return Preview;',
)(
  require('pdfkit'),
  require('qrcode'),
  Buffer,
  fs.existsSync,
  path.join,
);

function cartaoBase(id, nome) {
  return {
    id,
    estudanteId: id,
    numeroCartao: `UCM-2026-62081${id}`,
    qrToken: `exemplo-validacao-${id}`,
    dataValidade: new Date('2028-12-31'),
    estado: 'ATIVO',
    estudante: {
      nomeCompleto: nome,
      codigo: `701220202${id}`,
      foto: null,
      curso: {
        nome: 'Tecnologia de Informacao',
        faculdade: {
          sigla: 'FEG',
        },
      },
    },
  };
}

async function check() {
  const service = new Preview();
  service.prisma = {
    cartaoAcademico: {
      findMany: async () => [
        cartaoBase(1, 'Primeiro Estudante'),
        cartaoBase(2, 'Segundo Estudante'),
        cartaoBase(3, 'Terceiro Estudante'),
      ],
    },
  };

  const result = await service.gerarPdfLote('1,2,3', {
    perfil: 'ADMIN',
  });
  const pdf = await require('pdf-lib').PDFDocument.load(result.buffer);

  if (pdf.getPageCount() !== 6) {
    throw new Error('O lote deve criar frente e verso para cada cartao.');
  }

  console.log(
    `PDF em lote valido: ${result.buffer.length} bytes, ${pdf.getPageCount()} paginas CR80.`,
  );
}

check().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
