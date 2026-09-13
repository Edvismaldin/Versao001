import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private readonly transporter = nodemailer.createTransport({
    host:
      process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.test'
        ? process.env.SMTP_HOST
        : 'smtp.gmail.com',

    port: Number(process.env.SMTP_PORT ?? 465),

    secure:
      process.env.SMTP_SECURE === 'true' ||
      process.env.SMTP_PORT === '465' ||
      !process.env.SMTP_PORT,

    auth: {
      user:
        process.env.SMTP_USER ??
        process.env.SMTP_USERNAME ??
        'cedvismaldinjoao@gmail.com',
      pass:
        process.env.SMTP_PASS ??
        process.env.SMTP_PASSWORD ??
        'alrhonbfnfcnruuc',
    },
  });

  async verificarConexao() {
    if (process.env.USE_SMTP === 'false') {
      this.logger.warn('Envio SMTP está desativado.');
      return false;
    }

    await this.transporter.verify();
    this.logger.log('Conexão SMTP estabelecida.');
    return true;
  }

  async enviarEmail(
    destinatario: string,
    assunto: string,
    texto: string,
  ) {
    if (process.env.USE_SMTP === 'false') {
      this.logger.warn(
        `SMTP desativado. Email não enviado para ${destinatario}.`,
      );
      return;
    }

    if (!destinatario) {
      return;
    }

    try {
      const remetente =
        process.env.SMTP_USER ??
        process.env.SMTP_USERNAME ??
        'cedvismaldinjoao@gmail.com';

      return await this.transporter.sendMail({
        from: {
          name: process.env.SMTP_FROM_NAME ?? 'UCM Cartões',
          address: remetente,
        },
        to: destinatario,
        subject: assunto,
        text: texto,
      });
    } catch (error) {
      const detalhe =
        error instanceof Error
          ? error.message
          : 'Erro SMTP desconhecido.';

      this.logger.error(
        `Falha ao enviar email para ${destinatario}: ${detalhe}`,
      );

      throw new InternalServerErrorException(
        'Não foi possível enviar o email.',
      );
    }
  }
}
