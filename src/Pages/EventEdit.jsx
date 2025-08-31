import React, { useContext, useEffect, useState, useRef } from 'react';
import { FiCalendar, FiMapPin, FiUsers, FiImage, FiGlobe } from 'react-icons/fi';
import { MdOutlineEmojiEvents } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import { useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../Provider/AuthContext';
import { API_ENDPOINTS } from '../config/api';

const EventEdit = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { eventId } = useParams();
  const calendarRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    eventType: 'on-site',
    eventScope: 'public',
    requiredSkills: [],
    coHosts: [],
    sponsors: [],
    coverImage: null,
    timeslots: []
  });

  // Group related states together
  const [selectedCoHosts, setSelectedCoHosts] = useState([]);
  
  const [uiState, setUiState] = useState({
    isSubmitting: false,
    calendarModal: null,
    newSponsor: '',
    loading: true
  });
  
  const [searchState, setSearchState] = useState({
    query: '',
    results: [],
    searching: false,
    page: 0,
    hasMore: false
  });
  
  const [skillsState, setSkillsState] = useState({
    list: [],
    loading: false,
    error: null
  });
  
  const [calendarState, setCalendarState] = useState({
    events: []
  });

  // Debounced search for co-hosts
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchState.query.trim()) {
        const result = await fetchDirectory(searchState.query);
        setSearchState(prev => ({ ...prev, results: result.items }));
      } else {
        setSearchState(prev => ({ ...prev, results: [] }));
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchState.query]);

  // Load event data for editing
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setUiState(prev => ({ ...prev, loading: true }));
        
        // Fetch event data
        //`http://localhost:2038/api/events/${eventId}`,
        const eventRes = await fetch(API_ENDPOINTS.GET_EVENT(eventId));
        if (!eventRes.ok) {
          throw new Error('Event not found');
        }
        
        const eventData = await eventRes.json();
        const event = eventData.event;
        const timeslots = eventData.timeslots; 
        
        console.log('Loaded event data:', eventData);
        console.log('Event timeslots:', timeslots);
        
        // Check if user is the owner
        if (event.ownerId !== user.firebaseUid) {
          toast.error('You are not authorized to edit this event');
          navigate('/events');
          return;
        }
        
        // Preload form data
        setFormData({
           title: event.title || '',
           description: event.description || '',
           location: event.location || '',
           eventType: event.eventType || 'on-site',
           eventScope: event.eventScope || 'public',
           requiredSkills: event.requiredSkills || [],
           coHosts: event.coHosts || [],
           sponsors: event.sponsors || [],
           coverImage: null, // We'll handle this separately
           timeslots: timeslots // Will be set properly in the calendar events section
         });
        
                   // Set co-hosts - fetch actual user data for each co-host
          if (event.coHosts && event.coHosts.length > 0) {
            const coHostPromises = event.coHosts.map(async (coHostId) => {
              try {
                // Use common auth endpoint
                // const response = await fetch(`http://localhost:2038/api/auth/${coHostId}`);
                const response = await fetch(API_ENDPOINTS.GET_USER(coHostId));
                
                if (response.ok) {
                  const data = await response.json();
                  const userData = data.user;
                  const userRole = data.userRole;
                  
                  return {
                    firebaseUid: userData.firebaseUid,
                    name: userData.name || userData.username || userData.displayName || userData.email,
                    type: userRole,
                    email: userData.email
                  };
                }
                return null;
              } catch (error) {
                console.error(`Error fetching co-host data for ${coHostId}:`, error);
                return null;
              }
            });

            const coHostsData = await Promise.all(coHostPromises);
            const validCoHosts = coHostsData.filter(coHost => coHost !== null);
            console.log('validCoHosts:', validCoHosts);
            setSelectedCoHosts(validCoHosts);
          }
        
                         // Set calendar events using calendar API
        if (timeslots && timeslots.length > 0) {
          console.log('Setting calendar events with timeslots:', timeslots);
          
          // Wait for calendar to be ready, then add events
          setTimeout(() => {
            if (calendarRef.current) {
              const calendarApi = calendarRef.current.getApi();
              calendarApi.removeAllEvents();
              
              timeslots.forEach(slot => {
                calendarApi.addEvent({
                  id: slot.id,
                  title: slot.title || 'Event Session',
                  start: slot.start,
                  end: slot.end
                });
              });
            }
          }, 100);
        } else {
          console.log('No timeslots found in event data');
        }
        
        // Mark initial load as complete
        // setUiState(prev => ({ ...prev, initialLoadComplete: true })); // Removed as per new_code
        // isInitialLoadRef.current = false; // Removed as per new_code
        
      } catch (error) {
        console.error('Error loading event data:', error);
        toast.error('Failed to load event data');
        navigate('/events');
      } finally {
        setUiState(prev => ({ ...prev, loading: false }));
      }
    };

    if (eventId && user) {
      loadEventData();
    }
  }, [eventId, user, navigate]);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        setSkillsState(prev => ({ ...prev, loading: true }));
        //const res = await fetch(`http://localhost:2038/api/skills`);
        const res = await fetch(API_ENDPOINTS.SKILLS);
        const data = await res.json();
        setSkillsState(prev => ({ 
          ...prev, 
          list: Array.isArray(data) ? data : [],
          loading: false 
        }));
      } catch {
        setSkillsState(prev => ({ 
          ...prev, 
          error: 'Failed to load skills',
          list: [],
          loading: false 
        }));
      }
    };
    loadSkills();
  }, []);

  const fetchDirectory = async (query, page = 0) => {
    if (!query || !query.trim()) return [];
    try {
      setSearchState(prev => ({ ...prev, searching: true }));
      const [orgRes, orgzRes] = await Promise.all([
        //fetch(`http://localhost:2038/api/organizations?q=${encodeURIComponent(query)}&page=${page}&size=5`).then(r => r.json()),
        //fetch(`http://localhost:2038/api/organizers?q=${encodeURIComponent(query)}&page=${page}&size=5`).then(r => r.json()),
        fetch(`${API_ENDPOINTS.ORGANIZATIONS}?q=${encodeURIComponent(query)}&page=${page}&size=5`).then(r => r.json()),
        fetch(`${API_ENDPOINTS.ORGANIZERS}?q=${encodeURIComponent(query)}&page=${page}&size=5`).then(r => r.json()),
      ]);
      const mapOrg = (o) => ({ firebaseUid: o.firebaseUid, name: o.name || o.username || o.email, type: 'organization', email: o.email });
      const mapOrgz = (p) => ({ firebaseUid: p.firebaseUid, name: p.name || p.username || p.email, type: 'organizer', email: p.email });
      const orgContent = orgRes?.content ?? orgRes ?? [];
      const orgzContent = orgzRes?.content ?? orgzRes ?? [];
      const items = [...orgContent.map(mapOrg), ...orgzContent.map(mapOrgz)];
      const hasMore = (orgRes?.last === false) || (orgzRes?.last === false);
      return { items, hasMore };
    } catch {
      return { items: [], hasMore: false };
    } finally {
      setSearchState(prev => ({ ...prev, searching: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };



  const handleSponsorAdd = () => {
    if (uiState.newSponsor.trim()) {
      setFormData(prev => ({
        ...prev,
        sponsors: [...prev.sponsors, uiState.newSponsor.trim()]
      }));
      setUiState(prev => ({ ...prev, newSponsor: '' }));
    }
  };

  const handleSponsorRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      sponsors: prev.sponsors.filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, coverImage: file }));
    }
  };

  const handleCalendarSelect = (selected) => {
    setUiState(prev => ({ ...prev, calendarModal: { data: selected, title: formData.title || '' } }));
  };

  const addCalendarTimeslot = () => {
    if (!uiState.calendarModal) return;
    const calendarApi = uiState.calendarModal.data.view.calendar;
    calendarApi.unselect();
    const id = `timeslot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    calendarApi.addEvent({
      id,
      title: uiState.calendarModal.title || 'Session',
      start: uiState.calendarModal.data.startStr,
      end: uiState.calendarModal.data.endStr,
      allDay: uiState.calendarModal.data.allDay,
    });
    setUiState(prev => ({ ...prev, calendarModal: null }));
  };

  const handleCalendarEventClick = (selected) => {
    if (confirm('Remove this timeslot?')) {
      selected.event.remove();
    }
  };

  const handleEventResize = (info) => {
    console.log('Event resized:', info.event.title, 'from', info.oldEvent.start, 'to', info.event.start);
    console.log('New end time:', info.event.end);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    
    try {
      setUiState(prev => ({ ...prev, isSubmitting: true }));
      
      let coverImageUrl = null;
      if (formData.coverImage) {
        try {
          const cloudinaryResponse = await uploadToCloudinary(formData.coverImage);
          coverImageUrl = cloudinaryResponse.secure_url || cloudinaryResponse.url;
          console.log('Uploaded image URL:', coverImageUrl);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Failed to upload image. Please try again.');
          return;
        }
      }
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        eventType: formData.eventType,
        eventScope: formData.eventScope,
        requiredSkills: formData.requiredSkills,
        coHosts: selectedCoHosts.map(coHost => coHost.firebaseUid),
        sponsors: formData.sponsors,
        timeslots: formData.timeslots
      };
      
      console.log('Timeslots being sent for update:', formData.timeslots);
      
      // Only add coverImageUrl if we have a new image
      if (coverImageUrl) {
        eventData.coverImageUrl = coverImageUrl;
      }
      
      console.log('Sending event data:', eventData);
      // const response = await fetch(`http://localhost:2038/api/events/${eventId}`, {
      
              const response = await fetch(API_ENDPOINTS.UPDATE_EVENT(eventId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });
      
      if (response.ok) {
        toast.success('Event updated successfully!');
        navigate(`/event/${eventId}`);
      } else {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        toast.error(errorData.message || errorData.error || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  if (uiState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-gray-600">Loading event data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <MdOutlineEmojiEvents className="text-3xl text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter event title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Describe your event..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMapPin className="inline mr-2" />
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Event location"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="on-site">On-site</option>
                    <option value="online">Online</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Scope
                </label>
                <select
                  name="eventScope"
                  value={formData.eventScope}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            
            {/* Cover Image */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Cover Image</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiImage className="inline mr-2" />
                  Upload Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to keep the current image
                </p>
              </div>
            </div>
            
                         {/* Required Skills */}
             <div className="space-y-4">
               <h2 className="text-xl font-semibold text-gray-900">Required Skills</h2>
               <div className="space-y-2">
                 <div className="flex flex-wrap gap-2">
                   {formData.requiredSkills.map((skillName, index) => (
                     <span key={index} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                       {skillName}
                       <button 
                         type="button" 
                         onClick={() => setFormData(prev => ({
                           ...prev,
                           requiredSkills: prev.requiredSkills.filter((_, i) => i !== index)
                         }))} 
                         className="text-red-500 hover:text-red-700"
                       >
                         ✕
                       </button>
                     </span>
                   ))}
                 </div>
                 <div className="relative">
                   <select
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                     value=""
                     onChange={(e) => {
                       const skill = skillsState.list.find(sk => (sk.id || sk._id) === e.target.value);
                       if (skill && !formData.requiredSkills.includes(skill.name)) {
                         setFormData(prev => ({
                           ...prev,
                           requiredSkills: [...prev.requiredSkills, skill.name]
                         }));
                       }
                     }}
                     disabled={skillsState.loading || skillsState.error}
                   >
                     <option value="">{skillsState.loading ? 'Loading skills...' : (skillsState.error || 'Add a skill')}</option>
                     {skillsState.list.map(sk => (
                       <option key={sk.id || sk._id} value={sk.id || sk._id}>{sk.name}</option>
                     ))}
                   </select>
                 </div>
               </div>
             </div>
            
                         {/* Co-Hosts */}
             <div className="space-y-4">
               <h2 className="text-xl font-semibold text-gray-900">Co-Hosts</h2>
               <div className="relative">
                                   <input
                    type="text"
                    value={searchState.query}
                    onChange={(e) => setSearchState(prev => ({ ...prev, query: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Search for organizations or organizers..."
                  />
                 {searchState.results.length > 0 && searchState.query.trim() && (
                   <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                     {searchState.results.map((result, index) => (
                       <div
                         key={index}
                         onClick={() => {
                           if (!selectedCoHosts.find(coHost => coHost.firebaseUid === result.firebaseUid)) {
                             setSelectedCoHosts(prev => [...prev, result]);
                           }
                           setSearchState(prev => ({ ...prev, query: '', results: [] }));
                         }}
                         className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                       >
                         <div className="font-medium">{result.name}</div>
                         <div className="text-sm text-gray-500">{result.type} • {result.email}</div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
                               {selectedCoHosts.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Selected Co-Hosts:</div>
                    {selectedCoHosts.map((coHost, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {coHost.name ? coHost.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{coHost.name}</div>
                            <div className="text-sm text-gray-600">{coHost.email}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCoHosts(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
             </div>
             
             {/* Sponsors */}
             <div className="space-y-4">
               <h2 className="text-xl font-semibold text-gray-900">Sponsors</h2>
               <div className="flex gap-2">
                 <input
                   type="text"
                   value={uiState.newSponsor}
                   onChange={(e) => setUiState(prev => ({ ...prev, newSponsor: e.target.value }))}
                   className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                   placeholder="Add sponsor name"
                 />
                 <button
                   type="button"
                   onClick={handleSponsorAdd}
                   className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                 >
                   Add
                 </button>
               </div>
               {formData.sponsors.length > 0 && (
                 <div className="flex flex-wrap gap-2">
                   {formData.sponsors.map((sponsor, index) => (
                     <span
                       key={index}
                       className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                     >
                       {sponsor}
                       <button
                         type="button"
                         onClick={() => handleSponsorRemove(index)}
                         className="ml-2 text-red-600 hover:text-red-800"
                       >
                         ×
                       </button>
                     </span>
                   ))}
                 </div>
               )}
             </div>
            
            {/* Date & Time Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <FiCalendar className="text-green-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Date & Time</h2>
                  <p className="text-gray-500 text-sm">Select one or multiple time slots from the calendar below</p>
                </div>
              </div>

              <div className="mb-4">
                <FullCalendar
                  ref={calendarRef}
                  height="60vh"
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  initialView="dayGridMonth"
                  selectable={true}
                  selectMirror={true}
                  editable={true}
                  eventResizableFromStart={true}
                  eventResize={handleEventResize}
                  select={handleCalendarSelect}
                  eventClick={handleCalendarEventClick}
                  eventsSet={(events) => {
                    setCalendarState(prev => ({ ...prev, events }));
                    
                    // Update formData timeslots
                    const timeslots = events.map(e => ({
                      id: e.id,
                      title: e.title,
                      start: e.start ? e.start.toISOString() : null,
                      end: e.end ? e.end.toISOString() : null,
                    }));
                    setFormData(prev => ({ ...prev, timeslots }));
                    console.log('Updated formData.timeslots:', timeslots);
                  }}
                />
              </div>

              {/* Modal to confirm adding a selected range */}
              {uiState.calendarModal && (
                <div className="modal modal-open">
                  <div className="modal-box">
                    <h3 className="font-bold text-lg">Add Timeslot</h3>
                    <label className="block text-sm font-medium text-gray-700 mt-4">Label (optional)</label>
                    <input
                      type="text"
                      className="input input-bordered w-full mt-2"
                      placeholder="Session title"
                      value={uiState.calendarModal.title}
                      onChange={e => setUiState(prev => ({ 
                        ...prev, 
                        calendarModal: { ...prev.calendarModal, title: e.target.value }
                      }))}
                    />
                    <div className="modal-action">
                      <button className="btn btn-outline" onClick={() => setUiState(prev => ({ ...prev, calendarModal: null }))}>Cancel</button>
                      <button className="btn btn-success" onClick={addCalendarTimeslot}>Add</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected timeslots summary */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-2">Selected Timeslots ({calendarState.events.length})</h4>
                {calendarState.events.length === 0 ? (
                  <p className="text-sm text-gray-500">No timeslots selected yet. Drag on the calendar to add.</p>
                ) : (
                  <div className="space-y-2">
                    {calendarState.events.map((evt) => (
                     <div key={evt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div>
                         <p className="font-medium text-gray-900">{evt.title || 'Session'}</p>
                         <p className="text-sm text-gray-600">
                           {new Date(evt.start).toLocaleString()} — {evt.end ? new Date(evt.end).toLocaleString() : ''}
                         </p>
                       </div>
                       <button className="btn btn-sm btn-outline btn-error" onClick={() => evt.remove()}>Remove</button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>
            
            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={uiState.isSubmitting}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uiState.isSubmitting ? 'Updating...' : 'Update Event'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/event/${eventId}`)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventEdit;
