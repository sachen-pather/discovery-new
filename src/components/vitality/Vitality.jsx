import React from "react";

const Vitality = ({
  userProfile = {},
  realAnalysisResults,
  financialData = {},
}) => {
  // Discovery Vitality System Configuration
  const VITALITY_POINTS_ACTIVITIES = {
    health_check: 5000,
    vitality_age_assessment: 2500,
    biometric_screening: 2500,
    dental_checkup: 1000,
    eye_test: 1000,
    blood_pressure_check: 500,
    cholesterol_test: 1000,
    glucose_test: 1000,
    fitness_assessment: 2000,
    nutritional_assessment: 1500,
  };

  const FITNESS_POINTS = {
    gym_session: 100,
    steps_daily: 100,
    heart_rate_exercise: 200,
  };

  const STATUS_TIERS = [
    {
      name: "Blue",
      threshold: 0,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Bronze",
      threshold: 2500,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      name: "Silver",
      threshold: 7500,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      name: "Gold",
      threshold: 15000,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      name: "Diamond",
      threshold: 25000,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const HEALTHYFOOD_CASHBACK = {
    Blue: 0.05,
    Bronze: 0.1,
    Silver: 0.15,
    Gold: 0.2,
    Diamond: 0.25,
  };

  const HEALTHYCARE_CASHBACK = {
    Blue: 0.1,
    Bronze: 0.15,
    Silver: 0.2,
    Gold: 0.25,
    Diamond: 0.25,
  };

  // Estimate annual Vitality points based on typical member behavior
  const estimateVitalityPoints = () => {
    let estimatedPoints = 0;
    const activitiesCompleted = [];

    // Basic health activities (assumed completed)
    const basicActivities = {
      health_check: "Annual health screening",
      vitality_age_assessment: "Online health assessment",
      blood_pressure_check: "Blood pressure screening",
    };

    for (const [activity, description] of Object.entries(basicActivities)) {
      estimatedPoints += VITALITY_POINTS_ACTIVITIES[activity];
      activitiesCompleted.push({
        activity,
        description,
        points: VITALITY_POINTS_ACTIVITIES[activity],
      });
    }

    // Estimate fitness points (assume 2-3 gym sessions per week)
    const weeklyFitness = 3 * FITNESS_POINTS["gym_session"]; // 300 points/week
    const annualFitness = Math.min(weeklyFitness * 52, 15600); // Cap at reasonable max
    estimatedPoints += annualFitness;
    activitiesCompleted.push({
      activity: "fitness_activities",
      description: "Regular gym sessions & exercise",
      points: annualFitness,
    });

    return { estimatedPoints, activitiesCompleted };
  };

  // Determine status based on points
  const determineStatus = (points) => {
    let currentStatus = STATUS_TIERS[0];
    for (const tier of STATUS_TIERS) {
      if (points >= tier.threshold) {
        currentStatus = tier;
      }
    }
    return currentStatus;
  };

  // Calculate Discovery Miles potential from spending
  const calculateDiscoveryMiles = (spendingData, status) => {
    const milesBreakdown = {};
    let totalMiles = 0;

    if (!spendingData) return { totalMiles, milesBreakdown };

    // Process groceries for HealthyFood cashback
    const grocerySpend =
      spendingData.find((cat) => cat.name === "Groceries")?.amount || 0;
    if (grocerySpend > 0) {
      const qualifyingSpend = Math.min(grocerySpend * 0.3, 2500); // 30% assumed healthy, R2500 monthly limit
      const cashbackRate = HEALTHYFOOD_CASHBACK[status.name];
      const miles = qualifyingSpend * cashbackRate;

      milesBreakdown["Groceries"] = {
        totalSpend: grocerySpend,
        qualifyingSpend: qualifyingSpend,
        milesEarned: miles,
        description: `${(cashbackRate * 100).toFixed(
          0
        )}% back on healthy groceries`,
      };
      totalMiles += miles;
    }

    // Process medical spending for HealthyCare cashback
    const medicalCategories = ["Medical", "Healthcare", "Pharmacy"];
    for (const categoryName of medicalCategories) {
      const medicalSpend =
        spendingData.find((cat) => cat.name === categoryName)?.amount || 0;
      if (medicalSpend > 0) {
        const cashbackRate = HEALTHYCARE_CASHBACK[status.name];
        const miles = medicalSpend * cashbackRate;

        milesBreakdown[categoryName] = {
          totalSpend: medicalSpend,
          qualifyingSpend: medicalSpend,
          milesEarned: miles,
          description: `${(cashbackRate * 100).toFixed(
            0
          )}% back on health products`,
        };
        totalMiles += miles;
      }
    }

    return { totalMiles, milesBreakdown };
  };

  // Get spending data from props
  const getSpendingData = () => {
    if (realAnalysisResults && realAnalysisResults.category_breakdown) {
      return Object.entries(realAnalysisResults.category_breakdown).map(
        ([name, data]) => ({
          name,
          amount: data.amount,
          percentage: data.percentage,
        })
      );
    } else if (financialData.categories) {
      return financialData.categories;
    }
    return [];
  };

  // Simulate health improvement opportunities
  const simulateHealthImprovement = (currentPoints) => {
    const additionalActivities = {
      dental_checkup: {
        description: "Complete dental checkup",
        points: VITALITY_POINTS_ACTIVITIES["dental_checkup"],
      },
      eye_test: {
        description: "Complete eye test",
        points: VITALITY_POINTS_ACTIVITIES["eye_test"],
      },
      cholesterol_test: {
        description: "Complete cholesterol test",
        points: VITALITY_POINTS_ACTIVITIES["cholesterol_test"],
      },
      nutritional_assessment: {
        description: "Complete nutritional assessment",
        points: VITALITY_POINTS_ACTIVITIES["nutritional_assessment"],
      },
    };

    let improvedPoints = currentPoints;
    const improvements = [];

    for (const [activity, details] of Object.entries(additionalActivities)) {
      improvedPoints += details.points;
      improvements.push({
        action: details.description,
        points: details.points,
        category: "Health Activities",
      });
    }

    // Add more fitness activities
    const additionalFitness = 2 * FITNESS_POINTS["gym_session"] * 52; // +2 gym sessions/week
    improvedPoints += additionalFitness;
    improvements.push({
      action: "Increase gym visits to 5x per week",
      points: additionalFitness,
      category: "Fitness",
    });

    return { improvedPoints, improvements };
  };

  // Generate spending optimization suggestions
  const generateSpendingOptimizations = (spendingData, currentStatus) => {
    const suggestions = [];

    if (!spendingData || spendingData.length === 0) return suggestions;

    // Suggest shifting entertainment/dining spending to groceries
    const entertainmentSpend =
      spendingData.find((cat) =>
        ["Entertainment", "Dining Out"].includes(cat.name)
      )?.amount || 0;

    const grocerySpend =
      spendingData.find((cat) => cat.name === "Groceries")?.amount || 0;

    if (entertainmentSpend > 0 && grocerySpend > 0) {
      const shiftAmount = Math.min(entertainmentSpend * 0.3, 500);
      const currentMiles =
        grocerySpend * 0.3 * HEALTHYFOOD_CASHBACK[currentStatus.name];
      const newMiles =
        (grocerySpend + shiftAmount) *
        0.3 *
        HEALTHYFOOD_CASHBACK[currentStatus.name];
      const milesGain = newMiles - currentMiles;

      suggestions.push({
        action: `Shift R${shiftAmount.toFixed(
          0
        )} from dining out to healthy groceries`,
        benefit: `Earn additional R${milesGain.toFixed(0)} in Discovery Miles`,
        explanation:
          "Cook more at home, eat out less - earn cashback on healthy ingredients",
        category: "Spending Optimization",
      });
    }

    // Suggest using Discovery partners
    suggestions.push({
      action: "Shop at Clicks or Dis-Chem for health products",
      benefit: `Earn ${(HEALTHYCARE_CASHBACK[currentStatus.name] * 100).toFixed(
        0
      )}% back in Discovery Miles`,
      explanation:
        "Use Discovery partners for vitamins, supplements, and health products",
      category: "Partner Benefits",
    });

    return suggestions;
  };

  // Calculate everything
  const spendingData = getSpendingData();
  const { estimatedPoints, activitiesCompleted } = estimateVitalityPoints();
  const currentStatus = determineStatus(estimatedPoints);
  const { totalMiles, milesBreakdown } = calculateDiscoveryMiles(
    spendingData,
    currentStatus
  );
  const { improvedPoints, improvements } =
    simulateHealthImprovement(estimatedPoints);
  const improvedStatus = determineStatus(improvedPoints);
  const spendingOptimizations = generateSpendingOptimizations(
    spendingData,
    currentStatus
  );

  const improvementPointsGain = improvedPoints - estimatedPoints;

  return (
    <div className="space-y-6">
      {/* Vitality Status Overview */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
        <h2 className="text-xl font-bold mb-2 text-discovery-blue">
          Discovery Vitality Status
        </h2>
        <p className="text-gray-600 mb-4">
          Earn points through health activities & fitness to unlock rewards
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-discovery-gold/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Current Status</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${currentStatus.bgColor} ${currentStatus.color}`}
              >
                {currentStatus.name}
              </span>
            </div>
            <p className="text-2xl font-bold text-discovery-blue">
              {estimatedPoints.toLocaleString()} points
            </p>
            <p className="text-xs text-gray-500">Annual points earned</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-discovery-gold/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Discovery Miles</span>
              <span className="text-xs bg-discovery-gold/20 text-discovery-gold px-2 py-1 rounded">
                Monthly
              </span>
            </div>
            <p className="text-2xl font-bold text-discovery-gold">
              R{totalMiles.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500">From qualifying spending</p>
          </div>
        </div>
      </div>

      {/* Points Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-discovery-blue flex items-center">
          <span className="mr-2 text-discovery-gold text-xl">📊</span>
          Points Come From Health Activities
        </h3>

        <div className="space-y-3">
          {activitiesCompleted.slice(0, 3).map((activity, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-sm font-medium">
                {activity.description}
              </span>
              <span className="text-discovery-blue font-bold">
                {activity.points.toLocaleString()} pts
              </span>
            </div>
          ))}

          <div className="flex justify-between items-center p-3 bg-discovery-gold/10 rounded-lg border border-discovery-gold/20">
            <span className="text-sm font-bold">Total Annual Points</span>
            <span className="text-discovery-gold font-bold text-lg">
              {estimatedPoints.toLocaleString()} pts
            </span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-discovery-blue/10 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Vitality points come from health activities &
            fitness, not spending. Points reset annually and determine your
            reward rates.
          </p>
        </div>
      </div>

      {/* Discovery Miles from Spending */}
      <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-discovery-blue flex items-center">
          <span className="mr-2 text-discovery-gold text-xl">💰</span>
          Discovery Miles from Spending
        </h3>

        <div className="mb-4 p-4 bg-discovery-gold/10 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-discovery-gold">
                Monthly Discovery Miles
              </p>
              <p className="text-sm text-gray-600">
                Cashback rewards from partner spending
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-discovery-gold">
                R{totalMiles.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
          </div>
        </div>

        {Object.keys(milesBreakdown).length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-discovery-blue">
              Breakdown by category:
            </h4>
            {Object.entries(milesBreakdown).map(([category, details]) => (
              <div
                key={category}
                className="p-3 border border-discovery-gold/20 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-discovery-blue">
                    {category}
                  </span>
                  <span className="text-discovery-gold font-bold">
                    R{details.milesEarned.toFixed(0)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Total spent: R{details.totalSpend.toFixed(0)}</p>
                  <p>Qualifying spend: R{details.qualifyingSpend.toFixed(0)}</p>
                  <p className="text-discovery-gold">{details.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>Upload your bank statement to see Discovery Miles potential</p>
          </div>
        )}
      </div>

      {/* Spending & Discovery Benefits */}
      <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-discovery-blue flex items-center">
          <span className="mr-2 text-discovery-gold text-xl">🎯</span>
          Your Spending & Discovery Benefits
        </h3>

        <div className="space-y-3">
          {spendingData.length > 0 ? (
            spendingData.map((category, idx) => {
              const hasDiscoveryBenefit = [
                "Groceries",
                "Medical",
                "Healthcare",
                "Pharmacy",
              ].includes(category.name);
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    hasDiscoveryBenefit
                      ? "border-discovery-gold/30 bg-discovery-gold/5"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-discovery-blue">
                        {category.name}
                      </span>
                      <p className="text-xs text-gray-600">
                        {hasDiscoveryBenefit
                          ? category.name === "Groceries"
                            ? "Healthy groceries only (fruits, vegetables, etc.)"
                            : "Vitamins, supplements, health products"
                          : "No specific Discovery benefit"}
                      </p>
                    </div>
                    <span className="font-bold text-discovery-blue">
                      R{category.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>Upload your bank statement to see spending breakdown</p>
            </div>
          )}
        </div>
      </div>

      {/* Improvement Opportunities */}
      {improvedStatus.name !== currentStatus.name && (
        <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-discovery-blue flex items-center">
            <span className="mr-2 text-discovery-gold text-xl">🚀</span>
            Improvement Opportunities
          </h3>

          <div className="bg-discovery-gold/10 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-discovery-gold">
                  Potential Status: {improvedStatus.name}
                </p>
                <p className="text-sm text-gray-600">
                  With {improvedPoints.toLocaleString()} points
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-discovery-gold">
                  +{improvementPointsGain.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">additional points</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-discovery-blue">
              To achieve this:
            </h4>
            {improvements.slice(0, 4).map((improvement, idx) => (
              <div
                key={idx}
                className="p-3 border border-discovery-gold/20 rounded-lg"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-discovery-blue">
                    {improvement.action}
                  </span>
                  <span className="bg-discovery-gold text-white text-xs px-2 py-1 rounded-full">
                    +{improvement.points.toLocaleString()}
                  </span>
                </div>
                <span className="bg-discovery-blue/10 text-discovery-blue text-xs px-2 py-1 rounded">
                  {improvement.category}
                </span>
              </div>
            ))}
          </div>

          {totalMiles > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Bonus:</strong> Higher status = more Discovery Miles
                from your spending!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Spending Optimization Tips */}
      {spendingOptimizations.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-discovery-gold/20 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-discovery-blue flex items-center">
            <span className="mr-2 text-discovery-gold text-xl">💡</span>
            Spending Optimization Tips
          </h3>

          <div className="space-y-4">
            {spendingOptimizations.map((suggestion, idx) => (
              <div
                key={idx}
                className="p-4 border border-discovery-gold/20 rounded-lg"
              >
                <h4 className="font-semibold text-discovery-blue text-sm mb-2">
                  {suggestion.action}
                </h4>
                <p className="text-sm text-discovery-gold mb-1">
                  <strong>Benefit:</strong> {suggestion.benefit}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Why:</strong> {suggestion.explanation}
                </p>
                <span className="bg-discovery-blue/10 text-discovery-blue text-xs px-2 py-1 rounded mt-2 inline-block">
                  {suggestion.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Important Notes */}
      <div className="bg-gradient-to-r from-discovery-gold/10 to-discovery-blue/10 p-6 rounded-xl border border-discovery-gold/20">
        <h3 className="text-lg font-semibold mb-4 text-discovery-blue">
          📝 Important Notes
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            • Vitality points come from health activities & fitness, not
            spending
          </p>
          <p>• Discovery Miles are the spending rewards (like cashback)</p>
          <p>• Points reset annually; status determines your reward rates</p>
          <p>• HealthyFood cashback only applies to qualifying healthy items</p>
          <p>
            • Monthly spend limits apply to cashback benefits (R2,500 for
            individuals)
          </p>
          <p>• This analysis is based on 2025 Vitality program structure</p>
        </div>
      </div>
    </div>
  );
};

export default Vitality;
