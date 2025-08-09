import React from "react";

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      emoji: "📊",
    },
    {
      id: "analysis",
      label: "Analysis",
      emoji: "📈",
    },
    {
      id: "budget",
      label: "Budget",
      emoji: "💰",
    },
    {
      id: "debt",
      label: "Debt",
      emoji: "💳",
    },
    {
      id: "investment",
      label: "Invest",
      emoji: "🚀",
    },
    {
      id: "vitality",
      label: "Vitality",
      emoji: "🏆",
    },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex justify-around px-1">
        {tabs.map((tab) => {
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-1 text-center transition-all ${
                activeTab === tab.id
                  ? "border-b-2 border-discovery-gold text-discovery-gold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="text-base">{tab.emoji}</span>
              <p className="text-[10px] mt-0.5 font-medium">{tab.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabNavigation;
