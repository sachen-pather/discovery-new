import React, { useState, useEffect } from "react";

const ChatBot = ({
  showChatbot,
  setShowChatbot,
  chatMessages,
  setChatMessages,
  chatInput,
  setChatInput,
  handleSendMessage,
  realAnalysisResults,
  userProfile,
  debtAnalysis, // Add debt analysis prop
  investmentAnalysis, // Add investment analysis prop
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState([]);

  // Gemini API configuration
  const GEMINI_API_KEY =
    import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  // Check if we have real financial data
  const hasFinancialData =
    realAnalysisResults && realAnalysisResults.total_income;
  const hasDebtData =
    debtAnalysis && (debtAnalysis.avalanche || debtAnalysis.snowball);
  const hasInvestmentData = investmentAnalysis && investmentAnalysis.profiles;

  // Update conversation context when new messages are added
  useEffect(() => {
    if (chatMessages.length > 0) {
      const context = chatMessages.slice(-6).map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));
      setConversationContext(context);
    }
  }, [chatMessages]);

  // Prepare comprehensive financial context for AI
  const getComprehensiveFinancialContext = () => {
    let context = {};

    // Budget/Spending Analysis
    if (hasFinancialData) {
      const savingsRate = (
        (realAnalysisResults.available_income /
          realAnalysisResults.total_income) *
        100
      ).toFixed(1);

      const categoryData = Object.entries(
        realAnalysisResults.category_breakdown
      )
        .filter(([_, data]) => data.amount > 0)
        .map(
          ([name, data]) =>
            `${name}: R${data.amount.toLocaleString()} (${data.percentage.toFixed(
              1
            )}%)`
        )
        .join(", ");

      const potentialSavings = Object.values(
        realAnalysisResults.suggestions
      ).reduce((sum, s) => sum + (s.potential_savings || 0), 0);

      context.budget = {
        monthlyIncome: realAnalysisResults.total_income,
        monthlyExpenses: realAnalysisResults.total_expenses,
        availableIncome: realAnalysisResults.available_income,
        optimizedAvailableIncome:
          realAnalysisResults.optimized_available_income,
        savingsRate: savingsRate,
        categoryBreakdown: categoryData,
        potentialMonthlySavings: potentialSavings,
        transactionCount: Object.values(
          realAnalysisResults.category_breakdown
        ).reduce((sum, cat) => sum + cat.count, 0),
      };
    }

    // Debt Analysis
    if (hasDebtData) {
      const recommendedStrategy = debtAnalysis.recommendation || "avalanche";
      const strategy = debtAnalysis[recommendedStrategy];

      context.debt = {
        recommendedStrategy: recommendedStrategy,
        monthsToDebtFree: strategy?.months_to_debt_free,
        totalInterestPaid: strategy?.total_interest_paid,
        interestSaved: strategy?.interest_saved_vs_min_only,
        totalDebts: strategy?.debts?.length || 0,
        payoffOrder: strategy?.payoff_order || [],
        totalDebtAmount:
          strategy?.debts?.reduce(
            (sum, debt) => sum + debt.starting_balance,
            0
          ) || 0,
        monthlyPayments:
          strategy?.debts?.reduce((sum, debt) => sum + debt.min_payment, 0) ||
          0,
        avalancheVsSnowball: {
          avalanche: {
            months: debtAnalysis.avalanche?.months_to_debt_free,
            interestSaved: debtAnalysis.avalanche?.interest_saved_vs_min_only,
          },
          snowball: {
            months: debtAnalysis.snowball?.months_to_debt_free,
            interestSaved: debtAnalysis.snowball?.interest_saved_vs_min_only,
          },
        },
      };
    }

    // Investment Analysis
    if (hasInvestmentData) {
      const monthlySavings = investmentAnalysis.monthly_savings;

      context.investment = {
        monthlySavings: monthlySavings,
        strategies: Object.keys(investmentAnalysis.profiles).join(", "),
        recommendations: investmentAnalysis.recommendations || [],
        projections: {
          conservative:
            investmentAnalysis.profiles.conservative?.projections?.find(
              (p) => p.years === 10
            ),
          moderate: investmentAnalysis.profiles.moderate?.projections?.find(
            (p) => p.years === 10
          ),
          aggressive: investmentAnalysis.profiles.aggressive?.projections?.find(
            (p) => p.years === 10
          ),
        },
      };
    }

    return context;
  };

  const generateSystemPrompt = (context) => {
    let prompt = `You are a professional South African financial advisor AI assistant for Discovery Health's Financial AI app. You provide personalized, actionable financial advice based on the user's comprehensive real financial data.

USER PROFILE:
- Name: ${userProfile.name}
- Vitality Status: ${userProfile.vitalityStatus}
- Age: ${userProfile.age}
- Risk Tolerance: ${userProfile.riskTolerance}`;

    // Add budget context if available
    if (context.budget) {
      prompt += `

BUDGET ANALYSIS FROM USER'S BANK STATEMENT:
- Monthly Income: R${context.budget.monthlyIncome.toLocaleString()}
- Monthly Expenses: R${context.budget.monthlyExpenses.toLocaleString()}
- Available Income: R${context.budget.availableIncome.toLocaleString()}
- Optimized Available Income: R${
        context.budget.optimizedAvailableIncome?.toLocaleString() || "N/A"
      }
- Savings Rate: ${context.budget.savingsRate}%
- Spending Categories: ${context.budget.categoryBreakdown}
- Potential Monthly Savings: R${context.budget.potentialMonthlySavings.toLocaleString()}
- Transactions Analyzed: ${context.budget.transactionCount}`;
    }

    // Add debt context if available
    if (context.debt) {
      prompt += `

DEBT OPTIMIZATION ANALYSIS:
- Recommended Strategy: ${context.debt.recommendedStrategy} method
- Time to Debt-Free: ${context.debt.monthsToDebtFree} months
- Total Debt Amount: R${context.debt.totalDebtAmount.toLocaleString()}
- Monthly Debt Payments: R${context.debt.monthlyPayments.toLocaleString()}
- Interest Saved vs Min Payments: R${
        context.debt.interestSaved?.toLocaleString() || "N/A"
      }
- Payoff Order: ${context.debt.payoffOrder.join(" → ")}
- Strategy Comparison: Avalanche saves R${
        context.debt.avalancheVsSnowball.avalanche?.interestSaved?.toLocaleString() ||
        "N/A"
      } vs Snowball saves R${
        context.debt.avalancheVsSnowball.snowball?.interestSaved?.toLocaleString() ||
        "N/A"
      }`;
    }

    // Add investment context if available
    if (context.investment) {
      prompt += `

INVESTMENT ANALYSIS:
- Available for Investment: R${context.investment.monthlySavings.toLocaleString()}/month
- Investment Strategies Analyzed: ${context.investment.strategies}
- 10-Year Projections:
  * Conservative: R${
    context.investment.projections.conservative?.effective_future_value?.toLocaleString() ||
    "N/A"
  }
  * Moderate: R${
    context.investment.projections.moderate?.effective_future_value?.toLocaleString() ||
    "N/A"
  }
  * Aggressive: R${
    context.investment.projections.aggressive?.effective_future_value?.toLocaleString() ||
    "N/A"
  }
- Key Recommendations: ${context.investment.recommendations
        .slice(0, 2)
        .join("; ")}`;
    }

    prompt += `

SOUTH AFRICAN CONTEXT:
- Currency: South African Rand (ZAR)
- Consider local banks: Discovery Bank, Standard Bank, FNB, ABSA, Nedbank
- Local stores: Shoprite, Pick n Pay, Checkers, Woolworths, Spar
- Local transport: Taxi, Uber, Bolt
- Local services: DSTV, Vodacom, MTN, Eskom (electricity)
- Consider Discovery Vitality benefits and points system
- Tax-Free Savings Account (TFSA) limit: R36,000/year
- Retirement Annuity tax benefits

RESPONSE GUIDELINES:
1. Be conversational, friendly, and encouraging
2. Provide specific, actionable advice based on their actual data
3. Reference their real spending patterns, debt situation, and investment capacity
4. Suggest realistic South African solutions
5. Keep responses concise but comprehensive (3-4 sentences max)
6. Use South African Rand (R) for all amounts
7. Consider Discovery Vitality integration opportunities
8. Focus on practical South African financial products and services
9. Maintain conversation context and refer to previous discussions when relevant
10. Prioritize advice based on their most pressing financial needs (debt vs investment vs savings)

Remember: You're helping South Africans improve their financial wellness through Discovery Health's AI platform using their comprehensive real financial data. Consider their full financial picture when giving advice.`;

    return prompt;
  };

  const generateGeneralSystemPrompt = () => {
    return `You are a professional South African financial advisor AI assistant for Discovery Health's Financial AI app. The user hasn't uploaded their bank statement yet, so provide general financial advice and guidance.

USER PROFILE:
- Name: ${userProfile.name}
- Vitality Status: ${userProfile.vitalityStatus}
- Age: ${userProfile.age}
- Risk Tolerance: ${userProfile.riskTolerance}

SOUTH AFRICAN CONTEXT:
- Currency: South African Rand (ZAR)
- Consider local banks: Discovery Bank, Standard Bank, FNB, ABSA, Nedbank
- Local stores: Shoprite, Pick n Pay, Checkers, Woolworths, Spar
- Local transport: Taxi, Uber, Bolt
- Local services: DSTV, Vodacom, MTN, Eskom (electricity)
- Consider Discovery Vitality benefits and points system
- Tax-Free Savings Account (TFSA) limit: R36,000/year
- Retirement Annuity tax benefits

RESPONSE GUIDELINES:
1. Be conversational, friendly, and encouraging
2. Provide general financial advice suitable for South Africans
3. Keep responses concise (3-4 sentences max)
4. Use South African Rand (R) for examples
5. Encourage them to upload their bank statement for personalized advice
6. Focus on practical South African financial products and services
7. Consider Discovery Vitality integration opportunities
8. Maintain conversation context and refer to previous discussions when relevant

Remember: You're helping South Africans with general financial wellness. Encourage them to upload their bank statement for personalized advice based on their real spending patterns.`;
  };

  const callGeminiAPI = async (userMessage, financialContext) => {
    try {
      // Check if API key is available
      if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
        return "API key not configured. Please set your VITE_GEMINI_API_KEY environment variable.";
      }

      const systemPrompt = financialContext
        ? generateSystemPrompt(financialContext)
        : generateGeneralSystemPrompt();

      // Build conversation with proper format for Gemini API
      const contents = [];

      // Add system prompt as first user message
      contents.push({
        role: "user",
        parts: [{ text: systemPrompt }],
      });

      // Add a brief model response to acknowledge the system prompt
      contents.push({
        role: "model",
        parts: [
          {
            text: "I understand. I'm ready to help with financial advice based on the provided context.",
          },
        ],
      });

      // Add conversation history (exclude system messages)
      if (conversationContext.length > 0) {
        conversationContext.forEach((msg) => {
          if (msg.role === "user" || msg.role === "model") {
            contents.push({
              role: msg.role,
              parts: msg.parts,
            });
          }
        });
      }

      // Add current user message
      contents.push({
        role: "user",
        parts: [{ text: userMessage }],
      });

      console.log("Sending to Gemini API:", {
        contentsLength: contents.length,
        lastUserMessage: userMessage,
      });

      const requestBody = {
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      };

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error Response:", errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Gemini API Response:", data);

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        console.error("Gemini API returned error:", data.error);
        return "I'm having trouble processing your request. Please try again with a different question.";
      } else {
        console.error("Invalid response format:", data);
        return "I received an unexpected response. Please try again.";
      }
    } catch (error) {
      console.error("Gemini API Error:", error);

      if (error.message.includes("401")) {
        return "API authentication failed. Please check your Gemini API key.";
      } else if (error.message.includes("403")) {
        return "API access forbidden. Please verify your Gemini API key permissions.";
      } else if (error.message.includes("400")) {
        return "Request format error. The message might be too long or contain unsupported content.";
      } else {
        return "I'm having trouble connecting right now. Please try again or contact support if the issue persists.";
      }
    }
  };

  const handleAIMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setIsLoading(true);

    // Add user message
    const userChatMessage = { sender: "user", text: userMessage };
    setChatMessages((prevMessages) => [...prevMessages, userChatMessage]);

    try {
      const financialContext =
        hasFinancialData || hasDebtData || hasInvestmentData
          ? getComprehensiveFinancialContext()
          : null;

      const aiResponse = await callGeminiAPI(userMessage, financialContext);

      // Add AI response
      const aiMessage = { sender: "ai", text: aiResponse };
      setChatMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        sender: "ai",
        text: "I'm having trouble connecting right now. Please try again or contact support if the issue persists.",
      };
      setChatMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleAIMessage();
    }
  };

  // Enhanced suggested questions based on available data
  const getSuggestedQuestions = () => {
    const questions = [];

    if (hasFinancialData) {
      const context = getComprehensiveFinancialContext();

      if (context.budget?.savingsRate < 10) {
        questions.push("How can I improve my savings rate?");
      }

      if (hasDebtData && hasInvestmentData) {
        questions.push("Should I focus on paying off debt or investing first?");
      } else if (hasDebtData) {
        questions.push(
          `Why is the ${context.debt?.recommendedStrategy} method best for me?`
        );
      } else if (hasInvestmentData) {
        questions.push("What investment strategy suits my risk tolerance?");
      }

      if (context.budget?.potentialMonthlySavings > 1000) {
        questions.push("How should I allocate my potential savings?");
      }

      questions.push("What's my biggest financial priority right now?");
      questions.push("How can I optimize my largest spending categories?");
    } else {
      questions.push("How much should I be saving each month?");
      questions.push("What's the best way to start budgeting?");
      questions.push("Should I pay off debt or save first?");
      questions.push("What are good investment options in South Africa?");
    }

    return questions.slice(0, 3);
  };

  // Data status indicator
  const getDataStatus = () => {
    const statuses = [];
    if (hasFinancialData) statuses.push("Budget");
    if (hasDebtData) statuses.push("Debt");
    if (hasInvestmentData) statuses.push("Investment");

    if (statuses.length === 0)
      return "💡 Upload bank statement for personalized advice";

    const transactionCount = hasFinancialData
      ? Object.values(realAnalysisResults?.category_breakdown || {}).reduce(
          (sum, cat) => sum + cat.count,
          0
        )
      : 0;

    return `✓ Using your real ${statuses.join(" + ")} data${
      transactionCount ? ` (${transactionCount} transactions)` : ""
    }`;
  };

  // Always show the full chatbot interface
  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-80 bg-white rounded-xl shadow-lg border border-discovery-gold/20 z-50 max-h-96 flex flex-col">
      >
      <div className="p-4 border-b border-discovery-gold/20 bg-gradient-to-r from-discovery-gold to-discovery-blue text-white rounded-t-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">Financial AI Assistant</h3>
            <p className="text-xs text-white/90">
              {hasFinancialData || hasDebtData || hasInvestmentData
                ? "Powered by your comprehensive data"
                : "Ready to help with general advice"}
            </p>
          </div>
          <button
            onClick={() => setShowChatbot(false)}
            className="text-white hover:text-white/80"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto max-h-64">
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <div className="mb-4">
              <div className="w-12 h-12 bg-discovery-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-discovery-gold text-xl">🤖</span>
              </div>
            </div>
            <p className="text-sm">
              Hi {userProfile.name}! I'm your AI financial assistant.
            </p>
            <p className="text-xs mt-1">
              {hasFinancialData || hasDebtData || hasInvestmentData
                ? "I can provide personalized advice based on your comprehensive financial analysis!"
                : "I can help with general financial advice. Upload your bank statement for personalized insights!"}
            </p>

            {/* Suggested Questions */}
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-400">Try asking:</p>
              {getSuggestedQuestions().map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatInput(question)}
                  className="block w-full text-left text-xs p-2 bg-discovery-gold/10 rounded hover:bg-discovery-gold/20 transition-colors"
                >
                  "{question}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {chatMessages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg text-sm ${
                    message.sender === "user"
                      ? "bg-discovery-blue text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 max-w-xs p-3 rounded-lg text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-discovery-gold rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-discovery-gold rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-discovery-gold rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-discovery-gold/20">
        <div className="flex space-x-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              hasFinancialData || hasDebtData || hasInvestmentData
                ? "Ask about your finances..."
                : "Ask me about financial planning..."
            }
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-discovery-gold focus:border-transparent disabled:bg-gray-100"
          />
          <button
            onClick={handleAIMessage}
            disabled={isLoading || !chatInput.trim()}
            className="px-4 py-2 bg-discovery-gold text-white rounded-lg hover:bg-discovery-gold/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>

        {/* Enhanced Data Status Indicator */}
        <div className="mt-2 text-center">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              hasFinancialData || hasDebtData || hasInvestmentData
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {getDataStatus()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
