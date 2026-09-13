import { SetMetadata } from '@nestjs/common';

export const PERFIS_KEY = 'perfis';

export const Perfis = (
  ...perfis: string[]
) =>
  SetMetadata(
    PERFIS_KEY,
    perfis,
  );