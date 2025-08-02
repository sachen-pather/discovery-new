// Utility helper functions

export const formatCurrency = (amount) => {
  return `R${amount.toLocaleString()}`;
};

export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const calculatePercentage = (amount, total) => {
  if (total === 0) return 0;
  return (amount / total) * 100;
};

export const getCategoryIcon = (category) => {
  const iconMap = {
    "Rent/Mortgage": "🏠",
    Groceries: "🛒",
    "Dining Out": "☕",
    Transport: "🚗",
    Subscriptions: "📱",
    Shopping: "🛍️",
    Other: "💰",
    Administrative: "📋",
  };
  return iconMap[category] || "💰";
};

export const getCategoryColor = (category) => {
  const colorMap = {
    "Rent/Mortgage": "bg-green-600",
    Groceries: "bg-yellow-500",
    "Dining Out": "bg-red-500",
    Transport: "bg-discovery-blue",
    Subscriptions: "bg-purple-500",
    Shopping: "bg-orange-500",
    Other: "bg-gray-500",
    Administrative: "bg-gray-400",
  };
  return colorMap[category] || "bg-gray-500";
};

export const getInsightIcon = (type) => {
  const iconMap = {
    warning: "⚠️",
    opportunity: "🎯",
    positive: "✅",
    info: "ℹ️",
  };
  return iconMap[type] || "ℹ️";
};

export const getHealthColor = (rate) => {
  if (rate >= 20) return "text-green-600";
  if (rate >= 10) return "text-yellow-600";
  if (rate >= 0) return "text-orange-600";
  return "text-red-600";
};

export const getHealthIcon = (rate) => {
  if (rate >= 20) return "✅";
  if (rate >= 10) return "🎯";
  return "⚠️";
};

export const calculateCompoundGrowth = (
  monthlySaving,
  years,
  annualRate = 0.08
) => {
  const monthlyRate = annualRate / 12;
  const totalMonths = years * 12;

  // Calculate future value of annuity
  const futureValue =
    monthlySaving * (((1 + monthlyRate) ** totalMonths - 1) / monthlyRate);
  const totalContributions = monthlySaving * totalMonths;
  const interest = futureValue - totalContributions;

  return {
    totalSaved: Math.round(totalContributions),
    finalValue: Math.round(futureValue),
    interest: Math.round(interest),
  };
};

export const generateInsightsFromResults = (results) => {
  const insights = [];

  // Add insights based on analysis results
  if (results && results.suggestions) {
    Object.entries(results.suggestions).forEach(([category, suggestion]) => {
      if (suggestion.potential_savings > 0) {
        insights.push({
          type: suggestion.potential_savings > 500 ? "opportunity" : "warning",
          title: `${category} Optimization`,
          description:
            suggestion.suggestions[0] || "Review expenses in this category",
          suggestion: `Potential savings: R${suggestion.potential_savings.toFixed(
            0
          )}`,
          impact: `R${(suggestion.potential_savings * 12).toFixed(
            0
          )} annual savings`,
        });
      }
    });
  }

  // Add health status insight
  if (results && results.savingsRate !== undefined) {
    insights.push({
      type: results.savingsRate >= 10 ? "positive" : "warning",
      title: "Financial Health Status",
      description: results.healthStatus || "Monitor your financial health",
      suggestion:
        results.savingsRate < 10
          ? "Focus on expense reduction"
          : "Maintain good habits",
      impact: `${results.savingsRate.toFixed(1)}% savings rate`,
    });
  }

  return insights.slice(0, 5); // Limit to 5 insights
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0;
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export const formatTime = (date) => {
  return new Intl.DateTimeFormat("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
