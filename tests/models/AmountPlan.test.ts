import { AmountPlan, LinearAmountPlan, StepAmountPlan, PulseAmountPlan } from "../../src/models/AmountPlan";
import { describe, expect, it } from "vitest";

describe("AmountPlan", () => {
  describe("fromJSON", () => {
    it("should create correct instance based on type", () => {
      const linearData = {
        type: "Linear",
        name: "Salary",
        isIncome: true,
        account: "main",
        points: [
          { year: 2020, amount: 5000000 },
          { year: 2025, amount: 8000000 }
        ]
      };

      const stepData = {
        type: "Step",
        name: "Rent",
        isIncome: false,
        account: "expenses",
        points: [
          { year: 2020, amount: 120000 },
          { year: 2023, amount: 150000 }
        ]
      };

      const pulseData = {
        type: "Pulse",
        name: "Bonus",
        isIncome: true,
        account: "savings",
        points: [
          { year: 2022, amount: 1000000 },
          { year: 2023, amount: 1500000 }
        ]
      };

      expect(AmountPlan.fromJSON(linearData)).toBeInstanceOf(LinearAmountPlan);
      expect(AmountPlan.fromJSON(stepData)).toBeInstanceOf(StepAmountPlan);
      expect(AmountPlan.fromJSON(pulseData)).toBeInstanceOf(PulseAmountPlan);
    });

    it("should throw error for invalid type", () => {
      const invalidData = {
        type: "Invalid",
        name: "Test",
        isIncome: true,
        account: "main"
      };

      expect(() => AmountPlan.fromJSON(invalidData)).toThrow("Invalid type");
    });
  });

  describe("LinearAmountPlan", () => {
    it("should calculate correct linear interpolation", () => {
      const plan = new LinearAmountPlan(
        "Salary",
        true,
        "main",
        [
          { year: 2020, amount: 5000000 },
          { year: 2025, amount: 10000000 }
        ]
      );

      expect(plan.calcAmount(2020)).toBe(5000000);
      expect(plan.calcAmount(2022)).toBe(7000000);
      expect(plan.calcAmount(2025)).toBe(10000000);
    });
  });

  describe("StepAmountPlan", () => {
    it("should return correct step amounts", () => {
      const plan = new StepAmountPlan(
        "Rent",
        false,
        "expenses",
        [
          { year: 2020, amount: 120000 },
          { year: 2023, amount: 150000 }
        ]
      );

      expect(plan.calcAmount(2019)).toBe(0);
      expect(plan.calcAmount(2020)).toBe(120000);
      expect(plan.calcAmount(2022)).toBe(120000);
      expect(plan.calcAmount(2023)).toBe(150000);
      expect(plan.calcAmount(2025)).toBe(150000);
    });
  });

  describe("PulseAmountPlan", () => {
    it("should return amount only for exact years", () => {
      const plan = new PulseAmountPlan(
        "Bonus",
        true,
        "savings",
        [
          { year: 2022, amount: 1000000 },
          { year: 2023, amount: 1500000 }
        ]
      );

      expect(plan.calcAmount(2021)).toBe(0);
      expect(plan.calcAmount(2022)).toBe(1000000);
      expect(plan.calcAmount(2023)).toBe(1500000);
      expect(plan.calcAmount(2024)).toBe(0);
    });
  });

  describe("getResult", () => {
    it("should return correct amount plan result", () => {
      const plan = new StepAmountPlan(
        "Test",
        true,
        "main",
        [{ year: 2020, amount: 1000 }]
      );

      const result = plan.getResult([2019, 2020, 2021]);
      expect(result.amounts).toEqual([0, 1000, 1000]);
      expect(result.amountPlan).toBe(plan);
    });
  });
});