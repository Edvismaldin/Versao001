import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class MarcarProntoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  localLevantamento: string;
}
