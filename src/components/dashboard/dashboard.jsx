import React from "react";

const Dashboard = ({
  financialData,
  setActiveTab,
  handleFileUpload,
  realAnalysisResults,
}) => {
  // Only show real data if CSV has been uploaded, otherwise show placeholders
  const hasRealData =
    realAnalysisResults && realAnalysisResults.total_income !== undefined;
  const totalIncome = hasRealData ? realAnalysisResults.total_income : null;
  const disposableIncome = hasRealData
    ? realAnalysisResults.available_income
    : null;

  return (
    <div className="space-y-6">
      {/* Real Data Indicator */}
      {hasRealData && (
        <div className="bg-discovery-gold/10 p-3 rounded-lg border border-discovery-gold/20">
          <p className="text-sm text-discovery-gold font-medium">
            ✨ Showing your real financial analysis results
          </p>
        </div>
      )}

      {/* Financial Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-discovery-gold to-discovery-gold/80 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-xs">Monthly Income</p>
              {hasRealData ? (
                <p className="text-lg font-bold">
                  R{totalIncome.toLocaleString()}
                </p>
              ) : (
                <p className="text-lg font-bold text-white/60">Upload CSV</p>
              )}
            </div>
            <span className="text-white text-xl">↗️</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-discovery-blue to-discovery-blue/80 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-xs">Available</p>
              {hasRealData ? (
                <p className="text-lg font-bold">
                  R{disposableIncome.toLocaleString()}
                </p>
              ) : (
                <p className="text-lg font-bold text-white/60">Upload CSV</p>
              )}
            </div>
            <span className="text-white text-xl">💰</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-discovery-blue">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveTab("analysis")}
            className="p-3 border border-discovery-gold/20 rounded-lg hover:bg-discovery-gold/5 transition-colors text-left"
          >
            <div className="text-discovery-gold mb-2 text-xl">📊</div>
            <p className="font-medium text-discovery-blue text-sm">
              View Analysis
            </p>
            <p className="text-xs text-gray-500">
              {hasRealData ? "Your real breakdown" : "Detailed breakdown"}
            </p>
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className="p-3 border border-discovery-gold/20 rounded-lg hover:bg-discovery-gold/5 transition-colors text-left"
          >
            <div className="text-discovery-blue mb-2 text-xl">📈</div>
            <p className="font-medium text-discovery-blue text-sm">
              Budget Tools
            </p>
            <p className="text-xs text-gray-500">
              {hasRealData ? "Real scenarios" : "Manage spending"}
            </p>
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-xl border-2 border-dashed border-discovery-gold/30">
        <div className="text-center">
          <div className="mx-auto mb-4 text-discovery-gold text-5xl">📄</div>
          <h3 className="text-lg font-semibold mb-2 text-discovery-blue">
            {hasRealData ? "Upload New Statement" : "Upload Bank Statement"}
          </h3>
          <p className="text-gray-600 mb-4">
            {hasRealData
              ? "Analyze a different CSV file"
              : "Get AI-powered insights into your spending patterns"}
          </p>

          <label className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-discovery-gold to-discovery-blue text-white rounded-lg cursor-pointer hover:from-discovery-gold/90 hover:to-discovery-blue/90 transition-colors">
            <span className="mr-2 text-xl">📷</span>
            Choose CSV File
            <input
              type="file"
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
            />
          </label>

          <p className="text-xs text-gray-500 mt-2">
            Supports CSV files only • Your data is encrypted and secure
          </p>
        </div>
      </div>

      {/* Quick Insights - Always show demo insights for now */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
        <h3 className="text-lg font-semibold mb-4 text-discovery-blue">
          {hasRealData ? "AI Insights from Your Data" : "Quick Insights"}
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {financialData.insights.slice(0, 2).map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-discovery-gold/20"
            >
              <div className="mt-1">
                {insight.type === "warning" && (
                  <span className="text-red-500 text-lg">⚠️</span>
                )}
                {insight.type === "opportunity" && (
                  <span className="text-discovery-gold text-lg">🎯</span>
                )}
                {insight.type === "positive" && (
                  <span className="text-discovery-blue text-lg">✅</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-discovery-blue">
                  {insight.title}
                </p>
                <p className="text-xs text-gray-600">{insight.suggestion}</p>
                <p className="text-xs text-discovery-gold font-medium">
                  {insight.impact}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
