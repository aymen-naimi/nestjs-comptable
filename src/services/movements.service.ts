import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { ValidationResponse } from '../dto/validation-response.dto';
import { CONSTANTES } from './constantes';
import { Reason } from '../dto/reason.dto';
import * as dayjs from 'dayjs';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrBefore);
import { ReasonTypes, ReasonTitles } from './enums';
import { CheckpointDto } from '../dto/checkpoint.dto';
import { MovementDto } from '../dto/movement.dto';

interface ObjectWithDate {
  date: string;
}

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
      balances,
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
    if (dayjs(a.date).isBefore(dayjs(b.date))) {
      return -1;
    } else if (dayjs(a.date).isAfter(dayjs(b.date))) {
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
        dayjs(mov.date).isAfter(dayjs(balances[0].date)) &&
        dayjs(mov.date).isSameOrBefore(
          dayjs(balances[balances.length - 1].date),
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
        dayjs(movements[0].date).isAfter(dayjs(balances[i].date)) &&
        dayjs(movements[0].date).isSameOrBefore(dayjs(balances[i + 1].date))
      ) {
        movs.push(movements.shift() as MovementDto);
      }

      this.updateErrors(errors, movs, balances[i], balances[i + 1]);
    }

    return errors;
  }

  private updateErrors(
    errors: Reason[],
    movs: MovementDto[],
    currentCheck: CheckpointDto,
    nextCheck: CheckpointDto,
  ) {
    const balancesVariation: number = nextCheck.balance - currentCheck.balance;

    const movementsVariation: number = movs.reduce((acc, item) => {
      return acc + item.amount;
    }, 0);

    if (!this.compareFloats(movementsVariation, balancesVariation)) {
      errors.push({
        type: ReasonTypes.MOVEMENTS_IS_NOT_COMPATIBLE_CHECPOINTS,
        title: ReasonTitles.MOVEMENTS_IS_NOT_COMPATIBLE_CHECPOINTS,
        detail: `the mouvements between ${currentCheck.date} and ${nextCheck.date} are invalid`,
      });
    }
  }

  private compareFloats(a: number, b: number) {
    return parseFloat(a.toFixed(2)) === parseFloat(b.toFixed(2));
  }
}
