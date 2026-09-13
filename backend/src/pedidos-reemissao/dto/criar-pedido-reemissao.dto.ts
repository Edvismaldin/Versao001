import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CriarPedidoReemissaoDto {
  @IsInt()
  @Min(1)
  cartaoId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  motivo: string;
}