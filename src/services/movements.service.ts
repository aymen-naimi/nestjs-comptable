import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { ValidationResponse } from '../dto/validation-response.dto';
import { CONSTANTES } from './constantes';
import { Reason } from '../dto/reason.dto';
import * as moment from 'moment';
import { ReasonTypes, ReasonTitles } from './enums';
import { CheckpointDto } from '../dto/checkpoint.dto';
import { MovementDto } from '../dto/movement.dto';

type ObjectWithDate = CheckpointDto | MovementDto;

@Injectable()
export class MovementsService {
  public getValidation(
    movements: MovementDto[],
    balances: CheckpointDto[],
  ): ValidationResponse {
    let reasons: Reason[] = this.checkDoubles(movements, balances);

    if (reasons.length) {
      throw new HttpException(
        { message: CONSTANTES.ERR_MSG, reasons },
        HttpStatus.I_AM_A_TEAPOT,
      );
    }

    movements = movements.sort(this.callbackSortDate);
    balances = balances.sort(this.callbackSortDate);

    const usedMovements: MovementDto[] = this.removeUnusedMovements(
      movements,
      balances
    );

    reasons = this.validate(usedMovements, balances);

    if (reasons.length) {
      throw new HttpException(
        { message: CONSTANTES.ERR_MSG, reasons },
        HttpStatus.I_AM_A_TEAPOT,
      );
    } else {
      return { message: CONSTANTES.ACCEPED, reasons: [] };
    }
  }

  /**
   * @returns array of err
   */
  private checkMovementsDoubles(movements: MovementDto[]): Reason[] {
    const errors: Reason[] = [];
    const movementsMap: Map<number, number> = new Map();
    movements.forEach((mov) => {
      movementsMap.set(mov.id, (movementsMap.get(mov.id) || 0) + 1);
    });
    movementsMap.forEach((v, movId) => {
      if (v > 1) {
        errors.push({
          type: ReasonTypes.MOVEMENT_USED_MANY_TIMES,
          title: ReasonTitles.MOVEMENT_USED_MANY_TIMES,
          detail: `the movement with ( id = ${movId} ) exists  ${v} times`,
        });
      }
    });
    return errors;
  }

  /**
   * @returns array of err
   */
  private checkBalancesDoubles(balances: CheckpointDto[]): Reason[] {
    const errors: Reason[] = [];
    const balancesMap: Map<string, number> = new Map();
    balances.forEach((bl) => {
      balancesMap.set(bl.date, (balancesMap.get(bl.date) || 0) + 1);
    });

    balancesMap.forEach((v, bldate) => {
      if (v > 1) {
        errors.push({
          type: ReasonTypes.CHECKPOINT_USED_MANY_TIMES,
          title: ReasonTitles.CHECKOPINT_USED_MANY_TIMES,
          detail: `the checkpoint with ( date = ${bldate} ) exists  ${v} times`,
        });
      }
    });
    return errors;
  }

  /**
   * callback function to sort balances or movements
   */
  private callbackSortDate(a: ObjectWithDate, b: ObjectWithDate): number {
    if (moment(a.date).isBefore(moment(b.date))) {
      return -1;
    } else if (moment(a.date).isAfter(moment(b.date))) {
      return 1;
    } else {
      return 0;
    }
  }

  /**
   * to remove mouvenets before first checkpoint and after last  checkpoint
   * @returns array of MovementDto
   */
  private removeUnusedMovements(
    movements: MovementDto[],
    balances: CheckpointDto[],
  ): MovementDto[] {
    return movements.reduce((acc: MovementDto[], mov: MovementDto) => {
      if (
        moment(mov.date).isAfter(moment(balances[0].date)) &&
        moment(mov.date).isSameOrBefore(
          moment(balances[balances.length - 1].date),
        )
      ) {
        return [...acc, mov];
      } else {
        return acc;
      }
    }, []);
  }

  /**
   * @returns array of err
   */
  private checkDoubles(
    movements: MovementDto[],
    balances: CheckpointDto[],
  ): Reason[] {
    return [
      ...this.checkMovementsDoubles(movements),
      ...this.checkBalancesDoubles(balances),
    ];
  }

  /**
   * to check movements between checkpoints
   * @returns array of err
   */
  private validate(
    movements: MovementDto[],
    balances: CheckpointDto[],
  ): Reason[] {
    const errors: Reason[] = [];
    for (let i = 0; i < balances.length - 1; i++) {
      const movs: MovementDto[] = [];
      while (
        movements[0] &&
        moment(movements[0].date).isAfter(moment(balances[i].date)) &&
        moment(movements[0].date).isSameOrBefore(moment(balances[i + 1].date))
      ) {
        movs.push(movements.shift() as MovementDto);
      }

      const movementsVariation: number = movs.reduce((acc, item) => {
        return acc + item.amount;
      }, 0);
      const balancesVariation: number =
        balances[i + 1].balance - balances[i].balance;

      if (movementsVariation !== balancesVariation) {
        errors.push({
          type: ReasonTypes.MOVEMENTS_IS_NOT_COMPATIBLE_CHECPOINTS,
          title: ReasonTitles.MOVEMENTS_IS_NOT_COMPATIBLE_CHECPOINTS,
          detail: `the mouvements between ${balances[i].date} and ${
            balances[i + 1].date
          } are invalid`,
        });
      }
    }

    return errors;
  }
}
