import React from "react";

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
    // Use real analysis results if available, otherwise fall back to mock data
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

    // Generate insights from suggestions
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

    // Add financial health insight
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

      {/* Spending Categories */}
      <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-discovery-blue">
          <span className="mr-2 text-discovery-gold text-xl">📊</span>
          Spending Breakdown
        </h3>

        <div className="space-y-3">
          {displayData.categories
            .sort((a, b) => b.amount - a.amount)
            .map((category, idx) => {
              const icon = getIconForCategory(category.name);

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border border-discovery-gold/20 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        category.color || "bg-gray-500"
                      }`}
                    >
                      <span className="text-white text-lg">{icon}</span>
                    </div>
                    <div>
                      <p className="font-medium text-discovery-blue">
                        {category.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {category.percentage?.toFixed(1) || "0.0"}% of expenses
                        {category.count && ` • ${category.count} transactions`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-discovery-blue">
                      R{category.amount.toLocaleString()}
                    </p>
                    {category.savings > 0 && (
                      <p className="text-sm text-discovery-gold">
                        Save R{category.savings.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-discovery-blue">
          {realAnalysisResults
            ? "AI-Powered Recommendations"
            : "AI Recommendations"}
        </h3>
        <div className="space-y-4">
          {displayData.insights.map((insight, idx) => (
            <div
              key={idx}
              className="p-4 border border-discovery-gold/20 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  {insight.type === "warning" && (
                    <span className="text-red-500 text-xl">⚠️</span>
                  )}
                  {insight.type === "opportunity" && (
                    <span className="text-discovery-gold text-xl">🎯</span>
                  )}
                  {insight.type === "positive" && (
                    <span className="text-discovery-blue text-xl">✅</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-discovery-blue">
                    {insight.title}
                  </h4>
                  <p className="text-gray-600 text-sm mt-1">
                    {insight.description}
                  </p>
                  <p className="text-discovery-blue text-sm mt-2">
                    {insight.suggestion}
                  </p>
                  <p className="text-discovery-gold font-medium text-sm mt-1">
                    {insight.impact}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Potential Savings Summary */}
      {realAnalysisResults && (
        <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
          <h3 className="text-lg font-semibold mb-3 text-discovery-blue">
            💰 Optimization Potential
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current Savings Rate</p>
              <p className="text-xl font-bold text-discovery-blue">
                {realAnalysisResults.total_income > 0
                  ? (
                      (realAnalysisResults.available_income /
                        realAnalysisResults.total_income) *
                      100
                    ).toFixed(1)
                  : "0.0"}
                %
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Total Potential Monthly Savings
              </p>
              <p className="text-xl font-bold text-discovery-gold">
                R
                {Object.values(realAnalysisResults.suggestions)
                  .reduce((sum, s) => sum + (s.potential_savings || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analysis;
