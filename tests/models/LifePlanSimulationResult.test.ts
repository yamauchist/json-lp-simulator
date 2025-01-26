
// import { LifePlanSimulationResult, ParentResult, ChildResult, AccountResult, TransferResult } from "../../src/models/LifePlanSimulationResult";
// import { AmountPlan } from "../../src/models/AmountPlan";
// import { Account, Child, Parent } from "../../src/models/LifePlanSetting";
// import { beforeEach, describe, expect, it } from "vitest";


// describe("LifePlanSimulationResult", () => {
//   let result: LifePlanSimulationResult;

//   beforeEach(() => {
//     result = new LifePlanSimulationResult();
//   });

//   describe("incomeResults", () => {
//     it("should return income results from parents and other amount plans", () => {
//       const parent1 = new Parent("Parent1", 40);
//       const parent2 = new Parent("Parent2", 38);
//       const incomePlan1 = new AmountPlan("Income1", true, 1000);
//       const incomePlan2 = new AmountPlan("Income2", true, 2000);
//       const outcomePlan = new AmountPlan("Outcome", false, 500);

//       result.parentResults = [
//         new ParentResult(parent1, [40, 41], { amountPlan: incomePlan1, amounts: [1000, 1000] }, { amountPlan: outcomePlan, amounts: [500, 500] }),
//         new ParentResult(parent2, [38, 39], { amountPlan: incomePlan2, amounts: [2000, 2000] }, { amountPlan: outcomePlan, amounts: [500, 500] })
//       ];

//       const otherIncome = new AmountPlan("OtherIncome", true, 3000);
//       result.otherAmountPlanResults = [
//         { amountPlan: otherIncome, amounts: [3000, 3000] },
//         { amountPlan: outcomePlan, amounts: [500, 500] }
//       ];

//       const incomeResults = result.incomeResults;
//       expect(incomeResults.length).toBe(3);
//       expect(incomeResults[0].amountPlan.name).toBe("Income1");
//       expect(incomeResults[1].amountPlan.name).toBe("Income2");
//       expect(incomeResults[2].amountPlan.name).toBe("OtherIncome");
//     });
//   });

//   describe("outcomeResults", () => {
//     it("should return outcome results from parents and other amount plans", () => {
//       const parent = new Parent("Parent", 40);
//       const incomePlan = new AmountPlan("Income", true, 1000);
//       const outcomePlan1 = new AmountPlan("Outcome1", false, 500);
//       const outcomePlan2 = new AmountPlan("Outcome2", false, 300);

//       result.parentResults = [
//         new ParentResult(parent, [40, 41], { amountPlan: incomePlan, amounts: [1000, 1000] }, { amountPlan: outcomePlan1, amounts: [500, 500] })
//       ];

//       result.otherAmountPlanResults = [
//         { amountPlan: incomePlan, amounts: [1000, 1000] },
//         { amountPlan: outcomePlan2, amounts: [300, 300] }
//       ];

//       const outcomeResults = result.outcomeResults;
//       expect(outcomeResults.length).toBe(2);
//       expect(outcomeResults[0].amountPlan.name).toBe("Outcome1");
//       expect(outcomeResults[1].amountPlan.name).toBe("Outcome2");
//     });
//   });

//   describe("exportCsv", () => {
//     it("should export simulation results to CSV format", () => {
//       result.years = [2023, 2024];
      
//       const parent = new Parent("Parent", 40);
//       const incomePlan = new AmountPlan("Salary", true, 5000000);
//       const outcomePlan = new AmountPlan("Living", false, 3000000);
//       result.parentResults = [
//         new ParentResult(parent, [40, 41], 
//           { amountPlan: incomePlan, amounts: [5000000, 5000000] },
//           { amountPlan: outcomePlan, amounts: [3000000, 3000000] }
//         )
//       ];

//       const child = new Child("Child", 10);
//       const educationPlan = new AmountPlan("Education", false, 1000000);
//       result.childResults = [
//         new ChildResult(child, [10, 11], 
//           { amountPlan: educationPlan, amounts: [1000000, 1000000] }
//         )
//       ];

//       const account = new Account("Savings", 1000000, 0.01);
//       const accountResult = new AccountResult(account);
//       accountResult.balances = [1000000, 1100000];
//       accountResult.interests = [10000, 11000];
//       result.accountResults = [accountResult];

//       const csv = result.exportCsv();
//       const lines = csv.split("\n");

//       expect(lines[0]).toBe("西暦,,2023,2024");
//       expect(lines[1]).toBe("年齢,Parent,40,41");
//       expect(lines[2]).toBe(",Child,10,11");
//       expect(lines[3]).toBe("");
//       expect(lines[4]).toBe("収入,Salary,5000000,5000000");
//       expect(lines[5]).toBe("支出,Living,3000000,3000000");
//       expect(lines[6]).toBe("資産,Savings残高,1000000,1100000");
//       expect(lines[7]).toBe(",Savings利息,10000,11000");
//     });
//   });
// });
