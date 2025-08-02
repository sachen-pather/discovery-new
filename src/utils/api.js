// API configuration for Discovery Financial Assistant

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const uploadCSV = async (file) => {
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
    health: "/health",
  },
};
