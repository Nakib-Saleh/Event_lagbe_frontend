import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { FaBookmark } from "react-icons/fa";
import { FaShareAlt } from "react-icons/fa";
import { SiThealgorithms } from "react-icons/si";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import AuthContext from "../Provider/AuthContext";
import { toast } from "react-hot-toast";
import { API_ENDPOINTS } from "../config/api";

const EventDetails = () => {
  const { eventId } = useParams();
  const { user, userRole } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [ownerOrg, setOwnerOrg] = useState(null);
  const [coHosts, setCoHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isGoing, setIsGoing] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [goingCount, setGoingCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError("");

        let eventData = null;
        try {
          const eventRes = await fetch(
            //`http://localhost:2038/api/events/${eventId}`,
            API_ENDPOINTS.GET_EVENT(eventId)
          );
          if (eventRes.ok) {
            eventData = await eventRes.json();
          }
        } catch {
          console.log("Single event fetch failed. ");
        }

        if (!eventData) throw new Error("Event not found");
        console.log("Final event data:", eventData);

        if (isMounted) {
          setEvent(eventData);
          setInterestedCount(eventData.event?.interestedCount || 0);
          setGoingCount(eventData.event?.goingCount || 0);

          // Fetch owner organization details
          if (eventData.event?.ownerId) {
            try {
              // First try to fetch by organization ID
              let ownerRes = await fetch(
                //`http://localhost:2038/api/auth/${eventData.event.ownerId}`,
                API_ENDPOINTS.GET_USER(eventData.event.ownerId)
              );

              if (ownerRes.ok) {
                const ownerData = await ownerRes.json();
                // console.log("Owner data:", ownerData.user);
                setOwnerOrg(ownerData.user);
              }
            } catch (error) {
              console.error("Failed to fetch owner organization:", error);
            }
          }

          // Fetch co-host organizations details
          if (eventData.event?.coHosts && eventData.event.coHosts.length > 0) {
            try {
              const coHostPromises = eventData.event.coHosts.map(
                async (coHost) => {
                  try {
                    // If coHost is already an object with firebaseUid, use that
                    const coHostId = coHost.firebaseUid || coHost;

                    // First try to fetch by organization ID
                    let coHostRes = await fetch(
                      //`http://localhost:2038/api/auth/${coHostId}`,
                      API_ENDPOINTS.GET_USER(coHostId)
                    );

                    if (coHostRes.ok) {
                      const coHostData = await coHostRes.json();
                      // console.log("Co-host data:", coHostData.user);
                      // Merge with any existing coHost data (name, email)
                      return {
                        ...coHostData.user,
                      };
                    }
                  } catch (error) {
                    console.error(`Failed to fetch co-host ${coHost}:`, error);
                  }
                  return null;
                }
              );

              const coHostResults = await Promise.all(coHostPromises);
              //console.log("Co-host results:", coHostResults);
              setCoHosts(coHostResults);
            } catch (error) {
              console.error("Failed to fetch co-host organizations:", error);
            }
          }
        }
      } catch (e) {
        if (isMounted) {
          setError(e.message || "Failed to load event details");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (eventId) {
      fetchEventDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Separate useEffect to handle user status when user context becomes available
  useEffect(() => {
    if (user && userRole === "participant" && eventId) {
      fetchUserStatus();
    }
  }, [user, userRole, eventId]);

  const formatDate = (dateString) => {
    if (!dateString) return "Date not specified";
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid date";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleShare = () => {
    const pageUrl = window.location.href;
    navigator.clipboard
      .writeText(pageUrl)
      .then(() => {
        toast.success("Link copied to clipboard!");
        console.log("Success");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        toast.error("Failed to copy link.");
      });
  };

  const handleBookmark = async () => {
    if (!user || userRole !== "participant") return;

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
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
        setInterestedCount(data.interestedCount);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const handleGoing = async () => {
    if (!user || userRole !== "participant") return;

    try {
      const response = await fetch(
        //`http://localhost:2038/api/events/${eventId}/going`,
        API_ENDPOINTS.GOING_EVENT(eventId),
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
        const data = await response.json();
        setIsGoing(data.isGoing);
        setGoingCount(data.goingCount);
      }
    } catch (error) {
      console.error("Error toggling going status:", error);
    }
  };

  const fetchUserStatus = async () => {
    if (!user || userRole !== "participant") return;

    try {
      const response = await fetch(
        //`http://localhost:2038/api/events/${eventId}/user-status`,
        API_ENDPOINTS.USER_STATUS(eventId, user.firebaseUid)
      );
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
        setIsGoing(data.isGoing);
      }
    } catch (error) {
      console.error("Error fetching user status:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Event Not Found
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/events" className="btn btn-primary">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  // console.log("Rendering with event:", event);
  // console.log("Event title:", event?.event?.title);
  // console.log("Event description:", event?.event?.description);
  // console.log("Event object keys:", Object.keys(event || {}));
  // console.log("Owner organization:", ownerOrg);
  // console.log("Co-host organizations:", coHosts);
  // console.log("Skills array:", event?.event?.requiredSkills);

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Hero Section with Cover Image */}
      <div className="relative h-96">
        {event.event.coverImageUrl && (
          <img
            src={event.event.coverImageUrl}
            alt={event.event.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">
                    {event.event.title || "Untitled Event"}
                  </h1>
                  {!event.event.isActive && (
                    <span className="badge badge-warning text-sm px-3 py-1">
                      Completed
                    </span>
                  )}
                </div>
                <p className="text-xl opacity-90">
                  {event.event.location || "Location not specified"}
                </p>
                <p className="text-lg opacity-80">
                  {event.event.createdAt
                    ? formatDate(event.event.createdAt)
                    : "Date not specified"}
                </p>
              </div>
              <div className="hidden md:block flex gap-3">
                {/* Edit Button for Event Owner */}
                {user && event?.event?.ownerId === user.firebaseUid && (
                  <Link
                    to={`/event-edit/${eventId}`}
                    className="btn btn-secondary btn-lg"
                  >
                    Edit Event
                  </Link>
                )}

                {user && userRole === "participant" ? (
                  <button
                    onClick={handleBookmark}
                    className={`btn btn-primary btn-lg
                      <FaBookmark className="text-white mr-2" />
                      transition-colors duration-300 ${
                        isBookmarked
                          ? "bg-blue-500 hover:bg-blue-600 text-white border-none"
                          : "bg-white text-black border border-gray-400 hover:bg-gray-100"
                      }`}
                  >
                    <FaBookmark className="" />{" "}
                    {isBookmarked ? "Bookmarked" : "Bookmark Event"}
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-lg bg-gray-400 cursor-not-allowed"
                    disabled
                  >
                    <FaBookmark className="" /> Bookmark Event
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                About this event
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {event.event.description ||
                  "No description available for this event."}
              </p>
            </div>

            {/* Event Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Event Details
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p className="text-gray-600">
                      {event.event.location || "Location not specified"}
                    </p>
                  </div>
                </div>

                {event.event.eventType && (
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg
                        className="w-4 h-4 text-purple-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Event Type</p>
                      <p className="text-gray-600">{event.event.eventType}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Required Skills */}
            {Array.isArray(event.event.requiredSkills) &&
              event.event.requiredSkills.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {event.event.requiredSkills.map((skillName, index) => (
                      <span
                        key={index}
                        className="badge badge-primary badge-lg"
                      >
                        {skillName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Date & Time Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Date & Time
              </h2>
              <div className="space-y-6">
                {Array.isArray(event.timeslots) &&
                event.timeslots.length > 0 ? (
                  <>
                    {/* Calendar View */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3">
                        Calendar View
                      </h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <FullCalendar
                          height="550px"
                          plugins={[
                            dayGridPlugin,
                            timeGridPlugin,
                            interactionPlugin,
                          ]}
                          headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,timeGridDay",
                          }}
                          initialView="dayGridMonth"
                          editable={false}
                          selectable={false}
                          selectMirror={false}
                          dayMaxEvents={3}
                          weekends={true}
                          events={event.timeslots.map((timeslot, index) => ({
                            id: `session-${index}`,
                            title: timeslot.title || `Session ${index + 1}`,
                            start: timeslot.start,
                            end: timeslot.end,
                            backgroundColor: "#3B82F6",
                            borderColor: "#2563EB",
                            textColor: "#FFFFFF",
                            allDay: false,
                            display: "block",
                          }))}
                          eventDisplay="block"
                          eventTimeFormat={{
                            hour: "2-digit",
                            minute: "2-digit",
                            meridiem: "short",
                          }}
                          dayCellContent={(arg) => {
                            return arg.dayNumberText;
                          }}
                          moreLinkClick="popover"
                          moreLinkContent={(args) => {
                            return `+${args.num} more`;
                          }}
                        />
                      </div>
                    </div>

                    {/* List View */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3">
                        Event Schedule ({event.timeslots.length} session
                        {event.timeslots.length !== 1 ? "s" : ""})
                      </h4>
                      <div className="space-y-3">
                        {event.timeslots.map((timeslot, index) => {
                          const startDate = timeslot.start
                            ? new Date(timeslot.start)
                            : null;
                          const endDate = timeslot.end
                            ? new Date(timeslot.end)
                            : null;

                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 mb-1">
                                  {timeslot.title || `Session ${index + 1}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {startDate
                                    ? startDate.toLocaleString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })
                                    : "Start time not specified"}
                                  {endDate && (
                                    <>
                                      {" — "}
                                      {endDate.toLocaleString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      })}
                                    </>
                                  )}
                                </p>
                              </div>
                              <div className="ml-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Session {index + 1}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">
                      No specific schedule available
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Event date and time information will be provided
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Join Event Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="text-center">
                {user && userRole === "participant" ? (
                  <button
                    onClick={handleGoing}
                    disabled={!event.event.isActive}
                    className={`btn btn-block text-xl btn-lg mb-4 transition-colors duration-300 ${
                      !event.event.isActive
                        ? "bg-gray-400 cursor-not-allowed text-gray-600"
                        : isGoing
                        ? "bg-red-500 hover:bg-red-700 text-white border-none"
                        : "bg-white text-black border border-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    <SiThealgorithms className="mr-2 font-extrabold" />
                    {!event.event.isActive
                      ? "Event Completed"
                      : isGoing
                      ? "Going"
                      : "Join Event"}
                  </button>
                ) : (
                  <button
                    className="btn btn-block text-xl btn-lg mb-4 bg-gray-400 cursor-not-allowed"
                    disabled
                  >
                    <SiThealgorithms className="mr-2 font-extrabold" />
                    Join Event
                  </button>
                )}
                <button
                  onClick={handleShare}
                  className="btn btn-outline btn-block font-bold tex-3xl"
                >
                  <FaShareAlt className="text-clack" /> Share Event
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Meet Your Hosts
              </h3>
              <div className="flex flex-col gap-4">
                <div className="font-medium text-gray-700">Owner</div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img
                      src={ownerOrg.profilePictureUrl}
                      alt={ownerOrg.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{ownerOrg.name}</p>
                    <p className="text-sm text-gray-600">{ownerOrg.email}</p>
                  </div>
                </div>

                {/* Co-Hosts Section */}
                {coHosts.length > 0 && (
                  <>
                    <div className="font-medium text-gray-700 mt-4">
                      Co-Hosts
                    </div>
                    <div className="space-y-2">
                      {coHosts.map((coHostOrg, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden">
                            <img
                              src={coHostOrg.profilePictureUrl}
                              alt={coHostOrg.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {coHostOrg.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {coHostOrg.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Sponsors Section */}
                {Array.isArray(event.event.sponsors) &&
                  event.event.sponsors.length > 0 && (
                    <>
                      <div className="font-medium text-gray-700 mt-4">
                        Sponsors
                      </div>
                      <div className="space-y-2">
                        {event.event.sponsors.map((sponsor, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-orange-600 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {sponsor.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {sponsor}
                              </p>
                              <p className="text-sm text-gray-600">Sponsor</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
              </div>
            </div>

            {/* Event Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Event Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Interested</span>
                  <span className="font-medium">{interestedCount} people</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Going</span>
                  <span className="font-medium">{goingCount} people</span>
                </div>
              </div>
            </div>

            {/* Back to Events */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Link to="/events" className="btn btn-outline btn-block">
                ← Back to All Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
