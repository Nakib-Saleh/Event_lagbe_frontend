import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { FaHeart, FaCheckCircle, FaCrown } from "react-icons/fa";
import { CiHeart } from "react-icons/ci";
import AuthContext from "../Provider/AuthContext";
import { toast } from "react-hot-toast";
import { API_ENDPOINTS } from "../config/api";

const PublicProfile = () => {
  const { firebaseUid } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState("running"); // "running" or "past"
  const [organizationData, setOrganizationData] = useState(null);

  const getTabsForRole = (role) => {
    switch (role) {
      case "admin":
        return [{ id: "about", label: "About" }];
      case "organization":
        return [
          { id: "about", label: "About" },
          { id: "gallery", label: "Gallery" },
          { id: "organizers", label: "Organizers" },
          { id: "events", label: "Organized Events" },
        ];
      case "organizer":
        return [
          { id: "about", label: "About" },
          { id: "events", label: "Organized Events" },
        ];
      case "participant":
        return [
          { id: "about", label: "About" },
          { id: "events", label: "Registered Events" },
        ];
      default:
        return [{ id: "about", label: "About" }];
    }
  };

  const [activeTab, setActiveTab] = useState("about");

  // Fetch public profile from database
  useEffect(() => {
    const fetchPublicProfile = async () => {
      if (!firebaseUid) {
        setError("Invalid user ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // First, get the user's role and basic info
        const userResponse = await axios.get(
          //`http://localhost:2038/api/auth/${firebaseUid}`,
          API_ENDPOINTS.GET_USER(firebaseUid)
        );
        const { role, user } = userResponse.data;

        setUserRole(role);
        setProfileData(user);
        setActiveTab("about");
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Profile not found");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [firebaseUid]);

  // Fetch verified organizers for organizations
  useEffect(() => {
    const fetchOrganizers = async () => {
      if (userRole !== "organization" || !profileData) return;
      
      setLoading(true);
      try {
        const res = await axios.get(
          //`http://localhost:2038/api/organizer/${profileData.id}/verified-organizers`,
          API_ENDPOINTS.VERIFIED_ORGANIZERS(profileData.id)
        );
        setOrganizers(res.data);
      } catch {
        setOrganizers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizers();
  }, [profileData, userRole]);

  // Check if current user is following the profile being viewed
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUser?.firebaseUid || !firebaseUid || currentUser.firebaseUid === firebaseUid) {
        setIsFollowing(false);
        return;
      }

      try {
        const response = await axios.get(
          //`http://localhost:2038/api/follow/${currentUser.firebaseUid}/is-following/${firebaseUid}`,
          API_ENDPOINTS.IS_FOLLOWING(currentUser.firebaseUid, firebaseUid)
        );
        setIsFollowing(response.data.isFollowing);
      } catch (error) {
        console.error("Error checking follow status:", error);
        setIsFollowing(false);
      }
    };

    checkFollowStatus();
  }, [currentUser?.firebaseUid, firebaseUid]);

  // Fetch organization data for organizers
  useEffect(() => {
    const fetchOrganizationData = async () => {
      if (userRole !== "organizer" || !profileData?.organizationId) {
        setOrganizationData(null);
        return;
      }

      try {
        const response = await axios.get(
          //`http://localhost:2038/api/organization/${profileData.organizationId}`,
          API_ENDPOINTS.ORGANIZATION_DETAILS(profileData.organizationId)
        );
        setOrganizationData(response.data);
      } catch (error) {
        console.error("Error fetching organization data:", error);
        setOrganizationData(null);
      }
    };

    fetchOrganizationData();
  }, [userRole, profileData?.organizationId]);

  // Fetch events for organizations and participants
  useEffect(() => {
    const fetchEvents = async () => {
      if (!profileData || !userRole) return;
      
      try {
                 if (userRole === "organization" || userRole === "organizer") {
           // For organizations and organizers, fetch events using eventIds
           if (profileData.eventIds && profileData.eventIds.length > 0) {
             const eventPromises = profileData.eventIds.map(eventId =>
               //axios.get(`http://localhost:2038/api/events/${eventId}`),
               axios.get(API_ENDPOINTS.GET_EVENT(eventId))
             );
             const eventResponses = await Promise.all(eventPromises);
             const fetchedEvents = eventResponses.map(response => response.data.event);
             setEvents(fetchedEvents);
           } else {
             setEvents([]);
           }
                 } else if (userRole === "participant") {
           // For participants, fetch events using registeredEventIds
           if (profileData.registeredEventIds && profileData.registeredEventIds.length > 0) {
             const eventPromises = profileData.registeredEventIds.map(eventId =>
               //axios.get(`http://localhost:2038/api/events/${eventId}`),
               axios.get(API_ENDPOINTS.GET_EVENT(eventId))
             );
             const eventResponses = await Promise.all(eventPromises);
             const fetchedEvents = eventResponses.map(response => response.data.event);
             setEvents(fetchedEvents);
           } else {
             setEvents([]);
           }
         }
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      }
    };
    
    fetchEvents();
  }, [profileData, userRole]);

  const handleToggleFollow = async () => {
    if (!currentUser?.firebaseUid) {
      toast.error("Please log in to follow users");
      return;
    }

    if (currentUser.firebaseUid === firebaseUid) {
      toast.error("You cannot follow yourself");
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow user
        await axios.delete(
          //`http://localhost:2038/api/follow/${currentUser.firebaseUid}/follow/${firebaseUid}`,
          API_ENDPOINTS.FOLLOW(currentUser.firebaseUid, firebaseUid)
        );
        setIsFollowing(false);
        toast.success("Unfollowed successfully");
      } else {
        // Follow user
        await axios.post(
          //`http://localhost:2038/api/follow/${currentUser.firebaseUid}/follow/${firebaseUid}`,
          API_ENDPOINTS.FOLLOW(currentUser.firebaseUid, firebaseUid)
        );
        setIsFollowing(true);
        toast.success("Followed successfully");
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      const errorMessage = error.response?.data || "Failed to follow/unfollow user";
      toast.error(errorMessage);
    }
  };

  const getRoleBadge = (role, isVerified, isSuperAdmin) => {
    if (role === "admin" && isSuperAdmin) {
      return (
        <span className="badge badge-warning gap-1">
          <FaCrown className="text-xs" />
          Super Admin
        </span>
      );
    } else if (role === "admin") {
      return <span className="badge badge-info gap-1">Admin</span>;
    } else if (role === "organization" && isVerified) {
      return (
        <span className="badge badge-success gap-1">
          <FaCheckCircle className="text-xs" />
          Verified Organization
        </span>
      );
    } else if (role === "organization") {
      return <span className="badge badge-warning gap-1">Organization</span>;
    } else if (role === "organizer" && isVerified) {
      return (
        <span className="badge badge-success gap-1">
          <FaCheckCircle className="text-xs" />
          Verified Organizer
        </span>
      );
    } else if (role === "organizer") {
      return <span className="badge badge-warning gap-1">Organizer</span>;
    } else if (role === "participant") {
      return <span className="badge badge-primary gap-1">Participant</span>;
    }
    return null;
  };

  const getRoleSpecificFields = () => {
    if (!profileData) return [];

    const fields = [
      { label: "Email", value: profileData.email, readonly: true },
      { label: "Name", value: profileData.name },
      { label: "Username", value: profileData.username },
    ];

    // Add role-specific fields
    if (userRole === "organization" || userRole === "organizer") {
      fields.push({ label: "Type", value: profileData.type });
    }

    if (userRole === "organization") {
      fields.push({
        label: "Events Created",
        value: profileData.eventIds?.length || 0,
      });
      fields.push({
        label: "Organizers",
        value: profileData.organizerIds?.length || 0,
      });
    }

    if (userRole === "organizer") {
      if (organizationData) {
        fields.push({ 
          label: "Organization", 
          value: organizationData.name,
          organization: organizationData 
        });
      } else {
        fields.push({ label: "Organization", value: "Loading..." });
      }
    }

    return fields;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-600">
          {error || "Profile not found"}
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-6">
      {/* Banner */}
      <div className="relative h-60 bg-gray-200 rounded-lg shadow-sm">
        <img
          src={
            profileData.bannerUrl ||
            "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1350&q=80"
          }
          alt="Cover"
          className="object-cover w-full h-full rounded-lg"
        />

        {/* Profile Picture */}
        <div className="absolute -bottom-14 left-6 z-50 flex items-end">
          <div className="relative w-28 h-28 border-4 border-white rounded-full overflow-hidden shadow-lg">
            <img
              src={
                profileData.profilePictureUrl ||
                "https://img.daisyui.com/images/profile/demo/2@94.webp"
              }
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src =
                  "https://img.daisyui.com/images/profile/demo/2@94.webp";
              }}
            />
            {profileData.isVerified && (
              <div className="absolute -top-1 -right-1 bg-green-400 rounded-full p-1">
                <FaCheckCircle className="text-green-600 text-sm" />
              </div>
            )}
            {userRole === "admin" && profileData.isSuperAdmin && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                <FaCrown className="text-yellow-600 text-sm" />
              </div>
            )}
          </div>
        </div>
      </div>

             {/* Name + Username + Follow */}
       <div className="pt-20 px-6 sm:px-10">
         <div className="flex flex-col md:flex-row justify-between items-start">
           <div className="flex-1">
             <div className="flex items-center gap-3 mb-2">
               <h2 className="text-3xl font-bold text-gray-800">
                 {profileData.name || profileData.username}
               </h2>
               {getRoleBadge(
                 userRole,
                 profileData.isVerified,
                 profileData.isSuperAdmin
               )}
             </div>
             <p className="text-gray-500 text-lg mb-4">
               @{profileData.username || "unknown"}
             </p>
             
             {/* Quick Stats */}
             <div className="flex flex-wrap gap-6 text-sm">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                 <span className="font-semibold text-gray-700">{profileData.followers?.length || 0}</span>
                 <span className="text-gray-500">Followers</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                 <span className="font-semibold text-gray-700">{profileData.following?.length || 0}</span>
                 <span className="text-gray-500">Following</span>
               </div>
               {userRole === "organization" && (
                 <>
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                     <span className="font-semibold text-gray-700">{profileData.eventIds?.length || 0}</span>
                     <span className="text-gray-500">Events</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                     <span className="font-semibold text-gray-700">{profileData.organizerIds?.length || 0}</span>
                     <span className="text-gray-500">Organizers</span>
                   </div>
                 </>
               )}
               {userRole === "participant" && (
                 <>
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                     <span className="font-semibold text-gray-700">{profileData.registeredEventIds?.length || 0}</span>
                     <span className="text-gray-500">Registered</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                     <span className="font-semibold text-gray-700">{profileData.bookmarkedEventIds?.length || 0}</span>
                     <span className="text-gray-500">Bookmarked</span>
                   </div>
                 </>
               )}
             </div>
           </div>
           <div className="flex gap-3 mt-4 md:mt-0">
             {currentUser?.firebaseUid !== firebaseUid && (
               <button
                 onClick={handleToggleFollow}
                 className={`btn btn-lg flex items-center gap-2 transition duration-200 ${
                   !isFollowing
                     ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
                     : "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700"
                 }`}
               >
                 {!isFollowing ? (
                   <CiHeart className="text-xl" />
                 ) : (
                   <FaHeart className="text-xl" />
                 )}
                 {isFollowing ? "Following" : "Follow"}
               </button>
             )}
           </div>
         </div>
       </div>

      <div className="border-b-2 border-gray-400 w-full my-4"></div>

             <div className="flex justify-center mt-8">
         <div className="bg-white rounded-2xl shadow-lg p-2 border border-gray-100">
           <div className="flex gap-2">
             {getTabsForRole(userRole).map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                   activeTab === tab.id
                     ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                     : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                 }`}
               >
                 {tab.label}
               </button>
             ))}
           </div>
         </div>
       </div>

             {/* About Tab */}
       {activeTab === "about" && (
         <div className="mt-6 space-y-6">
           {/* Basic Information Card */}
           <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                 </svg>
               </div>
               <h3 className="text-xl font-bold text-gray-800">Basic Information</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {getRoleSpecificFields().slice(0, 3).map((field, index) => (
                 <div key={index} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                     <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{field.label}</span>
                   </div>
                   <p className="text-gray-800 font-medium">{field.value || "Not provided"}</p>
                 </div>
               ))}
             </div>
           </div>

           {/* Role Specific Information Card */}
           {getRoleSpecificFields().length > 3 && (
             <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                   <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                   </svg>
                 </div>
                 <h3 className="text-xl font-bold text-gray-800">Role Information</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {getRoleSpecificFields().slice(3).map((field, index) => (
                   <div key={index} className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-100 hover:border-green-200 transition-all">
                     <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                       <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{field.label}</span>
                     </div>
                     {field.organization ? (
                       <div 
                         className="flex items-center gap-3 cursor-pointer hover:bg-green-100 p-2 rounded-lg transition-colors"
                         onClick={() => window.location.href = `/profile/${field.organization.firebaseUid}`}
                       >
                         <img
                           src={field.organization.profilePictureUrl || "https://img.daisyui.com/images/profile/demo/2@94.webp"}
                           alt={field.organization.name}
                           className="w-10 h-10 rounded-full object-cover border-2 border-green-200"
                           onError={(e) => {
                             e.target.src = "https://img.daisyui.com/images/profile/demo/2@94.webp";
                           }}
                         />
                         <div>
                           <p className="text-gray-800 font-medium">{field.value}</p>
                           <p className="text-sm text-gray-600">{field.organization.email}</p>
                         </div>
                         <div className="ml-auto">
                           <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                           </svg>
                         </div>
                       </div>
                     ) : (
                       <p className="text-gray-800 font-medium">{field.value || "Not provided"}</p>
                     )}
                   </div>
                 ))}
               </div>
             </div>
           )}
         </div>
       )}

             {/* Gallery Tab */}
       {activeTab === "gallery" && (
         <div className="mt-6">
           <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
             <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
               </div>
               <h3 className="text-xl font-bold text-gray-800">Gallery</h3>
             </div>
             {profileData.pictureUrls && profileData.pictureUrls.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {profileData.pictureUrls.map((url, index) => (
                   <div
                     key={index}
                     className="aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                   >
                     <img
                       src={url}
                       alt={`Gallery ${index + 1}`}
                       className="w-full h-full object-cover"
                       onError={(e) => {
                         e.target.src =
                           "https://via.placeholder.com/300x300?text=Image+Not+Found";
                       }}
                     />
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                 </div>
                 <p className="text-gray-500 text-lg font-medium">No gallery images yet</p>
                 <p className="text-gray-400 text-sm mt-1">Upload some photos to showcase your work</p>
               </div>
             )}
           </div>
         </div>
       )}

             {/* Events Tab */}
       {activeTab === "events" && (
         <div className="mt-6">
           <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
             <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
               </div>
               <h3 className="text-xl font-bold text-gray-800">
                 {userRole === "participant" ? "Registered Events" : "Organized Events"}
               </h3>
               <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                 {events.length} events
               </span>
             </div>
             
             <div className="flex gap-2 mb-6">
               <button
                 onClick={() => setEventFilter("running")}
                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                   eventFilter === "running"
                     ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                     : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                 }`}
               >
                 Running
               </button>
               <button
                 onClick={() => setEventFilter("past")}
                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                   eventFilter === "past"
                     ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                     : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                 }`}
               >
                 Past Events
               </button>
             </div>
             {events.length > 0 ? (
             <div className="space-y-4">
               {events
                 .filter(event => {
                   // For all user types, use isActive field for filtering
                   if (eventFilter === "running") {
                     return event.isActive === true;
                   } else {
                     return event.isActive === false;
                   }
                 })
                 .map((event, index) => (
                   <div
                     key={event.id || index}
                     className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                   >
                     <div className="flex">
                       {/* Event Banner */}
                       <div className="w-32 h-24 flex-shrink-0">
                         <img
                           src={event.coverImageUrl}
                           alt={event.title}
                           className="w-full h-full object-cover"
                         />
                       </div>
                       
                       {/* Event Details */}
                       <div className="flex-1 p-4 flex items-center justify-between">
                         <div className="flex-1">
                           <h4 className="font-bold text-lg text-gray-800 mb-2">
                             {event.title}
                           </h4>
                           <div className="flex items-center gap-4 text-sm text-gray-600">
                             <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                               event.eventType === "ONLINE" 
                                 ? "bg-blue-100 text-blue-800" 
                                 : "bg-green-100 text-green-800"
                             }`}>
                               {event.eventType === "ONLINE" ? "Online" : "On-site"}
                             </span>
                             <span className="flex items-center gap-1">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                               </svg>
                               {new Date(event.date).toLocaleDateString()}
                             </span>
                             {event.location && (
                               <span className="flex items-center gap-1">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                 </svg>
                                 {event.location}
                               </span>
                             )}
                           </div>
                         </div>
                         
                         {/* View Details Button */}
                         <div className="flex items-center gap-3">
                           <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                             event.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                           }`}>
                             {event.isActive ? "Running" : "Past"}
                           </span>
                           <button
                             onClick={() => window.location.href = `/event/${event.id}`}
                             className="btn btn-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700"
                           >
                             View Details
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
             </div>
           ) : (
             <div className="text-center py-12">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
               </div>
               <p className="text-gray-500 text-lg font-medium">
                 {userRole === "participant" 
                   ? "No registered events yet" 
                   : "No organized events yet"}
               </p>
               <p className="text-gray-400 text-sm mt-1">
                 {userRole === "participant" 
                   ? "Start exploring and registering for events" 
                   : "Create your first event to get started"}
               </p>
             </div>
           )}
            </div>
         </div>
        )}

       {/* Organizers Tab - Only for organizations */}
       {activeTab === "organizers" && userRole === "organization" && (
         <div className="mt-6">
           <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
             <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                 </svg>
               </div>
               <h3 className="text-xl font-bold text-gray-800">Verified Organizers</h3>
               <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                 {organizers.length} organizers
               </span>
             </div>
             
             {organizers.length === 0 ? (
               <div className="text-center py-12">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                   </svg>
                 </div>
                 <p className="text-gray-500 text-lg font-medium">No verified organizers found</p>
                 <p className="text-gray-400 text-sm mt-1">Only verified organizers are displayed here</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {organizers.map((org) => (
                   <div
                     key={org.id}
                     className="group p-4 border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:border-blue-200"
                     onClick={() => window.location.href = `/profile/${org.firebaseUid}`}
                     title={`View ${org.name}'s profile`}
                   >
                     <div className="flex items-center gap-4">
                       <div className="relative">
                         <img
                           src={org.profilePictureUrl}
                           alt={org.name}
                           className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                           onError={(e) => {
                             e.target.src =
                               "https://img.daisyui.com/images/profile/demo/2@94.webp";
                           }}
                         />
                         {org.isVerified && (
                           <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 shadow-sm">
                             <FaCheckCircle className="text-white text-xs" />
                           </div>
                         )}
                       </div>
                       <div className="flex-1">
                         <h3 className="font-bold text-gray-800">{org.name}</h3>
                         <p className="text-sm text-gray-500">@{org.username}</p>
                         {org.isVerified && (
                           <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mt-1">
                             <FaCheckCircle className="text-xs" />
                             Verified
                           </span>
                         )}
                       </div>
                       <div className="flex items-center group-hover:text-blue-600 transition-colors">
                         <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                         </svg>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
         </div>
       )}


    </div>
  );
};

export default PublicProfile;