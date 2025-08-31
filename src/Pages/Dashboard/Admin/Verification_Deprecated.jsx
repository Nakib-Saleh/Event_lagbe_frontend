import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { API_ENDPOINTS } from "../../../config/api";

const Verification = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [activeTab, setActiveTab] = useState("Organization");
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [showApproveParticipantModal, setShowApproveParticipantModal] = useState(false);
  const [showRejectParticipantModal, setShowRejectParticipantModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showBulkApproveParticipantModal, setShowBulkApproveParticipantModal] = useState(false);
  const [showBulkRejectParticipantModal, setShowBulkRejectParticipantModal] = useState(false);
  const [showIdDocsModal, setShowIdDocsModal] = useState(false);
  const [idDocsUrls, setIdDocsUrls] = useState([]);
  const [idDocsParticipant, setIdDocsParticipant] = useState(null);

  const tabs = [
    { id: "Organization", label: "Organization Verification" },
    { id: "Participants", label: "Participants Verification" },
  ];

  // Fetch unverified organizations
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.UNVERIFIED_ORGANIZATIONS);
      setOrganizations(response.data);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  };

  // Fetch unverified participants
  const fetchParticipants = async () => {
    try {
      setParticipantsLoading(true);
      const response = await axios.get(API_ENDPOINTS.UNVERIFIED_PARTICIPANTS);
      setParticipants(response.data);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to fetch participants");
    } finally {
      setParticipantsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Organization") {
      fetchOrganizations();
      setSelectedParticipants([]);
    } else if (activeTab === "Participants") {
      fetchParticipants();
      setSelectedOrganizations([]);
    }
  }, [activeTab]);

  // Show approve confirmation modal
  const showApproveConfirmation = (organization) => {
    setSelectedOrganization(organization);
    setShowApproveModal(true);
  };

  // Show reject confirmation modal
  const showRejectConfirmation = (organization) => {
    setSelectedOrganization(organization);
    setShowRejectModal(true);
  };

  // Handle approve organization
  const handleApprove = async () => {
    try {
      await axios.put(API_ENDPOINTS.APPROVE_ORGANIZATION(selectedOrganization.id));
      toast.success("Organization approved successfully");
      setShowApproveModal(false);
      setSelectedOrganization(null);
      fetchOrganizations(); // Refresh the list
    } catch (error) {
      console.error("Error approving organization:", error);
      toast.error("Failed to approve organization");
    }
  };

  // Handle reject organization
  const handleReject = async () => {
    try {
      await axios.delete(API_ENDPOINTS.REJECT_ORGANIZATION(selectedOrganization.id));
      toast.success("Organization rejected successfully");
      setShowRejectModal(false);
      setSelectedOrganization(null);
      fetchOrganizations(); // Refresh the list
    } catch (error) {
      console.error("Error rejecting organization:", error);
      toast.error("Failed to reject organization");
    }
  };

  // Show bulk approve confirmation modal
  const showBulkApproveConfirmation = () => {
    if (selectedOrganizations.length === 0) {
      toast.error("Please select organizations to approve");
      return;
    }
    setShowBulkApproveModal(true);
  };

  // Show bulk reject confirmation modal
  const showBulkRejectConfirmation = () => {
    if (selectedOrganizations.length === 0) {
      toast.error("Please select organizations to reject");
      return;
    }
    setShowBulkRejectModal(true);
  };

  // Handle bulk approve organizations
  const handleBulkApprove = async () => {
    try {
      const promises = selectedOrganizations.map(id => 
        axios.put(API_ENDPOINTS.APPROVE_ORGANIZATION(id))
      );
      await Promise.all(promises);
      toast.success(`${selectedOrganizations.length} organizations approved successfully`);
      setShowBulkApproveModal(false);
      setSelectedOrganizations([]);
      fetchOrganizations(); // Refresh the list
    } catch (error) {
      console.error("Error approving organizations:", error);
      toast.error("Failed to approve some organizations");
    }
  };

  // Handle bulk reject organizations
  const handleBulkReject = async () => {
    try {
      const promises = selectedOrganizations.map(id => 
        axios.delete(API_ENDPOINTS.REJECT_ORGANIZATION(id))
      );
      await Promise.all(promises);
      toast.success(`${selectedOrganizations.length} organizations rejected successfully`);
      setShowBulkRejectModal(false);
      setSelectedOrganizations([]);
      fetchOrganizations(); // Refresh the list
    } catch (error) {
      console.error("Error rejecting organizations:", error);
      toast.error("Failed to reject some organizations");
    }
  };

  // Handle select all
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrganizations(organizations.map(org => org.id));
    } else {
      setSelectedOrganizations([]);
    }
  };

  // Handle select individual organization
  const handleSelectOrganization = (id) => {
    if (selectedOrganizations.includes(id)) {
      setSelectedOrganizations(selectedOrganizations.filter(orgId => orgId !== id));
    } else {
      setSelectedOrganizations([...selectedOrganizations, id]);
    }
  };

  // Handle select all for participants
  const handleSelectAllParticipants = (e) => {
    if (e.target.checked) {
      setSelectedParticipants(participants.map(p => p.id));
    } else {
      setSelectedParticipants([]);
    }
  };
  // Handle select individual participant
  const handleSelectParticipant = (id) => {
    if (selectedParticipants.includes(id)) {
      setSelectedParticipants(selectedParticipants.filter(pid => pid !== id));
    } else {
      setSelectedParticipants([...selectedParticipants, id]);
    }
  };

  // Approve/reject handlers for participants
  const showApproveParticipantConfirmation = (participant) => {
    setSelectedParticipant(participant);
    setShowApproveParticipantModal(true);
  };
  const showRejectParticipantConfirmation = (participant) => {
    setSelectedParticipant(participant);
    setShowRejectParticipantModal(true);
  };
  const handleApproveParticipant = async () => {
    try {
      await axios.put(API_ENDPOINTS.APPROVE_PARTICIPANT(selectedParticipant.id));
      toast.success("Participant approved successfully");
      setShowApproveParticipantModal(false);
      setSelectedParticipant(null);
      fetchParticipants();
    } catch (error) {
      console.error("Error approving participant:", error);
      toast.error("Failed to approve participant");
    }
  };
  const handleRejectParticipant = async () => {
    try {
      await axios.delete(API_ENDPOINTS.REJECT_PARTICIPANT(selectedParticipant.id));
      toast.success("Participant rejected successfully");
      setShowRejectParticipantModal(false);
      setSelectedParticipant(null);
      fetchParticipants();
    } catch (error) {
      console.error("Error rejecting participant:", error);
      toast.error("Failed to reject participant");
    }
  };
  const showBulkApproveParticipantConfirmation = () => {
    if (selectedParticipants.length === 0) {
      toast.error("Please select participants to approve");
      return;
    }
    setShowBulkApproveParticipantModal(true);
  };
  const showBulkRejectParticipantConfirmation = () => {
    if (selectedParticipants.length === 0) {
      toast.error("Please select participants to reject");
      return;
    }
    setShowBulkRejectParticipantModal(true);
  };
  const handleBulkApproveParticipants = async () => {
    try {
      const promises = selectedParticipants.map(id =>
        axios.put(API_ENDPOINTS.APPROVE_PARTICIPANT(id))
      );
      await Promise.all(promises);
      toast.success(`${selectedParticipants.length} participants approved successfully`);
      setShowBulkApproveParticipantModal(false);
      setSelectedParticipants([]);
      fetchParticipants();
    } catch (error) {
      console.error("Error approving participants:", error);
      toast.error("Failed to approve some participants");
    }
  };
  const handleBulkRejectParticipants = async () => {
    try {
      const promises = selectedParticipants.map(id =>
        axios.delete(API_ENDPOINTS.REJECT_PARTICIPANT(id))
      );
      await Promise.all(promises);
      toast.success(`${selectedParticipants.length} participants rejected successfully`);
      setShowBulkRejectParticipantModal(false);
      setSelectedParticipants([]);
      fetchParticipants();
    } catch (error) {
      console.error("Error rejecting participants:", error);
      toast.error("Failed to reject some participants");
    }
  };

  const handleShowIdDocs = (participant) => {
    setIdDocsUrls(participant.idDocumentUrls || []);
    setIdDocsParticipant(participant);
    setShowIdDocsModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div role="tablist" className="tabs tabs-boxed gap-x-2">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`tab ${activeTab === tab.id ? "tab-active" : ""} text-center font-bold px-2 py-2 rounded-xl border-2 border-black transition 
            ${activeTab === tab.id ? "bg-red-500 text-white" : "bg-blue-200 text-black"}`}
        >
          {tab.label}
        </div>
      ))}
    </div>
      <div className="flex flex-col justify-center py-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">{activeTab} Verification</h1>
      
      {/* Bulk Action Buttons */}
      {activeTab === "Organization" && selectedOrganizations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-800">
                {selectedOrganizations.length} organization(s) selected
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                className="btn btn-success btn-sm"
                onClick={showBulkApproveConfirmation}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve Selected
              </button>
              <button 
                className="btn btn-error btn-sm"
                onClick={showBulkRejectConfirmation}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject Selected
              </button>
            </div>
          </div>
        </div>
      )}
      {activeTab === "Participants" && selectedParticipants.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-800">
                {selectedParticipants.length} participant(s) selected
              </span>
            </div>
            <div className="flex gap-2">
              <button 
                className="btn btn-success btn-sm"
                onClick={showBulkApproveParticipantConfirmation}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve Selected
              </button>
              <button 
                className="btn btn-error btn-sm"
                onClick={showBulkRejectParticipantConfirmation}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject Selected
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg p-4 overflow-x-auto overflow-y-auto max-h-[calc(100vh-130px)]">
        {activeTab === "Organization" ? (
          loading ? (
            <div className="flex justify-center items-center h-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <table className="table">
              {/* head */}
              <thead>
                <tr>
                  <th>
                    <label>
                      <input 
                        type="checkbox" 
                        className="checkbox" 
                        checked={selectedOrganizations.length === organizations.length && organizations.length > 0}
                        onChange={handleSelectAll}
                      />
                    </label>
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No unverified organizations found
                    </td>
                  </tr>
                ) : (
                  organizations.map((organization) => (
                    <tr key={organization.id}>
                      <th>
                        <label>
                          <input 
                            type="checkbox" 
                            className="checkbox" 
                            checked={selectedOrganizations.includes(organization.id)}
                            onChange={() => handleSelectOrganization(organization.id)}
                          />
                        </label>
                      </th>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="mask mask-squircle h-12 w-12">
                              <img
                                src={organization.logoUrl || "https://img.daisyui.com/images/profile/demo/2@94.webp"}
                                alt={`${organization.name} logo`}
                                onError={(e) => {
                                  e.target.src = "https://img.daisyui.com/images/profile/demo/2@94.webp";
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{organization.name}</div>
                            <div className="text-sm opacity-50">@{organization.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>{organization.email}</td>
                      <td>{formatDate(organization.createdAt)}</td>
                      <th>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-success btn-xs"
                            onClick={() => showApproveConfirmation(organization)}
                          >
                            Approve
                          </button>
                          <button 
                            className="btn btn-error btn-xs"
                            onClick={() => showRejectConfirmation(organization)}
                          >
                            Reject
                          </button>
                        </div>
                      </th>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )
        ) : (
          participantsLoading ? (
            <div className="flex justify-center items-center h-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <label>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedParticipants.length === participants.length && participants.length > 0}
                        onChange={handleSelectAllParticipants}
                      />
                    </label>
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No unverified participants found
                    </td>
                  </tr>
                ) : (
                  participants.map((participant) => (
                    <tr key={participant.id}>
                      <th>
                        <label>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedParticipants.includes(participant.id)}
                            onChange={() => handleSelectParticipant(participant.id)}
                          />
                        </label>
                      </th>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="mask mask-squircle h-12 w-12">
                              <img
                                src={participant.avatarUrl || "https://img.daisyui.com/images/profile/demo/2@94.webp"}
                                alt={`${participant.name} avatar`}
                                onError={(e) => {
                                  e.target.src = "https://img.daisyui.com/images/profile/demo/2@94.webp";
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{participant.name}</div>
                            <div className="text-sm opacity-50">@{participant.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>{participant.email}</td>
                      <td>{formatDate(participant.createdAt)}</td>
                      <th>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-info btn-xs"
                            onClick={() => handleShowIdDocs(participant)}
                          >
                            View ID Documents
                          </button>
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => showApproveParticipantConfirmation(participant)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-error btn-xs"
                            onClick={() => showRejectParticipantConfirmation(participant)}
                          >
                            Reject
                          </button>
                        </div>
                      </th>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-green-600">Confirm Approval</h3>
            <p className="py-4">
              Are you sure you want to approve <strong>{selectedOrganization?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This will allow the organization to access the platform and create events.
            </p>
            <div className="modal-action">
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedOrganization(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-success"
                onClick={handleApprove}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-red-600">Confirm Rejection</h3>
            <p className="py-4">
              Are you sure you want to reject <strong>{selectedOrganization?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This action will permanently delete the organization and their Firebase account. This action cannot be undone.
            </p>
            <div className="modal-action">
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedOrganization(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error"
                onClick={handleReject}
              >
                Reject & Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Approve Confirmation Modal */}
      {showBulkApproveModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-green-600">Confirm Bulk Approval</h3>
            <p className="py-4">
              Are you sure you want to approve <strong>{selectedOrganizations.length} organization(s)</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This will allow all selected organizations to access the platform and create events.
            </p>
            <div className="modal-action">
              <button 
                className="btn btn-outline"
                onClick={() => setShowBulkApproveModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-success"
                onClick={handleBulkApprove}
              >
                Approve All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Reject Confirmation Modal */}
      {showBulkRejectModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-red-600">Confirm Bulk Rejection</h3>
            <p className="py-4">
              Are you sure you want to reject <strong>{selectedOrganizations.length} organization(s)</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This action will permanently delete all selected organizations and their Firebase accounts. This action cannot be undone.
            </p>
            <div className="modal-action">
              <button 
                className="btn btn-outline"
                onClick={() => setShowBulkRejectModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error"
                onClick={handleBulkReject}
              >
                Reject & Delete All
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Approve Participant Confirmation Modal */}
      {showApproveParticipantModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-green-600">Confirm Approval</h3>
            <p className="py-4">
              Are you sure you want to approve <strong>{selectedParticipant?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This will allow the participant to access the platform and join events.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowApproveParticipantModal(false);
                  setSelectedParticipant(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleApproveParticipant}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reject Participant Confirmation Modal */}
      {showRejectParticipantModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-red-600">Confirm Rejection</h3>
            <p className="py-4">
              Are you sure you want to reject <strong>{selectedParticipant?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This action will permanently delete the participant and their Firebase account. This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowRejectParticipantModal(false);
                  setSelectedParticipant(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleRejectParticipant}
              >
                Reject & Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Approve Participant Confirmation Modal */}
      {showBulkApproveParticipantModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-green-600">Confirm Bulk Approval</h3>
            <p className="py-4">
              Are you sure you want to approve <strong>{selectedParticipants.length} participant(s)</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This will allow all selected participants to access the platform and join events.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setShowBulkApproveParticipantModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleBulkApproveParticipants}
              >
                Approve All
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Reject Participant Confirmation Modal */}
      {showBulkRejectParticipantModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-red-600">Confirm Bulk Rejection</h3>
            <p className="py-4">
              Are you sure you want to reject <strong>{selectedParticipants.length} participant(s)</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              This action will permanently delete all selected participants and their Firebase accounts. This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setShowBulkRejectParticipantModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleBulkRejectParticipants}
              >
                Reject & Delete All
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ID Documents Modal */}
      {showIdDocsModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-2">
              ID Documents for {idDocsParticipant?.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {idDocsUrls.length === 0 ? (
                <div className="text-gray-500">No documents uploaded.</div>
              ) : (
                idDocsUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`ID Document ${idx + 1}`}
                    className="w-full h-48 object-contain border rounded"
                  />
                ))
              )}
            </div>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setShowIdDocsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Verification;
