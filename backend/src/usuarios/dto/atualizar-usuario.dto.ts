import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import {
  PerfilInterno,
} from './criar-usuario.dto.js';

export class AtualizarUsuarioDto {
  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  senha?: string;

  @IsOptional()
  @IsEnum(PerfilInterno)
  perfil?: PerfilInterno;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
