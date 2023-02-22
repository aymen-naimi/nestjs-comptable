import { IsNotEmpty, IsString, IsNumber, Matches } from 'class-validator';

export class MovementDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  @Matches('[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
  date: string; // format 'yyyy-mm-dd' like '2023-06-04'

  @IsString()
  @IsNotEmpty()
  wording: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
