import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { API_ENDPOINTS } from "../../../config/api";

const ENTITY_CONFIG = {
  Organization: {
    label: "Organization Verification",
    api: {
      //      fetch: "http://localhost:2038/api/organization/unverified",
      //approve: id => `http://localhost:2038/api/organization/${id}/approve`,
      //reject: id => `http://localhost:2038/api/organization/${id}/reject`,
      fetch: API_ENDPOINTS.UNVERIFIED_ORGANIZATIONS,
      approve: id => API_ENDPOINTS.APPROVE_ORGANIZATION(id),
      reject: id => API_ENDPOINTS.REJECT_ORGANIZATION(id),
    },
    avatar: org => org.profilePictureUrl || "https://img.daisyui.com/images/profile/demo/2@94.webp",
    name: org => org.name,
    username: org => org.username,
    extra: null,
    type: "organization",
  },
  Participants: {
    label: "Participants Verification",
    api: {
      //fetch: "http://localhost:2038/api/participant/unverified",
      //approve: id => `http://localhost:2038/api/participant/${id}/approve`,
      //reject: id => `http://localhost:2038/api/participant/${id}/reject`,
      fetch: API_ENDPOINTS.UNVERIFIED_PARTICIPANTS,
      approve: id => API_ENDPOINTS.APPROVE_PARTICIPANT(id),
      reject: id => API_ENDPOINTS.REJECT_PARTICIPANT(id),
    },
    avatar: p => p.profilePictureUrl || "https://img.daisyui.com/images/profile/demo/2@94.webp",
    name: p => p.name,
    username: p => p.username,
    extra: p => p.idDocumentUrls,
    type: "participant",
  },
};

const TABS = [
  { id: "Organization", label: "Organization Verification" },
  { id: "Participants", label: "Participants Verification" },
];

const ConfirmationModal = ({ show, onClose, onConfirm, title, message, confirmText, cancelText }) =>
  show ? (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4">{message}</p>
        <div className="modal-action">
          <button className="btn btn-outline" onClick={onClose}>{cancelText || "Cancel"}</button>
          <button className="btn btn-success" onClick={onConfirm}>{confirmText || "Confirm"}</button>
        </div>
      </div>
    </div>
  ) : null;

const IdDocsModal = ({ show, onClose, participant }) => (
  show ? (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-2">
          ID Documents for {participant?.name}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {participant?.idDocumentUrls?.length ? (
            participant.idDocumentUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`ID Document ${idx + 1}`}
                className="w-full h-48 object-contain border rounded"
              />
            ))
          ) : (
            <div className="text-gray-500">No documents uploaded.</div>
          )}
        </div>
        <div className="modal-action">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  ) : null
);

const BulkActionBar = ({ selectedCount, entityType, onApprove, onReject }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-blue-800">
          {selectedCount} {entityType.toLowerCase()}(s) selected
        </span>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-success btn-sm" onClick={onApprove}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Approve Selected
        </button>
        <button className="btn btn-error btn-sm" onClick={onReject}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reject Selected
        </button>
      </div>
    </div>
  </div>
);

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const VerificationOptimized = () => {
  const [activeTab, setActiveTab] = useState("Organization");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [showIdDocsModal, setShowIdDocsModal] = useState(false);

  const config = ENTITY_CONFIG[activeTab];

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(config.api.fetch);
      setData(response.data);
    } catch {
      toast.error(`Failed to fetch ${config.type}s`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelected([]);
  }, [activeTab]);

  // Select logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(data.map(item => item.id));
    } else {
      setSelected([]);
    }
  };
  const handleSelect = (id) => {
    setSelected(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]);
  };

  // Approve/Reject logic
  const handleApprove = async () => {
    try {
      await axios.put(config.api.approve(currentItem.id));
      toast.success(`${config.type.charAt(0).toUpperCase() + config.type.slice(1)} approved successfully`);
      setShowApproveModal(false);
      setCurrentItem(null);
      fetchData();
    } catch {
      toast.error(`Failed to approve ${config.type}`);
    }
  };
  const handleReject = async () => {
    try {
      await axios.delete(config.api.reject(currentItem.id));
      toast.success(`${config.type.charAt(0).toUpperCase() + config.type.slice(1)} rejected successfully`);
      setShowRejectModal(false);
      setCurrentItem(null);
      fetchData();
    } catch {
      toast.error(`Failed to reject ${config.type}`);
    }
  };
  const handleBulkApprove = async () => {
    try {
      await Promise.all(selected.map(id => axios.put(config.api.approve(id))));
      toast.success(`${selected.length} ${config.type}s approved successfully`);
      setShowBulkApproveModal(false);
      setSelected([]);
      fetchData();
    } catch {
      toast.error(`Failed to approve some ${config.type}s`);
    }
  };
  const handleBulkReject = async () => {
    try {
      await Promise.all(selected.map(id => axios.delete(config.api.reject(id))));
      toast.success(`${selected.length} ${config.type}s rejected successfully`);
      setShowBulkRejectModal(false);
      setSelected([]);
      fetchData();
    } catch {
      toast.error(`Failed to reject some ${config.type}s`);
    }
  };

  // Table rendering
  const renderTable = () => (
    <table className="table">
      <thead>
        <tr>
          <th>
            <label>
              <input
                type="checkbox"
                className="checkbox"
                checked={selected.length === data.length && data.length > 0}
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
        {data.length === 0 ? (
          <tr>
            <td colSpan="5" className="text-center py-8 text-gray-500">
              No unverified {config.type}s found
            </td>
          </tr>
        ) : (
          data.map(item => (
            <tr key={item.id}>
              <th>
                <label>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={() => handleSelect(item.id)}
                  />
                </label>
              </th>
              <td>
                <div className="flex items-center gap-3">
                  <div className="avatar">
                    <div className="mask mask-squircle h-12 w-12">
                      <img
                        src={config.avatar(item)}
                        alt={`${config.name(item)} avatar`}
                        onError={e => {
                          e.target.src = "https://img.daisyui.com/images/profile/demo/2@94.webp";
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">{config.name(item)}</div>
                    <div className="text-sm opacity-50">@{config.username(item)}</div>
                  </div>
                </div>
              </td>
              <td>{item.email}</td>
              <td>{formatDate(item.createdAt)}</td>
              <th>
                <div className="flex gap-2">
                  {activeTab === "Participants" && (
                    <button
                      className="btn btn-info btn-xs"
                      onClick={() => {
                        setCurrentItem(item);
                        setShowIdDocsModal(true);
                      }}
                    >
                      View ID Documents
                    </button>
                  )}
                  <button
                    className="btn btn-success btn-xs"
                    onClick={() => {
                      setCurrentItem(item);
                      setShowApproveModal(true);
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-error btn-xs"
                    onClick={() => {
                      setCurrentItem(item);
                      setShowRejectModal(true);
                    }}
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
  );

  return (
    <div>
      <div role="tablist" className="tabs tabs-boxed gap-x-2">
        {TABS.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab ${activeTab === tab.id ? "tab-active" : ""} text-center font-bold px-2 py-2 rounded-xl border-2 border-black transition ${activeTab === tab.id ? "bg-red-500 text-white" : "bg-blue-200 text-black"}`}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className="flex flex-col justify-center py-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4">{config.label}</h1>
        {selected.length > 0 && (
          <BulkActionBar
            selectedCount={selected.length}
            entityType={config.type.charAt(0).toUpperCase() + config.type.slice(1)}
            onApprove={() => setShowBulkApproveModal(true)}
            onReject={() => setShowBulkRejectModal(true)}
          />
        )}
        <div className="bg-white rounded-lg p-4 overflow-x-auto overflow-y-auto max-h-[calc(100vh-130px)]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            renderTable()
          )}
        </div>
        {/* Approve Confirmation Modal */}
        <ConfirmationModal
          show={showApproveModal}
          onClose={() => { setShowApproveModal(false); setCurrentItem(null); }}
          onConfirm={handleApprove}
          title={`Confirm Approval`}
          message={`Are you sure you want to approve ${(currentItem ? config.name(currentItem) : "this item")}?`}
          confirmText="Approve"
        />
        {/* Reject Confirmation Modal */}
        <ConfirmationModal
          show={showRejectModal}
          onClose={() => { setShowRejectModal(false); setCurrentItem(null); }}
          onConfirm={handleReject}
          title={`Confirm Rejection`}
          message={`Are you sure you want to reject ${(currentItem ? config.name(currentItem) : "this item")}? This action cannot be undone.`}
          confirmText="Reject & Delete"
        />
        {/* Bulk Approve Confirmation Modal */}
        <ConfirmationModal
          show={showBulkApproveModal}
          onClose={() => setShowBulkApproveModal(false)}
          onConfirm={handleBulkApprove}
          title={`Confirm Bulk Approval`}
          message={`Are you sure you want to approve ${selected.length} ${config.type}(s)?`}
          confirmText="Approve All"
        />
        {/* Bulk Reject Confirmation Modal */}
        <ConfirmationModal
          show={showBulkRejectModal}
          onClose={() => setShowBulkRejectModal(false)}
          onConfirm={handleBulkReject}
          title={`Confirm Bulk Rejection`}
          message={`Are you sure you want to reject ${selected.length} ${config.type}(s)? This action cannot be undone.`}
          confirmText="Reject & Delete All"
        />
        {/* ID Documents Modal for Participants */}
        {activeTab === "Participants" && (
          <IdDocsModal
            show={showIdDocsModal}
            onClose={() => setShowIdDocsModal(false)}
            participant={currentItem}
          />
        )}
      </div>
    </div>
  );
};

export default VerificationOptimized; 