import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  AppModule,
  observabilidadeAtiva,
  ObserveInstrument,
} from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    observabilidadeAtiva ? { instrument: ObserveInstrument } : {},
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useStaticAssets('uploads/public', {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
await bootstrap();
