import { Account } from "./LifePlanSetting";
import { AmountPlanResult } from "./LifePlanSimulationResult";

// Abstract class AmountPlan
export abstract class AmountPlan {
  name?: string;
  isIncome: boolean;
  account: string;

  constructor(name: string | undefined, isIncome: boolean, account: string) {
    this.name = name;
    this.isIncome = isIncome;
    this.account = account;
  }

  static fromJSON(data: any): AmountPlan {
    if (data.type === "Step") {
      return StepAmountPlan.fromJSON(data);
    } else if (data.type === "Linear") {
      return LinearAmountPlan.fromJSON(data);
    } else if (data.type === "Pulse") {
      return PulseAmountPlan.fromJSON(data);
    } else {
      throw new Error("Invalid type");
    }
  }

  abstract calcAmount(year: number): number;

  calcAmounts(years: number[]): number[] {
    return years.map((year) => this.calcAmount(year));
  }

  doPlan(accountDictionary: { [key: string]: Account }, year: number): void {
    const account = accountDictionary[this.account];
    if (this.isIncome) {
      account.balance += this.calcAmount(year);
    } else {
      account.balance -= this.calcAmount(year);
    }
  }

  getResult(years: number[]): AmountPlanResult {
    return { amountPlan: this, amounts: this.calcAmounts(years) };
  }
}

// Supporting class AmountPoint
export type AmountPoint = {
  year: number;
  amount: number;
};

// LinearAmountPlan class
export class LinearAmountPlan extends AmountPlan {
  type: string = "Linear";
  points: AmountPoint[];

  static fromJSON(data: any): StepAmountPlan {
    return new LinearAmountPlan(
      data.name,
      data.isIncome,
      data.account,
      data.points
    );
  }

  constructor(
    name: string | undefined,
    isIncome: boolean,
    account: string,
    points: AmountPoint[]
  ) {
    super(name, isIncome, account);
    this.points = points;
  }

  calcAmount(year: number): number {
    let startPoint: AmountPoint | null = null;
    let endPoint: AmountPoint | null = null;

    startPoint =
      this.points
        .sort((a, b) => a.year - b.year)
        .reverse()
        .find((point) => point.year <= year) || null;

    endPoint =
      this.points
        .sort((a, b) => a.year - b.year)
        .find((point) => point.year > year) || null;

    if (!startPoint) {
      return 0;
    } else if (!endPoint) {
      return startPoint.amount;
    }

    const amount =
      startPoint.amount +
      ((year - startPoint.year) * (endPoint.amount - startPoint.amount)) /
        (endPoint.year - startPoint.year);

    return Math.round(amount);
  }
}

// StepAmountPlan class
export class StepAmountPlan extends AmountPlan {
  type: string = "Step";
  points: AmountPoint[];

  constructor(
    name: string | undefined,
    isIncome: boolean,
    account: string,
    points: AmountPoint[]
  ) {
    super(name, isIncome, account);
    this.points = points;
  }

  static fromJSON(data: any): StepAmountPlan {
    return new StepAmountPlan(
      data.name,
      data.isIncome ?? false,
      data.account,
      data.points
    );
  }

  calcAmount(year: number): number {
    let startPoint: AmountPoint | null = null;

    for (const point of this.points) {
      if (point.year <= year) {
        startPoint = point;
      }
    }

    return startPoint ? startPoint.amount : 0;
  }
}

export class PulseAmountPlan extends AmountPlan {
  type: string = "Pulse";
  points: AmountPoint[];

  static fromJSON(data: any): StepAmountPlan {
    return new PulseAmountPlan(
      data.name,
      data.isIncome,
      data.account,
      data.points
    );
  }

  constructor(
    name: string | undefined,
    isIncome: boolean,
    account: string,
    points: AmountPoint[]
  ) {
    super(name, isIncome, account);
    this.points = points;
  }

  calcAmount(year: number): number {
    for (const point of this.points) {
      if (point.year === year) {
        return point.amount;
      }
    }
    return 0;
  }
}
