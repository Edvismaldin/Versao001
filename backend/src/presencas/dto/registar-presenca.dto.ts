import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegistarPresencaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  qrCode: string;
}
