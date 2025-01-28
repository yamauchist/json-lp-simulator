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
        enabled: false,
      },
    },
    annotations: {
      xaxis: [],
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      categories: result.years || [],
      tickAmount: 10,
    },
  };

  addAnnotaions(options, result);

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
        enabled: false,
      },
    },
    annotations: {
      xaxis: [],
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      categories: result.years || [],
      tickAmount: 10,
    },
  };

  addAnnotaions(options, result);

  const series = result.accountResults.map((series: AccountResult) => ({
    name: series.account.name,
    data: series.balances,
  }));

  return { options: options, series: series };
}

function addAnnotaions(
  options: ApexCharts.ApexOptions,
  result: LifePlanSimulationResult
) {
  const ages = [0, 6, 12, 20, 60, 65];
  const colors = ["#775DD0", "#008FFB", "#FF4560", "#FFBB28"];
  let familyIndex = 0;
  result.parentResults.forEach((parent) => {
    const color = colors[familyIndex % 4];
    parent.ages.forEach((age, index) => {
      if (ages.includes(age))
        options.annotations?.xaxis?.push({
          x: result.years[index],
          borderColor: color,
          label: {
            text: `${parent.parent.name} ${age}歳`,
            borderColor: color,
            offsetY: 20 * familyIndex,
            orientation: "horizontal",
            textAnchor: "start",
            style: {
              color: "#fff",
              background: color,
            },
          },
        });
    });
    familyIndex++;
  });

  result.childResults.forEach((child) => {
    const color = colors[familyIndex % 4];
    child.ages.forEach((age, index) => {
      if (ages.includes(age))
        options.annotations?.xaxis?.push({
          x: result.years[index],
          borderColor: color,
          label: {
            text: `${child.child.name} ${age}歳`,
            borderColor: color,
            offsetY: 20 * familyIndex,
            style: {
              color: "#fff",
              background: color,
            },
            orientation: "horizontal",
            textAnchor: "start",
          },
        });
    });
    familyIndex++;
  });
}
