import {
  LifePlanSetting,
  Parent,
  Child,
  Account,
  Loan,
  CloseAccountPlan,
} from "../../src/models/LifePlanSetting";
import { AmountPlan, StepAmountPlan } from "../../src/models/AmountPlan";
import { describe, test, it, expect } from "vitest";
import { getSampleSetting } from "../../src/sampleData";

const person = {
  isActive: true,
  age: 32,
};
 
describe("person", () => {
  test("person is defined", () => {
    expect(person).toBeDefined();
  });

  test("is active", () => {
    expect(person.isActive).toBeTruthy();
  });

  test("age limit", () => {
    expect(person.age).toBeLessThanOrEqual(32);
  });
});

describe("LifePlanSetting", () => {
  it("基本的なライフプランのシミュレーション結果が正しく計算される", () => {
    const setting = new LifePlanSetting(2024, 2026);

    // 親の設定
    const parentIncomePlan = new StepAmountPlan("給与収入", true, "普通預金", [
      { year: 2024, amount: 5000000 },
    ]);
    const parentOutcomePlan = new StepAmountPlan("生活費", false, "普通預金", [
      { year: 2024, amount: 3000000 },
    ]);
    const parent = new Parent("父", 35, parentIncomePlan, parentOutcomePlan);
    setting.parents.push(parent);

    // 口座の設定
    const account = new Account("普通預金", 0.001, 1000000, []);
    setting.accounts.push(account);

    const result = setting.getResult();

    expect(result.years).toEqual([2024, 2025, 2026]);
    expect(result.accountResults).toHaveLength(1);
    expect(result.parentResults).toHaveLength(1);
  });

  it("fromJSONで正しくデシリアライズできる", () => {
    const json = getSampleSetting();
    const setting = LifePlanSetting.fromJSON(json);

    const result = setting.getResult();
    expect(setting.startYear).toBe(2024);
    expect(setting.endYear).toBe(2091);
  });

  it("口座の利息が正しく計算される", () => {
    const setting = new LifePlanSetting(2024, 2024);
    const account = new Account("定期預金", 0.01, 1000000, []);
    setting.accounts.push(account);

    const result = setting.getResult();

    expect(result.accountResults[0].interests[0]).toBe(10000); // 1,000,000 * 0.01
  });

  it("口座間の振替が正しく実行される", () => {
    const setting = new LifePlanSetting(2024, 2025);

    const account1 = new Account("口座1", 0, 100000, [
      new StepAmountPlan("振替", false, "口座2", [
        { year: 2024, amount: 50000 },
      ]),
    ]);
    const account2 = new Account("口座2", 0, 0, []);

    setting.accounts.push(account1, account2);

    const result = setting.getResult();

    expect(result.accountResults[0].balances[1]).toBe(50000);
    expect(result.accountResults[1].balances[1]).toBe(50000);
  });
});
