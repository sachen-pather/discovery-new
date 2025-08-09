import React, { useState, useEffect } from "react";
import { getDebtAnalysis } from "../../utils/api"; // Update this import path as needed

const Debt = ({ financialData, userProfile, realAnalysisResults }) => {
  // State for debt items and calculations
  const [debts, setDebts] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState("avalanche");
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [newDebt, setNewDebt] = useState({
    name: "",
    type: "credit_card",
    balance: "",
    interestRate: "",
    minimumPayment: "",
  });

  // Backend analysis results
  const [backendAnalysis, setBackendAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate available monthly amount for debt payments
  const monthlyIncome =
    realAnalysisResults?.total_income || financialData?.totalIncome || 0;
  const monthlyExpenses =
    realAnalysisResults?.total_expenses || financialData?.totalExpenses || 0;
  const availableMonthly = Math.max(0, monthlyIncome - monthlyExpenses);

  // Load backend debt analysis on component mount or when available monthly changes
  useEffect(() => {
    if (availableMonthly > 0) {
      loadDebtAnalysis();
    }
  }, [availableMonthly]);

  const loadDebtAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "🔄 Loading debt analysis with available monthly:",
        availableMonthly
      );
      const analysis = await getDebtAnalysis(availableMonthly);
      setBackendAnalysis(analysis);

      // Convert backend debt data to frontend format
      if (analysis.avalanche?.debts || analysis.snowball?.debts) {
        const backendDebts =
          analysis.avalanche?.debts || analysis.snowball?.debts;
        const convertedDebts = backendDebts.map((debt, index) => ({
          id: index + 1,
          name: debt.name,
          type: getDebtTypeFromName(debt.name),
          emoji: getDebtEmoji(getDebtTypeFromName(debt.name)),
          balance: debt.starting_balance,
          interestRate: debt.apr * 100, // Convert decimal to percentage
          minimumPayment: debt.min_payment,
          currentPayment: debt.min_payment,
          color: getDebtColor(index),
        }));
        setDebts(convertedDebts);
      }

      console.log("✅ Debt analysis loaded:", analysis);
    } catch (err) {
      console.error("❌ Error loading debt analysis:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine debt type from name
  const getDebtTypeFromName = (name) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("credit") || nameLower.includes("card"))
      return "credit_card";
    if (nameLower.includes("personal") || nameLower.includes("loan"))
      return "personal_loan";
    if (nameLower.includes("store") || nameLower.includes("account"))
      return "store_card";
    if (nameLower.includes("overdraft")) return "overdraft";
    if (nameLower.includes("home") || nameLower.includes("mortgage"))
      return "home_loan";
    if (nameLower.includes("car") || nameLower.includes("vehicle"))
      return "car_loan";
    if (nameLower.includes("student")) return "student_loan";
    return "credit_card";
  };

  // Helper function to get debt color
  const getDebtColor = (index) => {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-purple-500",
      "bg-blue-500",
      "bg-yellow-500",
    ];
    return colors[index % colors.length];
  };

  // Calculate total debt metrics (use backend data if available, fallback to frontend)
  const getDebtMetrics = () => {
    if (backendAnalysis && backendAnalysis.avalanche?.debts) {
      const backendDebts = backendAnalysis.avalanche.debts;
      return {
        totalDebt: backendDebts.reduce(
          (sum, debt) => sum + debt.starting_balance,
          0
        ),
        totalMinimumPayment: backendDebts.reduce(
          (sum, debt) => sum + debt.min_payment,
          0
        ),
        totalCurrentPayment: backendDebts.reduce(
          (sum, debt) => sum + debt.min_payment,
          0
        ),
        averageInterestRate:
          backendDebts.length > 0
            ? (backendDebts.reduce((sum, debt) => sum + debt.apr, 0) /
                backendDebts.length) *
              100
            : 0,
      };
    }

    // Fallback to frontend state
    return {
      totalDebt: debts.reduce((sum, debt) => sum + debt.balance, 0),
      totalMinimumPayment: debts.reduce(
        (sum, debt) => sum + debt.minimumPayment,
        0
      ),
      totalCurrentPayment: debts.reduce(
        (sum, debt) => sum + debt.currentPayment,
        0
      ),
      averageInterestRate:
        debts.length > 0
          ? debts.reduce((sum, debt) => sum + debt.interestRate, 0) /
            debts.length
          : 0,
    };
  };

  const debtMetrics = getDebtMetrics();

  // Calculate debt-to-income ratio
  const debtToIncomeRatio =
    monthlyIncome > 0
      ? (debtMetrics.totalMinimumPayment / monthlyIncome) * 100
      : 0;

  // Get debt health status
  const getDebtHealthStatus = () => {
    if (debtToIncomeRatio < 20) {
      return { status: "Good", color: "text-green-600", icon: "✅" };
    } else if (debtToIncomeRatio < 36) {
      return { status: "Manageable", color: "text-yellow-600", icon: "⚠️" };
    } else {
      return { status: "High Risk", color: "text-red-600", icon: "🚨" };
    }
  };

  const debtHealth = getDebtHealthStatus();

  // Emoji mapping for debt types
  const getDebtEmoji = (type) => {
    const emojiMap = {
      credit_card: "💳",
      personal_loan: "💰",
      home_loan: "🏠",
      car_loan: "🚗",
      student_loan: "🎓",
      store_card: "🛍️",
      overdraft: "📱",
    };
    return emojiMap[type] || "💳";
  };

  // Calculate payoff timeline (simplified)
  const calculatePayoffMonths = (balance, rate, payment) => {
    if (payment <= 0) return 0;
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return Math.ceil(balance / payment);

    const months =
      Math.log(payment / (payment - balance * monthlyRate)) /
      Math.log(1 + monthlyRate);
    return Math.ceil(months);
  };

  // Sort debts based on strategy
  const getSortedDebts = () => {
    const sortedDebts = [...debts];
    if (selectedStrategy === "avalanche") {
      return sortedDebts.sort((a, b) => b.interestRate - a.interestRate);
    } else if (selectedStrategy === "snowball") {
      return sortedDebts.sort((a, b) => a.balance - b.balance);
    }
    return sortedDebts;
  };

  // Handle adding new debt
  const handleAddDebt = () => {
    if (
      newDebt.name &&
      newDebt.balance &&
      newDebt.interestRate &&
      newDebt.minimumPayment
    ) {
      const emoji = getDebtEmoji(newDebt.type);
      const newDebtItem = {
        id: Date.now(),
        ...newDebt,
        emoji: emoji,
        balance: parseFloat(newDebt.balance),
        interestRate: parseFloat(newDebt.interestRate),
        minimumPayment: parseFloat(newDebt.minimumPayment),
        currentPayment: parseFloat(newDebt.minimumPayment),
        color: "bg-blue-500",
      };
      setDebts([...debts, newDebtItem]);
      setNewDebt({
        name: "",
        type: "credit_card",
        balance: "",
        interestRate: "",
        minimumPayment: "",
      });
      setShowAddDebt(false);
    }
  };

  // Handle removing debt
  const handleRemoveDebt = (id) => {
    setDebts(debts.filter((debt) => debt.id !== id));
  };

  // Get the current strategy results from backend
  const getCurrentStrategyResults = () => {
    if (!backendAnalysis) return null;
    return backendAnalysis[selectedStrategy] || backendAnalysis.avalanche;
  };

  const currentStrategy = getCurrentStrategyResults();

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-600">
              Loading debt analysis...
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-start space-x-2">
            <span className="text-red-600">⚠️</span>
            <div>
              <p className="text-sm font-medium text-red-800">Analysis Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <button
                onClick={loadDebtAnalysis}
                className="mt-2 text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debt Overview Card */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Debt Overview</h2>
          <span className={`${debtHealth.color} text-sm font-medium`}>
            {debtHealth.icon} {debtHealth.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Total Debt</p>
            <p className="text-lg font-bold text-gray-800">
              R{debtMetrics.totalDebt.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Monthly Payment</p>
            <p className="text-lg font-bold text-gray-800">
              R{debtMetrics.totalCurrentPayment.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* AI Optimized Debt Plan */}
      {currentStrategy && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <span className="text-xl">🤖</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                AI-Optimized Debt Plan ({currentStrategy.strategy})
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Based on your financial data and R
                {availableMonthly.toLocaleString()} available monthly
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/80 rounded p-2">
                  <p className="text-xs text-gray-500">Recommended Strategy</p>
                  <p className="text-sm font-bold text-blue-600">
                    {backendAnalysis?.recommendation === "avalanche"
                      ? "Avalanche"
                      : "Snowball"}
                  </p>
                </div>
                <div className="bg-white/80 rounded p-2">
                  <p className="text-xs text-gray-500">Debt-Free In</p>
                  <p className="text-sm font-bold text-green-600">
                    {currentStrategy.months_to_debt_free} months
                  </p>
                </div>
                <div className="bg-white/80 rounded p-2">
                  <p className="text-xs text-gray-500">Total Interest</p>
                  <p className="text-sm font-bold text-gray-800">
                    R{currentStrategy.total_interest_paid?.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/80 rounded p-2">
                  <p className="text-xs text-gray-500">Interest Saved</p>
                  <p className="text-sm font-bold text-green-600">
                    R
                    {currentStrategy.interest_saved_vs_min_only?.toLocaleString()}
                  </p>
                </div>
              </div>
              {currentStrategy.payoff_order && (
                <div className="mt-3 p-2 bg-white/80 rounded">
                  <p className="text-xs text-gray-700 font-medium">
                    Payoff Order:
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentStrategy.payoff_order.map((debt, index) => (
                      <span
                        key={index}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                      >
                        {index + 1}. {debt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Repayment Strategy Selector */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Repayment Strategy
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSelectedStrategy("avalanche")}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedStrategy === "avalanche"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <span className="text-xl mb-1">📉</span>
            <p className="text-xs font-medium">Avalanche</p>
            <p className="text-xs text-gray-500 mt-1">Highest rate first</p>
            {backendAnalysis?.avalanche && (
              <p className="text-xs text-blue-600 mt-1">
                Save R
                {backendAnalysis.avalanche.interest_saved_vs_min_only?.toLocaleString()}
              </p>
            )}
          </button>
          <button
            onClick={() => setSelectedStrategy("snowball")}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedStrategy === "snowball"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <span className="text-xl mb-1">🎯</span>
            <p className="text-xs font-medium">Snowball</p>
            <p className="text-xs text-gray-500 mt-1">Lowest balance first</p>
            {backendAnalysis?.snowball && (
              <p className="text-xs text-blue-600 mt-1">
                Save R
                {backendAnalysis.snowball.interest_saved_vs_min_only?.toLocaleString()}
              </p>
            )}
          </button>
        </div>
      </div>

      {/* Debt List */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Your Debts</h3>
          <button
            onClick={() => setShowAddDebt(!showAddDebt)}
            className="text-blue-600 text-sm font-medium"
          >
            + Add Debt
          </button>
        </div>

        {/* Add Debt Form */}
        {showAddDebt && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
            <input
              type="text"
              placeholder="Debt name"
              value={newDebt.name}
              onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <select
              value={newDebt.type}
              onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="credit_card">Credit Card</option>
              <option value="personal_loan">Personal Loan</option>
              <option value="home_loan">Home Loan</option>
              <option value="car_loan">Car Loan</option>
              <option value="student_loan">Student Loan</option>
              <option value="store_card">Store Card</option>
              <option value="overdraft">Overdraft</option>
            </select>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="Balance"
                value={newDebt.balance}
                onChange={(e) =>
                  setNewDebt({ ...newDebt, balance: e.target.value })
                }
                className="px-2 py-2 border rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Rate %"
                value={newDebt.interestRate}
                onChange={(e) =>
                  setNewDebt({ ...newDebt, interestRate: e.target.value })
                }
                className="px-2 py-2 border rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Min payment"
                value={newDebt.minimumPayment}
                onChange={(e) =>
                  setNewDebt({ ...newDebt, minimumPayment: e.target.value })
                }
                className="px-2 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddDebt}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddDebt(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Debt Items */}
        <div className="space-y-2">
          {getSortedDebts().map((debt, index) => {
            const months = calculatePayoffMonths(
              debt.balance,
              debt.interestRate,
              debt.currentPayment
            );
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;

            return (
              <div
                key={debt.id}
                className="border rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`${debt.color} p-2 rounded-lg flex items-center justify-center`}
                    >
                      <span className="text-white text-lg">{debt.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-800">
                          {debt.name}
                        </p>
                        {index === 0 && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            Focus
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        R{debt.balance.toLocaleString()} at {debt.interestRate}%
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <p className="text-xs text-gray-400">Monthly</p>
                          <p className="text-xs font-medium">
                            R{debt.currentPayment}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Payoff in</p>
                          <p className="text-xs font-medium">
                            {years > 0
                              ? `${years}y ${remainingMonths}m`
                              : `${months}m`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDebt(debt.id)}
                    className="text-gray-400 hover:text-red-500 text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {debts.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-400">
            <span className="text-4xl opacity-50">💳</span>
            <p className="text-sm mt-2">
              {backendAnalysis
                ? "No debts found in analysis"
                : "No debts added yet"}
            </p>
            <p className="text-xs mt-1">
              {availableMonthly <= 0
                ? "Upload your financial data first to see debt analysis"
                : "Analysis will load automatically when you have available funds"}
            </p>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Smart Debt Tips
        </h3>
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Always pay more than minimum on high-interest debts
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Consider consolidating multiple high-interest debts
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Build emergency fund while paying off debt
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Use the avalanche method for maximum interest savings
            </p>
          </div>
          {backendAnalysis && backendAnalysis.recommendation && (
            <div className="flex items-start space-x-2 bg-blue-50 p-2 rounded mt-2">
              <span className="text-xs text-blue-600 mt-0.5">🤖</span>
              <p className="text-xs text-blue-700">
                <strong>AI Recommendation:</strong> Use the{" "}
                {backendAnalysis.recommendation} method to save R
                {(
                  backendAnalysis[backendAnalysis.recommendation]
                    ?.interest_saved_vs_min_only || 0
                ).toLocaleString()}
                in interest payments.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Debt;
