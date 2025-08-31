import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaCrown, FaBuilding, FaUser, FaUserTie } from 'react-icons/fa';
import { API_ENDPOINTS } from '../../../config/api';
import { useNavigate } from 'react-router-dom';

const UserList = () => {
  const [users, setUsers] = useState({
    admins: [],
    organizations: [],
    organizers: [],
    participants: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("organizations");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const TABS = [
    { id: "organizations", label: "Organizations", icon: FaBuilding, color: "blue" },
    { id: "organizers", label: "Organizers", icon: FaUserTie, color: "green" },
    { id: "participants", label: "Participants", icon: FaUser, color: "purple" },
    { id: "admins", label: "Admins", icon: FaCrown, color: "yellow" },
  ];

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      //const response = await axios.get(`http://localhost:2038/api/admin/users`);
      const response = await axios.get(API_ENDPOINTS.ADMIN_USERS);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerification = async (userType, userId) => {
    try {
      //await axios.put(`http://localhost:2038/api/admin/users/${userType}/${userId}/toggle-verification`);
              await axios.put(API_ENDPOINTS.TOGGLE_VERIFICATION(userType, userId));
      toast.success('Verification status updated successfully');
      
      // Update the local state
      setUsers(prevUsers => ({
        ...prevUsers,
        [userType]: prevUsers[userType].map(user => 
          user.id === userId ? { ...user, isVerified: !user.isVerified } : user
        )
      }));
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast.error('Failed to update verification status');
    }
  };

  const handleUserClick = (userType, user) => {
    // Navigate to public profile page
    navigate(`/profile/${user.firebaseUid}`);
  };

  const getFilteredUsers = () => {
    const currentUsers = users[activeTab] || [];
    if (!searchTerm) return currentUsers;
    
    return currentUsers.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getStatusColor = (isVerified) => {
    return isVerified ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isVerified) => {
    return isVerified ? FaCheckCircle : FaTimesCircle;
  };

  const getRoleBadge = (userType, user) => {
    const baseClasses = "badge badge-sm font-semibold";
    
    switch (userType) {
      case 'admins':
        return (
          <span className={`${baseClasses} badge-warning gap-1`}>
            <FaCrown className="text-xs" />
            {user.isSuperAdmin ? 'Super Admin' : 'Admin'}
          </span>
        );
      case 'organizations':
        return (
          <span className={`${baseClasses} badge-info gap-1`}>
            <FaBuilding className="text-xs" />
            Organization
          </span>
        );
      case 'organizers':
        return (
          <span className={`${baseClasses} badge-success gap-1`}>
            <FaUserTie className="text-xs" />
            Organizer
          </span>
        );
      case 'participants':
        return (
          <span className={`${baseClasses} badge-primary gap-1`}>
            <FaUser className="text-xs" />
            Participant
          </span>
        );
      default:
        return null;
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
        <p className="text-gray-600">Manage all users and their verification status</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-10"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-lg gap-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? `bg-${tab.color}-500 text-white border-${tab.color}-500`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                }`}
              >
                <IconComponent className="text-lg" />
                {tab.label}
                <span className="badge badge-sm bg-white text-gray-700">
                  {users[tab.id]?.length || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {getFilteredUsers().map((user) => {
          const StatusIcon = getStatusIcon(user.isVerified);
          
          return (
            <div
              key={user.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group flex flex-col h-full"
              onClick={() => handleUserClick(activeTab, user)}
            >
              {/* User Header */}
              <div className="p-6 pb-4 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all">
                      <img
                        src={user.profilePictureUrl || "https://img.daisyui.com/images/profile/demo/2@94.webp"}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://img.daisyui.com/images/profile/demo/2@94.webp";
                        }}
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-bold text-gray-800  group-hover:text-blue-600 transition-colors text-ellipsis">
                        {user.name || user.username || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-500 truncate text-ellipsis">@{user.username}</p>
                    </div>
                  </div>
                  <StatusIcon className={`text-xl ${getStatusColor(user.isVerified)}`} />
                </div>

                {/* Role Badge */}
                <div className="mb-3">
                  {getRoleBadge(activeTab, user)}
                </div>

                {/* Email */}
                <p className="text-sm text-gray-600 truncate mb-3">
                  {user.email}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {user.followers && (
                    <span>{user.followers.length} Followers</span>
                  )}
                  {user.following && (
                    <span>{user.following.length} Following</span>
                  )}
                  {user.eventIds && (
                    <span>{user.eventIds.length} Events</span>
                  )}
                  {user.registeredEventIds && (
                    <span>{user.registeredEventIds.length} Registered</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 pb-6 mt-auto">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVerification(activeTab, user.id);
                    }}
                    className={`btn btn-sm flex-1 gap-2 transition-all ${
                      user.isVerified
                        ? 'btn-error hover:bg-red-600'
                        : 'btn-success hover:bg-green-600'
                    }`}
                  >
                    {user.isVerified ? (
                      <>
                        <FaTimesCircle className="text-xs" />
                        Revoke Verification
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="text-xs" />
                        Verify User
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {getFilteredUsers().length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No users found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'No users in this category yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserList;