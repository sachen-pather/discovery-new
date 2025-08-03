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

export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    uploadCSV: "/upload-csv",
    uploadPDF: "/upload-pdf",
    health: "/health",
  },
};

// Default export (optional)
export default {
  uploadCSV,
  uploadPDF,
  healthCheck,
  apiConfig,
};
