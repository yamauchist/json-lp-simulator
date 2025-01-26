import {
  AccountResult,
  AmountPlanResult,
  LifePlanSimulationResult,
} from "../models/LifePlanSimulationResult";

export interface ChartData {
  options: ApexCharts.ApexOptions | undefined;
  series: ApexAxisChartSeries | ApexNonAxisChartSeries | undefined;
}

export function resultToCashFlowChartData(
  result: LifePlanSimulationResult
): ChartData {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      animations: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      categories: result.years || [],
      tickAmount:10,
    },
  };

  const incomeSeries = result.incomeResults.map((series: AmountPlanResult) => ({
    name: series.amountPlan.name,
    group: "income",
    data: series.amounts,
  }));

  const outcomeSeries = result.outcomeResults.map(
    (series: AmountPlanResult) => ({
      name: series.amountPlan.name,
      group: "outcome",
      data: series.amounts,
    })
  );

  return { options: options, series: incomeSeries.concat(outcomeSeries) };
}

export function resultToBalanceChartData(
  result: LifePlanSimulationResult
): ChartData {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      animations: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      categories: result.years || [],
      tickAmount:10,
    },
  };

  const series = result.accountResults.map((series: AccountResult) => ({
    name: series.account.name,
    data: series.balances,
  }));

  return { options: options, series: series };
}
