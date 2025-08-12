// src/components/sections/Debt.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { getDebtAnalysis, getApiHealth } from "../../utils/api";

const Debt = ({ financialData, userProfile, realAnalysisResults }) => {
  // UI state
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

  // Backend analysis
  const [backendAnalysis, setBackendAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [features, setFeatures] = useState(null);
  const abortRef = useRef(null);

  // Budget inputs
  const monthlyIncome =
    Number(realAnalysisResults?.total_income) ||
    Number(financialData?.totalIncome) ||
    0;
  const monthlyExpenses =
    Number(realAnalysisResults?.total_expenses) ||
    Number(financialData?.totalExpenses) ||
    0;

  const availableMonthly =
    Number(realAnalysisResults?.available_income) ||
    Math.max(0, monthlyIncome - monthlyExpenses);

  const optimizedAvailable =
    Number(realAnalysisResults?.optimized_available_income) ||
    Number(availableMonthly);

  const enhancedMode = !!realAnalysisResults?.enhanced_mode;

  // Extract debt information from transactions
  const debtPayments = useMemo(() => {
    if (!realAnalysisResults?.transactions) return [];

    return realAnalysisResults.transactions
      .filter((t) => t.IsDebtPayment && t.DebtName && t.DebtKind)
      .map((t) => ({
        name: t.DebtName,
        kind: t.DebtKind,
        payment: Math.abs(t["Amount (ZAR)"] || 0),
        description: t.Description,
      }));
  }, [realAnalysisResults]);

  // Initial feature health check
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const apiHealth = await getApiHealth();
        if (!alive) return;
        setFeatures(apiHealth?.features || null);
      } catch (e) {
        // non-fatal
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Seed debts from detected debt payments
  useEffect(() => {
    if (debtPayments.length > 0 && debts.length === 0) {
      const seededDebts = debtPayments.map((debt, idx) => ({
        id: idx + 1,
        name: debt.name,
        type: debt.kind,
        emoji: getDebtEmoji(debt.kind),
        balance: 0, // User needs to fill this
        interestRate: 0, // User needs to fill this
        minimumPayment: debt.payment,
        currentPayment: debt.payment,
        color: getDebtColor(idx),
        detected: true,
      }));
      setDebts(seededDebts);
    }
  }, [debtPayments, debts.length]);

  // Fetch backend debt analysis when the available amount changes
  useEffect(() => {
    if (optimizedAvailable > 0 || availableMonthly > 0) {
      loadDebtAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optimizedAvailable, availableMonthly]);

  const loadDebtAnalysis = async () => {
    // cancel any in-flight
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const amount = optimizedAvailable || availableMonthly;
      const debtsCsvPath = realAnalysisResults?.debts_csv_path;
      const analysis = await getDebtAnalysis(amount, debtsCsvPath);
      setBackendAnalysis(analysis);

      // Auto-select recommendation if present
      if (
        analysis?.recommendation &&
        (analysis.avalanche || analysis.snowball)
      ) {
        setSelectedStrategy(
          analysis.recommendation === "snowball" ? "snowball" : "avalanche"
        );
      }
    } catch (err) {
      console.error("Debt analysis error:", err);
      setError(
        err?.message ||
          (features?.debt_optimizer
            ? "Debt analysis failed"
            : "Debt optimizer is not available on the server")
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getDebtTypeFromName = (name) => {
    const s = String(name || "").toLowerCase();
    if (s.includes("credit") || s.includes("card")) return "credit_card";
    if (s.includes("personal") || s.includes("loan")) return "personal_loan";
    if (s.includes("store") || s.includes("account")) return "store_card";
    if (s.includes("overdraft")) return "overdraft";
    if (s.includes("home") || s.includes("mortgage") || s.includes("bond"))
      return "home_loan";
    if (s.includes("car") || s.includes("vehicle") || s.includes("auto"))
      return "car_loan";
    if (s.includes("student") || s.includes("education")) return "student_loan";
    return "credit_card";
  };

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

  const getDebtEmoji = (type) => {
    const emojiMap = {
      credit_card: "💳",
      personal_loan: "💰",
      home_loan: "🏠",
      car_loan: "🚗",
      student_loan: "🎓",
      store_card: "🛍️",
      overdraft: "🏦",
      mortgage: "🏠",
    };
    return emojiMap[type] || "💳";
  };

  // Compute summary metrics with proper fallbacks
  const debtMetrics = useMemo(() => {
    const userDebtTotal = debts.reduce(
      (sum, d) => sum + (Number(d.balance) || 0),
      0
    );
    const userMinPayment = debts.reduce(
      (sum, d) => sum + (Number(d.minimumPayment) || 0),
      0
    );
    const userCurrentPayment = debts.reduce(
      (sum, d) => sum + (Number(d.currentPayment || d.minimumPayment) || 0),
      0
    );

    // If user has entered debt data, use it
    if (userDebtTotal > 0) {
      const avgRate =
        debts.length > 0
          ? debts.reduce((sum, d) => sum + (Number(d.interestRate) || 0), 0) /
            debts.length
          : 0;

      return {
        totalDebt: userDebtTotal,
        totalMinimumPayment: userMinPayment,
        totalCurrentPayment: userCurrentPayment,
        averageInterestRate: avgRate,
        source: "user",
      };
    }

    // Fall back to detected debt payments
    if (debtPayments.length > 0) {
      const totalPayments = debtPayments.reduce((sum, d) => sum + d.payment, 0);
      // Estimate debt based on typical payment ratios
      const estimatedDebt = totalPayments * 20; // Assuming ~5% of balance as monthly payment

      return {
        totalDebt: estimatedDebt,
        totalMinimumPayment: totalPayments,
        totalCurrentPayment: totalPayments,
        averageInterestRate: 18, // Typical SA rate
        source: "estimated",
      };
    }

    // Fall back to backend analysis estimates
    const strat =
      backendAnalysis?.[selectedStrategy] ||
      backendAnalysis?.avalanche ||
      backendAnalysis?.snowball;
    if (strat?.total_interest_paid != null) {
      const estimatedTotalDebt = Number(strat.total_interest_paid) * 3;
      const estimatedMinPayment = estimatedTotalDebt * 0.05;
      return {
        totalDebt: estimatedTotalDebt,
        totalMinimumPayment: estimatedMinPayment,
        totalCurrentPayment: estimatedMinPayment,
        averageInterestRate: 18,
        source: "backend",
      };
    }

    return {
      totalDebt: 0,
      totalMinimumPayment: 0,
      totalCurrentPayment: 0,
      averageInterestRate: 0,
      source: "none",
    };
  }, [debts, backendAnalysis, selectedStrategy, debtPayments]);

  // Debt health calculations
  const debtToIncomeRatio =
    monthlyIncome > 0
      ? (Number(debtMetrics.totalMinimumPayment) / Number(monthlyIncome)) * 100
      : 0;

  const debtHealth =
    debtToIncomeRatio < 20
      ? { status: "Good", color: "text-green-600", icon: "✅" }
      : debtToIncomeRatio < 36
      ? { status: "Manageable", color: "text-yellow-600", icon: "⚠️" }
      : { status: "High Risk", color: "text-red-600", icon: "🚨" };

  // Simple payoff calculator
  const calculatePayoffMonths = (balance, rate, payment) => {
    const b = Number(balance) || 0;
    const r = (Number(rate) || 0) / 100 / 12;
    const p = Number(payment) || 0;
    if (p <= 0 || b <= 0) return 0;
    if (r === 0) return Math.ceil(b / p);
    const denom = p - b * r;
    if (denom <= 0) return Infinity;
    const months = Math.log(p / denom) / Math.log(1 + r);
    return Math.max(0, Math.ceil(months));
  };

  const getSortedDebts = () => {
    const sorted = [...debts];
    if (selectedStrategy === "avalanche") {
      return sorted.sort(
        (a, b) => (Number(b.interestRate) || 0) - (Number(a.interestRate) || 0)
      );
    } else if (selectedStrategy === "snowball") {
      return sorted.sort(
        (a, b) => (Number(a.balance) || 0) - (Number(b.balance) || 0)
      );
    }
    return sorted;
  };

  const handleAddDebt = () => {
    const { name, type, balance, interestRate, minimumPayment } = newDebt;
    if (!name || !balance || !interestRate || !minimumPayment) return;

    const item = {
      id: Date.now(),
      name: String(name),
      type,
      emoji: getDebtEmoji(type),
      balance: Number(balance) || 0,
      interestRate: Number(interestRate) || 0,
      minimumPayment: Number(minimumPayment) || 0,
      currentPayment: Number(minimumPayment) || 0,
      color: getDebtColor(debts.length),
      detected: false,
    };
    setDebts((d) => [...d, item]);
    setNewDebt({
      name: "",
      type: "credit_card",
      balance: "",
      interestRate: "",
      minimumPayment: "",
    });
    setShowAddDebt(false);
  };

  const handleUpdateDebt = (id, updatedFields) => {
    setDebts((list) =>
      list.map((d) =>
        d.id === id
          ? {
              ...d,
              ...updatedFields,
              currentPayment:
                updatedFields.currentPayment != null
                  ? Number(updatedFields.currentPayment)
                  : d.currentPayment,
            }
          : d
      )
    );
  };

  const handleRemoveDebt = (id) => {
    setDebts((d) => d.filter((x) => x.id !== id));
  };

  const currentStrategy =
    backendAnalysis?.[selectedStrategy] ||
    backendAnalysis?.avalanche ||
    backendAnalysis?.snowball ||
    null;

  return (
    <div className="space-y-4">
      {/* Loading */}
      {loading && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-600">
              Loading enhanced debt analysis...
            </span>
          </div>
        </div>
      )}

      {/* Error */}
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

      {/* Overview */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Debt Overview</h2>
          <div className="flex items-center gap-2">
            <span className={`${debtHealth.color} text-sm font-medium`}>
              {debtHealth.icon} {debtHealth.status}
            </span>
            {enhancedMode && (
              <span className="text-xs bg-discovery-gold/20 text-discovery-gold px-2 py-1 rounded-full">
                Enhanced
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Total Debt</p>
            <p className="text-lg font-bold text-gray-800">
              R{Number(debtMetrics.totalDebt).toLocaleString()}
            </p>
            {debtMetrics.source !== "user" && (
              <p className="text-xs text-gray-400">
                {debtMetrics.source === "estimated"
                  ? "Estimated from payments"
                  : debtMetrics.source === "backend"
                  ? "AI estimated"
                  : "Add debt details"}
              </p>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Monthly Payment</p>
            <p className="text-lg font-bold text-gray-800">
              R{Number(debtMetrics.totalCurrentPayment).toLocaleString()}
            </p>
            {debtPayments.length > 0 && (
              <p className="text-xs text-gray-400">
                {debtPayments.length} detected payments
              </p>
            )}
          </div>
        </div>

        {/* Debt-to-income ratio */}
        {monthlyIncome > 0 && (
          <div className="mt-3 p-2 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Debt-to-Income Ratio</p>
            <p className="text-sm font-medium text-gray-700">
              {debtToIncomeRatio.toFixed(1)}%
              <span className="ml-2 text-xs text-gray-500">
                (Recommended: &lt;36%)
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Detected Debt Payments - Made more AI-like */}
      {debtPayments.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 text-xl">🤖</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                AI Detected Debt Payments
              </p>
              <p className="text-xs text-blue-600 mt-1">
                I've noticed {debtPayments.length} potential debts in your
                transactions. Please add the current balance and interest rate
                for each below to get a personalized payoff strategy.
              </p>
              <div className="mt-2 space-y-1">
                {debtPayments.map((debt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white/50 rounded px-2 py-1"
                  >
                    <span className="text-xs text-gray-700">
                      {getDebtEmoji(debt.kind)} {debt.name}
                    </span>
                    <span className="text-xs font-medium text-gray-800">
                      R{debt.payment.toLocaleString()}/month
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Plan */}
      {currentStrategy && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <span className="text-xl">🤖</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                AI-Optimized Debt Plan (
                {currentStrategy.strategy || selectedStrategy})
                {enhancedMode && (
                  <span className="ml-2 text-xs bg-discovery-gold/20 text-discovery-gold px-2 py-1 rounded-full">
                    Enhanced Analysis
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Based on your financial data and R
                {Number(
                  optimizedAvailable || availableMonthly
                ).toLocaleString()}{" "}
                available monthly
                {enhancedMode && " with statistical optimization"}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/80 rounded p-2">
                  <p className="text-xs text-gray-500">Recommended Strategy</p>
                  <p className="text-sm font-bold text-blue-600">
                    {backendAnalysis?.recommendation === "avalanche"
                      ? "Avalanche (High Interest First)"
                      : backendAnalysis?.recommendation === "snowball"
                      ? "Snowball (Low Balance First)"
                      : currentStrategy?.strategy || "Avalanche"}
                  </p>
                </div>
                <div className="bg-white/80 rounded p-2">
                  <p className="text-xs text-gray-500">Debt-Free In</p>
                  <p className="text-sm font-bold text-green-600">
                    {Number(
                      currentStrategy.months_to_debt_free
                    ).toLocaleString()}{" "}
                    months
                  </p>
                </div>
                <div className="bg-white/80 rounded p-2">
                  <p className="text-xs text-gray-500">Total Interest</p>
                  <p className="text-sm font-bold text-gray-800">
                    R
                    {Number(
                      currentStrategy.total_interest_paid || 0
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/80 rounded p-2">
                  <p className="text-xs text-gray-500">Interest Saved</p>
                  <p className="text-sm font-bold text-green-600">
                    R
                    {Number(
                      currentStrategy.interest_saved_vs_min_only ?? 0
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {Array.isArray(currentStrategy.payoff_order) && (
                <div className="mt-3 p-2 bg-white/80 rounded">
                  <p className="text-xs text-gray-700 font-medium">
                    Payoff Order ({currentStrategy.strategy || selectedStrategy}
                    ):
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentStrategy.payoff_order.map((debt, idx) => (
                      <span
                        key={`${debt}-${idx}`}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                      >
                        {idx + 1}. {debt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {enhancedMode && (
                <div className="mt-2 p-2 bg-discovery-gold/10 rounded">
                  <p className="text-xs text-discovery-gold">
                    ✨ Enhanced mode: Using advanced statistical modeling for
                    optimal debt payoff strategy
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Strategy selector */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Repayment Strategy Comparison
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
              <div className="mt-1">
                <p className="text-xs text-blue-600">
                  {Number(
                    backendAnalysis.avalanche.months_to_debt_free
                  ).toLocaleString()}{" "}
                  months to freedom
                </p>
                <p className="text-xs text-green-600">
                  R
                  {Number(
                    backendAnalysis.avalanche.total_interest_paid || 0
                  ).toLocaleString()}{" "}
                  total interest
                </p>
              </div>
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
              <div className="mt-1">
                <p className="text-xs text-blue-600">
                  {Number(
                    backendAnalysis.snowball.months_to_debt_free
                  ).toLocaleString()}{" "}
                  months to freedom
                </p>
                <p className="text-xs text-green-600">
                  R
                  {Number(
                    backendAnalysis.snowball.total_interest_paid || 0
                  ).toLocaleString()}{" "}
                  total interest
                </p>
              </div>
            )}
          </button>
        </div>
        {backendAnalysis?.recommendation && (
          <div className="mt-3 p-2 bg-discovery-gold/10 rounded-lg">
            <p className="text-xs text-discovery-gold">
              <strong>AI Recommendation:</strong> The{" "}
              {backendAnalysis.recommendation} method is optimal for your
              situation
              {enhancedMode && " based on enhanced statistical analysis"}
            </p>
          </div>
        )}
      </div>

      {/* Debts list */}
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

        <div className="space-y-3">
          {getSortedDebts().map((debt, index) => {
            const months = calculatePayoffMonths(
              debt.balance,
              debt.interestRate,
              debt.currentPayment
            );
            const years = Math.floor((months || 0) / 12);
            const remMonths = (months || 0) % 12;

            return (
              <div
                key={debt.id}
                className="border rounded-lg p-3 hover:shadow-sm transition-shadow space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`${debt.color} p-2 rounded-lg flex items-center justify-center`}
                    >
                      <span className="text-white text-lg">{debt.emoji}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-800">
                          {debt.name}
                        </p>
                        {debt.detected && (
                          <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                            Detected
                          </span>
                        )}
                        {index === 0 && (
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            Focus
                          </span>
                        )}
                        {currentStrategy?.payoff_order?.includes(debt.name) && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                            #
                            {currentStrategy.payoff_order.indexOf(debt.name) +
                              1}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {debt.balance > 0
                          ? `R${Number(
                              debt.balance
                            ).toLocaleString()} at ${Number(
                              debt.interestRate
                            )}%`
                          : "Please enter balance and rate for personalized plan"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDebt(debt.id)}
                    className="text-gray-400 hover:text-red-500 text-sm"
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Monthly Payment</p>
                    <input
                      type="number"
                      value={debt.currentPayment}
                      onChange={(e) =>
                        handleUpdateDebt(debt.id, {
                          currentPayment: e.target.value,
                        })
                      }
                      className="w-full text-xs font-medium border rounded px-2 py-1"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Balance</p>
                    <input
                      type="number"
                      value={debt.balance}
                      onChange={(e) =>
                        handleUpdateDebt(debt.id, {
                          balance: e.target.value,
                        })
                      }
                      className="w-full text-xs font-medium border rounded px-2 py-1"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Interest Rate %</p>
                    <input
                      type="number"
                      value={debt.interestRate}
                      onChange={(e) =>
                        handleUpdateDebt(debt.id, {
                          interestRate: e.target.value,
                        })
                      }
                      className="w-full text-xs font-medium border rounded px-2 py-1"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Est. Payoff Time</p>
                    <p className="text-xs font-medium bg-gray-50 rounded px-2 py-1">
                      {months === Infinity
                        ? "∞"
                        : years > 0
                        ? `${years}y ${remMonths}m`
                        : `${months || 0}m`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {debts.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-400">
            <span className="text-4xl opacity-50">💳</span>
            <p className="text-sm mt-2">
              {debtPayments.length > 0
                ? "Debt payments detected - add details above"
                : backendAnalysis
                ? "Sample debt analysis available"
                : "No debts added yet"}
            </p>
            <p className="text-xs mt-1">
              {availableMonthly <= 0
                ? "Upload your financial data first to see debt analysis"
                : enhancedMode
                ? "Enhanced analysis will provide optimal debt strategies when you add debts"
                : "Add your debts to see payoff strategies"}
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Smart Debt Tips
          {enhancedMode && (
            <span className="ml-2 text-xs bg-discovery-gold/20 text-discovery-gold px-2 py-1 rounded-full">
              Enhanced
            </span>
          )}
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
              Build emergency fund while paying off debt (3-month minimum)
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-xs text-gray-400 mt-0.5">▸</span>
            <p className="text-xs text-gray-600">
              Use the avalanche method for maximum interest savings
            </p>
          </div>
          {enhancedMode && (
            <div className="flex items-start space-x-2 bg-discovery-gold/10 p-2 rounded mt-2">
              <span className="text-xs text-discovery-gold mt-0.5">✨</span>
              <p className="text-xs text-discovery-gold">
                <strong>Enhanced Analysis:</strong> Statistical modeling
                considers your specific financial patterns for optimal debt
                management
              </p>
            </div>
          )}
          {backendAnalysis && (
            <div className="flex items-start space-x-2 bg-blue-50 p-2 rounded mt-2">
              <span className="text-xs text-blue-600 mt-0.5">🤖</span>
              <p className="text-xs text-blue-700">
                <strong>AI Recommendation:</strong> Use the{" "}
                {backendAnalysis.recommendation || "avalanche"} method to save R
                {Number(
                  backendAnalysis[backendAnalysis.recommendation || "avalanche"]
                    ?.interest_saved_vs_min_only ||
                    Math.abs(
                      (backendAnalysis.avalanche?.total_interest_paid || 0) -
                        (backendAnalysis.snowball?.total_interest_paid || 0)
                    ) ||
                    0
                ).toLocaleString()}{" "}
                in interest compared to alternatives.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Budget integration */}
      {Number.isFinite(availableMonthly) && (
        <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg border border-discovery-gold/20">
          <h3 className="text-sm font-semibold text-discovery-blue mb-2">
            💰 Budget Integration
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-gray-600">Available for Debt Payment</p>
              <p className="text-lg font-bold text-discovery-blue">
                R{Number(availableMonthly).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">With Optimizations</p>
              <p className="text-lg font-bold text-discovery-gold">
                R{Number(optimizedAvailable).toLocaleString()}
              </p>
            </div>
          </div>
          {enhancedMode && (
            <p className="text-xs text-discovery-gold mt-2">
              Enhanced analysis preserves essential expenses while maximizing
              debt payment capacity
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Debt;
