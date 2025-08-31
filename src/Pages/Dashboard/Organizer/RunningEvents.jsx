import React, { useEffect, useContext, useState } from "react";
import axios from "axios";
import AuthContext from "../../../Provider/AuthContext";
import { toast } from "react-hot-toast";
import { FiCalendar, FiMapPin, FiClock, FiUser, FiEdit, FiTrash2 } from "react-icons/fi";
import { MdOutlineEmojiEvents } from "react-icons/md";
import { API_ENDPOINTS } from "../../../config/api";

const RunningEvents = () => {
  const { user } = useContext(AuthContext);
  const [runningEvents, setRunningEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRunningEvents = async () => {
      try {
        setLoading(true);
        
        if (user.eventIds && user.eventIds.length > 0) {
          // Fetch each event individually using the event IDs
          const eventPromises = user.eventIds.map(async (eventId) => {
            try {
              //const eventResponse = await axios.get(`http://localhost:2038/api/events/${eventId}`);
              const eventResponse = await axios.get(API_ENDPOINTS.GET_EVENT(eventId));
              return eventResponse.data.event; // The API returns {event: {...}, timeslots: [...]}
            } catch (error) {
              console.error(`Error fetching event ${eventId}:`, error);
              return null;
            }
          });
          
          const allEvents = await Promise.all(eventPromises);
          const validEvents = allEvents.filter(event => event !== null);
          
          // Filter for active events only
          const runningEvents = validEvents.filter(event => event.isActive);
          
          setRunningEvents(runningEvents);
        } else {
          setRunningEvents([]);
        }
      } catch (error) {
        console.error("Error fetching running events:", error);
        toast.error("Failed to fetch running events");
      } finally {
        setLoading(false);
      }
    };

    if (user?.firebaseUid) {
      fetchRunningEvents();
    }
  }, [user]);


  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        //await axios.delete(`http://localhost:2038/api/events/${eventId}`);
        await axios.delete(API_ENDPOINTS.DELETE_EVENT(eventId));
        setRunningEvents(prev => prev.filter(event => event.id !== eventId));
        toast.success("Event deleted successfully");
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event");
      }
    }
  };

  const handleToggleEventStatus = async (eventId, currentStatus) => {
    try {
      //await axios.put(`http://localhost:2038/api/events/${eventId}`, {
      await axios.put(API_ENDPOINTS.UPDATE_EVENT(eventId), {
        isActive: !currentStatus
      });
      
      // Remove the event from the running events list when it's deactivated
      setRunningEvents(prev => 
        prev.filter(event => event.id !== eventId)
      );
      
      toast.success(`Event deactivated successfully`);
    } catch (error) {
      console.error("Error updating event status:", error);
      toast.error("Failed to update event status");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <MdOutlineEmojiEvents className="text-2xl text-red-600" />
          <h2 className="text-2xl font-bold text-gray-800">Running Events</h2>
          <span className="badge badge-primary">{runningEvents.length}</span>
        </div>

        {runningEvents.length === 0 ? (
          <div className="text-center py-12">
            <MdOutlineEmojiEvents className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Running Events</h3>
            <p className="text-gray-500 mb-4">
              You don't have any running events yet. Create your first event to get started!
            </p>
            <button
              onClick={() => window.location.href = "/add-event"}
              className="btn btn-primary"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {runningEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Event Image */}
                <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  <img
                    src={event.coverImageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <span className="badge badge-success">Running</span>
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                    {event.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {event.description}
                  </p>

                  {/* Event Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {event.eventType && (
                      <span className="badge badge-outline badge-sm text-xs">
                        {event.eventType}
                      </span>
                    )}
                    {event.tags &&
                      event.tags.length > 0 &&
                      event.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="badge badge-neutral badge-sm text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <FiMapPin className="text-red-500" />
                      <span>{event.location || "Location TBA"}</span>
                    </div>
                  </div>

                  {/* Event Stats */}
                  <div className="mt-3 flex gap-4 text-xs text-gray-500">
                    <span>{event.interestedCount || 0} Interested</span>
                    <span>{event.goingCount || 0} Going</span>
                    <span>{event.sharesCount || 0} Shares</span>
                  </div>

                  {/* Event Actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`badge ${event.isActive ? "badge-success" : "badge-warning"}`}>
                      {event.isActive ? "Active" : "Inactive"}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => window.location.href = `/event/${event.id}`}
                        className="btn btn-sm btn-outline btn-primary"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleToggleEventStatus(event.id, event.isActive)}
                        className={`btn btn-sm btn-outline ${event.isActive ? 'btn-warning' : 'btn-success'}`}
                      >
                        {event.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="btn btn-sm btn-outline btn-error"
                      >
                        <FiTrash2 className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RunningEvents;
