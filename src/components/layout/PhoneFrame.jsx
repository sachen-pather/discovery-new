import React from "react";

const PhoneFrame = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Phone Frame */}
      <div className="relative">
        {/* Phone Outer Frame */}
        <div className="bg-gray-800 rounded-[3rem] p-2 shadow-2xl">
          {/* Phone Inner Frame */}
          <div className="bg-black rounded-[2.5rem] p-1">
            {/* Screen */}
            <div className="bg-white rounded-[2rem] overflow-hidden w-[375px] h-[812px] relative">
              {children}
            </div>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full"></div>
      </div>
    </div>
  );
};

export default PhoneFrame;
