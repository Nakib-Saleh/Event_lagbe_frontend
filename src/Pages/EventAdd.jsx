import React, { useContext, useEffect, useState } from 'react';
import { FiCalendar, FiMapPin, FiUsers, FiImage, FiGlobe } from 'react-icons/fi';
import { MdOutlineEmojiEvents } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../Provider/AuthContext';
import { API_ENDPOINTS } from '../config/api';

const EventAdd = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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
    newSponsor: ''
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

  useEffect(() => {
    const loadSkills = async () => {
      try {
        setSkillsState(prev => ({ ...prev, loading: true }));
        const res = await fetch(API_ENDPOINTS.SKILLS);
        const data = await res.json();
        setSkillsState(prev => ({ 
          ...prev, 
          list: Array.isArray(data) ? data : [],
          loading: false 
        }));

        console.log(data);
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        coverImage: file
      }));
    }
  };

  const handleSearchCoHosts = (query) => {
    setSearchState(prev => ({ ...prev, query, page: 0 }));
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchState.query && searchState.query.trim()) {
        const { items, hasMore } = await fetchDirectory(searchState.query, 0);
        setSearchState(prev => ({ ...prev, results: items, hasMore, page: 0 }));
      } else {
        setSearchState(prev => ({ ...prev, results: [], hasMore: false, page: 0 }));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchState.query]);

  const loadMoreResults = async () => {
    const nextPage = searchState.page + 1;
    const { items, hasMore } = await fetchDirectory(searchState.query, nextPage);
    setSearchState(prev => ({ 
      ...prev, 
      results: [...prev.results, ...items], 
      hasMore, 
      page: nextPage 
    }));
  };

  const handleAddCoHost = (coHost) => {
    // Check if coHost is already added by firebaseUid
    const isAlreadyAdded = formData.coHosts.includes(coHost.firebaseUid);
    
    if (!isAlreadyAdded) {
      setFormData(prev => ({
        ...prev,
        coHosts: [...prev.coHosts, coHost.firebaseUid]
      }));
      setSelectedCoHosts(prev => [...prev, coHost]);
      setSearchState(prev => ({ ...prev, query: '', results: [] }));
    }
  };

  const handleRemoveCoHost = (coHostId) => {
    setFormData(prev => ({
      ...prev,
      coHosts: prev.coHosts.filter(hostId => hostId !== coHostId)
    }));
    setSelectedCoHosts(prev => prev.filter(host => host.firebaseUid !== coHostId));
  };

  const handleAddSponsor = () => {
    if (uiState.newSponsor.trim() && !formData.sponsors.includes(uiState.newSponsor.trim())) {
      setFormData(prev => ({
        ...prev,
        sponsors: [...prev.sponsors, uiState.newSponsor.trim()]
      }));
      setUiState(prev => ({ ...prev, newSponsor: '' }));
    }
  };

  const handleRemoveSponsor = (sponsorToRemove) => {
    setFormData(prev => ({
      ...prev,
      sponsors: prev.sponsors.filter(sponsor => sponsor !== sponsorToRemove)
    }));
  };

  const handleSponsorKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSponsor();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUiState(prev => ({ ...prev, isSubmitting: true }));
    try {
      let coverImageUrl = null;
      if (formData.coverImage) {
        const uploadRes = await uploadToCloudinary(formData.coverImage);
        coverImageUrl = uploadRes?.secure_url || uploadRes?.url || null;
        if (!coverImageUrl) {
          toast.error('Image upload failed, please try again');
          throw new Error('Image upload failed, please try again');
        }
      }

      // Ensure timeslots are properly formatted with all required fields
      console.log('formData.timeslots:', formData.timeslots);
      
      const timeslots = (formData.timeslots && formData.timeslots.length > 0) 
        ? formData.timeslots 
        : calendarState.events.map(event => ({
            title: event.title,
            start: event.start,
            end: event.end
          }));

      console.log(user);
      
      const payload = {
        ownerId: user.firebaseUid,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        eventType: formData.eventType,
        eventScope: formData.eventScope,
        requiredSkills: formData.requiredSkills,
        coHosts: formData.coHosts,
        sponsors: formData.sponsors,
        coverImageUrl,
        timeslots: timeslots
      };

      console.log('Timeslots being sent:', timeslots);
      console.log(payload);

      //const res = await fetch(`http://localhost:2038/api/events`, {
              const res = await fetch(API_ENDPOINTS.EVENTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create event');
      await res.json();
      toast.success('Event created successfully!');

      setTimeout(() => {
        navigate('/events');
      }, 800);
      setFormData({
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
      setSelectedCoHosts([]);
    } catch {
      toast.error('Failed to create event');
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
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
    });
    setUiState(prev => ({ ...prev, calendarModal: null }));
    console.log('Added timeslot:', calendarApi.getEvents());
  };

  const handleCalendarEventClick = (selected) => {
    if (confirm('Remove this timeslot?')) {
      selected.event.remove();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Event</h1>
        <p className="text-gray-600">Share your event with the world</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MdOutlineEmojiEvents className="text-blue-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              <p className="text-gray-500 text-sm">Tell people about your event</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Event Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="What's your event called?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            {/* Event Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe your event..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                required
              />
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills
              </label>
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

            {/* Event Scope */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Event Scope
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="eventScope"
                    value="public"
                    checked={formData.eventScope === 'public'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      eventScope: e.target.value
                    }))}
                    className="mr-3"
                  />
                  <div className="flex items-center gap-2">
                    <FiUsers className="text-blue-600" />
                    <div>
                      <span className="font-medium">Open Event</span>
                      <p className="text-sm text-gray-500">All students can participate</p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="eventScope"
                    value="private"
                    checked={formData.eventScope === 'private'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      eventScope: e.target.value
                    }))}
                    className="mr-3"
                  />
                  <div className="flex items-center gap-2">
                    <FiUsers className="text-green-600" />
                    <div>
                      <span className="font-medium">Intra-University Event</span>
                      <p className="text-sm text-gray-500">Only students from your organization can participate</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
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
              select={handleCalendarSelect}
              eventClick={handleCalendarEventClick}
                eventsSet={(events) => {
                    setCalendarState(prev => ({ ...prev, events }));
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

        {/* Location Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FiMapPin className="text-purple-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Location</h2>
              <p className="text-gray-500 text-sm">Where is your event taking place?</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Event Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="eventType"
                    value="on-site"
                    checked={formData.eventType === 'on-site'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <div className="flex items-center gap-2">
                    <FiGlobe className="text-blue-600" />
                    <span className="font-medium">On-Site Event</span>
                  </div>
                </label>

                <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="eventType"
                    value="online"
                    checked={formData.eventType === 'online'}
                    onChange={handleInputChange}
                    className="mr-3"
                  />
                  <div className="flex items-center gap-2">
                    <FiGlobe className="text-green-600" />
                    <span className="font-medium">Online Event</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Enter event location or write Online"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>
          </div>
        </div>

        {/* Additional Details Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <FiUsers className="text-orange-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Additional Details</h2>
              <p className="text-gray-500 text-sm">Make your event more engaging</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Co-Hosts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Co-Hosts
              </label>
              <div className="space-y-4">
                {/* Search Input */}
                                 <div className="relative">
                     <input
                     type="text"
                       value={searchState.query}
                       onChange={(e) => handleSearchCoHosts(e.target.value)}
                     placeholder="Search organizations or organizers..."
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                   />
                     {searchState.query && (
                     <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                       {searchState.searching && (
                         <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                       )}
                       {!searchState.searching && searchState.results.length === 0 && (
                         <div className="px-4 py-3 text-sm text-gray-500">No results</div>
                       )}
                       {!searchState.searching && searchState.results.map((result) => (
                         <div
                           key={result.id}
                           onClick={() => handleAddCoHost(result)}
                           className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                         >
                           <div className="flex items-center justify-between">
                             <div>
                               <p className="font-medium text-gray-900">{result.name}</p>
                               <p className="text-sm text-gray-500">{result.email}</p>
                             </div>
                             <span className={`px-2 py-1 text-xs rounded-full ${
                               result.type === 'organization' 
                                 ? 'bg-blue-100 text-blue-800' 
                                 : 'bg-green-100 text-green-800'
                             }`}>
                               {result.type}
                             </span>
                           </div>
                         </div>
                       ))}
                         {!searchState.searching && searchState.hasMore && (
                           <button
                             type="button"
                             onClick={loadMoreResults}
                             className="w-full text-center py-2 text-blue-600 hover:bg-blue-50"
                           >
                             Load more
                           </button>
                         )}
                     </div>
                   )}
                 </div>

                {/* Selected Co-Hosts */}
                {selectedCoHosts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected Co-Hosts:</p>
                    <div className="space-y-2">
                      {selectedCoHosts.map((coHost) => (
                        <div
                          key={coHost.firebaseUid}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              coHost.type === 'organization' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {coHost.type === 'organization' ? 'O' : 'P'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{coHost.name}</p>
                              <p className="text-sm text-gray-500">{coHost.email}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCoHost(coHost.firebaseUid)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sponsors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sponsors
              </label>
              <div className="space-y-4">
                {/* Add Sponsor Input */}
                                 <div className="flex gap-2">
                   <input
                     type="text"
                     value={uiState.newSponsor}
                     onChange={(e) => setUiState(prev => ({ ...prev, newSponsor: e.target.value }))}
                     onKeyPress={handleSponsorKeyPress}
                     placeholder="Enter sponsor name..."
                     className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                   />
                   <button
                     type="button"
                     onClick={handleAddSponsor}
                     disabled={!uiState.newSponsor.trim()}
                     className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     Add
                   </button>
                 </div>

                {/* Selected Sponsors */}
                {formData.sponsors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Event Sponsors:</p>
                    <div className="space-y-2">
                      {formData.sponsors.map((sponsor, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-medium">
                              S
                            </div>
                            <span className="font-medium text-gray-900">{sponsor}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSponsor(sponsor)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="coverImage"
                />
                <label htmlFor="coverImage" className="cursor-pointer">
                  <FiImage className="mx-auto text-gray-400 text-3xl mb-2" />
                  <p className="text-gray-600 mb-1">
                    {formData.coverImage ? formData.coverImage.name : 'Click to upload cover image'}
                  </p>
                  <p className="text-gray-400 text-sm">PNG, JPG up to 5MB</p>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={() => {
              setFormData({
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
              setSelectedCoHosts([]);
            }}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
                     <button
             type="submit"
             disabled={uiState.isSubmitting}
             className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
           >
             {uiState.isSubmitting ? (
               <>
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 Creating Event...
               </>
             ) : (
               'Create Event'
             )}
           </button>
        </div>
      </form>
    </div>
  );
};

export default EventAdd;