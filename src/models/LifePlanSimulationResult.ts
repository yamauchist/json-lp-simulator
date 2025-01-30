import { AmountPlan } from "./AmountPlan";
import { Account, Child, Parent } from "./LifePlanSetting";

export class LifePlanSimulationResult {
  years: number[];
  parentResults: ParentResult[];
  childResults: ChildResult[];
  otherAmountPlanResults: AmountPlanResult[];
  accountResults: AccountResult[];

  constructor() {
    this.years = [];
    this.parentResults = [];
    this.childResults = [];
    this.otherAmountPlanResults = [];
    this.accountResults = [];
  }

  get incomeResults(): AmountPlanResult[] {
    const results: AmountPlanResult[] = [];
    this.parentResults.forEach((parent) => {
      if (parent.incomeResult) results.push(parent.incomeResult);
    });
    this.otherAmountPlanResults.forEach((result) => {
      if (result.amountPlan.isIncome) {
        results.push(result);
      }
    });
    return results;
  }

  get outcomeResults(): AmountPlanResult[] {
    const results: AmountPlanResult[] = [];
    this.parentResults.forEach((parent) => {
      if (parent.outcomeResult) results.push(parent.outcomeResult);
    });
    // this.childResults.forEach((child) => {
    //   results.push(child.educationCostResult);
    // });
    this.otherAmountPlanResults.forEach((result) => {
      if (!result.amountPlan.isIncome) {
        results.push(result);
      }
    });
    return results;
  }

  exportCsv(): string {
    const lines: string[] = [];
    lines.push(`西暦,,${this.years.join(",")}`);

    this.parentResults.forEach((parent, i) => {
      const line =
        i === 0
          ? `年齢,${parent.parent.name},${parent.ages.join(",")}`
          : `,${parent.parent.name},${parent.ages
              .map((age) => (age > 0 ? age.toString() : ""))
              .join(",")}`;
      lines.push(line);
    });

    this.childResults.forEach((child) => {
      const line = `,${child.child.name},${child.ages.map((age) => (age >= 0 ? age.toString() : "")).join(",")}`;
      lines.push(line);
    });

    lines.push("");

    const incomeResults = this.incomeResults;
    incomeResults.forEach((income, i) => {
      const line =
        i === 0
          ? `収入,${income.amountPlan.name},${income.amounts.join(",")}`
          : `,${income.amountPlan.name},${income.amounts.join(",")}`;
      lines.push(line);
    });

    this.accountResults.forEach((accountResult) => {
      if (accountResult.account.rate > 0) {
        lines.push(
          `,${accountResult.account.name}利息,${accountResult.interests.join(
            ","
          )}`
        );
      }
    });

    const outcomeResults = this.outcomeResults;
    outcomeResults.forEach((outcome, i) => {
      const line =
        i === 0
          ? `支出,${outcome.amountPlan.name},${outcome.amounts.join(",")}`
          : `,${outcome.amountPlan.name},${outcome.amounts.join(",")}`;
      lines.push(line);
    });

    this.accountResults.forEach((accountResult, i) => {
      lines.push(
        `${i === 0 ? "資産," : ","}${
          accountResult.account.name
        }残高,${accountResult.balances.join(",")}`
      );
    });

    let transferIndex = 0;
    this.accountResults.forEach((accountResult) => {
      accountResult.transferResults.forEach((transferResult) => {
        const line = `${transferIndex === 0 ? "振替," : ","}${
          accountResult.account.name
        }から${
          transferResult.transferPlan.account
        },${transferResult.amount.join(",")}`;
        lines.push(line);
        transferIndex++;
      });
    });

    return lines.join("\n");
  }
}

export type AmountPlanResult = {
  amountPlan: AmountPlan;
  amounts: number[];
};

export class ParentResult {
  parent: Parent;
  ages: number[];
  incomeResult?: AmountPlanResult;
  outcomeResult?: AmountPlanResult;

  constructor(
    parent: Parent,
    ages: number[],
    incomeResult?: AmountPlanResult,
    outcomeResult?: AmountPlanResult
  ) {
    this.parent = parent;
    this.ages = ages;
    this.incomeResult = incomeResult;
    this.outcomeResult = outcomeResult;
  }
}

export class ChildResult {
  child: Child;
  ages: number[];
  educationCostResult: AmountPlanResult | undefined;

  constructor(
    child: Child,
    ages: number[],
    educationCostResult: AmountPlanResult | undefined
  ) {
    this.child = child;
    this.ages = ages;
    this.educationCostResult = educationCostResult;
  }
}

export class AccountResult {
  account: Account;
  balances: number[];
  interests: number[];
  transferResults: TransferResult[];

  constructor(account: Account) {
    this.account = account;
    this.balances = [];
    this.interests = [];
    this.transferResults = [];
  }
}

export class TransferResult {
  transferPlan: AmountPlan;
  amount: number[];

  constructor(transferPlan: AmountPlan, amount: number[]) {
    this.transferPlan = transferPlan;
    this.amount = amount;
  }
}
