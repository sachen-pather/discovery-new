import React from "react";

const NotificationPanel = ({
  notifications,
  removeNotification,
  setShowNotifications,
}) => {
  const getNotificationStyle = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-500";
      case "warning":
        return "bg-yellow-50 border-yellow-500";
      case "error":
        return "bg-red-50 border-red-500";
      default:
        return "bg-blue-50 border-blue-500";
    }
  };

  return (
    <div className="absolute top-16 right-4 w-80 bg-white rounded-xl shadow-lg border border-discovery-gold/20 z-50 max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-discovery-gold/20">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-discovery-blue">Notifications</h3>
          <button
            onClick={() => setShowNotifications(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="p-2">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No notifications</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 mb-2 rounded-lg border-l-4 ${getNotificationStyle(
                notification.type
              )}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
