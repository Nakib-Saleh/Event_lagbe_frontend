import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import { formatDate } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

const Calendar = () => {
  const [currentEvents, setCurrentEvents] = useState([]);
  // Single modal state: null | { type: 'add', data, title } | { type: 'delete', data }
  const [modal, setModal] = useState(null);

  const handleDateClick = (selected) => {
    setModal({ type: 'add', data: selected, title: '' });
  };

  const handleAddEvent = () => {
    if (modal.title.trim()) {
      console.log(modal);
      const calendarApi = modal.data.view.calendar;
      calendarApi.unselect();
      calendarApi.addEvent({
        id: `${modal.data.dateStr}-${modal.title}`,
        title: modal.title,
        start: modal.data.startStr,
        end: modal.data.endStr,
        allDay: modal.data.allDay,
      });
    }
    setModal(null);
  };

  const handleEventClick = (selected) => {
    setModal({ type: 'delete', data: selected.event });
  };

  const handleDeleteEvent = () => {
    if (modal.data) {
      modal.data.remove();
    }
    setModal(null);
  };

  return (
    <Box m="20px">
      <Typography variant="h4" gutterBottom>
        Calendar
      </Typography>
      <Box display="flex" justifyContent="space-between">
        {/* CALENDAR SIDEBAR */}
        <Box
          flex="1 1 20%"
          bgcolor="#f5f5f5"
          p="15px"
          borderRadius="4px"
        >
          <Typography variant="h5">Events</Typography>
          <List>
            {currentEvents.map((event) => (
              <ListItem
                key={event.id}
                sx={{
                  bgcolor: "#b9f6ca",
                  margin: "10px 0",
                  borderRadius: "2px",
                }}
              >
                <ListItemText
                  primary={event.title}
                  secondary={
                    <Typography>
                      {formatDate(event.start, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* CALENDAR */}
        <Box flex="1 1 100%" ml="15px">
          <FullCalendar
            height="75vh"
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
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            select={handleDateClick}
            eventClick={handleEventClick}
            eventsSet={(events) => setCurrentEvents(events)}
          />
        </Box>
      </Box>

      {/* Add Event Modal */}
      {modal?.type === 'add' && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add New Event</h3>
            <input
              type="text"
              className="input input-bordered w-full mt-4"
              placeholder="Event Title"
              value={modal.title}
              onChange={e => setModal(m => ({ ...m, title: e.target.value }))}
              autoFocus
            />
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleAddEvent}
                disabled={!modal.title.trim()}
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Modal */}
      {modal?.type === 'delete' && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-red-600">Delete Event</h3>
            <p className="py-4">
              Are you sure you want to delete the event <strong>{modal.data?.title}</strong>?
            </p>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleDeleteEvent}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default Calendar;