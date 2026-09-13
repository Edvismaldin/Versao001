import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class RejeitarPedidoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  observacao: string;
}
