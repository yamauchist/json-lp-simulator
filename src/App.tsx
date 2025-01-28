import React, { useEffect, useState } from "react";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/javascript/javascript";
import Chart from "react-apexcharts";
import CodeMirror from "@uiw/react-codemirror";
import { langs } from "@uiw/codemirror-extensions-langs";
import {
  ChartData,
  resultToBalanceChartData,
  resultToCashFlowChartData,
} from "./utils/resultToChart";
import { LifePlanSetting } from "./models/LifePlanSetting";
import { useDebounce } from "./utils/hooks";
import jsonString from "./sampleData.jsonc?raw";
import { LifePlanSimulationResult } from "./models/LifePlanSimulationResult";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";

const App: React.FC = () => {
  const [jsonData, setJsonData] = useState<string>(jsonString);
  const debouncedJsonData = useDebounce(jsonData, 1000);

  const [cashFlow, setCashFlow] = useState<ChartData>({
    options: undefined,
    series: undefined,
  });
  const [balance, setBalance] = useState<ChartData>({
    options: undefined,
    series: undefined,
  });

  useEffect(() => {
    try {
      const setting = LifePlanSetting.fromJSON(debouncedJsonData);
      const result = setting.getResult();
      setCashFlow(resultToCashFlowChartData(result));
      setBalance(resultToBalanceChartData(result));
    } catch (error) {
      console.error("Failed to parse JSON or calculate results:", error);
    }
  }, []);

  const onChange = React.useCallback((val: string) => {
    setJsonData(val);
  }, []);

  const handleUpdateClick = () => {
    try {
      const setting = LifePlanSetting.fromJSON(jsonData);
      const result = setting.getResult();
      setCashFlow(resultToCashFlowChartData(result));
      setBalance(resultToBalanceChartData(result));
    } catch (error) {
      alert("JSONデータの解析に失敗しました。");
      // console.error("Failed to update charts:", error);
    }
  };

  function getCurrentTimestamp() {
    const now = new Date();

    const year = now.getFullYear(); // 年
    const month = String(now.getMonth() + 1).padStart(2, "0"); // 月 (0始まりなので+1)
    const date = String(now.getDate()).padStart(2, "0"); // 日
    const hours = String(now.getHours()).padStart(2, "0"); // 時
    const minutes = String(now.getMinutes()).padStart(2, "0"); // 分

    return `${year}${month}${date}${hours}${minutes}`;
  }

  // ファイル読み込み処理を追加
  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const text = await file.text();
      setJsonData(text);
      handleUpdateClick();
    }
  };

  // ファイル選択を起動する関数
  const handleLoadClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.jsonc";
    input.onchange = handleFileLoad as any;
    input.click();
  };

  const handleSaveClick = () => {
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeplan-settings-${getCurrentTimestamp()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateCSV = (result: LifePlanSimulationResult) => {
    const headers = ["年度", "収入", "支出", "収支", "資産残高"];
    const rows = result.years.map((year: number) => [year]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    return result.exportCsv();
  };

  // CSV出力ハンドラーを追加
  const handleCSVExport = () => {
    try {
      const setting = LifePlanSetting.fromJSON(jsonData);
      const result = setting.getResult();
      const csvContent = generateCSV(result);
      const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      const csvWithBOM = new Blob([bom, csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lifeplan-${getCurrentTimestamp()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    }
  };

  const generateExcel = async (result: LifePlanSimulationResult) => {
    const workbook = new ExcelJS.Workbook();
    // Fetchを使ってテンプレートファイルを読み込む
    const response = await fetch("/assets/template.xlsx");
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.getWorksheet("ライフプラン");

    if (worksheet) {
      // ヘッダー設定
      worksheet.columns = [
        { header: "年度", key: "year", width: 10 },
        { header: "収入", key: "income", width: 15 },
        { header: "支出", key: "outcome", width: 15 },
        { header: "収支", key: "balance", width: 15 },
        { header: "資産残高", key: "assets", width: 15 },
      ];

      // データ追加
      result.years.forEach((year) => {
        worksheet.addRow({
          year: year,
        });
      });

      // スタイル設定
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
    }

    return workbook;
  };

  // Excel出力ハンドラーを追加
  const handleExcelExport = async () => {
    try {
      const setting = LifePlanSetting.fromJSON(jsonData);
      const result = setting.getResult();
      const workbook = await generateExcel(result);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `lifeplan-${getCurrentTimestamp()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export Excel:", error);
    }
  };

  // PDF生成関数を追加
  const generatePDF = (result: LifePlanSimulationResult) => {
    const pdf = new jsPDF();

    // タイトル
    pdf.setFontSize(20);
    pdf.text("ライフプラン シミュレーション結果", 20, 20);

    // サブタイトルと基本情報
    pdf.setFontSize(12);
    pdf.text("収支シミュレーション", 20, 40);

    console.log(result);

    return pdf;
  };

  // PDFダウンロードハンドラーを追加
  const handlePDFExport = () => {
    try {
      const setting = LifePlanSetting.fromJSON(jsonData);
      const result = setting.getResult();
      const pdf = generatePDF(result);

      pdf.save("lifeplan-report.pdf");
    } catch (error) {
      console.error("Failed to export PDF:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-green-700 p-4 flex items-center">
        <h1 className="text-2xl font-bold text-white">JSON LP Simulator</h1>
        <button
          onClick={handleLoadClick}
          className="ml-4 text-white hover:underline hover:text-green-200"
        >
          設定読込
        </button>
        <button
          onClick={handleSaveClick}
          className="ml-4 text-white hover:underline hover:text-green-200"
        >
          設定保存
        </button>
        <button
          onClick={handleCSVExport}
          className="ml-4 text-white hover:underline hover:text-green-200"
        >
          CSV出力
        </button>
        <button
          onClick={handleExcelExport}
          className="ml-4 text-white hover:underline hover:text-green-200"
        >
          Excel出力
        </button>
        <button
          onClick={handlePDFExport}
          className="ml-4 text-white hover:underline hover:text-green-200"
        >
          PDF出力
        </button>
        <a
          target="_blank"
          href="https://github.com/yamauchist/json-lp-simulator/blob/master/README.md"
          className="ml-auto text-white hover:underline hover:text-green-200"
        >
          このツールについて
        </a>
      </div>
      <div className="flex h-full min-h-0">
        {/* 左側の JSON エディタ */}
        <div className="w-1/3 border-r border-gray-300 p-4 flex flex-col h-full">
          <div className="h-full  flex flex-col">
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-semibold">シミュレーション設定</h3>
              <button
                onClick={handleUpdateClick}
                className="ml-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded-lg transition duration-200 ease-in-out">
                結果更新
              </button>
            </div>
            <CodeMirror
              value={jsonData}
              extensions={[langs.javascript()]}
              onChange={onChange}
              theme={"light"}
              height="100%"
              className="border border-gray-300 rounded h-full overflow-auto"
            />
          </div>
        </div>

        {/* 右側のグラフ */}
        <div className="w-2/3 p-4 overflow-auto grid grid-rows-2 gap-4">
          <div className="h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-2">支出入推移</h3>
            <div className="flex-grow">
              {cashFlow?.series && (
                <Chart
                  options={cashFlow.options}
                  series={cashFlow.series}
                  type="bar"
                  height={"100%"}
                />
              )}
            </div>
          </div>
          <div className="h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-2">資産推移</h3>
            <div className="flex-grow">
              {balance?.series && (
                <Chart
                  options={balance.options}
                  series={balance.series}
                  type="bar"
                  height={"100%"}
                  className="flex-grow min-h-0 h-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
