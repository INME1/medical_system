import React from "react";
import ReactECharts from "echarts-for-react";

const ShapContributionChart = ({ shapData }) => {
  if (!shapData || !shapData.features || !shapData.contributions) return null;

  // 절댓값 기준 상위 5개 추출
  const sorted = shapData.features
    .map((f, i) => ({ name: f, value: shapData.contributions[i] }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 5);

  const option = {
    title: {
      text: "Top 5 SHAP Feature Contributions",
      left: "center",
      top: 0,
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: "item",
      formatter: ({ name, value }) =>
        `${name}: ${value >= 0 ? "+" : ""}${value.toFixed(4)}`
    },
    grid: { left: 80, right: 20, bottom: 20, top: 40 },
    xAxis: {
      type: "value",
      name: "SHAP 값",
      axisLabel: { formatter: "{value}" }
    },
    yAxis: {
      type: "category",
      data: sorted.map((d) => d.name),
      inverse: true
    },
    series: [
      {
        type: "bar",
        data: sorted.map((d) => ({
          value: d.value,
          itemStyle: {
            color: d.value >= 0 ? "#5470C6" : "#EE6666"
          }
        }),
        ),
        label: {
          show: true,
          position: "right",
          formatter: ({ value }) => `${value.toFixed(4)}`
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: 300 }} />;
};

export default ShapContributionChart;
