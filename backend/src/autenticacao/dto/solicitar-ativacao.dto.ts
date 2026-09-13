import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class SolicitarAtivacaoDto {
  @IsString()
  @IsNotEmpty({
    message: 'O código do estudante é obrigatório.',
  })
  @MaxLength(30)
  codigo: string;

  @IsEmail(
    {},
    {
      message: 'Informe um email válido.',
    },
  )
  email: string;
}