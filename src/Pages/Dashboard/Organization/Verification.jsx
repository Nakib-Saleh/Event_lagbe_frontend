import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import AuthContext from "../../../Provider/AuthContext";
import { API_ENDPOINTS } from "../../../config/api";

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
  const { user } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [modal, setModal] = useState({ type: null, item: null });

  // Fetch data
  const fetchData = async () => {
    if (!user || !user.id) return;
    try {
      setLoading(true);
      //const response = await axios.get(`http://localhost:2038/api/organizer/${user.id}/unverified-organizers`);
      const response = await axios.get(API_ENDPOINTS.UNVERIFIED_ORGANIZERS(user.id));
      setData(response.data);
    } catch {
      toast.error("Failed to fetch organizers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelected([]);
    // eslint-disable-next-line
  }, [user]);

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
      //await axios.put(`http://localhost:2038/api/organizer/${modal.item.id}/approve`);
      await axios.put(API_ENDPOINTS.APPROVE_ORGANIZER(modal.item.id));
      toast.success("Organizer approved successfully");
      setModal({ type: null, item: null });
      fetchData();
    } catch {
      toast.error("Failed to approve organizer");
    }
  };
  const handleReject = async () => {
    try {
      //await axios.delete(`http://localhost:2038/api/organizer/${modal.item.id}/reject`);
      await axios.delete(API_ENDPOINTS.REJECT_ORGANIZER(modal.item.id));
      toast.success("Organizer rejected successfully");
      setModal({ type: null, item: null });
      fetchData();
    } catch {
      toast.error("Failed to reject organizer");
    }
  };
  const handleBulkApprove = async () => {
    try {
      //await Promise.all(selected.map(id => axios.put(`http://localhost:2038/api/organizer/${id}/approve`)));
              await Promise.all(selected.map(id => axios.put(API_ENDPOINTS.APPROVE_ORGANIZER(id))));
      toast.success(`${selected.length} organizers approved successfully`);
      setModal({ type: null, item: null });
      setSelected([]);
      fetchData();
    } catch {
      toast.error("Failed to approve some organizers");
    }
  };
  const handleBulkReject = async () => {
    try {
      //await Promise.all(selected.map(id => axios.delete(`http://localhost:2038/api/organizer/${id}/reject`)));
              await Promise.all(selected.map(id => axios.delete(API_ENDPOINTS.REJECT_ORGANIZER(id))));
      toast.success(`${selected.length} organizers rejected successfully`);
      setModal({ type: null, item: null });
      setSelected([]);
      fetchData();
    } catch {
      toast.error("Failed to reject some organizers");
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
              No unverified organizers found
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
                        src={item.profilePictureUrl || "https://img.daisyui.com/images/profile/demo/2@94.webp"}
                        alt={`${item.name} avatar`}
                        onError={e => {
                          e.target.src = "https://img.daisyui.com/images/profile/demo/2@94.webp";
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">{item.name}</div>
                    <div className="text-sm opacity-50">@{item.username}</div>
                  </div>
                </div>
              </td>
              <td>{item.email}</td>
              <td>{formatDate(item.createdAt)}</td>
              <th>
                <div className="flex gap-2">
                  <button
                    className="btn btn-success btn-xs"
                    onClick={() => {
                      setModal({ type: 'approve', item });
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-error btn-xs"
                    onClick={() => {
                      setModal({ type: 'reject', item });
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
      <div className="flex flex-col justify-center py-4">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Organizer Verification</h1>
        {selected.length > 0 && (
          <BulkActionBar
            selectedCount={selected.length}
            entityType="Organizer"
            onApprove={() => setModal({ type: 'bulkApprove', item: null })}
            onReject={() => setModal({ type: 'bulkReject', item: null })}
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
          show={modal.type === 'approve'}
          onClose={() => setModal({ type: null, item: null })}
          onConfirm={handleApprove}
          title={`Confirm Approval`}
          message={`Are you sure you want to approve ${(modal.item ? modal.item.name : "this item")}?`}
          confirmText="Approve"
        />
        {/* Reject Confirmation Modal */}
        <ConfirmationModal
          show={modal.type === 'reject'}
          onClose={() => setModal({ type: null, item: null })}
          onConfirm={handleReject}
          title={`Confirm Rejection`}
          message={`Are you sure you want to reject ${(modal.item ? modal.item.name : "this item")}? This action cannot be undone.`}
          confirmText="Reject & Delete"
        />
        {/* Bulk Approve Confirmation Modal */}
        <ConfirmationModal
          show={modal.type === 'bulkApprove'}
          onClose={() => setModal({ type: null, item: null })}
          onConfirm={handleBulkApprove}
          title={`Confirm Bulk Approval`}
          message={`Are you sure you want to approve ${selected.length} organizers?`}
          confirmText="Approve All"
        />
        {/* Bulk Reject Confirmation Modal */}
        <ConfirmationModal
          show={modal.type === 'bulkReject'}
          onClose={() => setModal({ type: null, item: null })}
          onConfirm={handleBulkReject}
          title={`Confirm Bulk Rejection`}
          message={`Are you sure you want to reject ${selected.length} organizers? This action cannot be undone.`}
          confirmText="Reject & Delete All"
        />
      </div>
    </div>
  );
};

export default VerificationOptimized; 