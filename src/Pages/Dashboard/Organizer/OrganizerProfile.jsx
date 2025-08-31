import axios from 'axios';
import React, { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../../Provider/AuthContext";
import { toast } from "react-hot-toast";
import { uploadToCloudinary } from "../../../utils/cloudinaryUpload";
import { FaCheckCircle } from "react-icons/fa";
import { debounce } from 'lodash';
import { API_ENDPOINTS } from "../../../config/api";

const OrganizerProfile = () => {
  const { user, userRole } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [organizationData, setOrganizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const handleOrganizationClick = () => {
    if (organizationData?.firebaseUid) {
      navigate(`/profile/${organizationData.firebaseUid}`);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        //const response = await axios.get(`http://localhost:2038/api/auth/${userRole}/${user.firebaseUid}`);
        const response = await axios.get(API_ENDPOINTS.GET_USER_BY_ROLE(userRole, user.firebaseUid));
        setProfileData(response.data);
        setFormData(response.data);
        
        // Fetch organization data if organizationId exists
        if (response.data.organizationId) {
          try {
            //const orgResponse = await axios.get(`http://localhost:2038/api/organization/${response.data.organizationId}`);
            const orgResponse = await axios.get(API_ENDPOINTS.ORGANIZATION_DETAILS(response.data.organizationId));
            setOrganizationData(orgResponse.data);
          } catch (orgError) {
            console.error("Error fetching organization data:", orgError);
            // Don't show error toast for organization fetch failure
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to fetch profile data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.firebaseUid && userRole) {
      fetchProfile();
    }
  }, [user.firebaseUid, userRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear username error when user starts typing
    if (name === 'username') {
      setUsernameError("");
    }
  };

  // Debounced username check
  const checkUsernameAvailability = debounce(async (username) => {
    if (!username || username === profileData?.username) {
      setUsernameError("");
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    try {
      //const response = await axios.get(`http://localhost:2038/api/auth/check-username/${username}`);
      const response = await axios.get(API_ENDPOINTS.CHECK_USERNAME(username));
      if (response.data.exists) {
        setUsernameError("Username already taken");
      } else {
        setUsernameError("");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameError("Error checking username availability");
    } finally {
      setIsCheckingUsername(false);
    }
  }, 500);

  const handleUsernameChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      username: value
    }));
    setUsernameError("");
    checkUsernameAvailability(value);
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadToCloudinary(file);
      setFormData((prev) => ({
        ...prev,
        profilePictureUrl: res.secure_url,
      }));
      toast.success("Profile picture updated (not saved yet)");
    } catch {
      toast.error("Failed to upload profile picture");
    }
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadToCloudinary(file);
      setFormData((prev) => ({
        ...prev,
        bannerUrl: res.secure_url,
      }));
      toast.success("Banner updated (not saved yet)");
    } catch {
      toast.error("Failed to upload banner");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if there's a username error
    if (usernameError) {
      toast.error("Please fix the username error before saving");
      return;
    }

    try {
      //await axios.put(`http://localhost:2038/api/auth/${userRole}/${user.firebaseUid}`, formData);
              await axios.put(API_ENDPOINTS.UPDATE_USER(userRole, user.firebaseUid), formData);
      setProfileData(formData);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-600">Profile not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-6">
      {/* Banner */}
      <div className="relative h-60 bg-gray-200 rounded-lg shadow-sm">
        <img
          src={formData.bannerUrl || profileData.bannerUrl || "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1350&q=80"}
          alt="Cover"
          className="object-cover w-full h-full rounded-lg"
        />
        {isEditing && (
          <div className="absolute top-4 right-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="file-input file-input-bordered file-input-sm bg-white/80 backdrop-blur-sm"
            />
          </div>
        )}
        {/* Profile Picture */}
        <div className="absolute -bottom-14 left-6 z-50 flex items-end">
          <div className="relative w-28 h-28 border-4 border-white rounded-full overflow-hidden shadow-lg">
            <img
              src={formData.profilePictureUrl || profileData.profilePictureUrl || "https://img.daisyui.com/images/profile/demo/2@94.webp"}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://img.daisyui.com/images/profile/demo/2@94.webp";
              }}
            />
            {profileData.isVerified && (
              <div className="absolute -top-1 -right-1 bg-green-400 rounded-full p-1">
                <FaCheckCircle className="text-green-600 text-sm" />
              </div>
            )}
          </div>
          {isEditing && (
            <div className="ml-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="file-input file-input-bordered file-input-sm mt-2"
              />
            </div>
          )}
        </div>
      </div>

      {/* Name + Username + Edit */}
      <div className="pt-20 px-6 sm:px-10">
        <div className="flex flex-col md:flex-row justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-800">
                {profileData.name || profileData.username}
              </h2>
              {profileData.isVerified && (
                <span className="badge badge-success gap-1">
                  <FaCheckCircle className="text-xs" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-gray-500 text-lg mb-4">@{profileData.username || "unknown"}</p>
            
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
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="font-semibold text-gray-700">{profileData.eventIds?.length || 0}</span>
                <span className="text-gray-500">Events</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>
      </div>

      <div className="border-b-2 border-gray-400 w-full my-4"></div>
            
      {/* About Section */}
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
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Email</label>
              </div>
              <p className="text-gray-800 font-medium">{profileData.email}</p>
            </div>

            {/* Name */}
            <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Name</label>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="input input-bordered w-full bg-white"
                  placeholder="Enter your name"
                />
              ) : (
                <p className="text-gray-800 font-medium">{profileData.name || 'Not provided'}</p>
              )}
            </div>

            {/* Username */}
            <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Username</label>
              </div>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username || ''}
                    onChange={handleUsernameChange}
                    className={`input input-bordered w-full bg-white ${usernameError ? 'input-error' : ''}`}
                    placeholder="Enter username"
                  />
                  {isCheckingUsername && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="loading loading-spinner loading-xs"></span>
                      <span className="text-sm text-gray-500">Checking username availability...</span>
                    </div>
                  )}
                  {usernameError && (
                    <p className="text-error text-sm mt-2">{usernameError}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-800 font-medium">@{profileData.username || 'Not provided'}</p>
              )}
            </div>

            {/* Organization */}
            <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Organization</label>
              </div>
              {organizationData ? (
                <div 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={handleOrganizationClick}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all">
                    <img
                      src={organizationData.profilePictureUrl || "https://img.daisyui.com/images/profile/demo/2@94.webp"}
                      alt={organizationData.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://img.daisyui.com/images/profile/demo/2@94.webp";
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium group-hover:text-blue-600 transition-colors">
                      {organizationData.name}
                    </p>
                    <p className="text-sm text-gray-500">{organizationData.email}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ) : (
                <p className="text-gray-800 font-medium">{profileData.organizationId ? 'Loading organization...' : 'Not assigned'}</p>
              )}
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end pt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg bg-gradient-to-r from-blue-500 to-purple-600 border-0 hover:from-blue-600 hover:to-purple-700"
                  disabled={!!usernameError || isCheckingUsername}
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Verification & Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <FaCheckCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Verification & Status</h3>
          </div>
          
          <div className="space-y-4">
            {/* Verification Status */}
            <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Verification Status</label>
              </div>
              <span className={`badge ${profileData.isVerified ? 'badge-success' : 'badge-warning'} gap-1`}>
                <FaCheckCircle className="text-xs" />
                {profileData.isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>

            {/* Member Since */}
            <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Member Since</label>
              </div>
              <p className="text-gray-800 font-medium">
                {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Unknown'}
              </p>
            </div>

            {/* Last Updated */}
            <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
              </div>
              <p className="text-gray-800 font-medium">
                {profileData.updatedAt ? new Date(profileData.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerProfile;
