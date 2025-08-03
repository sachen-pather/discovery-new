import React, { useState } from "react";

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
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Gemini API configuration
  const GEMINI_API_KEY =
    import.meta.env.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  // Check if we have real financial data
  const hasFinancialData =
    realAnalysisResults && realAnalysisResults.total_income;

  // Prepare financial context for AI
  const getFinancialContext = () => {
    if (!hasFinancialData) {
      return null;
    }

    const savingsRate = (
      (realAnalysisResults.available_income /
        realAnalysisResults.total_income) *
      100
    ).toFixed(1);

    const categoryData = Object.entries(realAnalysisResults.category_breakdown)
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

    return {
      monthlyIncome: realAnalysisResults.total_income,
      monthlyExpenses: realAnalysisResults.total_expenses,
      availableIncome: realAnalysisResults.available_income,
      savingsRate: savingsRate,
      categoryBreakdown: categoryData,
      potentialMonthlySavings: potentialSavings,
      transactionCount: Object.values(
        realAnalysisResults.category_breakdown
      ).reduce((sum, cat) => sum + cat.count, 0),
    };
  };

  const generateSystemPrompt = (context) => {
    return `You are a professional South African financial advisor AI assistant for Discovery Health's Financial AI app. You provide personalized, actionable financial advice based on the user's real financial data.

USER PROFILE:
- Name: ${userProfile.name}
- Vitality Status: ${userProfile.vitalityStatus}
- Age: ${userProfile.age}
- Risk Tolerance: ${userProfile.riskTolerance}

CURRENT FINANCIAL DATA FROM USER'S BANK STATEMENT:
- Monthly Income: R${context.monthlyIncome.toLocaleString()}
- Monthly Expenses: R${context.monthlyExpenses.toLocaleString()}
- Available Income: R${context.availableIncome.toLocaleString()}
- Savings Rate: ${context.savingsRate}%
- Spending Categories: ${context.categoryBreakdown}
- Potential Monthly Savings: R${context.potentialMonthlySavings.toLocaleString()}
- Transactions Analyzed: ${context.transactionCount}

SOUTH AFRICAN CONTEXT:
- Currency: South African Rand (ZAR)
- Consider local banks: Discovery Bank
- Local stores: Shoprite, Pick n Pay, Checkers, Woolworths, Spar
- Local transport: Taxi, Uber, Bolt
- Local services: DSTV, Vodacom, MTN, Eskom (electricity)
- Consider Discovery Vitality benefits and points system

RESPONSE GUIDELINES:
1. Be conversational, friendly, and encouraging
2. Provide specific, actionable advice based on their actual data
3. Reference their real spending patterns and amounts
4. Suggest realistic South African solutions
5. Keep responses concise (2-3 sentences max)
6. Use South African Rand (R) for all amounts
7. Consider Discovery Vitality integration opportunities
8. Focus on practical South African financial products and services

Remember: You're helping South Africans improve their financial wellness through Discovery Health's AI platform using their real financial data.`;
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
- Consider local banks: Discovery Bank
- Local stores: Shoprite, Pick n Pay, Checkers, Woolworths, Spar
- Local transport: Taxi, Uber, Bolt
- Local services: DSTV, Vodacom, MTN, Eskom (electricity)
- Consider Discovery Vitality benefits and points system

RESPONSE GUIDELINES:
1. Be conversational, friendly, and encouraging
2. Provide general financial advice suitable for South Africans
3. Keep responses concise (2-3 sentences max)
4. Use South African Rand (R) for examples
5. Encourage them to upload their bank statement for personalized advice
6. Focus on practical South African financial products and services
7. Consider Discovery Vitality integration opportunities

Remember: You're helping South Africans with general financial wellness. Encourage them to upload their bank statement for personalized advice based on their real spending patterns.`;
  };

  const callGeminiAPI = async (userMessage, context) => {
    try {
      const systemPrompt = context
        ? generateSystemPrompt(context)
        : generateGeneralSystemPrompt();
      const promptText = context
        ? `${systemPrompt}

USER QUESTION: ${userMessage}

Please provide a helpful, personalized response based on the user's financial data above.`
        : `${systemPrompt}

USER QUESTION: ${userMessage}

Please provide helpful general financial advice. Since they haven't uploaded their bank statement yet, remind them that uploading it will allow for personalized advice based on their real spending patterns.`;

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: promptText,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
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
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid response format from Gemini API");
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I'm having trouble connecting right now. Please try again or contact support if the issue persists.";
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
      const context = hasFinancialData ? getFinancialContext() : null;
      const aiResponse = await callGeminiAPI(userMessage, context);

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

  // Suggested questions based on whether we have financial data or not
  const getSuggestedQuestions = () => {
    if (hasFinancialData) {
      const context = getFinancialContext();
      const questions = [];

      if (parseFloat(context.savingsRate) < 10) {
        questions.push("How can I improve my savings rate?");
      }
      if (context.potentialMonthlySavings > 1000) {
        questions.push("What's the best way to invest my potential savings?");
      }
      questions.push("How can I optimize my largest spending categories?");
      questions.push("What emergency fund amount should I target?");

      return questions.slice(0, 3);
    } else {
      // General financial questions for users without uploaded data
      return [
        "How much should I be saving each month?",
        "What's the best way to start budgeting?",
        "How do I build an emergency fund?",
        "Should I pay off debt or save first?",
        "What are good investment options in South Africa?",
      ].slice(0, 3);
    }
  };

  // Always show the full chatbot interface
  return (
    <div className="absolute bottom-20 right-4 w-80 bg-white rounded-xl shadow-lg border border-discovery-gold/20 z-50 max-h-96 flex flex-col">
      <div className="p-4 border-b border-discovery-gold/20 bg-gradient-to-r from-discovery-gold to-discovery-blue text-white rounded-t-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">Financial AI Assistant</h3>
            <p className="text-xs text-white/90">
              {hasFinancialData
                ? "Powered by your real data"
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
              {hasFinancialData
                ? "I can provide personalized advice based on your financial data!"
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
              hasFinancialData
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

        {/* Data Status Indicator */}
        <div className="mt-2 text-center">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              hasFinancialData
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {hasFinancialData
              ? `✓ Using your real data (${Object.values(
                  realAnalysisResults?.category_breakdown || {}
                ).reduce((sum, cat) => sum + cat.count, 0)} transactions)`
              : "💡 Upload bank statement for personalized advice"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
