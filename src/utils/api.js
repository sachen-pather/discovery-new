// src/utils/api.js
// API configuration for Discovery Financial Assistant (robust fetch, timeouts, optional params)

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 20000);
const DEBUG = String(import.meta.env.VITE_DEBUG_API || "false") === "true";

function log(...args) {
  if (DEBUG) console.log("[api]", ...args);
}

async function fetchJSON(
  path,
  { timeout = DEFAULT_TIMEOUT_MS, ...options } = {}
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const url = `${API_BASE_URL}${path}`;
    log("→", options.method || "GET", url);

    const res = await fetch(url, { ...options, signal: controller.signal });

    // Try to parse JSON safely even on non-2xx responses
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // Not JSON; leave data as null and construct an error below if needed
    }

    if (!res.ok) {
      const message =
        (data && (data.error || data.message)) ||
        `${res.status} ${res.statusText}` ||
        "Request failed";
      throw new Error(message);
    }

    log("←", res.status, path, data);
    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

export const uploadCSV = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return fetchJSON("/upload-csv", {
    method: "POST",
    body: formData,
  });
};

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return fetchJSON("/upload-pdf", {
    method: "POST",
    body: formData,
  });
};

/**
 * Debt analysis
 * @param {number} availableMonthly - amount available for debt each month
 * @param {string} [debtsCsvPath] - optional server-side path to debts.csv (if you expose one)
 */
export const getDebtAnalysis = async (availableMonthly, debtsCsvPath) => {
  const payload = { available_monthly: Number(availableMonthly) || 0 };
  if (debtsCsvPath) payload.debts_csv_path = debtsCsvPath;

  return fetchJSON("/debt-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export const getInvestmentAnalysis = async (availableMonthly) => {
  return fetchJSON("/investment-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ available_monthly: Number(availableMonthly) || 0 }),
  });
};

/**
 * Comprehensive analysis
 * @param {number} availableIncome
 * @param {number} optimizedAvailableIncome
 * @param {boolean} enhancedMode
 * @param {string} [debtsCsvPath] - optional path to pass through
 */
export const getComprehensiveAnalysis = async (
  availableIncome,
  optimizedAvailableIncome,
  enhancedMode = true,
  debtsCsvPath
) => {
  const payload = {
    available_income: Number(availableIncome) || 0,
    optimized_available_income:
      Number(optimizedAvailableIncome ?? availableIncome) || 0,
    enhanced_mode: !!enhancedMode,
  };
  if (debtsCsvPath) payload.debts_csv_path = debtsCsvPath;

  return fetchJSON("/comprehensive-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export const healthCheck = async () => {
  try {
    const data = await fetchJSON("/health");
    return data?.status === "healthy";
  } catch {
    return false;
  }
};

export const getApiHealth = async () => fetchJSON("/health");

export const getEnhancedFeatures = async () => {
  try {
    return await fetchJSON("/enhanced-features");
  } catch (err) {
    console.error("Error fetching enhanced features:", err);
    return null;
  }
};

export const getSupportedFormats = async () => fetchJSON("/supported-formats");
export const getFeatures = async () => fetchJSON("/features");

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    uploadCSV: "/upload-csv",
    uploadPDF: "/upload-pdf",
    debtAnalysis: "/debt-analysis",
    investmentAnalysis: "/investment-analysis",
    comprehensiveAnalysis: "/comprehensive-analysis",
    health: "/health",
    enhancedFeatures: "/enhanced-features",
    supportedFormats: "/supported-formats",
    features: "/features",
  },
};

export default {
  uploadCSV,
  uploadPDF,
  getDebtAnalysis,
  getInvestmentAnalysis,
  getComprehensiveAnalysis,
  healthCheck,
  getEnhancedFeatures,
  getApiHealth,
  getSupportedFormats,
  getFeatures,
  apiConfig,
};
