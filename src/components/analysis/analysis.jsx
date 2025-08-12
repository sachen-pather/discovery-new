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
      "Debt Payments": "💳",
    };
    return iconMap[categoryName] || "💰";
  };

  const getDisplayData = () => {
    if (realAnalysisResults) {
      return {
        totalIncome: realAnalysisResults.total_income,
        totalExpenses: realAnalysisResults.total_expenses,
        disposableIncome: realAnalysisResults.available_income,
        optimizedIncome:
          realAnalysisResults.optimized_available_income ||
          realAnalysisResults.available_income,
        totalPotentialSavings: realAnalysisResults.total_potential_savings || 0,
        enhancedMode: realAnalysisResults.enhanced_mode || false,
        protectedCategories: realAnalysisResults.protected_categories || [],
        categories: Object.entries(realAnalysisResults.category_breakdown)
          .filter(([_, data]) => data.amount > 0)
          .map(([name, data]) => ({
            name,
            amount: data.amount,
            percentage: data.percentage,
            count: data.count,
            savings:
              realAnalysisResults.suggestions?.[name]?.potential_savings || 0,
            priority: realAnalysisResults.suggestions?.[name]?.priority || 1,
            confidenceLevel:
              realAnalysisResults.suggestions?.[name]?.confidence_level ||
              "Low",
            suggestions:
              realAnalysisResults.suggestions?.[name]?.suggestions || [],
          })),
        insights: generateInsightsFromBackend(realAnalysisResults),
        transactionCount: Object.values(
          realAnalysisResults.category_breakdown
        ).reduce((sum, cat) => sum + cat.count, 0),
        actionPlan: realAnalysisResults.action_plan || {},
      };
    } else {
      return {
        totalIncome: financialData.totalIncome,
        totalExpenses: financialData.totalExpenses,
        disposableIncome: financialData.disposableIncome,
        categories: financialData.categories,
        insights: financialData.insights,
        transactionCount: analysisResults?.transactionsFound || 247,
        enhancedMode: false,
      };
    }
  };

  const generateInsightsFromBackend = (backendData) => {
    const insights = [];

    // Enhanced mode indicator
    if (backendData.enhanced_mode) {
      insights.push({
        type: "positive",
        title: "Enhanced AI Analysis Active",
        description:
          "Advanced statistical modeling and protected category detection enabled",
        suggestion:
          "Using South African household spending patterns for optimization",
        impact: "More accurate recommendations",
      });
    }

    // Process suggestions with priority and confidence
    if (backendData.suggestions) {
      Object.entries(backendData.suggestions)
        .filter(([_, suggestion]) => suggestion.potential_savings > 0)
        .sort((a, b) => (b[1].priority || 1) - (a[1].priority || 1))
        .slice(0, 3)
        .forEach(([category, suggestion]) => {
          insights.push({
            type:
              suggestion.potential_savings > 500 ? "opportunity" : "warning",
            title: `${category} Optimization (Priority ${
              suggestion.priority || 1
            })`,
            description: Array.isArray(suggestion.suggestions)
              ? suggestion.suggestions[0]
              : "Review expenses in this category",
            suggestion: `Potential savings: R${suggestion.potential_savings.toFixed(
              0
            )}`,
            impact: `R${(suggestion.potential_savings * 12).toFixed(
              0
            )} annual savings`,
            confidence: suggestion.confidence_level || "Medium",
          });
        });
    }

    // Financial health status
    const savingsRate =
      backendData.total_income > 0
        ? (backendData.available_income / backendData.total_income) * 100
        : 0;

    const optimizedSavingsRate =
      backendData.total_income > 0
        ? ((backendData.optimized_available_income ||
            backendData.available_income) /
            backendData.total_income) *
          100
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
      impact: `${savingsRate.toFixed(1)}% → ${optimizedSavingsRate.toFixed(
        1
      )}% potential savings rate`,
    });

    return insights.slice(0, 5);
  };

  // Build debt sub-slices from the raw transactions
  const buildDebtBreakdownFromTransactions = (txs = []) => {
    const labelMap = {
      mortgage: "Mortgage",
      credit_card: "Credit Card",
      personal_loan: "Personal Loan",
      store_card: "Store Card",
      auto_loan: "Vehicle Finance",
      student_loan: "Student Loan",
    };

    const sums = {};

    txs.forEach((t) => {
      const isDebt =
        String(t?.Category || "").toLowerCase() === "debt payments" ||
        String(t?.Category || "").toLowerCase() === "debt payment";

      if (!isDebt) return;

      const kind = String(t?.DebtKind || "").toLowerCase();
      const rawAmt =
        Number(t?.["Amount (ZAR)"]) ??
        Number(t?.Amount) ??
        Number(t?.amount) ??
        0;

      const amt = Math.abs(rawAmt) || 0; // make positive for charting

      const baseLabel =
        labelMap[kind] || (t?.DebtName ? String(t.DebtName) : "Other Debt");

      const label = `${baseLabel} (Debt)`;

      sums[label] = (sums[label] || 0) + amt;
    });

    return Object.entries(sums).map(([name, amount]) => ({ name, amount }));
  };

  const displayData = getDisplayData();

  const getChartData = () => {
    // Start with backend categories (already filtered to amount > 0)
    const base = [...displayData.categories];

    // Expand "Debt Payments" using transactions (if present)
    let categoriesForChart = base;
    const txs = realAnalysisResults?.transactions;

    if (Array.isArray(txs) && txs.length) {
      const debtSlices = buildDebtBreakdownFromTransactions(txs);
      if (debtSlices.length > 0) {
        // remove the aggregate Debt Payments slice to avoid double-counting
        categoriesForChart = base.filter((c) => c.name !== "Debt Payments");
        // append the specific debt slices
        debtSlices.forEach((d) =>
          categoriesForChart.push({
            name: d.name,
            amount: d.amount,
            // other fields not needed for the wheel
          })
        );
      }
    }

    // sort & compact into top 6 + "Other categories"
    const sorted = [...categoriesForChart].sort((a, b) => b.amount - a.amount);
    const top = sorted.slice(0, 6);
    const rest = sorted.slice(6);
    const restAmount = rest.reduce((s, c) => s + c.amount, 0);

    const finalCats = [...top];
    if (restAmount > 0) {
      finalCats.push({ name: "Other categories", amount: restAmount });
    }

    const total = finalCats.reduce((s, c) => s + c.amount, 0) || 1;

    return {
      labels: finalCats.map(
        (c) => `${c.name} (${((c.amount / total) * 100).toFixed(1)}%)`
      ),
      datasets: [
        {
          data: finalCats.map((c) => c.amount),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#D3D3D3",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Analysis Header */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
        <h2 className="text-xl font-bold mb-2 text-discovery-blue">
          Financial Analysis Complete
        </h2>
        <p className="text-gray-600">
          AI analyzed {displayData.transactionCount} transactions across{" "}
          {displayData.categories.length} categories
        </p>
        {displayData.enhancedMode && (
          <div className="mt-2 space-y-1">
            <div className="text-sm text-discovery-gold">
              ✨ Enhanced Statistical Analysis Active
            </div>
            {displayData.protectedCategories.length > 0 && (
              <div className="text-xs text-gray-600">
                🔒 Protected categories:{" "}
                {displayData.protectedCategories.join(", ")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Financial Summary Cards */}
      {realAnalysisResults && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl border border-discovery-gold/20 text-center">
            <p className="text-xs text-gray-600 mb-1">Monthly Income</p>
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
            <p className="text-xs text-gray-600 mb-1">Available Now</p>
            <p className="text-lg font-bold text-discovery-blue">
              R{displayData.disposableIncome.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(
                (displayData.disposableIncome / displayData.totalIncome) *
                100
              ).toFixed(1)}
              % savings rate
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-discovery-gold/20 text-center">
            <p className="text-xs text-gray-600 mb-1">Optimized</p>
            <p className="text-lg font-bold text-discovery-gold">
              R
              {displayData.optimizedIncome?.toLocaleString() ||
                displayData.disposableIncome.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(
                ((displayData.optimizedIncome || displayData.disposableIncome) /
                  displayData.totalIncome) *
                100
              ).toFixed(1)}
              % potential rate
            </p>
          </div>
        </div>
      )}

      {/* Optimization Potential */}
      {displayData.totalPotentialSavings > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
          <h3 className="text-lg font-semibold mb-2 flex items-center text-discovery-blue">
            <span className="mr-2 text-discovery-gold text-xl">💡</span>
            Optimization Potential
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Monthly Savings Potential</p>
              <p className="text-xl font-bold text-green-600">
                R{displayData.totalPotentialSavings.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Annual Impact</p>
              <p className="text-xl font-bold text-discovery-gold">
                R{(displayData.totalPotentialSavings * 12).toFixed(0)}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {displayData.categories
              .filter((cat) => cat.savings > 0)
              .sort((a, b) => b.savings - a.savings)
              .slice(0, 3)
              .map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white/70 rounded p-2"
                >
                  <div className="flex items-center gap-2">
                    <span>{getIconForCategory(cat.name)}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    R{cat.savings.toFixed(0)}/month
                  </span>
                </div>
              ))}
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
              plugins: {
                legend: {
                  position: "right",
                  labels: {
                    boxWidth: 12,
                    padding: 8,
                    font: {
                      size: 11,
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

      {/* Category Breakdown with Detailed Analysis */}
      <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-discovery-blue flex items-center">
          <span className="mr-2 text-discovery-gold text-xl">📋</span>
          Category Analysis & Savings Opportunities
        </h3>
        <div className="space-y-4">
          {displayData.categories
            .sort((a, b) => b.amount - a.amount)
            .map((category, idx) => (
              <div key={idx} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getIconForCategory(category.name)}
                    </span>
                    <div>
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        {category.name}
                        {displayData.protectedCategories?.includes(
                          category.name
                        ) && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            🔒 Protected
                          </span>
                        )}
                        {category.priority && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              category.priority >= 4
                                ? "bg-red-100 text-red-700"
                                : category.priority >= 3
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            Priority {category.priority}
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {category.count} transactions •{" "}
                        {category.percentage?.toFixed(1)}% of expenses
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">
                      R{category.amount.toLocaleString()}
                    </p>
                    {category.savings > 0 && (
                      <p className="text-sm text-green-600 font-medium">
                        Save R{category.savings.toFixed(0)}/month
                      </p>
                    )}
                    {category.confidenceLevel && (
                      <p
                        className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                          category.confidenceLevel === "High"
                            ? "bg-green-100 text-green-700"
                            : category.confidenceLevel === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {category.confidenceLevel} confidence
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-discovery-blue h-2 rounded-full"
                      style={{
                        width: `${Math.min(category.percentage || 0, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Suggestions */}
                {category.suggestions && category.suggestions.length > 0 && (
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      💡 Optimization Tips:
                    </p>
                    <ul className="space-y-1">
                      {category.suggestions
                        .slice(0, 3)
                        .map((suggestion, suggIdx) => (
                          <li
                            key={suggIdx}
                            className="text-xs text-gray-600 flex items-start"
                          >
                            <span className="mr-2 text-discovery-gold">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Action Plan */}
      {displayData.actionPlan &&
        Object.keys(displayData.actionPlan).length > 0 && (
          <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-discovery-blue flex items-center">
              <span className="mr-2 text-discovery-gold text-xl">📋</span>
              AI-Generated Action Plan
            </h3>
            <div className="space-y-4">
              {displayData.actionPlan.immediate_actions?.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h4 className="font-semibold text-sm text-red-700 mb-2 flex items-center">
                    <span className="mr-2">🚨</span>
                    Immediate Actions (Start Today)
                  </h4>
                  <ul className="space-y-2">
                    {displayData.actionPlan.immediate_actions.map(
                      (action, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-red-800 flex items-start"
                        >
                          <span className="mr-2 mt-1">•</span>
                          <span>{action}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
              {displayData.actionPlan.short_term_goals?.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-semibold text-sm text-yellow-700 mb-2 flex items-center">
                    <span className="mr-2">⏰</span>
                    Short-term Goals (1-3 months)
                  </h4>
                  <ul className="space-y-2">
                    {displayData.actionPlan.short_term_goals.map(
                      (goal, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-yellow-800 flex items-start"
                        >
                          <span className="mr-2 mt-1">•</span>
                          <span>{goal}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
              {displayData.actionPlan.long_term_goals?.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-sm text-green-700 mb-2 flex items-center">
                    <span className="mr-2">🎯</span>
                    Long-term Goals (3+ months)
                  </h4>
                  <ul className="space-y-2">
                    {displayData.actionPlan.long_term_goals.map((goal, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-green-800 flex items-start"
                      >
                        <span className="mr-2 mt-1">•</span>
                        <span>{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Enhanced AI Recommendations */}
      {displayData.insights && displayData.insights.length > 0 && (
        <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
          <h3 className="text-lg font-semibold mb-4 text-discovery-blue flex items-center">
            <span className="mr-2 text-discovery-gold text-xl">🤖</span>
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
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-discovery-blue">
                      {insight.title}
                    </p>
                    {insight.confidence && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          insight.confidence === "High"
                            ? "bg-green-100 text-green-700"
                            : insight.confidence === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {insight.confidence}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {insight.description}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {insight.suggestion}
                  </p>
                  <p className="text-xs text-discovery-gold font-medium mt-1">
                    {insight.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-discovery-blue flex items-center">
          <span className="mr-2 text-discovery-gold text-xl">📈</span>
          Financial Health Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Categories Analyzed</p>
            <p className="text-lg font-bold text-gray-800">
              {displayData.categories.length}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Transactions</p>
            <p className="text-lg font-bold text-gray-800">
              {displayData.transactionCount}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Largest Category</p>
            <p className="text-sm font-bold text-gray-800">
              {displayData.categories.length > 0
                ? displayData.categories.reduce((max, cat) =>
                    cat.amount > max.amount ? cat : max
                  ).name
                : "N/A"}
            </p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Optimization Score</p>
            <p className="text-lg font-bold text-discovery-gold">
              {displayData.totalPotentialSavings > 0
                ? Math.round(
                    (displayData.totalPotentialSavings /
                      displayData.totalExpenses) *
                      100
                  )
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
