import {
  IsInt,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CriarCartaoDto {
  @IsInt()
  @Min(1)
  estudanteId: number;

  @IsOptional()
  @IsDateString()
  dataValidade?: string;
}