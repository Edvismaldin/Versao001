import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class AbrirSessaoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  disciplina: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  turma?: string;

  @IsOptional()
  @IsIn(['AULA', 'TESTE'])
  tipo?: 'AULA' | 'TESTE';

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'A hora de início deve estar no formato HH:mm.',
  })
  horaInicio?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  toleranciaMinutos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(240)
  limiteEntradaMinutos?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(600)
  duracaoMinutos?: number;
}
