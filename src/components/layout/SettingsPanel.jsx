import React from "react";

const SettingsPanel = ({
  userProfile,
  securitySettings,
  setSecuritySettings,
  setShowSettings,
  exportData,
}) => {
  const toggleSetting = (setting) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const ToggleSwitch = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full transition-colors ${
        enabled ? "bg-discovery-gold" : "bg-gray-300"
      }`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  return (
    <div className="absolute top-16 right-4 w-80 bg-white rounded-xl shadow-lg border border-discovery-gold/20 z-50 max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-discovery-gold/20">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-discovery-blue">Settings</h3>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Section */}
        <div className="space-y-3">
          <h4 className="font-medium text-discovery-blue">Profile</h4>
          <div className="flex items-center space-x-3 p-3 bg-discovery-gold/10 rounded-lg">
            <div className="w-10 h-10 bg-discovery-gold rounded-full flex items-center justify-center">
              <span className="text-white text-xl">👤</span>
            </div>
            <div>
              <p className="font-medium text-discovery-blue">
                {userProfile.name}
              </p>
              <p className="text-sm text-gray-600">
                Vitality {userProfile.vitalityStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="space-y-3">
          <h4 className="font-medium text-discovery-blue flex items-center">
            <span className="mr-2">🛡️</span>
            Security
          </h4>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Two-Factor Authentication</span>
              <ToggleSwitch
                enabled={securitySettings.twoFactorEnabled}
                onToggle={() => toggleSetting("twoFactorEnabled")}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Biometric Login</span>
              <ToggleSwitch
                enabled={securitySettings.biometricEnabled}
                onToggle={() => toggleSetting("biometricEnabled")}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Push Notifications</span>
              <ToggleSwitch
                enabled={securitySettings.notificationsEnabled}
                onToggle={() => toggleSetting("notificationsEnabled")}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Data Encryption</span>
              <div className="flex items-center text-discovery-gold">
                <span className="text-lg">✓</span>
                <span className="text-xs ml-1">Enabled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <h4 className="font-medium text-discovery-blue flex items-center">
            <span className="mr-2">⬇️</span>
            Export Data
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => exportData("csv")}
              className="w-full p-2 text-left text-sm border border-discovery-gold/20 rounded-lg hover:bg-discovery-gold/5"
            >
              Export as CSV
            </button>
            <button
              onClick={() => exportData("pdf")}
              className="w-full p-2 text-left text-sm border border-discovery-gold/20 rounded-lg hover:bg-discovery-gold/5"
            >
              Export as PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
