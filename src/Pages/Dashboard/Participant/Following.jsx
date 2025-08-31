import React, { useEffect, useContext, useState } from "react";
import axios from "axios";
import AuthContext from "../../../Provider/AuthContext";
import { toast } from "react-hot-toast";
import { FiUserCheck, FiUser, FiMapPin } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { API_ENDPOINTS } from "../../../config/api";

const Following = () => {
  const { user } = useContext(AuthContext);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        setLoading(true);
        
        // If user.following is available, use it directly
        if (user?.following && user.following.length > 0) {
          // Fetch detailed user data for each followed user
          const followingData = await Promise.all(
            user.following.map(async (followedFirebaseUid) => {
              try {
                // Try to find user in different endpoints
                const [participantRes, organizerRes, organizationRes] = await Promise.allSettled([
                  //axios.get(`http://localhost:2038/api/auth/participant/${followedFirebaseUid}`),
                  //axios.get(`http://localhost:2038/api/auth/organizer/${followedFirebaseUid}`),
                  //axios.get(`http://localhost:2038/api/auth/organization/${followedFirebaseUid}`)
                  axios.get(API_ENDPOINTS.GET_USER_BY_ROLE('participant', followedFirebaseUid)),
                  axios.get(API_ENDPOINTS.GET_USER_BY_ROLE('organizer', followedFirebaseUid)),
                  axios.get(API_ENDPOINTS.GET_USER_BY_ROLE('organization', followedFirebaseUid))
                ]);

                if (participantRes.status === 'fulfilled') return participantRes.value.data;
                if (organizerRes.status === 'fulfilled') return organizerRes.value.data;
                if (organizationRes.status === 'fulfilled') return organizationRes.value.data;
                
                return null;
              } catch (error) {
                console.error(`Error fetching followed user ${followedFirebaseUid}:`, error);
                return null;
              }
            })
          );

          setFollowing(followingData.filter(followedUser => followedUser !== null));
        } else {
          setFollowing([]);
        }
      } catch (error) {
        console.error("Error fetching following:", error);
        toast.error("Failed to fetch following");
      } finally {
        setLoading(false);
      }
    };

    if (user?.firebaseUid) {
      fetchFollowing();
    }
  }, [user?.firebaseUid, user?.following]);

  const handleUnfollow = async (followedFirebaseUid) => {
    try {
      // Use the new common follow API to unfollow
      await axios.delete(API_ENDPOINTS.FOLLOW(user.firebaseUid, followedFirebaseUid));
      
      // Update local state
      setFollowing(prev => prev.filter(followedUser => followedUser.firebaseUid !== followedFirebaseUid));
      toast.success("Unfollowed successfully");
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
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
          <FiUserCheck className="text-2xl text-red-600" />
          <h2 className="text-2xl font-bold text-gray-800">Following</h2>
          <span className="badge badge-primary">{following.length}</span>
        </div>

        {following.length === 0 ? (
          <div className="text-center py-12">
            <FiUserCheck className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Not Following Anyone</h3>
            <p className="text-gray-500 mb-4">
              You're not following anyone yet. Start connecting with other users and organizations to see their updates!
            </p>
            <button 
              onClick={() => window.location.href = '/connect'}
              className="btn btn-primary"
            >
              Connect with Others
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {following.map((followedUser) => (
              <div key={followedUser.firebaseUid} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={followedUser.profilePictureUrl || "https://img.daisyui.com/images/profile/demo/2@94.webp"}
                        alt={followedUser.name || followedUser.fullName || followedUser.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://img.daisyui.com/images/profile/demo/2@94.webp";
                        }}
                      />
                      {followedUser.isVerified && (
                        <div className="absolute -top-1 -right-1 bg-green-400 rounded-full p-1">
                          <FaCheckCircle className="text-green-600 text-xs" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{followedUser.name || followedUser.fullName || followedUser.displayName}</h3>
                      <p className="text-sm text-gray-500">@{followedUser.username}</p>
                      {(followedUser.institution || followedUser.organization || followedUser.location) && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <FiMapPin className="text-xs" />
                          <span>{followedUser.institution || followedUser.organization || followedUser.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnfollow(followedUser.firebaseUid)}
                    className="btn btn-sm btn-outline btn-error"
                  >
                    Unfollow
                  </button>
                </div>
                
                <div className="flex gap-4 text-xs text-gray-500 mb-3">
                  <span>{followedUser.followers?.length || 0} Followers</span>
                  <span>{followedUser.following?.length || 0} Following</span>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => window.location.href = `/profile/${followedUser.firebaseUid}`}
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

export default Following;
