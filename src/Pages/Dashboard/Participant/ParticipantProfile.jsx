import axios from 'axios';
import React, { useEffect, useContext, useState } from "react";
import AuthContext from "../../../Provider/AuthContext";
import { toast } from "react-hot-toast";
import { uploadToCloudinary } from "../../../utils/cloudinaryUpload";
import { FaCheckCircle, FaSearch, FaTimes, FaPlus } from "react-icons/fa";
import { debounce } from 'lodash';
import { API_ENDPOINTS } from "../../../config/api";

const ParticipantProfile = () => {
  const { user, userRole } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  // Skill search states
  const [skillSearchTerm, setSkillSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [showSkillSearch, setShowSkillSearch] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        //const response = await axios.get(`http://localhost:2038/api/auth/${userRole}/${user.firebaseUid}`);
        const response = await axios.get(API_ENDPOINTS.GET_USER_BY_ROLE(userRole, user.firebaseUid));
        setProfileData(response.data);
        setFormData(response.data);
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

  // Debounced skill search
  const searchSkills = debounce(async (searchTerm, page = 0) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setHasMoreResults(false);
      return;
    }

    setIsSearching(true);
    try {
      //const response = await axios.get(`http://localhost:2038/api/skills/search`, {
      const response = await axios.get(API_ENDPOINTS.SEARCH_SKILLS(searchTerm), {
        params: {
          name: searchTerm,
          page: page,
          size: 5
        }
      });
      
      const newResults = response.data.content || [];
      if (page === 0) {
        setSearchResults(newResults);
      } else {
        setSearchResults(prev => [...prev, ...newResults]);
      }
      
      setHasMoreResults(!response.data.last);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error searching skills:", error);
      toast.error("Failed to search skills");
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const handleSkillSearchChange = (e) => {
    const value = e.target.value;
    setSkillSearchTerm(value);
    setCurrentPage(0);
    searchSkills(value, 0);
  };

  const loadMoreSkills = () => {
    if (hasMoreResults && !isSearching) {
      searchSkills(skillSearchTerm, currentPage + 1);
    }
  };

  const addSkill = (skill) => {
    const currentSkills = formData.interestedSkills || [];
    if (!currentSkills.includes(skill.name)) {
      setFormData(prev => ({
        ...prev,
        interestedSkills: [...currentSkills, skill.name]
      }));
      toast.success(`Added ${skill.name} to your skills`);
    } else {
      toast.error(`${skill.name} is already in your skills list`);
    }
    setSkillSearchTerm("");
    setSearchResults([]);
    setShowSkillSearch(false);
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      interestedSkills: prev.interestedSkills.filter(skill => skill !== skillToRemove)
    }));
    toast.success(`Removed ${skillToRemove} from your skills`);
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
                <span className="font-semibold text-gray-700">{profileData.registeredEventIds?.length || 0}</span>
                <span className="text-gray-500">Registered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="font-semibold text-gray-700">{profileData.bookmarkedEventIds?.length || 0}</span>
                <span className="text-gray-500">Bookmarked</span>
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
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Email</span>
              </div>
              <p className="text-gray-800 font-medium">{profileData.email}</p>
            </div>

            {/* Name (editable) */}
            <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Name</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Enter your name"
                />
              ) : (
                <p className="text-gray-800 font-medium">{profileData.name || 'Not provided'}</p>
              )}
            </div>

            {/* Username (editable with validation) */}
            <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Username</span>
              </div>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username || ''}
                    onChange={handleUsernameChange}
                    className={`input input-bordered w-full ${usernameError ? 'input-error' : ''}`}
                    placeholder="Enter username"
                  />
                  {isCheckingUsername && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="loading loading-spinner loading-xs"></span>
                      <span className="text-sm text-gray-500">Checking username availability...</span>
                    </div>
                  )}
                  {usernameError && (
                    <p className="text-error text-sm mt-1">{usernameError}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-800 font-medium">{profileData.username || 'Not provided'}</p>
              )}
            </div>

            {/* Institution (editable) */}
            <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Institution</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  name="institution"
                  value={formData.institution || ''}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Enter your institution"
                />
              ) : (
                <p className="text-gray-800 font-medium">{profileData.institution || 'Not provided'}</p>
              )}
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="btn btn-lg bg-gradient-to-r from-green-500 to-teal-600 text-white border-0 hover:from-green-600 hover:to-teal-700"
                  disabled={!!usernameError || isCheckingUsername}
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Skills & Verification Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Skills & Verification</h3>
          </div>
          
          {/* Interested Skills */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-100 hover:border-green-200 transition-all mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Interested Skills</span>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowSkillSearch(!showSkillSearch)}
                  className="btn btn-sm bg-gradient-to-r from-green-500 to-teal-600 text-white border-0 hover:from-green-600 hover:to-teal-700"
                >
                  <FaPlus className="text-xs mr-1" />
                  Add Skill
                </button>
              )}
            </div>
            
            {/* Skill Search */}
            {isEditing && showSkillSearch && (
              <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={skillSearchTerm}
                    onChange={handleSkillSearchChange}
                    placeholder="Search for skills..."
                    className="input input-bordered w-full pl-10"
                  />
                </div>
                
                {/* Search Results */}
                {isSearching && (
                  <div className="flex items-center justify-center py-4">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="ml-2 text-sm text-gray-500">Searching...</span>
                  </div>
                )}
                
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{skill.name}</p>
                          {skill.description && (
                            <p className="text-sm text-gray-500">{skill.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="btn btn-xs bg-green-500 text-white border-0 hover:bg-green-600"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                    
                    {/* Load More Button */}
                    {hasMoreResults && (
                      <button
                        type="button"
                        onClick={loadMoreSkills}
                        disabled={isSearching}
                        className="btn btn-sm btn-outline w-full mt-2"
                      >
                        {isSearching ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </button>
                    )}
                  </div>
                )}
                
                {skillSearchTerm && !isSearching && searchResults.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No skills found matching "{skillSearchTerm}"</p>
                )}
              </div>
            )}
            
            {/* Selected Skills */}
            <div className="flex flex-wrap gap-2">
              {(formData.interestedSkills || []).map((skill, index) => (
                <div key={index} className="badge badge-outline bg-white border-green-300 text-green-700 hover:bg-green-50 flex items-center gap-1">
                  {skill}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-red-600 transition-colors"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  )}
                </div>
              ))}
              {(formData.interestedSkills || []).length === 0 && (
                <p className="text-gray-500 text-sm">No skills added yet</p>
              )}
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 hover:border-orange-200 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Verification Status</span>
            </div>
            <span className={`badge badge-lg ${profileData.isVerified ? 'badge-success' : 'badge-warning'}`}>
              {profileData.isVerified ? 'Verified' : 'Pending Verification'}
            </span>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Account Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 hover:border-orange-200 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Created At</span>
              </div>
              <p className="text-gray-800 font-medium">
                {profileData.createdAt
                  ? new Date(profileData.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : "Not available"}
              </p>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100 hover:border-orange-200 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Last Updated</span>
              </div>
              <p className="text-gray-800 font-medium">
                {profileData.updatedAt
                  ? new Date(profileData.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : "Not available"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantProfile;
