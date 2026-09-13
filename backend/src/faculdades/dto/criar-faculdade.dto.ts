import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CriarFaculdadeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  sigla: string;
}