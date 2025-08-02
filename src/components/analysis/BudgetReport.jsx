import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Progress } from "../ui/Progress";

const BudgetReport = ({ analysisResults }) => {
  if (!analysisResults) return null;

  const {
    profileName,
    totalIncome,
    totalExpenses,
    availableIncome,
    savingsRate,
    categoryBreakdown,
    suggestions,
    totalPotentialSavings,
    improvedSavingsRate,
    healthStatus,
    transactionCount,
  } = analysisResults;

  const getHealthColor = (rate) => {
    if (rate >= 20) return "text-green-600";
    if (rate >= 10) return "text-yellow-600";
    if (rate >= 0) return "text-orange-600";
    return "text-red-600";
  };

  const getHealthIcon = (rate) => {
    if (rate >= 20) return "✅";
    if (rate >= 10) return "🎯";
    return "⚠️";
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Budget Analysis Report
            <Badge variant="outline">{profileName}</Badge>
          </CardTitle>
          <CardDescription>
            Analysis of {transactionCount} transactions • Generated{" "}
            {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-green-600">
                R{totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                R{totalExpenses.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Available Income</p>
              <p className="text-2xl font-bold text-blue-600">
                R{availableIncome.toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Savings Rate</p>
              <p
                className={`text-2xl font-bold ${getHealthColor(savingsRate)}`}
              >
                {savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryBreakdown)
              .filter(([_, data]) => data.amount > 0)
              .sort(([_, a], [__, b]) => b.amount - a.amount)
              .map(([category, data]) => (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category}</span>
                    <div className="text-right">
                      <span className="font-bold">
                        R{data.amount.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({data.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={data.percentage} className="h-2" />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Budget Optimization Suggestions</CardTitle>
          <CardDescription>
            Potential monthly savings: R{totalPotentialSavings.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(suggestions)
              .filter(
                ([_, suggestion]) =>
                  suggestion.potential_savings > 0 &&
                  suggestion.current_amount > 0
              )
              .sort(
                ([_, a], [__, b]) => b.potential_savings - a.potential_savings
              )
              .map(([category, suggestion]) => (
                <div key={category} className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold">{category}</h4>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Current: R{suggestion.current_amount.toLocaleString()}
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        Save: R{suggestion.potential_savings.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {suggestion.suggestions.map((sug, idx) => (
                      <p key={idx} className="text-sm text-gray-700">
                        • {sug}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Health Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{getHealthIcon(savingsRate)}</span>
            Financial Health Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className={`font-medium ${getHealthColor(savingsRate)}`}>
                {healthStatus}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Current Savings Rate</p>
                <div className="flex items-center gap-2">
                  <Progress
                    value={Math.min(savingsRate, 100)}
                    className="flex-1"
                  />
                  <span
                    className={`text-sm font-medium ${getHealthColor(
                      savingsRate
                    )}`}
                  >
                    {savingsRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Potential Savings Rate</p>
                <div className="flex items-center gap-2">
                  <Progress
                    value={Math.min(improvedSavingsRate, 100)}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-green-600">
                    {improvedSavingsRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 text-lg">📈</span>
                <span className="font-medium text-blue-800">
                  Improvement Potential
                </span>
              </div>
              <p className="text-sm text-blue-700">
                By implementing these suggestions, you could improve your
                savings rate by{" "}
                <span className="font-bold">
                  {(improvedSavingsRate - savingsRate).toFixed(1)} percentage
                  points
                </span>
                , saving an additional{" "}
                <span className="font-bold">
                  R{(totalPotentialSavings * 12).toLocaleString()}
                </span>{" "}
                annually.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { BudgetReport };
