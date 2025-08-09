import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const Analysis = ({ financialData, analysisResults, realAnalysisResults }) => {
  const getIconForCategory = (categoryName) => {
    const iconMap = {
      "Rent/Mortgage": "🏠",
      Groceries: "🛒",
      "Dining Out": "☕",
      Transport: "🚗",
      Subscriptions: "📱",
      Shopping: "🛍️",
      Other: "💰",
      Administrative: "📋",
    };
    return iconMap[categoryName] || "💰";
  };

  const getDisplayData = () => {
    if (realAnalysisResults) {
      return {
        totalIncome: realAnalysisResults.total_income,
        totalExpenses: realAnalysisResults.total_expenses,
        disposableIncome: realAnalysisResults.available_income,
        categories: Object.entries(realAnalysisResults.category_breakdown)
          .filter(([_, data]) => data.amount > 0)
          .map(([name, data]) => ({
            name,
            amount: data.amount,
            percentage: data.percentage,
            count: data.count,
            savings:
              realAnalysisResults.suggestions[name]?.potential_savings || 0,
          })),
        insights: generateInsightsFromBackend(realAnalysisResults),
        transactionCount: Object.values(
          realAnalysisResults.category_breakdown
        ).reduce((sum, cat) => sum + cat.count, 0),
      };
    } else {
      return {
        totalIncome: financialData.totalIncome,
        totalExpenses: financialData.totalExpenses,
        disposableIncome: financialData.disposableIncome,
        categories: financialData.categories,
        insights: financialData.insights,
        transactionCount: analysisResults?.transactionsFound || 247,
      };
    }
  };

  const generateInsightsFromBackend = (backendData) => {
    const insights = [];

    if (backendData.suggestions) {
      Object.entries(backendData.suggestions).forEach(
        ([category, suggestion]) => {
          if (suggestion.potential_savings > 0) {
            insights.push({
              type:
                suggestion.potential_savings > 500 ? "opportunity" : "warning",
              title: `${category} Optimization`,
              description: Array.isArray(suggestion.suggestions)
                ? suggestion.suggestions[0]
                : "Review expenses in this category",
              suggestion: `Potential savings: R${suggestion.potential_savings.toFixed(
                0
              )}`,
              impact: `R${(suggestion.potential_savings * 12).toFixed(
                0
              )} annual savings`,
            });
          }
        }
      );
    }

    const savingsRate =
      backendData.total_income > 0
        ? (backendData.available_income / backendData.total_income) * 100
        : 0;
    let healthStatus = "";

    if (savingsRate >= 20) {
      healthStatus = "Excellent: You're saving over 20% of your income!";
    } else if (savingsRate >= 10) {
      healthStatus =
        "Good: You're saving 10-20% of your income. Room for improvement.";
    } else if (savingsRate >= 0) {
      healthStatus = "Caution: Low savings rate. Focus on expense reduction.";
    } else {
      healthStatus =
        "Alert: Spending more than you earn. Immediate action required.";
    }

    insights.push({
      type: savingsRate >= 10 ? "positive" : "warning",
      title: "Financial Health Status",
      description: healthStatus,
      suggestion:
        savingsRate < 10
          ? "Focus on expense reduction"
          : "Maintain good habits",
      impact: `${savingsRate.toFixed(1)}% savings rate`,
    });

    return insights.slice(0, 5);
  };

  const displayData = getDisplayData();

  const getChartData = () => {
    const sortedCategories = [...displayData.categories].sort(
      (a, b) => b.amount - a.amount
    );

    const topCategories = sortedCategories.slice(0, 6);
    const remainingCategories = sortedCategories.slice(6);

    const remainingAmount = remainingCategories.reduce(
      (sum, cat) => sum + cat.amount,
      0
    );
    const totalAmount =
      topCategories.reduce((sum, cat) => sum + cat.amount, 0) + remainingAmount;

    const finalCategories = [...topCategories];
    if (remainingAmount > 0) {
      finalCategories.push({
        name: "Remaining categories",
        amount: remainingAmount,
        percentage: (remainingAmount / totalAmount) * 100,
      });
    }

    return {
      labels: finalCategories.map(
        (c) => `${c.name} (${c.percentage.toFixed(1)}%)`
      ),
      datasets: [
        {
          data: finalCategories.map((c) => c.amount),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#D3D3D3", // grey for remaining
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
        <h2 className="text-xl font-bold mb-2 text-discovery-blue">
          Financial Analysis Complete
        </h2>
        <p className="text-gray-600">
          AI analyzed {displayData.transactionCount} transactions across{" "}
          {displayData.categories.length} categories
        </p>
        {realAnalysisResults && (
          <div className="mt-2 text-sm text-discovery-gold">
            ✨ Powered by AI categorization and analysis
          </div>
        )}
      </div>

      {/* Financial Summary Cards */}
      {realAnalysisResults && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-xl border border-discovery-gold/20 text-center">
            <p className="text-xs text-gray-600 mb-1">Income</p>
            <p className="text-lg font-bold text-green-600">
              R{displayData.totalIncome.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-discovery-gold/20 text-center">
            <p className="text-xs text-gray-600 mb-1">Expenses</p>
            <p className="text-lg font-bold text-red-600">
              R{displayData.totalExpenses.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-discovery-gold/20 text-center">
            <p className="text-xs text-gray-600 mb-1">Available</p>
            <p className="text-lg font-bold text-discovery-blue">
              R{displayData.disposableIncome.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Pie Chart */}
      <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-discovery-blue">
          <span className="mr-2 text-discovery-gold text-xl">📊</span>
          Expense Distribution
        </h3>
        <div className="h-64">
          <Pie
            data={getChartData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: "60%", // makes it a donut chart
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    boxWidth: 12,
                    padding: 8,
                    font: {
                      size: 12,
                    },
                    // Wrap long labels
                    generateLabels: (chart) => {
                      const original =
                        ChartJS.overrides.pie.plugins.legend.labels
                          .generateLabels;
                      return original(chart).map((label) => {
                        if (label.text.length > 18) {
                          label.text = label.text.match(/.{1,18}/g).join("\n");
                        }
                        return label;
                      });
                    },
                  },
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const label = context.label || "";
                      const value = context.raw || 0;
                      const total = context.dataset.data.reduce(
                        (a, b) => a + b,
                        0
                      );
                      const percentage = ((value / total) * 100).toFixed(1);
                      return `${label}: R${value.toLocaleString()} (${percentage}%)`;
                    },
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* AI Recommendations */}
      {displayData.insights && displayData.insights.length > 0 && (
        <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
          <h3 className="text-lg font-semibold mb-4 text-discovery-blue">
            AI-Powered Recommendations
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {displayData.insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-discovery-gold/20"
              >
                <div className="mt-1">
                  {insight.type === "warning" && (
                    <span className="text-red-500 text-lg">⚠️</span>
                  )}
                  {insight.type === "opportunity" && (
                    <span className="text-discovery-gold text-lg">🎯</span>
                  )}
                  {insight.type === "positive" && (
                    <span className="text-discovery-blue text-lg">✅</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-discovery-blue">
                    {insight.title}
                  </p>
                  <p className="text-xs text-gray-600">{insight.suggestion}</p>
                  <p className="text-xs text-discovery-gold font-medium">
                    {insight.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analysis;
