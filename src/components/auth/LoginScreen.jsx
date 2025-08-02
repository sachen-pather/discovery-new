import React from "react";

const LoginScreen = ({
  loginCredentials,
  setLoginCredentials,
  loginError,
  showPassword,
  setShowPassword,
  handleLogin,
  validCredentials,
}) => {
  return (
    <div className="flex-1 overflow-y-auto">
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

      {/* Centered Login Content */}
      <div className="flex-1 bg-gradient-to-br from-discovery-gold/10 to-discovery-blue/10 flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-md">
          {/* Welcome Header */}
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-discovery-gold to-discovery-blue text-white p-6 rounded-2xl shadow-xl">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <img
                    src="/images/DiscoveryLogo.png"
                    alt="Discovery Health"
                    className="h-8"
                  />
                </div>
              </div>
              <h1 className="text-xl font-bold mb-1">Welcome to</h1>
              <h2 className="text-lg font-semibold mb-2">
                Discovery Financial AI
              </h2>
              <p className="text-white/90 text-xs leading-relaxed">
                Your AI-powered financial wellness companion
              </p>
            </div>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Sign In</h3>
              <p className="text-xs text-gray-600 mt-1">
                Access your financial dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="id"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  User ID
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base">
                    👤
                  </span>
                  <input
                    type="text"
                    id="id"
                    value={loginCredentials.id}
                    onChange={(e) =>
                      setLoginCredentials({
                        ...loginCredentials,
                        id: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-discovery-gold focus:border-transparent transition-all text-base"
                    placeholder="Enter your ID"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base">
                    🔒
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={loginCredentials.password}
                    onChange={(e) =>
                      setLoginCredentials({
                        ...loginCredentials,
                        password: e.target.value,
                      })
                    }
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-discovery-gold focus:border-transparent transition-all text-base"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-xs text-center">
                    {loginError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-discovery-gold to-discovery-blue text-white py-3 px-6 rounded-xl font-semibold text-base hover:from-discovery-gold/90 hover:to-discovery-blue/90 transition-all transform hover:scale-[1.02] shadow-lg"
              >
                Sign In
              </button>
            </form>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 gap-3 mt-6">
              {/* Security Features */}
              <div className="grid grid-cols-1 gap-3 mt-6">
                {/* Security Features */}
                <div className="p-3 bg-discovery-blue/10 rounded-xl border border-discovery-blue/20">
                  <h4 className="text-xs font-semibold text-discovery-blue mb-2 flex items-center">
                    <span className="mr-1 text-base">🛡️</span>
                    Security Features
                  </h4>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-600">
                    <div className="flex items-center">
                      <span className="mr-1">🔐</span>
                      <span>End-to-end encryption</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">👆</span>
                      <span>Biometric auth</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">📱</span>
                      <span>Two-factor auth</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">💾</span>
                      <span>Secure storage</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-[10px] text-gray-500">
              Powered by Discovery Health • Secure & Encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
