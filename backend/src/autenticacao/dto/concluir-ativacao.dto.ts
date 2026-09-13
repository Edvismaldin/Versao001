import {
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class ConcluirAtivacaoDto {
  @IsString()
  @IsNotEmpty({
    message: 'O código do estudante é obrigatório.',
  })
  codigoEstudante: string;

  @IsString()
  @Length(6, 6, {
    message:
      'O código de ativação deve possuir 6 dígitos.',
  })
  codigoAtivacao: string;

  @IsString()
  @MinLength(8, {
    message:
      'A senha deve possuir pelo menos 8 caracteres.',
  })
  senha: string;

  @IsString()
  @MinLength(8)
  confirmarSenha: string;
}