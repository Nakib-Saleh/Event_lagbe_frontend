// API Configuration
// Environment variable for backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:2038';

// Log the API URL in development
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: (userType) => `${API_BASE_URL}/api/auth/register/${userType}`,
  GET_USER: (firebaseUid) => `${API_BASE_URL}/api/auth/${firebaseUid}`,
  GET_USER_BY_ROLE: (role, firebaseUid) => `${API_BASE_URL}/api/auth/${role}/${firebaseUid}`,
  CHECK_USERNAME: (username) => `${API_BASE_URL}/api/auth/check-username/${username}`,
  UPDATE_USER: (role, firebaseUid) => `${API_BASE_URL}/api/auth/${role}/${firebaseUid}`,
  
  // Event endpoints
  EVENTS: `${API_BASE_URL}/api/events`,
  GET_EVENT: (eventId) => `${API_BASE_URL}/api/events/${eventId}`,
  UPDATE_EVENT: (eventId) => `${API_BASE_URL}/api/events/${eventId}`,
  DELETE_EVENT: (eventId) => `${API_BASE_URL}/api/events/${eventId}`,
  BOOKMARK_EVENT: (eventId) => `${API_BASE_URL}/api/events/${eventId}/bookmark`,
  GOING_EVENT: (eventId) => `${API_BASE_URL}/api/events/${eventId}/going`,
  USER_STATUS: (eventId, participantId) => `${API_BASE_URL}/api/events/${eventId}/user-status?participantId=${participantId}`,
  REGISTERED_PARTICIPANTS: (eventId) => `${API_BASE_URL}/api/events/${eventId}/registered-participants`,
  SEND_MAIL: (eventId) => `${API_BASE_URL}/api/events/${eventId}/send-mail`,
  USER_EVENTS: (firebaseUid) => `${API_BASE_URL}/api/events/user/${firebaseUid}`,
  
  // User endpoints
  PARTICIPANTS: `${API_BASE_URL}/api/participant`,
  ORGANIZERS: `${API_BASE_URL}/api/organizer`,
  ORGANIZATIONS: `${API_BASE_URL}/api/organization`,
  ADMIN_USERS: `${API_BASE_URL}/api/admin/users`,
  
  // Follow endpoints
  FOLLOW: (followerId, followedId) => `${API_BASE_URL}/api/follow/${followerId}/follow/${followedId}`,
  IS_FOLLOWING: (followerId, followedId) => `${API_BASE_URL}/api/follow/${followerId}/is-following/${followedId}`,
  
  // Skills endpoints
  SKILLS: `${API_BASE_URL}/api/skills`,
  SEARCH_SKILLS: (name) => `${API_BASE_URL}/api/skills/search?name=${encodeURIComponent(name)}&page=0&size=10`,
  
  // Admin endpoints
  TOGGLE_VERIFICATION: (userType, userId) => `${API_BASE_URL}/api/admin/users/${userType}/${userId}/toggle-verification`,
  UNVERIFIED_ORGANIZATIONS: `${API_BASE_URL}/api/organization/unverified`,
  UNVERIFIED_PARTICIPANTS: `${API_BASE_URL}/api/participant/unverified`,
  APPROVE_ORGANIZATION: (id) => `${API_BASE_URL}/api/organization/${id}/approve`,
  REJECT_ORGANIZATION: (id) => `${API_BASE_URL}/api/organization/${id}/reject`,
  APPROVE_PARTICIPANT: (id) => `${API_BASE_URL}/api/participant/${id}/approve`,
  REJECT_PARTICIPANT: (id) => `${API_BASE_URL}/api/participant/${id}/reject`,

  
  // Scheduled tasks
  DEACTIVATE_EXPIRED_EVENTS: `${API_BASE_URL}/api/scheduled-tasks/deactivate-expired-events`,
  
  // Participant specific
  REGISTERED_EVENTS: (firebaseUid) => `${API_BASE_URL}/api/participant/${firebaseUid}/registered-events`,
  BOOKMARKED_EVENTS: (firebaseUid) => `${API_BASE_URL}/api/participant/${firebaseUid}/bookmarked-events`,
  
  // Organizer specific
  VERIFIED_ORGANIZERS: (organizerId) => `${API_BASE_URL}/api/organizer/${organizerId}/verified-organizers`,
  UNVERIFIED_ORGANIZERS: (organizerId) => `${API_BASE_URL}/api/organizer/${organizerId}/unverified-organizers`,
  APPROVE_ORGANIZER: (id) => `${API_BASE_URL}/api/organizer/${id}/approve`,
  REJECT_ORGANIZER: (id) => `${API_BASE_URL}/api/organizer/${id}/reject`,
  ORGANIZATION_DETAILS: (orgId) => `${API_BASE_URL}/api/organization/${orgId}`,
};

export default API_BASE_URL;
