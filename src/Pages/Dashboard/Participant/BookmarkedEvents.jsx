import React, { useEffect, useContext, useState } from "react";
import axios from "axios";
import AuthContext from "../../../Provider/AuthContext";
import { toast } from "react-hot-toast";
import { FiBookmark, FiMapPin } from "react-icons/fi";
import { API_ENDPOINTS } from "../../../config/api";

const BookmarkedEvents = () => {
  const { user } = useContext(AuthContext);
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarkedEvents = async () => {
      try {
        setLoading(true);
        //const response = await axios.get(`http://localhost:2038/api/participant/${user.firebaseUid}/bookmarked-events`);
        const response = await axios.get(API_ENDPOINTS.BOOKMARKED_EVENTS(user.firebaseUid));
        setBookmarkedEvents(response.data);
      } catch (error) {
        console.error("Error fetching bookmarked events:", error);
        toast.error("Failed to fetch bookmarked events");
      } finally {
        setLoading(false);
      }
    };

    if (user?.firebaseUid) {
      fetchBookmarkedEvents();
    }
  }, [user.firebaseUid]);

  const handleRemoveBookmark = async (eventId) => {
    try {
      const response = await fetch(
        //`http://localhost:2038/api/events/${eventId}/bookmark`,
        API_ENDPOINTS.BOOKMARK_EVENT(eventId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participantId: user.firebaseUid,
          }),
        }
      );

      if (response.ok) {
        setBookmarkedEvents(prev => prev.filter(event => event.id !== eventId));
        toast.success("Event removed from bookmarks");
      }
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast.error("Failed to remove bookmark");
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
          <FiBookmark className="text-2xl text-red-600" />
          <h2 className="text-2xl font-bold text-gray-800">Bookmarked Events</h2>
          <span className="badge badge-primary">{bookmarkedEvents.length}</span>
        </div>

        {bookmarkedEvents.length === 0 ? (
          <div className="text-center py-12">
            <FiBookmark className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Bookmarked Events</h3>
            <p className="text-gray-500 mb-4">
              You haven't bookmarked any events yet. Start exploring events and bookmark the ones you're interested in!
            </p>
            <button 
              onClick={() => window.location.href = '/events'}
              className="btn btn-primary"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedEvents.map((event) => (
              <div key={event.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* Event Image */}
                <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  <img
                    src={event.coverImageUrl }
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveBookmark(event.id)}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white p-2 rounded-full transition-colors duration-200"
                  >
                    <FiBookmark className="text-red-600 text-lg" />
                  </button>
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
                     {event.tags && event.tags.length > 0 && event.tags.map((tag, index) => (
                       <span key={index} className="badge badge-neutral badge-sm text-xs">
                         {tag}
                       </span>
                     ))}
                   </div>

                   {/* Event Details */}
                   <div className="space-y-2 text-sm text-gray-500">
                     
                    
                    <div className="flex items-center gap-2">
                      <FiMapPin className="text-red-500" />
                      <span>{event.location || 'Location TBA'}</span>
                    </div>
                  </div>

                    {/* Event Status */}
                   <div className="mt-4 flex items-center justify-between">
                     <span className={`badge ${
                       event.isActive 
                         ? 'badge-success' 
                         : 'badge-warning'
                     }`}>
                       {event.isActive ? 'Active' : 'Inactive'}
                     </span>
                    
                    <button
                      onClick={() => window.location.href = `/event/${event.id}`}
                      className="btn btn-sm btn-outline btn-primary"
                    >
                      View Details
                    </button>
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

export default BookmarkedEvents;
