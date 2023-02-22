import { Controller, Post, HttpCode, Body, HttpStatus } from '@nestjs/common';
import { MovementsService } from './services/movements.service';
import { ValidationResponse } from './dto/validation-response.dto';
import { ValidationPayloadDto } from './dto/validation-payload.dto';
import { ValidationPipe, UsePipes } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post('/validation')
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(new ValidationPipe())
  validation(@Body() body: ValidationPayloadDto): ValidationResponse {
    return this.movementsService.getValidation(body.movements, body.balances);
  }
}
