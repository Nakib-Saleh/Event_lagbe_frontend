import React, { useState, useEffect, useContext } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import AuthContext from "../../../Provider/AuthContext";
import { toast } from "react-hot-toast";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import { API_ENDPOINTS } from "../../../config/api";

const Calendar = () => {
  const { user, userRole } = useContext(AuthContext);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Color palette for different events
  const eventColors = [
    { bg: "#3B82F6", border: "#2563EB", text: "#FFFFFF" }, // Blue
    { bg: "#10B981", border: "#059669", text: "#FFFFFF" }, // Green
    { bg: "#F59E0B", border: "#D97706", text: "#FFFFFF" }, // Yellow
    { bg: "#EF4444", border: "#DC2626", text: "#FFFFFF" }, // Red
    { bg: "#8B5CF6", border: "#7C3AED", text: "#FFFFFF" }, // Purple
    { bg: "#06B6D4", border: "#0891B2", text: "#FFFFFF" }, // Cyan
    { bg: "#F97316", border: "#EA580C", text: "#FFFFFF" }, // Orange
    { bg: "#EC4899", border: "#DB2777", text: "#FFFFFF" }, // Pink
  ];

  useEffect(() => {
    if (user?.firebaseUid) {
      fetchRegisteredEvents();
    }
  }, [user?.firebaseUid]);

  const fetchRegisteredEvents = async () => {
    try {
      setLoading(true);
      
             // First, get the participant's profile to get registeredEventIds
             //const participantRes = await fetch(`http://localhost:2038/api/auth/${userRole}/${user.firebaseUid}`);
       const participantRes = await fetch(API_ENDPOINTS.GET_USER_BY_ROLE(userRole, user.firebaseUid));
      if (!participantRes.ok) {
        throw new Error('Failed to fetch participant data');
      }
      
      const participantData = await participantRes.json();
      const registeredEventIds = participantData.registeredEventIds || [];
      
      if (registeredEventIds.length === 0) {
        setRegisteredEvents([]);
        setCalendarEvents([]);
        setLoading(false);
        return;
      }

      // Fetch each registered event with its timeslots
      const eventsWithTimeslots = [];
      const calendarEventsData = [];

      for (let i = 0; i < registeredEventIds.length; i++) {
        const eventId = registeredEventIds[i];
        const colorIndex = i % eventColors.length;
        const eventColor = eventColors[colorIndex];

        try {
          //const eventRes = await fetch(`http://localhost:2038/api/events/${eventId}`);
                     const eventRes = await fetch(API_ENDPOINTS.GET_EVENT(eventId));
          if (eventRes.ok) {
            const eventData = await eventRes.json();
            const event = eventData.event;
            const timeslots = eventData.timeslots || [];

            // Skip inactive events
            if (event.isActive === false) {
              console.log(`Skipping inactive event: ${event.title} (ID: ${eventId})`);
              continue;
            }

            // Add event to the list
            eventsWithTimeslots.push({
              ...event,
              timeslots,
              color: eventColor
            });

            // Add timeslots to calendar events
            timeslots.forEach((timeslot, timeslotIndex) => {
              calendarEventsData.push({
                id: `${eventId}-${timeslot.id}`,
                title: `${event.title} - ${timeslot.title || `Session ${timeslotIndex + 1}`}`,
                start: timeslot.start,
                end: timeslot.end,
                backgroundColor: eventColor.bg,
                borderColor: eventColor.border,
                textColor: eventColor.text,
                allDay: false,
                display: "block",
                extendedProps: {
                  eventId: eventId,
                  eventTitle: event.title,
                  timeslotTitle: timeslot.title || `Session ${timeslotIndex + 1}`,
                  location: event.location,
                  eventType: event.eventType,
                  color: eventColor
                }
              });
            });
          }
        } catch (error) {
          console.error(`Error fetching event ${eventId}:`, error);
        }
      }

      setRegisteredEvents(eventsWithTimeslots);
      setCalendarEvents(calendarEventsData);
      
    } catch (error) {
      console.error('Error fetching registered events:', error);
      toast.error('Failed to load registered events');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo) => {
    const eventId = clickInfo.event.extendedProps.eventId;
    const event = registeredEvents.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowEventModal(true);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Calendar</h1>
        <p className="text-gray-600">View your registered events and their schedules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Event List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaCalendarAlt className="text-blue-600 text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Registered Events</h2>
                <p className="text-gray-500 text-sm">{registeredEvents.length} events</p>
              </div>
            </div>

            {registeredEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCalendarAlt className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No registered events</p>
                <p className="text-gray-400 text-xs mt-1">Register for events to see them here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {registeredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    style={{ borderLeft: `4px solid ${event.color.border}` }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEventModal(true);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">
                        {event.title}
                      </h3>
                      <div
                        className="w-3 h-3 rounded-full ml-2 flex-shrink-0"
                        style={{ backgroundColor: event.color.bg }}
                      ></div>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-gray-400" />
                        <span>{event.timeslots.length} session{event.timeslots.length !== 1 ? 's' : ''}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-gray-400" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-gray-400" />
                        <span>{event.registeredBy?.length || 0} registered</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <FaCalendarAlt className="text-green-600 text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Calendar View</h2>
                <p className="text-gray-500 text-sm">Click on events to view details</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <FullCalendar
                height="600px"
                plugins={[
                  dayGridPlugin,
                  timeGridPlugin,
                  interactionPlugin,
                  listPlugin,
                ]}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
                }}
                initialView="dayGridMonth"
                editable={false}
                selectable={false}
                selectMirror={false}
                dayMaxEvents={3}
                weekends={true}
                events={calendarEvents}
                eventClick={handleEventClick}
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
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl text-gray-800">{selectedEvent.title}</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Event Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span className="text-gray-600">
                      {selectedEvent.location || "Location not specified"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-gray-400" />
                    <span className="text-gray-600">
                      {selectedEvent.timeslots.length} session{selectedEvent.timeslots.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUsers className="text-gray-400" />
                    <span className="text-gray-600">
                      {selectedEvent.registeredBy?.length || 0} registered
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-gray-600 capitalize">{selectedEvent.eventType}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm">{selectedEvent.description}</p>
                </div>
              )}

              {/* Timeslots */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  Event Schedule ({selectedEvent.timeslots.length} session{selectedEvent.timeslots.length !== 1 ? 's' : ''})
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedEvent.timeslots.map((timeslot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200"
                      style={{ borderLeft: `4px solid ${selectedEvent.color.border}` }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">
                          {timeslot.title || `Session ${index + 1}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDateTime(timeslot.start)}
                          {timeslot.end && (
                            <>
                              {" — "}
                              {formatDateTime(timeslot.end)}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: selectedEvent.color.bg }}
                        >
                          Session {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setShowEventModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
