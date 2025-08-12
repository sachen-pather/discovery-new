import React from "react";

const Budget = ({ financialData, userProfile, realAnalysisResults }) => {
  const potentialMonthlySavings = realAnalysisResults
    ? realAnalysisResults.total_potential_savings || 0
    : 3500;

  const currentAvailable = realAnalysisResults
    ? realAnalysisResults.available_income
    : financialData.disposableIncome;

  const optimizedAvailable = realAnalysisResults
    ? realAnalysisResults.optimized_available_income ||
      currentAvailable + potentialMonthlySavings
    : currentAvailable + potentialMonthlySavings;

  const totalIncome = realAnalysisResults
    ? realAnalysisResults.total_income
    : financialData.totalIncome;

  // Use backend annuity data if available
  const annuityData = realAnalysisResults?.annuity_projection;
  const enhancedMode = realAnalysisResults?.enhanced_mode || false;

  const scenarioData = [
    { years: 1 },
    { years: 5 },
    { years: 10 },
    { years: 15 },
    { years: 20 },
    { years: 25 },
  ];

  const formatCompactNumber = (number) => {
    if (number >= 1000000) {
      return `R${(number / 1000000).toFixed(2)}M`;
    } else if (number >= 1000) {
      return `R${(number / 1000).toFixed(0)}K`;
    }
    return `R${number.toLocaleString()}`;
  };

  const calculateCompoundGrowth = (monthlySaving, years) => {
    // Check if we have backend annuity data for current available income
    if (
      annuityData &&
      annuityData[years] &&
      Math.abs(monthlySaving - currentAvailable) < 100 // Allow small variance
    ) {
      const backendResult = annuityData[years];
      return {
        totalSaved: Math.round(backendResult.total_contributions),
        finalValue: Math.round(backendResult.final_value),
        interest: Math.round(backendResult.interest_earned),
        effectiveReturn: backendResult.effective_return,
        monthlyPayment: backendResult.monthly_payment,
      };
    }

    // Fallback to frontend calculation for optimized scenarios
    const monthlyRate = 0.0675 / 12; // 6.75% annual return
    const totalMonths = years * 12;
    const totalSaved = monthlySaving * totalMonths;

    if (monthlyRate === 0) {
      return { totalSaved, finalValue: totalSaved, interest: 0 };
    }

    const finalValue =
      monthlySaving * (((1 + monthlyRate) ** totalMonths - 1) / monthlyRate);
    const interest = finalValue - totalSaved;

    return {
      totalSaved: Math.round(totalSaved),
      finalValue: Math.round(finalValue),
      interest: Math.round(interest),
    };
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Budget Overview */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
        <h2 className="text-xl font-bold mb-2 text-black">Budget Management</h2>
        <p className="text-black mb-4">
          Track your spending and optimize your budget
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-white rounded-lg">
            <p className="text-sm text-gray-600">Monthly Income</p>
            <p className="text-2xl font-bold text-discovery-blue">
              R{totalIncome.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Total available</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <p className="text-sm text-gray-600">Available to Save</p>
            <p className="text-2xl font-bold text-discovery-gold">
              R{currentAvailable.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Current potential</p>
          </div>
        </div>

        {enhancedMode && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-discovery-blue/10 rounded-lg">
              <p className="text-sm text-gray-600">
                Potential Additional Savings
              </p>
              <p className="text-2xl font-bold text-discovery-gold">
                R{potentialMonthlySavings.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">per month</p>
              <p className="text-xs text-discovery-blue mt-1">
                AI-powered recommendations
              </p>
            </div>
            <div className="text-center p-4 bg-discovery-gold/10 rounded-lg">
              <p className="text-sm text-gray-600">Optimized Monthly Savings</p>
              <p className="text-2xl font-bold text-discovery-blue">
                R{optimizedAvailable.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">with improvements</p>
              <p className="text-xs text-discovery-gold mt-1">
                Statistical modeling applied
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scenario Analysis */}
      <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-discovery-blue">
          Investment Growth Scenarios
        </h3>
        <p className="text-gray-600 mb-6">
          See how your savings could grow over time with compound interest.
        </p>
        {annuityData && (
          <div className="text-sm text-discovery-gold mb-4 space-y-1 bg-discovery-blue/5 p-3 rounded-lg">
            <div>📊 Calculations powered by enhanced backend analysis.</div>
            {enhancedMode && (
              <div className="text-xs text-gray-600">
                Using optimized statistical modeling for accurate projections.
              </div>
            )}
          </div>
        )}

        {/* Scenario A: Current Savings */}
        {currentAvailable > 0 && (
          <div className="mb-8">
            <div className="bg-discovery-blue/10 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-discovery-blue mb-2">
                Scenario A: Current Available Income (R
                {currentAvailable.toLocaleString()}/month)
              </h4>
              <p className="text-sm text-gray-600">
                Based on your current spending patterns
                {enhancedMode && " with protected categories preserved"}.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-discovery-gold/20">
                    <th className="text-left py-2 text-discovery-blue">
                      Years
                    </th>
                    <th className="text-right py-2 text-discovery-blue">
                      Total Saved
                    </th>
                    <th className="text-right py-2 text-discovery-blue">
                      Final Value
                    </th>
                    <th className="text-right py-2 text-discovery-blue">
                      Interest Earned
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioData.map((row, idx) => {
                    const { totalSaved, finalValue, interest } =
                      calculateCompoundGrowth(currentAvailable, row.years);
                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{row.years}</td>
                        <td className="py-2 text-right text-xs">
                          {formatCompactNumber(totalSaved)}
                        </td>
                        <td className="py-2 text-right font-semibold text-discovery-blue text-xs">
                          {formatCompactNumber(finalValue)}
                        </td>
                        <td className="py-2 text-right text-discovery-gold text-xs">
                          {formatCompactNumber(interest)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scenario B: Optimized Savings */}
        {potentialMonthlySavings > 0 && (
          <div className="mb-6">
            <div className="bg-discovery-gold/10 p-4 rounded-lg mb-4">
              <h4 className="font-semibold text-discovery-gold mb-2">
                Scenario B: With AI Optimizations (R
                {optimizedAvailable.toLocaleString()}/month)
              </h4>
              <p className="text-sm text-gray-600">
                If you implement the AI-suggested budget optimizations
                {enhancedMode && " from enhanced statistical analysis"}.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-discovery-gold/20">
                    <th className="text-left py-2 text-discovery-blue">
                      Years
                    </th>
                    <th className="text-right py-2 text-discovery-blue">
                      Total Saved
                    </th>
                    <th className="text-right py-2 text-discovery-blue">
                      Final Value
                    </th>
                    <th className="text-right py-2 text-discovery-blue">
                      Interest Earned
                    </th>
                    <th className="text-right py-2 text-discovery-gold">
                      Extra vs Current
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioData.map((row, idx) => {
                    const optimizedResult = calculateCompoundGrowth(
                      optimizedAvailable,
                      row.years
                    );
                    const currentResult = calculateCompoundGrowth(
                      currentAvailable,
                      row.years
                    );
                    const extraValue =
                      optimizedResult.finalValue - currentResult.finalValue;
                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{row.years}</td>
                        <td className="py-2 text-right">
                          R{optimizedResult.totalSaved.toLocaleString()}
                        </td>
                        <td className="py-2 text-right font-semibold text-discovery-blue">
                          R{optimizedResult.finalValue.toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-discovery-gold">
                          R{optimizedResult.interest.toLocaleString()}
                        </td>
                        <td className="py-2 text-right font-semibold text-green-600">
                          +R{extraValue.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Key Insights */}
        <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-discovery-blue mb-3">
            Key Insights:
          </h4>
          <div className="space-y-2 text-sm">
            {currentAvailable > 0 && (
              <>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-discovery-gold rounded-full mt-1.5 flex-shrink-0"></div>
                  <p>
                    After 10 years, your current savings could grow to{" "}
                    <strong>
                      R
                      {calculateCompoundGrowth(
                        currentAvailable,
                        10
                      ).finalValue.toLocaleString()}
                    </strong>
                    , earning R
                    {calculateCompoundGrowth(
                      currentAvailable,
                      10
                    ).interest.toLocaleString()}{" "}
                    in interest.
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-discovery-blue rounded-full mt-1.5 flex-shrink-0"></div>
                  <p>
                    After 20 years, this could become{" "}
                    <strong>
                      R
                      {calculateCompoundGrowth(
                        currentAvailable,
                        20
                      ).finalValue.toLocaleString()}
                    </strong>
                    , with R
                    {calculateCompoundGrowth(
                      currentAvailable,
                      20
                    ).interest.toLocaleString()}{" "}
                    in interest, showcasing compound growth.
                  </p>
                </div>
              </>
            )}
            {potentialMonthlySavings > 0 && (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p>
                  With AI optimizations, you could have an extra{" "}
                  <strong>
                    R
                    {(
                      calculateCompoundGrowth(optimizedAvailable, 20)
                        .finalValue -
                      calculateCompoundGrowth(currentAvailable, 20).finalValue
                    ).toLocaleString()}
                  </strong>{" "}
                  after 20 years!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Calculation Assumptions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">
            Calculation Assumptions:
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            {annuityData && Object.keys(annuityData).length > 0 ? (
              <>
                <p>
                  • Backend calculations with enhanced statistical modeling.
                </p>
                <p>
                  • Effective return rate:{" "}
                  <strong>
                    {annuityData["10"]?.effective_return?.toFixed(2)}%
                  </strong>{" "}
                  (volatility-adjusted).
                </p>
                <p>• Protected categories preserved in optimization.</p>
              </>
            ) : (
              <>
                <p>
                  • <strong>6.75%</strong> annual return (compounded monthly).
                </p>
                <p>• Returns are estimates based on historical averages.</p>
              </>
            )}
            <p>
              • No taxes considered (use TFSA or retirement annuity for tax
              benefits).
            </p>
            <p>• Inflation is not factored in; real returns will be lower.</p>
          </div>
        </div>
      </div>

      {/* Discovery Integration with Enhanced Features */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
        <h3 className="text-lg font-semibold mb-4 text-discovery-blue">
          Discovery Vitality Integration
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-discovery-gold/20">
            <div>
              <p className="font-medium text-discovery-blue">
                Current Status: {userProfile.vitalityStatus}
              </p>
              <p className="text-sm text-gray-600">
                Budget management contributes to Vitality points
                {enhancedMode && " (Enhanced tracking active)"}.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-discovery-gold">
                +{enhancedMode ? "750" : "500"} points
              </p>
              <p className="text-xs text-gray-400">This month</p>
            </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-discovery-gold/20">
            <p className="font-medium text-sm text-discovery-blue">
              Vitality Benefit
            </p>
            <p className="text-xs text-gray-600">
              Maintaining a healthy budget earns Vitality points, which can
              reduce your medical aid costs.
              {enhancedMode &&
                " Enhanced analysis provides more accurate tracking for better rewards."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budget;
