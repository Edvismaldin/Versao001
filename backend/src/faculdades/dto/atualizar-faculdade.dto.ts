import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AtualizarFaculdadeDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  sigla?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}