import React from "react";

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "analysis", label: "Analysis", icon: "📊" },
    { id: "budget", label: "Budget", icon: "📈" },
    { id: "vitality", label: "Vitality", icon: "⭐" },
  ];

  return (
    <div className="bg-white border-b border-discovery-gold/20">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-3 text-center transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-discovery-gold text-discovery-gold bg-discovery-gold/5"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="mx-auto mb-1 text-lg">{tab.icon}</div>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;
