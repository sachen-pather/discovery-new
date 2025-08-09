// API configuration for Discovery Financial Assistant

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const uploadCSV = async (file) => {
  console.log("🔄 uploadCSV called with:", file.name);

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload-csv`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Analysis failed");
  }

  return response.json();
};

export const uploadPDF = async (file) => {
  console.log("🔄 uploadPDF called with:", file.name);

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload-pdf`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "PDF analysis failed");
  }

  return response.json();
};

export const getDebtAnalysis = async (availableMonthly) => {
  console.log("🔄 getDebtAnalysis called with:", availableMonthly);

  const response = await fetch(`${API_BASE_URL}/debt-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      available_monthly: availableMonthly,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Debt analysis failed");
  }

  return response.json();
};

export const getInvestmentAnalysis = async (availableMonthly) => {
  console.log("🔄 getInvestmentAnalysis called with:", availableMonthly);

  const response = await fetch(`${API_BASE_URL}/investment-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      available_monthly: availableMonthly,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Investment analysis failed");
  }

  return response.json();
};

export const getComprehensiveAnalysis = async (
  availableIncome,
  optimizedAvailableIncome
) => {
  console.log("🔄 getComprehensiveAnalysis called with:", {
    availableIncome,
    optimizedAvailableIncome,
  });

  const response = await fetch(`${API_BASE_URL}/comprehensive-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      available_income: availableIncome,
      optimized_available_income: optimizedAvailableIncome,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Comprehensive analysis failed");
  }

  return response.json();
};

export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

export const getFeatures = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/features`);
    if (!response.ok) {
      throw new Error("Failed to fetch features");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching features:", error);
    return null;
  }
};

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    uploadCSV: "/upload-csv",
    uploadPDF: "/upload-pdf",
    debtAnalysis: "/debt-analysis",
    investmentAnalysis: "/investment-analysis",
    comprehensiveAnalysis: "/comprehensive-analysis",
    health: "/health",
    features: "/features",
  },
};

// Default export (optional)
export default {
  uploadCSV,
  uploadPDF,
  getDebtAnalysis,
  getInvestmentAnalysis,
  getComprehensiveAnalysis,
  healthCheck,
  getFeatures,
  apiConfig,
};
