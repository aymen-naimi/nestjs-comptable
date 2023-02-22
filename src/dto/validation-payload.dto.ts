import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CheckpointDto } from './checkpoint.dto';
import { MovementDto } from './movement.dto';

export class ValidationPayloadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovementDto)
  movements: MovementDto[];

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CheckpointDto)
  balances: CheckpointDto[];
}
