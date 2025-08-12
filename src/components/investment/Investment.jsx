import React, { useState, useEffect } from "react";
import { getInvestmentAnalysis } from "../../utils/api";

const Investment = ({ financialData, userProfile, realAnalysisResults }) => {
  const [selectedStrategy, setSelectedStrategy] = useState("moderate");

  // Backend analysis results
  const [backendAnalysis, setBackendAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate available investment capacity
  const monthlyIncome =
    realAnalysisResults?.total_income || financialData?.totalIncome || 0;
  const monthlyExpenses =
    realAnalysisResults?.total_expenses || financialData?.totalExpenses || 0;
  const availableMonthly =
    realAnalysisResults?.available_income ||
    Math.max(0, monthlyIncome - monthlyExpenses);
  const optimizedAvailable =
    realAnalysisResults?.optimized_available_income || availableMonthly;
  const enhancedMode = realAnalysisResults?.enhanced_mode || false;

  // Load backend investment analysis on component mount or when available monthly changes
  useEffect(() => {
    if (availableMonthly > 0) {
      loadInvestmentAnalysis();
    }
  }, [availableMonthly, optimizedAvailable]);

  const loadInvestmentAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "🔄 Loading investment analysis with available monthly:",
        optimizedAvailable || availableMonthly
      );
      const analysis = await getInvestmentAnalysis(
        optimizedAvailable || availableMonthly
      );
      setBackendAnalysis(analysis);
      console.log("✅ Investment analysis loaded:", analysis);
    } catch (err) {
      console.error("❌ Error loading investment analysis:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get backend investment strategies or fallback to defaults
  const getInvestmentStrategies = () => {
    if (backendAnalysis?.profiles) {
      const strategies = {};
      Object.entries(backendAnalysis.profiles).forEach(([key, profile]) => {
        strategies[key] = {
          name: profile.profile.name,
          avgReturn: profile.profile.avg_return,
          volatility: profile.profile.volatility,
          effectiveReturn: profile.profile.effective_return,
          description: profile.profile.description,
          emoji: key === "aggressive" ? "🚀" : key === "moderate" ? "⚖️" : "🛡️",
          color:
            key === "aggressive"
              ? "bg-red-200"
              : key === "moderate"
              ? "bg-yellow-200"
              : "bg-green-200",
          allocation: getDefaultAllocation(key),
          projections: profile.projections,
        };
      });
      return strategies;
    }

    // Fallback to default strategies
    return {
      aggressive: {
        name: "Aggressive",
        avgReturn: 10.5,
        volatility: 18.0,
        effectiveReturn: 8.88,
        description: "High growth potential, high risk",
        emoji: "🚀",
        color: "bg-red-200",
        allocation: { stocks: 85, bonds: 10, cash: 5 },
      },
      moderate: {
        name: "Moderate",
        avgReturn: 8.5,
        volatility: 12.0,
        effectiveReturn: 7.78,
        description: "Balanced growth and stability",
        emoji: "⚖️",
        color: "bg-yellow-200",
        allocation: { stocks: 60, bonds: 30, cash: 10 },
      },
      conservative: {
        name: "Conservative",
        avgReturn: 6.5,
        volatility: 6.0,
        effectiveReturn: 6.32,
        description: "Capital preservation focus",
        emoji: "🛡️",
        color: "bg-green-200",
        allocation: { stocks: 30, bonds: 60, cash: 10 },
      },
    };
  };

  const getDefaultAllocation = (strategy) => {
    const allocations = {
      aggressive: { stocks: 85, bonds: 10, cash: 5 },
      moderate: { stocks: 60, bonds: 30, cash: 10 },
      conservative: { stocks: 30, bonds: 60, cash: 10 },
    };
    return allocations[strategy] || allocations.moderate;
  };

  const investmentStrategies = getInvestmentStrategies();

  // Calculate future value with monthly contributions (fallback)
  const calculateFutureValue = (monthlyContribution, years, effectiveRate) => {
    const months = years * 12;
    const monthlyRate = effectiveRate / 100 / 12;
    if (monthlyRate === 0) {
      return monthlyContribution * months;
    }
    return (
      (monthlyContribution * (Math.pow(1 + monthlyRate, months) - 1)) /
      monthlyRate
    );
  };

  // Generate projection table for a strategy
  const generateProjectionTable = (strategy, monthlyAmount) => {
    if (strategy.projections && strategy.projections.length > 0) {
      return strategy.projections;
    }

    const yearsList = [1, 5, 10, 15, 20, 25];
    const effectiveRate = strategy.effectiveReturn;
    return yearsList.map((years) => {
      const futureValue = calculateFutureValue(
        monthlyAmount,
        years,
        effectiveRate
      );
      const totalContributions = monthlyAmount * years * 12;
      return {
        years,
        effective_annual_return: effectiveRate,
        monthly_contribution: monthlyAmount,
        effective_future_value: futureValue,
        total_contributions: totalContributions,
        effective_interest_earned: futureValue - totalContributions,
      };
    });
  };

  return (
    <div className="space-y-4">
      {/* Loading and Error States */}
      {loading && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-600">
            Loading enhanced investment analysis...
          </span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start space-x-2">
            <span className="text-red-600">⚠️</span>
            <div>
              <p className="text-sm font-medium text-red-800">Analysis Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <button
                onClick={loadInvestmentAnalysis}
                className="mt-2 text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Summary */}
      {backendAnalysis && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start space-x-3">
            <span className="text-xl">🤖</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                AI Investment Analysis
                {enhancedMode && (
                  <span className="ml-2 text-xs bg-discovery-gold/20 text-discovery-gold px-2 py-1 rounded-full">
                    Enhanced
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Based on R{backendAnalysis.monthly_savings?.toLocaleString()}{" "}
                available monthly
                {enhancedMode && " with statistical optimization"}
              </p>
              {backendAnalysis.recommendations && (
                <div className="bg-white/80 rounded p-2">
                  <p className="text-xs text-gray-700 font-medium mb-1">
                    Key Recommendations:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {backendAnalysis.recommendations
                      .slice(0, 3)
                      .map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
              {enhancedMode && (
                <div className="mt-2 p-2 bg-discovery-gold/10 rounded">
                  <p className="text-xs text-discovery-gold">
                    ✨ Enhanced mode: Advanced portfolio optimization with South
                    African market context
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Investment Strategy Selection
          {enhancedMode && (
            <span className="ml-2 text-xs bg-discovery-gold/20 text-discovery-gold px-2 py-1 rounded-full">
              Enhanced
            </span>
          )}
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {Object.entries(investmentStrategies).map(([key, strategy]) => (
            <button
              key={key}
              onClick={() => setSelectedStrategy(key)}
              className={`p-3 rounded-lg border-2 transition-all text-center ${
                selectedStrategy === key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{strategy.emoji}</span>
              <p className="text-xs font-medium mt-1">{strategy.name}</p>
              <p className="text-[10px] text-gray-500">
                {strategy.avgReturn?.toFixed(1)}% avg
              </p>
              <p className="text-[10px] text-gray-400">
                {strategy.volatility?.toFixed(1)}% vol
              </p>
            </button>
          ))}
        </div>
        <div className="rounded-lg p-3 bg-gray-50 border-l-4 border-blue-500">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm text-gray-800">
              {investmentStrategies[selectedStrategy].name} Strategy
            </h4>
            <span className="text-2xl">
              {investmentStrategies[selectedStrategy].emoji}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {investmentStrategies[selectedStrategy].description}
          </p>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div>
              <p className="text-[10px] text-gray-500">Avg Return</p>
              <p className="text-sm font-bold text-gray-800">
                {investmentStrategies[selectedStrategy].avgReturn?.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Volatility (σ)</p>
              <p className="text-sm font-bold text-gray-800">
                {investmentStrategies[selectedStrategy].volatility?.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Effective Return</p>
              <p className="text-sm font-bold text-green-600">
                {investmentStrategies[
                  selectedStrategy
                ].effectiveReturn?.toFixed(2)}
                %
              </p>
            </div>
          </div>
          {investmentStrategies[selectedStrategy].allocation && (
            <div className="mt-3 space-y-1">
              <p className="text-[10px] text-gray-500 mb-1">
                Asset Allocation:
              </p>
              {Object.entries(
                investmentStrategies[selectedStrategy].allocation
              ).map(([asset, percentage]) => (
                <div
                  key={asset}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="capitalize text-gray-600">{asset}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          asset === "stocks"
                            ? "bg-blue-600"
                            : asset === "bonds"
                            ? "bg-green-600"
                            : "bg-yellow-600"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-700 w-10 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {enhancedMode && (
            <div className="mt-2 p-2 bg-discovery-gold/10 rounded">
              <p className="text-xs text-discovery-gold">
                ✨ Optimized for South African market conditions.
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Investment Projections
        </h3>
        <p className="text-xs text-gray-600 mb-3">
          Monthly contribution: R
          {(
            backendAnalysis?.monthly_savings || optimizedAvailable
          ).toLocaleString()}
          {enhancedMode && " (optimized)"}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-600">
                  Years
                </th>
                <th className="text-right py-2 font-medium text-gray-600">
                  Future Value
                </th>
                <th className="text-right py-2 font-medium text-gray-600">
                  Total Invested
                </th>
                <th className="text-right py-2 font-medium text-gray-600">
                  Interest Earned
                </th>
              </tr>
            </thead>
            <tbody>
              {generateProjectionTable(
                investmentStrategies[selectedStrategy],
                backendAnalysis?.monthly_savings || optimizedAvailable
              ).map((proj, i) => {
                const fv = proj.effective_future_value || 0;
                const tc = proj.total_contributions || 0;
                const ie = proj.effective_interest_earned || fv - tc;
                return (
                  <tr
                    key={proj.years}
                    className={i % 2 === 0 ? "bg-gray-50" : ""}
                  >
                    <td className="py-2 font-medium">{proj.years}</td>
                    <td className="text-right py-2 font-bold text-blue-600">
                      R
                      {fv.toLocaleString("en-ZA", {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="text-right py-2 text-gray-600">
                      R
                      {tc.toLocaleString("en-ZA", {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="text-right py-2 text-green-600 font-medium">
                      R
                      {ie.toLocaleString("en-ZA", {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-2 bg-gray-100 rounded">
          <p className="text-[10px] text-gray-700">
            <strong>Note:</strong> Projections use effective return to account
            for volatility. Returns are pre-tax and fees.{" "}
            {enhancedMode && "Enhanced analysis applied."}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Strategy Comparison (20 Year Horizon)
        </h3>
        <div className="space-y-2">
          {Object.entries(investmentStrategies).map(([key, strategy]) => {
            const monthlyAmount =
              backendAnalysis?.monthly_savings || optimizedAvailable;
            const proj20 = strategy.projections?.find((p) => p.years === 20);
            const futureValue =
              proj20?.effective_future_value ||
              calculateFutureValue(monthlyAmount, 20, strategy.effectiveReturn);
            const isSelected = key === selectedStrategy;
            return (
              <div
                key={key}
                className={`rounded-lg p-3 border ${
                  isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{strategy.emoji}</span>
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          isSelected ? "text-blue-800" : "text-gray-700"
                        }`}
                      >
                        {strategy.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {strategy.effectiveReturn?.toFixed(2)}% effective
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        isSelected ? "text-blue-800" : "text-gray-700"
                      }`}
                    >
                      R
                      {futureValue.toLocaleString("en-ZA", {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-[10px] text-gray-500">after 20 years</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <span className="mr-2">📚</span>Investment Best Practices
          {enhancedMode && (
            <span className="ml-2 text-xs bg-discovery-gold/20 text-discovery-gold px-2 py-1 rounded-full">
              Enhanced
            </span>
          )}
        </h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-start space-x-2">
            <span className="mt-0.5">▸</span>
            <p>
              Stay disciplined with your chosen strategy through market cycles.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="mt-0.5">▸</span>
            <p>Max out your Tax-Free Savings Account (R36,000/year limit).</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="mt-0.5">▸</span>
            <p>
              Dollar-cost averaging: Invest consistently regardless of market
              conditions.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="mt-0.5">▸</span>
            <p>
              Keep 3-6 months' expenses in an emergency fund before aggressive
              investing.
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="mt-0.5">▸</span>
            <p>Review and rebalance your portfolio at least annually.</p>
          </div>
          {enhancedMode && (
            <div className="flex items-start space-x-2 bg-discovery-gold/10 p-2 rounded mt-2">
              <span className="text-discovery-gold mt-0.5">✨</span>
              <p className="text-discovery-gold">
                <strong>Enhanced Tip:</strong> Recommendations consider SA tax
                implications.
              </p>
            </div>
          )}
          {backendAnalysis?.recommendations?.slice(3).map((rec, index) => (
            <div
              key={index}
              className="flex items-start space-x-2 bg-blue-50 p-2 rounded"
            >
              <span className="text-blue-600 mt-0.5">🤖</span>
              <p className="text-blue-700">
                <strong>AI Tip:</strong> {rec}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Integration Summary */}
      {realAnalysisResults && (
        <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg border border-discovery-gold/20">
          <h3 className="text-sm font-semibold text-discovery-blue mb-2">
            💰 Investment Capacity Summary
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-600">Available Monthly</p>
              <p className="text-lg font-bold text-discovery-blue">
                R{availableMonthly.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">With Optimizations</p>
              <p className="text-lg font-bold text-discovery-gold">
                R{optimizedAvailable.toLocaleString()}
              </p>
            </div>
          </div>
          {enhancedMode && (
            <p className="text-xs text-discovery-gold mt-2">
              Enhanced analysis maximizes investment potential.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Investment;
