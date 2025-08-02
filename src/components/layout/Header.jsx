import React from "react";

const Header = ({
  userProfile,
  notifications,
  showSettings,
  setShowSettings,
  showNotifications,
  setShowNotifications,
  handleLogout,
}) => {
  return (
    <div className="bg-white text-black p-4 relative border-b border-gray-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img
            src="/images/discovery-logo.png"
            alt="Discovery"
            className="h-6"
          />
          <div>
            <h1 className="text-lg font-bold text-discovery-blue">
              Financial AI
            </h1>
            <p className="text-gray-600 text-xs">
              AI-powered wellness companion
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowSettings(false);
            }}
            className="relative text-discovery-blue hover:text-discovery-blue/80 transition-colors"
            title="Notifications"
          >
            <span className="text-xl">🔔</span>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowNotifications(false);
            }}
            className="text-discovery-blue hover:text-discovery-blue/80 transition-colors"
            title="Settings"
          >
            <span className="text-xl">⚙️</span>
          </button>
          <button
            onClick={handleLogout}
            className="text-discovery-blue hover:text-discovery-blue/80 transition-colors"
            title="Logout"
          >
            <span className="text-xl">👤</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
