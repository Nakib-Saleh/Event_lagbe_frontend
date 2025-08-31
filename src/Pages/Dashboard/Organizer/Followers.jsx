import React, { useEffect, useContext, useState } from "react";
import axios from "axios";
import AuthContext from "../../../Provider/AuthContext";
import { toast } from "react-hot-toast";
import { FiUserPlus, FiUser, FiMapPin } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { API_ENDPOINTS } from "../../../config/api";

const Followers = () => {
  const { user } = useContext(AuthContext);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        setLoading(true);
        
        // If user.followers is available, use it directly
        if (user?.followers && user.followers.length > 0) {
          // Fetch detailed user data for each follower
          const followersData = await Promise.all(
            user.followers.map(async (followerFirebaseUid) => {
              try {
                // Try to find user in different endpoints
                const [participantRes, organizerRes, organizationRes] = await Promise.allSettled([
                  //axios.get(`http://localhost:2038/api/auth/participant/${followerFirebaseUid}`),
                  //axios.get(`http://localhost:2038/api/auth/organizer/${followerFirebaseUid}`),
                  //axios.get(`http://localhost:2038/api/auth/organization/${followerFirebaseUid}`)
                  axios.get(API_ENDPOINTS.GET_USER_BY_ROLE('participant', followerFirebaseUid)),
                  axios.get(API_ENDPOINTS.GET_USER_BY_ROLE('organizer', followerFirebaseUid)),
                  axios.get(API_ENDPOINTS.GET_USER_BY_ROLE('organization', followerFirebaseUid))
                ]);

                if (participantRes.status === 'fulfilled') return participantRes.value.data;
                if (organizerRes.status === 'fulfilled') return organizerRes.value.data;
                if (organizationRes.status === 'fulfilled') return organizationRes.value.data;
                
                return null;
              } catch (error) {
                console.error(`Error fetching follower ${followerFirebaseUid}:`, error);
                return null;
              }
            })
          );

          setFollowers(followersData.filter(follower => follower !== null));
        } else {
          setFollowers([]);
        }
      } catch (error) {
        console.error("Error fetching followers:", error);
        toast.error("Failed to fetch followers");
      } finally {
        setLoading(false);
      }
    };

    if (user?.firebaseUid) {
      fetchFollowers();
    }
  }, [user?.firebaseUid, user?.followers]);

  const handleRemoveFollower = async (followerFirebaseUid) => {
    try {
      // Use the new common follow API to unfollow the follower
      //await axios.delete(`http://localhost:2038/api/follow/${followerFirebaseUid}/follow/${user.firebaseUid}`);
      await axios.delete(API_ENDPOINTS.FOLLOW(followerFirebaseUid, user.firebaseUid));
      
      // Update local state
      setFollowers(prev => prev.filter(follower => follower.firebaseUid !== followerFirebaseUid));
      toast.success("Follower removed successfully");
    } catch (error) {
      console.error("Error removing follower:", error);
      toast.error("Failed to remove follower");
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <FiUserPlus className="text-2xl text-red-600" />
          <h2 className="text-2xl font-bold text-gray-800">Followers</h2>
          <span className="badge badge-primary">{followers.length}</span>
        </div>

        {followers.length === 0 ? (
          <div className="text-center py-12">
            <FiUserPlus className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Followers Yet</h3>
            <p className="text-gray-500 mb-4">
              You don't have any followers yet. Start creating events and connecting with other users to gain followers!
            </p>
            <button 
              onClick={() => window.location.href = '/add-event'}
              className="btn btn-primary"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {followers.map((follower) => (
              <div key={follower.firebaseUid} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={follower.profilePictureUrl || "https://img.daisyui.com/images/profile/demo/2@94.webp"}
                        alt={follower.name || follower.fullName || follower.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://img.daisyui.com/images/profile/demo/2@94.webp";
                        }}
                      />
                      {follower.isVerified && (
                        <div className="absolute -top-1 -right-1 bg-green-400 rounded-full p-1">
                          <FaCheckCircle className="text-green-600 text-xs" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{follower.name || follower.fullName || follower.displayName}</h3>
                      <p className="text-sm text-gray-500">@{follower.username}</p>
                      {(follower.institution || follower.organization || follower.location) && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <FiMapPin className="text-xs" />
                          <span>{follower.institution || follower.organization || follower.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFollower(follower.firebaseUid)}
                    className="btn btn-sm btn-outline btn-error"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="flex gap-4 text-xs text-gray-500 mb-3">
                  <span>{follower.followers?.length || 0} Followers</span>
                  <span>{follower.following?.length || 0} Following</span>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => window.location.href = `/profile/${follower.firebaseUid}`}
                    className="btn btn-sm btn-outline btn-primary w-full"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Followers;
