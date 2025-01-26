import { describe, expect, it } from "vitest";
import { LifePlanSetting } from "../src/models/LifePlanSetting";
import  { getSampleSetting } from "../src/sampleData";

it("口座の利息が正しく計算される", () => {
  const json = getSampleSetting();
  const setting = LifePlanSetting.fromJSON(json);
  const result = setting.getResult();
});
