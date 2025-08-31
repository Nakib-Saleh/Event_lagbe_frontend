import React, { useState, useEffect, useMemo, useContext } from "react";
import { FiUsers, FiSearch, FiTrendingUp, FiPlus, FiCheckCircle, FiHeart, FiUser } from "react-icons/fi";
import { MdOutlineEmojiEvents, MdOutlineBusinessCenter } from "react-icons/md";
import AuthContext from "../Provider/AuthContext";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";

const Connect = () => {
  const { user, userRole } = useContext(AuthContext);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [activeTab, setActiveTab] = useState("participants");
  const [searchQuery, setSearchQuery] = useState("");
  const [participants, setParticipants] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // pagination state
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const fetchData = async () => {
      try {
        //const participantsResponse = await fetch(`http://localhost:2038/api/participant`);
        //const organizersResponse = await fetch(`http://localhost:2038/api/organizer`);
        //const organizationsResponse = await fetch(`http://localhost:2038/api/organization`);
        // Fetch participants from the correct endpoint
        const participantsResponse = await fetch(API_ENDPOINTS.PARTICIPANTS);
        const organizersResponse = await fetch(API_ENDPOINTS.ORGANIZERS);
        const organizationsResponse = await fetch(API_ENDPOINTS.ORGANIZATIONS);

        if (!participantsResponse.ok) throw new Error(`HTTP error! status: ${participantsResponse.status}`);
        if (!organizersResponse.ok) throw new Error(`HTTP error! status: ${organizersResponse.status}`);
        if (!organizationsResponse.ok) throw new Error(`HTTP error! status: ${organizationsResponse.status}`);

        const participantsData = await participantsResponse.json();
        const organizersData = await organizersResponse.json();
        const organizationsData = await organizationsResponse.json();

        setParticipants(Array.isArray(participantsData) ? participantsData : []);
        setOrganizers(Array.isArray(organizersData.content) ? organizersData.content : []);
        setOrganizations(Array.isArray(organizationsData.content) ? organizationsData.content : []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err);
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.firebaseUid]);

  // Check initial follow status using user.following from AuthContext
  useEffect(() => {
    if (!user?.following || !user?.firebaseUid) {
      setFollowedUsers(new Set());
      return;
    }

    try {
      const allUsers = [...participants, ...organizers, ...organizations];
      const followedUserIds = new Set();

      // Create a Set of Firebase UIDs that the current user is following
      const followingFirebaseUids = new Set(user.following);

      for (const userItem of allUsers) {
        if (userItem.firebaseUid && 
            userItem.firebaseUid !== user.firebaseUid && 
            followingFirebaseUids.has(userItem.firebaseUid)) {
          followedUserIds.add(userItem.id);
        }
      }

      setFollowedUsers(followedUserIds);
    } catch (error) {
      console.error("Error setting follow status:", error);
      setFollowedUsers(new Set());
    }
  }, [user?.following, user?.firebaseUid, participants, organizers, organizations]);

  const handleFollow = async (userId, firebaseUid) => {
    // Don't allow users to follow themselves
    if (firebaseUid === user?.firebaseUid) {
      return;
    }

    if (!user?.firebaseUid || !userRole) {
      toast.error("Please log in to follow users");
      return;
    }

    try {
      const isCurrentlyFollowing = followedUsers.has(userId);
      
      // Use the common follow endpoint
      //const apiEndpoint = API_ENDPOINTS.FOLLOW(user.firebaseUid, firebaseUid);
      const apiEndpoint = API_ENDPOINTS.FOLLOW(user.firebaseUid, firebaseUid);
      
      if (isCurrentlyFollowing) {
        // Unfollow user
        await axios.delete(apiEndpoint);
        setFollowedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast.success("Unfollowed successfully");
      } else {
        // Follow user
        await axios.post(apiEndpoint);
        setFollowedUsers(prev => {
          const newSet = new Set(prev);
          newSet.add(userId);
          return newSet;
        });
        toast.success("Followed successfully");
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      const errorMessage = error.response?.data || "Failed to follow/unfollow user";
      toast.error(errorMessage);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case "participants":
        return participants;
      case "organizers":
        return organizers;
      case "organizations":
        return organizations;
      default:
        return participants;
    }
  };

  // ---- Search helpers (live filtering) ----
  const normalize = (v) => (typeof v === "string" ? v.toLowerCase() : "");
  const tokens = useMemo(() => normalize(searchQuery).split(/\s+/).filter(Boolean), [searchQuery]);

  // Build a consolidated, tab-aware searchable string for each item
  const buildSearchHaystack = (item) => {
    // common possible fields across your payloads
    const name = item.name || item.fullName || item.displayName || "";
    const org = item.organization || item.organizationName || item.company || "";
    const email = item.email || "";
    const role = item.role || item.title || "";
    const location = item.location || item.city || item.country || "";
    const skills = Array.isArray(item.skills) ? item.skills.join(" ") : "";

    // You can append more fields if they exist in your API responses
    return normalize(
      [
        name,
        org,
        email,
        role,
        location,
        skills
      ].join(" ")
    );
  };

  // Live, memoized filtering
  const filteredData = useMemo(() => {
    const data = getCurrentData();
    if (tokens.length === 0) return data;

    return data.filter((item) => {
      const hay = buildSearchHaystack(item);
      // Require that every token appears somewhere (AND semantics)
      return tokens.every((t) => hay.includes(t));
    });
  }, [activeTab, participants, organizers, organizations, tokens]);

  const visibleData = useMemo(
    () => filteredData.slice(0, visibleCount),
    [filteredData, visibleCount]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Connect with people</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover amazing people, organizers, and organizations. Connect with participants, organizers, and organizations to expand your network.
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or organization"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(6); // reset pagination on new search
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {/* Button kept for UI parity; search is already live-on-type */}
            <button
              onClick={() => setVisibleCount(6)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FiSearch className="text-sm" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => { setActiveTab("participants"); setVisibleCount(6); }}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === "participants"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <FiUsers className="text-sm" />
            Participants ({participants.length})
          </div>
        </button>
        <button
          onClick={() => { setActiveTab("organizers"); setVisibleCount(6); }}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === "organizers"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <MdOutlineEmojiEvents className="text-sm" />
            Organizers ({organizers.length})
          </div>
        </button>
        <button
          onClick={() => { setActiveTab("organizations"); setVisibleCount(6); }}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === "organizations"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <MdOutlineBusinessCenter className="text-sm" />
            Organizations ({organizations.length})
          </div>
        </button>
      </div>

      {loading && <div className="text-center py-12 text-blue-600 text-xl">Loading...</div>}
      {error && <div className="text-center py-12 text-red-600 text-xl">Error: {error.message}</div>}

      {!loading && !error && visibleData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleData.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4">
                {/* Profile Picture */}
                <img
                  src={item.profilePictureUrl || "https://res.cloudinary.com/dfvwazcdk/image/upload/v1753161431/generalProfilePicture_inxppe.png"}
                  alt={item.name}
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                />

                {/* User/Org Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.name || item.fullName || item.displayName || item.organizationName || item.company}
                    </h3>
                    {item.role && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.role === 'Student'
                          ? 'bg-blue-100 text-blue-800'
                          : item.role === 'Organizer'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.role}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{item.followers?.length || 0} followers</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {Array.isArray(item.skills) && item.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {Array.isArray(item.skills) && item.skills.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        +{item.skills.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFollow(item.id, item.firebaseUid);
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                        followedUsers.has(item.id) || item.firebaseUid === user?.firebaseUid
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      disabled={item.firebaseUid === user?.firebaseUid}
                    >
                      {followedUsers.has(item.id) || item.firebaseUid === user?.firebaseUid ? (
                        <span className="flex items-center justify-center gap-1">
                          <FiCheckCircle className="text-xs" />
                          Following
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <FiPlus className="text-xs" />
                          Follow
                        </span>
                      )}
                    </button>

                    <Link
                      to={`/profile/${item.firebaseUid}`}
                      className="flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-1"
                    >
                      <FiUser className="text-xs" />
                      View Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Section */}
      {filteredData.length > visibleCount && (
        <div className="text-center mt-12">
          <button
            onClick={() => setVisibleCount(prev => prev + 6)}
            className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Load More Results
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredData.length === 0 && (
        <div className="text-center py-12">
          <FiSearch className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
};

export default Connect;
