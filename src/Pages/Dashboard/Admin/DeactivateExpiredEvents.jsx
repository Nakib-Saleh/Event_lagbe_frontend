import React, { useState } from "react";
import { FiClock, FiPlay, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-hot-toast";
import axios from "axios";
import { API_ENDPOINTS } from "../../../config/api";

const DeactivateExpiredEvents = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const handleTriggerTask = async () => {
    setIsRunning(true);
    
    try {
      const response = await axios.post(
        //"http://localhost:2038/api/scheduled-tasks/deactivate-expired-events"
        API_ENDPOINTS.DEACTIVATE_EXPIRED_EVENTS
      );

      if (response.data.success) {
        toast.success("✅ Task triggered successfully! Check console logs for details.");
        setLastRun(new Date());
      } else {
        toast.error("❌ Failed to trigger task: " + response.data.message);
      }
    } catch (error) {
      console.error("Error triggering task:", error);
      const errorMessage = error.response?.data?.message || "Failed to trigger task";
      toast.error("❌ Error: " + errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <FiClock className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Deactivate Expired Events</h2>
            <p className="text-gray-600">Manually trigger the scheduled task to deactivate events with expired timeslots</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="max-w-2xl mx-auto">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* What it does */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FiCheckCircle className="text-white text-sm" />
                </div>
                <h3 className="text-lg font-semibold text-blue-800">What it does</h3>
              </div>
              <ul className="text-blue-700 space-y-2 text-sm">
                <li>• Fetches all active events</li>
                <li>• Checks each event's timeslots</li>
                <li>• Deactivates events where ALL timeslots have ended</li>
                <li>• Keeps events active if ANY timeslot is still in the future</li>
              </ul>
            </div>

            {/* Schedule Info */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <FiClock className="text-white text-sm" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">Automatic Schedule</h3>
              </div>
                             <div className="text-green-700 space-y-2 text-sm">
                 <p><strong>Frequency:</strong> Daily at midnight</p>
                 <p><strong>Timezone:</strong> Bangladesh (Asia/Dhaka)</p>
                 <p><strong>Status:</strong> Active</p>
               </div>
            </div>
          </div>

          {/* Manual Trigger Section */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPlay className="text-white text-2xl" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Manual Task Trigger
              </h3>
              
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Click the button below to manually run the deactivation task. 
                This is useful for testing or immediate processing.
              </p>

              {/* Trigger Button */}
              <button
                onClick={handleTriggerTask}
                disabled={isRunning}
                className={`btn btn-lg ${
                  isRunning 
                    ? "btn-disabled bg-gray-400" 
                    : "bg-gradient-to-r from-orange-500 to-red-600 border-0 hover:from-orange-600 hover:to-red-700"
                } text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200`}
              >
                {isRunning ? (
                  <>
                    <div className="loading loading-spinner loading-sm"></div>
                    Running Task...
                  </>
                ) : (
                  <>
                    <FiPlay className="mr-2" />
                    Trigger Deactivation Task
                  </>
                )}
              </button>

              {/* Last Run Info */}
              {lastRun && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <FiCheckCircle className="text-green-600" />
                    <span className="font-medium">Last triggered:</span>
                    <span>{lastRun.toLocaleString('en-US', { 
                      timeZone: 'Asia/Dhaka',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })} (Bangladesh Time)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-8 bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <FiAlertCircle className="text-white text-sm" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes</h4>
                <ul className="text-yellow-700 space-y-2 text-sm">
                  <li>• The task will only deactivate events where ALL timeslots have ended</li>
                  <li>• Events with any future timeslots will remain active</li>
                  <li>• Check the backend console logs for detailed execution information</li>
                  <li>• This action cannot be undone - deactivated events will need manual reactivation</li>
                                     <li>• The task runs automatically every day at midnight Bangladesh time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeactivateExpiredEvents;
