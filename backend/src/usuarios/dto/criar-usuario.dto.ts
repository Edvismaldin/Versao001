import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export enum PerfilInterno {
  ADMIN = 'ADMIN',
  PROFESSOR = 'PROFESSOR',
  OPERADOR_CARTAO = 'OPERADOR_CARTAO',
  RESPONSAVEL = 'RESPONSAVEL',
}

export class CriarUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  senha: string;

  @IsEnum(PerfilInterno)
  perfil: PerfilInterno;
}
