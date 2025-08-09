// hooks/useFinancialAnalysis.js
import { useState, useEffect } from "react";
import {
  getDebtAnalysis,
  getInvestmentAnalysis,
  getComprehensiveAnalysis,
} from "../utils/api";

export const useFinancialAnalysis = (realAnalysisResults, financialData) => {
  const [debtAnalysis, setDebtAnalysis] = useState(null);
  const [investmentAnalysis, setInvestmentAnalysis] = useState(null);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState(null);
  const [loading, setLoading] = useState({
    debt: false,
    investment: false,
    comprehensive: false,
  });
  const [errors, setErrors] = useState({
    debt: null,
    investment: null,
    comprehensive: null,
  });

  // Calculate available amounts
  const monthlyIncome =
    realAnalysisResults?.total_income || financialData?.totalIncome || 0;
  const monthlyExpenses =
    realAnalysisResults?.total_expenses || financialData?.totalExpenses || 0;
  const availableIncome = Math.max(0, monthlyIncome - monthlyExpenses);
  const optimizedAvailableIncome =
    realAnalysisResults?.optimized_available_income || availableIncome;

  // Load debt analysis
  const loadDebtAnalysis = async () => {
    if (availableIncome <= 0) return;

    setLoading((prev) => ({ ...prev, debt: true }));
    setErrors((prev) => ({ ...prev, debt: null }));

    try {
      console.log("🔄 Loading debt analysis...");
      const result = await getDebtAnalysis(availableIncome);
      setDebtAnalysis(result);
      console.log("✅ Debt analysis loaded:", result);
    } catch (error) {
      console.error("❌ Error loading debt analysis:", error);
      setErrors((prev) => ({ ...prev, debt: error.message }));
    } finally {
      setLoading((prev) => ({ ...prev, debt: false }));
    }
  };

  // Load investment analysis
  const loadInvestmentAnalysis = async () => {
    if (availableIncome <= 0) return;

    setLoading((prev) => ({ ...prev, investment: true }));
    setErrors((prev) => ({ ...prev, investment: null }));

    try {
      console.log("🔄 Loading investment analysis...");
      const result = await getInvestmentAnalysis(availableIncome);
      setInvestmentAnalysis(result);
      console.log("✅ Investment analysis loaded:", result);
    } catch (error) {
      console.error("❌ Error loading investment analysis:", error);
      setErrors((prev) => ({ ...prev, investment: error.message }));
    } finally {
      setLoading((prev) => ({ ...prev, investment: false }));
    }
  };

  // Load comprehensive analysis
  const loadComprehensiveAnalysis = async () => {
    if (availableIncome <= 0) return;

    setLoading((prev) => ({ ...prev, comprehensive: true }));
    setErrors((prev) => ({ ...prev, comprehensive: null }));

    try {
      console.log("🔄 Loading comprehensive analysis...");
      const result = await getComprehensiveAnalysis(
        availableIncome,
        optimizedAvailableIncome
      );
      setComprehensiveAnalysis(result);
      console.log("✅ Comprehensive analysis loaded:", result);
    } catch (error) {
      console.error("❌ Error loading comprehensive analysis:", error);
      setErrors((prev) => ({ ...prev, comprehensive: error.message }));
    } finally {
      setLoading((prev) => ({ ...prev, comprehensive: false }));
    }
  };

  // Auto-load analyses when data is available
  useEffect(() => {
    if (availableIncome > 0) {
      loadDebtAnalysis();
      loadInvestmentAnalysis();
      loadComprehensiveAnalysis();
    }
  }, [availableIncome, optimizedAvailableIncome]);

  // Retry functions
  const retryDebtAnalysis = () => loadDebtAnalysis();
  const retryInvestmentAnalysis = () => loadInvestmentAnalysis();
  const retryComprehensiveAnalysis = () => loadComprehensiveAnalysis();

  return {
    // Data
    debtAnalysis,
    investmentAnalysis,
    comprehensiveAnalysis,

    // Loading states
    loading,

    // Error states
    errors,

    // Calculated values
    availableIncome,
    optimizedAvailableIncome,
    monthlyIncome,
    monthlyExpenses,

    // Retry functions
    retryDebtAnalysis,
    retryInvestmentAnalysis,
    retryComprehensiveAnalysis,

    // Manual load functions
    loadDebtAnalysis,
    loadInvestmentAnalysis,
    loadComprehensiveAnalysis,
  };
};

export default useFinancialAnalysis;
