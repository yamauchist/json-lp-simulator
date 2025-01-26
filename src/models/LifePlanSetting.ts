import { parse } from "jsonc-parser";
import { AmountPlan, PulseAmountPlan, StepAmountPlan } from "./AmountPlan.ts";
import {
  AccountResult,
  AmountPlanResult,
  ChildResult,
  LifePlanSimulationResult,
  ParentResult,
  TransferResult,
} from "./LifePlanSimulationResult.ts";

type School =
  | "None"
  | "Public"
  | "Private"
  | "PrivateLiberal"
  | "PrivateScience";

export class Account {
  static fromJSON(item: any) {
    return new Account(
      item.name,
      item.rate ?? 0.0,
      item.balance,
      item.transferPlans?.map((item: any) => AmountPlan.fromJSON(item))
    );
  }
  name: string;
  rate: number;
  balance: number;
  transferPlans: AmountPlan[] = [];

  constructor(
    name: string,
    rate: number,
    balance: number,
    transferPlans: AmountPlan[]
  ) {
    this.name = name;
    this.rate = rate;
    this.balance = balance;
    this.transferPlans = transferPlans ?? [];
  }

  get interest(): number {
    return Math.floor(this.balance * this.rate);
  }

  doTransfer(
    accountDictionary: { [key: string]: Account },
    year: number
  ): void {
    for (const plan of this.transferPlans) {
      const destinationAccount = accountDictionary[plan.account];
      const amount = plan.calcAmount(year);
      this.balance -= amount;
      destinationAccount.balance += amount;
    }
  }
}

export class Parent {
  name: string;
  age: number;
  incomePlan: AmountPlan | undefined;
  outcomePlan: AmountPlan | undefined;

  constructor(
    name: string,
    age: number,
    incomePlan: AmountPlan | undefined,
    outcomePlan: AmountPlan | undefined
  ) {
    this.name = name;
    this.age = age;
    this.incomePlan = incomePlan;
    this.outcomePlan = outcomePlan;
  }

  static fromJSON(data: any): Parent {
    return new Parent(
      data.name,
      data.age,
      data.incomePlan ? AmountPlan.fromJSON(data.incomePlan) : undefined,
      data.outcomePlan ? AmountPlan.fromJSON(data.outcomePlan) : undefined
    );
  }
}

export class Child {
  static fromJSON(item: any): Child {
    return new Child(
      item.name,
      item.age,
      undefined //item.educationPlan
    );
  }
  name: string;
  age: number;
  educationPlan?: EducationPlan;

  constructor(name: string, age: number, educationPlan?: EducationPlan) {
    this.name = name;
    this.age = age;
    this.educationPlan = educationPlan;
  }

  createEducationCostPlan(startYear: number): AmountPlan | null {
    if (this.educationPlan) {
      return new StepAmountPlan(
        `${this.name} ${startYear} 教育費`,
        false,
        this.educationPlan.account,
        []
      );
    }
    return null;
  }
}

export type EducationPlan = {
  account: string;
  elementarySchool: School;
  juniorHighSchool: School;
  highSchool: School;
  university: School;
};

export class Loan {
  static fromJSON(loan: any): Loan | undefined {
    return new Loan(loan.startYear, loan.span, loan.amount, loan.rate ?? 0.0);
  }
  startYear: number;
  span: number;
  amount: number;
  rate: number;

  constructor(startYear: number, span: number, amount: number, rate: number) {
    this.startYear = startYear;
    this.span = span;
    this.amount = amount;
    this.rate = rate;
  }

  calcPaymentPlan(): AmountPlan {
    const count = this.span * 12;
    const ratePerMonth = this.rate / 12;
    const paymentPerMonth = Math.floor(
      (this.amount * ratePerMonth * Math.pow(1 + ratePerMonth, count)) /
        (Math.pow(1 + ratePerMonth, count) - 1)
    );
    return new StepAmountPlan("住宅ローン返済", false, "", [
      { year: this.startYear, amount: paymentPerMonth * 12 },
      { year: this.startYear + this.span, amount: 0 },
    ]);
  }
}

export class CloseAccountPlan {
  static fromJSON(item: any) {
    return new CloseAccountPlan(item.account, item.year, item.destination);
  }
  account: string;
  year: number;
  destination: string;

  constructor(account: string, year: number, destination: string) {
    this.account = account;
    this.year = year;
    this.destination = destination;
  }
}

export class LifePlanSetting {
  startYear: number;
  endYear: number;
  parents: Parent[] = [];
  children: Child[] = [];
  incomePlans: AmountPlan[] = [];
  outcomePlans: AmountPlan[] = [];
  accounts: Account[] = [];
  loan?: Loan;
  closeAccountPlans: CloseAccountPlan[] = [];

  constructor(startYear: number, endYear: number) {
    this.startYear = startYear;
    this.endYear = endYear;
  }

  static fromJSON(json: string): LifePlanSetting {
    const data = parse(json);
    const setting = new LifePlanSetting(data.startYear, data.endYear);
    setting.parents = data.parents.map((item: any) => Parent.fromJSON(item));
    setting.children = data.children.map((item: any) => Child.fromJSON(item));
    setting.incomePlans = data.incomePlans.map((item: any) =>
      AmountPlan.fromJSON(item)
    );
    setting.outcomePlans = data.outcomePlans.map((item: any) =>
      AmountPlan.fromJSON(item)
    );
    setting.accounts = data.accounts.map((item: any) => Account.fromJSON(item));
    setting.loan = data.loan ? Loan.fromJSON(data.loan) : undefined;
    setting.closeAccountPlans = data.closeAccountPlans.map((item: any) =>
      CloseAccountPlan.fromJSON(item)
    );
    return setting;
  }

  getResult(): LifePlanSimulationResult {
    const setting = this;
    const length = setting.endYear - setting.startYear + 1;
    const accountDictionary: { [key: string]: Account } = {};
    setting.accounts.forEach((account) => {
      accountDictionary[account.name] = account;
    });

    const result = new LifePlanSimulationResult();
    result.years = Array.from({ length }, (_, i) => setting.startYear + i);
    result.accountResults = setting.accounts.map(
      (account) => new AccountResult(account)
    );

    result.parentResults = setting.parents.map((parent) => {
      const ages = Array.from({ length }, (_, i) => parent.age + i);
      const incomeResult = parent.incomePlan?.getResult(result.years);
      const outcomeResult = parent.outcomePlan?.getResult(result.years);
      const parentResult = new ParentResult(
        parent,
        ages,
        incomeResult,
        outcomeResult
      );
      return parentResult;
    });

    result.childResults = setting.children.map((child) => {
      const ages = Array.from({ length }, (_, i) => child.age + i);
      const educationPlan = child.createEducationCostPlan(setting.startYear);
      const educationCostResult = educationPlan?.getResult(result.years);
      const childResult = new ChildResult(child, ages, educationCostResult);
      return childResult;
    });

    const loanPlan = setting.loan?.calcPaymentPlan();

    const otherResults: AmountPlanResult[] = [];
    setting.incomePlans.forEach((plan) =>
      otherResults.push(plan.getResult(result.years))
    );
    setting.outcomePlans.forEach((plan) =>
      otherResults.push(plan.getResult(result.years))
    );
    if (loanPlan) {
      otherResults.push(loanPlan.getResult(result.years));
    }
    result.otherAmountPlanResults = otherResults;

    result.accountResults.forEach((accountResult) => {
      accountResult.balances = new Array(length).fill(0);
      accountResult.interests = new Array(length).fill(0);
    });

    for (let i = 0; i < length; i++) {
      const year = result.years[i];

      // 現在の残高と利息を記録
      result.accountResults.forEach((accountResult) => {
        accountResult.balances[i] = accountResult.account.balance;
        accountResult.interests[i] = accountResult.account.interest;
      });

      // 利息の追加を実行
      setting.accounts.forEach((account) => {
        account.balance += account.interest;
      });

      setting.closeAccountPlans.forEach((plan) => {
        if (plan.year === year) {
          const src = accountDictionary[plan.account];
          const dst = accountDictionary[plan.destination];
          src.transferPlans.push(
            new PulseAmountPlan(
              `${src.name} → ${dst.name}`,
              false,
              plan.destination,
              [{ year: year, amount: src.balance }]
            )
          );
        }
      });

      // 振替を実行
      setting.accounts.forEach((account) => {
        account.doTransfer(accountDictionary, year);
      });

      // 各種収入と支出を計算
      setting.parents.forEach((parent) => {
        parent.incomePlan?.doPlan(accountDictionary, year);
        parent.outcomePlan?.doPlan(accountDictionary, year);
      });

      //   result.childResults.forEach((childResult) => {
      //     // childResult.educationCostResult.amountPlan.doPlan(
      //     //   accountDictionary,
      //     //   year
      //     // );
      //   });

      setting.incomePlans.forEach((plan) => {
        plan.doPlan(accountDictionary, year);
      });

      setting.outcomePlans.forEach((plan) => {
        plan.doPlan(accountDictionary, year);
      });
    }

    result.accountResults.forEach((accountResult) => {
      accountResult.transferResults = accountResult.account.transferPlans.map(
        (plan) => {
          const amount = plan.calcAmounts(result.years);
          const transferPlan = plan;
          const transferResult = new TransferResult(transferPlan, amount);
          return transferResult;
        }
      );
    });

    return result;
  }
}
