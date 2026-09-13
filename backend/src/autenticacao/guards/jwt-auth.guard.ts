import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<Request>();

    const token =
      this.extrairToken(request);

    if (!token) {
      throw new UnauthorizedException(
        'Token de autenticação não informado.',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        });

      (request as any).usuario = payload;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Token inválido ou expirado.',
      );
    }
  }

  private extrairToken(
    request: Request,
  ): string | undefined {
    const [tipo, token] =
      request.headers.authorization?.split(' ') ?? [];

    return tipo === 'Bearer'
      ? token
      : undefined;
  }
}