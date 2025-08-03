import React, { useState, useEffect } from "react";
import PhoneFrame from "./components/layout/PhoneFrame";
import LoginScreen from "./components/auth/LoginScreen";
import Header from "./components/layout/Header";
import TabNavigation from "./components/layout/TabNavigation";
import Dashboard from "./components/dashboard/Dashboard";
import Analysis from "./components/analysis/Analysis";
import Budget from "./components/budget/Budget";
import SettingsPanel from "./components/layout/SettingsPanel";
import NotificationPanel from "./components/layout/NotificationPanel";
import ChatBot from "./components/shared/ChatBot";
import "./styles/globals.css";
import { uploadCSV, uploadPDF } from "./utils/api";
import Vitality from "./components/vitality/Vitality";

const App = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({
    id: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // App state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [bankStatement, setBankStatement] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState("sample1");
  const [realAnalysisResults, setRealAnalysisResults] = useState(null);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // User profile and settings
  const [userProfile, setUserProfile] = useState({
    monthlyIncome: 45000,
    vitalityStatus: "Gold",
    age: 35,
    riskTolerance: "Moderate",
    name: "Demo User",
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    biometricEnabled: true,
    notificationsEnabled: true,
    dataEncryption: true,
  });

  // Financial data
  const [financialData, setFinancialData] = useState({
    totalIncome: 45000,
    totalExpenses: 38500,
    disposableIncome: 6500,
    categories: [
      {
        name: "Dining Out",
        amount: 4500,
        icon: "Coffee",
        color: "bg-red-500",
        savings: 2000,
      },
      {
        name: "Shopping",
        amount: 8500,
        icon: "ShoppingCart",
        color: "bg-orange-500",
        savings: 3000,
      },
      {
        name: "Transport",
        amount: 3500,
        icon: "Car",
        color: "bg-blue-500",
        savings: 500,
      },
      {
        name: "Subscriptions",
        amount: 1200,
        icon: "Smartphone",
        color: "bg-purple-500",
        savings: 600,
      },
      {
        name: "Rent/Mortgage",
        amount: 15000,
        icon: "Home",
        color: "bg-discovery-gold",
        savings: 0,
      },
      {
        name: "Groceries",
        amount: 5800,
        icon: "ShoppingCart",
        color: "bg-yellow-500",
        savings: 800,
      },
    ],
    insights: [
      {
        type: "warning",
        title: "Frequent Coffee Shop Visits",
        description: "You spent R1,500 on coffee this month - 47 visits!",
        suggestion: "Reduce to 20 visits to save R900/month",
        impact: "R10,800 annual savings",
      },
      {
        type: "opportunity",
        title: "Subscription Optimization",
        description: "5 active streaming services detected",
        suggestion: "Cancel 2 unused subscriptions",
        impact: "R600/month savings",
      },
      {
        type: "positive",
        title: "Excellent Rent Ratio",
        description: "Housing costs are 33% of income - ideal range!",
        suggestion: "Maintain this healthy ratio",
        impact: "Financial stability",
      },
    ],
  });

  const sampleProfiles = {
    sample1: {
      name: "Min Wage Earner",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sample1_min_wage_earner-VrcjPwFUxo2t1TDqKUHIY4ubOwtquj.csv",
    },
    sample2: {
      name: "Single Parent",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sample2_single_parent-n1tQBri2o01YisCeWELHWRCuC0HD5M.csv",
    },
    sample3: {
      name: "Pensioner",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sample3_pensioner-55nMLccQ0MhMuRfZFMKnND5eOyyEzH.csv",
    },
    sample4: {
      name: "Informal Trader",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sample4_informal_trader-1hDEaepnhzWrLCt7uID8bbiLpBfnGh.csv",
    },
    sample5: {
      name: "Security Guard",
      url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sample5_security_guard-dErhfdXt6AsYrjLRM1Rlmqf1EYN1C7.csv",
    },
  };

  // Demo credentials
  const validCredentials = {
    id: "demo123",
    password: "password123",
  };

  // Helper functions (define before they're used)
  const getCategoryIcon = (category) => {
    const iconMap = {
      "Rent/Mortgage": "Home",
      Groceries: "ShoppingCart",
      "Dining Out": "Coffee",
      Transport: "Car",
      Subscriptions: "Smartphone",
      Shopping: "ShoppingCart",
      Other: "DollarSign",
      Administrative: "DollarSign",
    };
    return iconMap[category] || "DollarSign";
  };

  const getCategoryColor = (category) => {
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

  const generateInsightsFromResults = (results) => {
    const insights = [];

    // Add insights based on real analysis
    if (results.suggestions) {
      Object.entries(results.suggestions).forEach(([category, suggestion]) => {
        if (suggestion.potential_savings > 0) {
          insights.push({
            type:
              suggestion.potential_savings > 500 ? "opportunity" : "warning",
            title: `${category} Optimization`,
            description:
              suggestion.suggestions?.[0] || "Review expenses in this category",
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
    const savingsRate =
      results.total_income > 0
        ? (results.available_income / results.total_income) * 100
        : 0;
    let healthStatus = "";

    if (savingsRate >= 20) {
      healthStatus = "Excellent: You're saving over 20% of your income!";
    } else if (savingsRate >= 10) {
      healthStatus =
        "Good: You're saving 10-20% of your income. Room for improvement.";
    } else if (savingsRate >= 0) {
      healthStatus = "Caution: Low savings rate. Focus on expense reduction.";
    } else {
      healthStatus =
        "Alert: Spending more than you earn. Immediate action required.";
    }

    insights.push({
      type: savingsRate >= 10 ? "positive" : "warning",
      title: "Financial Health Status",
      description: healthStatus,
      suggestion:
        savingsRate < 10
          ? "Focus on expense reduction"
          : "Maintain good habits",
      impact: `${savingsRate.toFixed(1)}% savings rate`,
    });

    return insights.slice(0, 5); // Limit to 5 insights
  };

  // Add notifications on app load
  useEffect(() => {
    if (isAuthenticated) {
      const initialNotifications = [
        {
          id: 1,
          type: "success",
          title: "Budget Goal Achieved",
          message: "You've successfully saved 15% this month!",
          timestamp: new Date(),
        },
        {
          id: 2,
          type: "warning",
          title: "Spending Alert",
          message: "You're 80% through your dining budget",
          timestamp: new Date(Date.now() - 3600000),
        },
      ];
      setNotifications(initialNotifications);
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    if (
      loginCredentials.id === validCredentials.id &&
      loginCredentials.password === validCredentials.password
    ) {
      setIsAuthenticated(true);
    } else {
      setLoginError("Invalid ID or password. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginCredentials({ id: "", password: "" });
    setActiveTab("dashboard");
    setNotifications([]);
    setShowSettings(false);
    setShowNotifications(false);
    setShowChatbot(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileExtension = file.name.toLowerCase().split(".").pop();

      // Validate file type
      if (!["csv", "pdf"].includes(fileExtension)) {
        addNotification(
          "error",
          "Invalid File",
          "Please upload a CSV or PDF file"
        );
        return;
      }

      setBankStatement(file);
      setIsAnalyzing(true);

      try {
        let analysisData;

        // Call appropriate API based on file type
        if (fileExtension === "csv") {
          console.log("📄 Processing CSV file...");
          analysisData = await uploadCSV(file);
        } else if (fileExtension === "pdf") {
          console.log("📄 Processing PDF file...");
          analysisData = await uploadPDF(file);
        }

        // Process the response and update state
        setRealAnalysisResults(analysisData);

        // Update financial data with real results
        setFinancialData({
          totalIncome: analysisData.total_income,
          totalExpenses: analysisData.total_expenses,
          disposableIncome: analysisData.available_income,
          categories: Object.entries(analysisData.category_breakdown).map(
            ([name, data]) => ({
              name,
              amount: data.amount,
              icon: getCategoryIcon(name),
              color: getCategoryColor(name),
              savings: analysisData.suggestions[name]?.potential_savings || 0,
              percentage: data.percentage,
              count: data.count,
            })
          ),
          insights: generateInsightsFromResults(analysisData),
        });

        setAnalysisResults({
          processed: true,
          transactionsFound: Object.values(
            analysisData.category_breakdown
          ).reduce((sum, cat) => sum + cat.count, 0),
          categoriesIdentified: Object.keys(analysisData.category_breakdown)
            .length,
          savingsOpportunities: Object.values(analysisData.suggestions).filter(
            (s) => s && typeof s === "object" && s.potential_savings > 0
          ).length,
        });

        setActiveTab("analysis");
        addNotification(
          "success",
          "Analysis Complete",
          `Your ${fileExtension.toUpperCase()} file has been successfully ${
            fileExtension === "pdf" ? "extracted and " : ""
          }analyzed`
        );
      } catch (error) {
        console.error("Analysis error:", error);
        addNotification(
          "error",
          "Analysis Failed",
          error.message ||
            `Failed to analyze ${fileExtension.toUpperCase()} file`
        );
      } finally {
        setIsAnalyzing(false);
      }
    }
  };
  const addNotification = (type, title, message) => {
    const newNotification = {
      id: Date.now(),
      type,
      title,
      message,
      timestamp: new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev.slice(0, 4)]); // Keep only 5 notifications
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const exportData = (format) => {
    // Simulate data export
    addNotification(
      "success",
      "Export Complete",
      `Your financial data has been exported as ${format.toUpperCase()}`
    );
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage = { sender: "user", text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on your spending patterns, I recommend focusing on reducing dining out expenses to increase your savings rate.",
        "Your rent-to-income ratio looks healthy at 33%. This is within the recommended 25-35% range.",
        "Consider setting up an emergency fund with 3-6 months of expenses. Based on your current spending, that would be around R115,500-R231,000.",
        "I notice you could save significantly on subscriptions. Review which services you actually use regularly.",
        "Your current savings rate could be improved. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
      ];
      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];
      const aiMessage = { sender: "ai", text: randomResponse };
      setChatMessages((prev) => [...prev, aiMessage]);
    }, 1000);

    setChatInput("");
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <PhoneFrame>
        <LoginScreen
          loginCredentials={loginCredentials}
          setLoginCredentials={setLoginCredentials}
          loginError={loginError}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          handleLogin={handleLogin}
          validCredentials={validCredentials}
        />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame>
      <div className="bg-gray-50 rounded-[2rem] overflow-hidden w-[375px] h-[812px] relative flex flex-col">
        {/* Status Bar */}
        <div className="flex justify-between items-center px-6 py-2 bg-black text-white text-sm">
          <div className="flex items-center space-x-1">
            <span className="font-medium">9:41</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>📶</span>
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        {/* Header */}
        <Header
          userProfile={userProfile}
          notifications={notifications}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          handleLogout={handleLogout}
        />

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel
            userProfile={userProfile}
            securitySettings={securitySettings}
            setSecuritySettings={setSecuritySettings}
            setShowSettings={setShowSettings}
            exportData={exportData}
          />
        )}

        {/* Notifications Panel */}
        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            removeNotification={removeNotification}
            setShowNotifications={setShowNotifications}
          />
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-discovery-gold mb-4"></div>
            <p className="text-gray-600">
              Analyzing your bank statement with AI...
            </p>
            <p className="text-sm text-gray-500">
              Processing transactions and identifying patterns
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!isAnalyzing && (
            <>
              {activeTab === "dashboard" && (
                <Dashboard
                  financialData={financialData}
                  setActiveTab={setActiveTab}
                  handleFileUpload={handleFileUpload}
                  realAnalysisResults={realAnalysisResults}
                />
              )}
              {activeTab === "analysis" && (
                <Analysis
                  financialData={financialData}
                  analysisResults={analysisResults}
                  realAnalysisResults={realAnalysisResults}
                />
              )}
              {activeTab === "budget" && (
                <Budget
                  financialData={financialData}
                  userProfile={userProfile}
                  realAnalysisResults={realAnalysisResults}
                />
              )}

              {activeTab === "vitality" && (
                <Vitality
                  userProfile={userProfile}
                  realAnalysisResults={realAnalysisResults}
                  financialData={financialData}
                />
              )}
            </>
          )}
        </div>

        {/* Chatbot Toggle Button */}
        <div className="absolute bottom-6 right-6">
          <button
            onClick={() => setShowChatbot(!showChatbot)}
            className="bg-gradient-to-r from-discovery-gold to-discovery-blue text-white p-3 rounded-full shadow-lg hover:from-discovery-gold/90 hover:to-discovery-blue/90 transition-colors"
          >
            <span className="text-lg">💬</span>
          </button>
        </div>

        {/* Chatbot */}
        {/* Chatbot */}
        {showChatbot && (
          <ChatBot
            showChatbot={showChatbot}
            setShowChatbot={setShowChatbot}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages} // ← ADD THIS LINE
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSendMessage={handleSendMessage}
            financialData={financialData}
            realAnalysisResults={realAnalysisResults}
            userProfile={userProfile}
          />
        )}
      </div>
    </PhoneFrame>
  );
};

export default App;
