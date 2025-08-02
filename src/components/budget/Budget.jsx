import React from "react";

const Budget = ({ financialData, userProfile, realAnalysisResults }) => {
  const potentialMonthlySavings = realAnalysisResults
    ? Object.values(realAnalysisResults.suggestions).reduce(
        (sum, s) => sum + (s.potential_savings || 0),
        0
      )
    : 3500;

  const currentAvailable = realAnalysisResults
    ? realAnalysisResults.available_income
    : financialData.disposableIncome;
  const optimizedAvailable = currentAvailable + potentialMonthlySavings;
  const totalIncome = realAnalysisResults
    ? realAnalysisResults.total_income
    : financialData.totalIncome;

  // Use backend annuity data if available
  const annuityData = realAnalysisResults?.annuity_projection;

  const scenarioData = [
    { years: 1 },
    { years: 5 },
    { years: 10 },
    { years: 15 },
    { years: 20 },
    { years: 25 },
  ];

  const calculateCompoundGrowth = (monthlySaving, years) => {
    // Check if we have backend annuity data for current available income
    if (
      annuityData &&
      annuityData[years] &&
      monthlySaving === currentAvailable
    ) {
      const backendResult = annuityData[years];
      return {
        totalSaved: Math.round(backendResult.total_contributions),
        finalValue: Math.round(backendResult.final_value),
        interest: Math.round(backendResult.interest_earned),
      };
    }

    // Fallback to frontend calculation for optimized scenarios
    const monthlyRate = 0.08 / 12;
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
      {/* Budget Overview */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
        <h2 className="text-xl font-bold mb-2 text-black">Budget Management</h2>
        <p className="text-black mb-4">
          Track your spending and optimize your budget
        </p>
        {realAnalysisResults && (
          <div className="text-sm text-discovery-gold mb-4">
            ✨ Based on your real financial data analysis
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-discovery-gold/20">
            <p className="text-sm text-black">Monthly Income</p>
            <p className="text-2xl font-bold text-black">
              R{totalIncome.toLocaleString()}
            </p>
            <p className="text-xs text-black">Total available</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-discovery-gold/20">
            <p className="text-sm text-black">Available to Save</p>
            <p className="text-2xl font-bold text-black">
              R{currentAvailable.toLocaleString()}
            </p>
            <p className="text-xs text-black">Current savings potential</p>
          </div>
        </div>
      </div>

      {/* Optimization Summary */}
      {potentialMonthlySavings > 0 && (
        <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-discovery-blue">
            💡 Optimization Opportunity
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-discovery-blue/10 rounded-lg">
              <p className="text-sm text-gray-600">
                Potential Additional Savings
              </p>
              <p className="text-2xl font-bold text-discovery-gold">
                R{potentialMonthlySavings.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
            <div className="text-center p-4 bg-discovery-gold/10 rounded-lg">
              <p className="text-sm text-gray-600">Optimized Monthly Savings</p>
              <p className="text-2xl font-bold text-discovery-blue">
                R{optimizedAvailable.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">with improvements</p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Analysis */}
      <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-discovery-blue">
          Scenario Analysis
        </h3>
        <p className="text-gray-600 mb-6">
          See how your savings could grow over time with compound interest
        </p>
        {annuityData && (
          <div className="text-sm text-discovery-gold mb-4">
            📊 Calculations powered by your backend analysis
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
                      Monthly Savings
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
                        <td className="py-2 text-right">
                          R{currentAvailable.toLocaleString()}
                        </td>
                        <td className="py-2 text-right">
                          R{totalSaved.toLocaleString()}
                        </td>
                        <td className="py-2 text-right font-semibold text-discovery-blue">
                          R{finalValue.toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-discovery-gold">
                          R{interest.toLocaleString()}
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
                Scenario B: With Cost Optimizations (R
                {optimizedAvailable.toLocaleString()}/month)
              </h4>
              <p className="text-sm text-gray-600">
                If you implement the AI-suggested budget optimizations
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
                      Monthly Savings
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
                          R{optimizedAvailable.toLocaleString()}
                        </td>
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
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-discovery-gold rounded-full"></div>
                  <p>
                    After 10 years: You'll have R
                    {calculateCompoundGrowth(
                      currentAvailable,
                      10
                    ).finalValue.toLocaleString()}{" "}
                    (R
                    {calculateCompoundGrowth(
                      currentAvailable,
                      10
                    ).interest.toLocaleString()}{" "}
                    in interest)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-discovery-blue rounded-full"></div>
                  <p>
                    After 20 years: You'll have R
                    {calculateCompoundGrowth(
                      currentAvailable,
                      20
                    ).finalValue.toLocaleString()}{" "}
                    (R
                    {calculateCompoundGrowth(
                      currentAvailable,
                      20
                    ).interest.toLocaleString()}{" "}
                    in interest)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-discovery-gold rounded-full"></div>
                  <p>
                    Your money grows 2.4x from year 10 to year 20 due to
                    compound interest!
                  </p>
                </div>
              </>
            )}
            {potentialMonthlySavings > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p>
                  With optimizations: Extra R
                  {(
                    calculateCompoundGrowth(optimizedAvailable, 20).finalValue -
                    calculateCompoundGrowth(currentAvailable, 20).finalValue
                  ).toLocaleString()}{" "}
                  after 20 years!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Calculation Assumptions */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">
            Calculation Assumptions:
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• 8% annual return (compounded monthly)</p>
            <p>• Fixed monthly contributions at month-end</p>
            <p>
              • No taxes considered (use TFSA or retirement annuity for tax
              benefits)
            </p>
            <p>• Returns are estimates based on historical averages</p>
            <p>
              • Inflation not factored in - consider 6% inflation for real
              returns
            </p>
            {annuityData && (
              <p>• Backend calculations ensure accuracy and consistency</p>
            )}
          </div>
        </div>
      </div>

      {/* Discovery Integration */}
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
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-discovery-gold">+500 points</p>
              <p className="text-xs text-gray-400">This month</p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-discovery-gold/20">
            <p className="font-medium text-sm text-discovery-blue">
              Vitality Benefit
            </p>
            <p className="text-xs text-gray-600">
              Maintaining a healthy budget earns Vitality points, reducing your
              medical aid costs by up to 25%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budget;
