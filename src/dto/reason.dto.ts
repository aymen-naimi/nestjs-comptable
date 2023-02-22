import { IsNotEmpty, IsString } from 'class-validator';

export class Reason {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  detail: string;
}
