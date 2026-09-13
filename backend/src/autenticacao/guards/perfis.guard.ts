import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  PERFIS_KEY,
} from '../decorators/perfis.decorator.js';

@Injectable()
export class PerfisGuard
  implements CanActivate
{
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const perfisPermitidos =
      this.reflector.getAllAndOverride<
        string[]
      >(
        PERFIS_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (
      !perfisPermitidos ||
      perfisPermitidos.length === 0
    ) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    const usuario =
      request.usuario;

    if (!usuario) {
      return false;
    }

    if (
      !perfisPermitidos.includes(
        usuario.perfil,
      )
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para esta operação.',
      );
    }

    return true;
  }
}