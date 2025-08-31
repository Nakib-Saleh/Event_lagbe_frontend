import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_ENDPOINTS } from '../../../config/api';

const SkillsList = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSkill, setEditingSkill] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [isEditMode, setIsEditMode] = useState(false);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.SKILLS);
      setSkills(res.data);
    } catch {
      toast.error('Failed to fetch skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? Boolean(checked) : value }));
  };

  const handleAddSkill = async e => {
    e.preventDefault();
    try {
      await axios.post(API_ENDPOINTS.SKILLS, form);
      toast.success('Skill added');
      setForm({ name: '', description: '', isActive: true });
      fetchSkills();
    } catch (err) {
      toast.error(err?.response?.data || 'Failed to add skill');
    }
  };

  const handleEditSkill = skill => {
    setEditingSkill(skill);
    setForm({ name: skill.name, description: skill.description, isActive: skill.isActive });
    setIsEditMode(true);
  };

  const handleUpdateSkill = async e => {
    e.preventDefault();
    try {
      await axios.put(`${API_ENDPOINTS.SKILLS}/${editingSkill.id}`, form);
      toast.success('Skill updated');
      setEditingSkill(null);
      setForm({ name: '', description: '', isActive: true });
      setIsEditMode(false);
      fetchSkills();
    } catch {
      toast.error('Failed to update skill');
    }
  };

  const handleDeleteSkill = async id => {
    if (!window.confirm('Delete this skill?')) return;
    try {
      await axios.delete(`${API_ENDPOINTS.SKILLS}/${id}`);
      toast.success('Skill deleted');
      fetchSkills();
    } catch {
      toast.error('Failed to delete skill');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100/60 via-white/60 to-red-200/80 backdrop-blur-md p-8 rounded-xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-orange-700 drop-shadow">Manage Skills</h2>
      <form
        onSubmit={isEditMode ? handleUpdateSkill : handleAddSkill}
        className="glass bg-white/60 border border-red-200 rounded-lg p-4 mb-8 shadow flex flex-col md:flex-row gap-4 items-center"
      >
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleInputChange}
          placeholder="Skill name"
          className="input input-bordered input-md w-48 bg-white/80"
          required
        />
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleInputChange}
          placeholder="Description"
          className="input input-bordered input-md w-64 bg-white/80"
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleInputChange}
            className="checkbox checkbox-error"
          />
          <span className="text-red-700">Active</span>
        </label>
        <button
          type="submit"
          className="btn bg-red-500 text-white hover:bg-red-600 shadow"
        >
          {isEditMode ? 'Update' : 'Add'}
        </button>
        {isEditMode && (
          <button
            type="button"
            className="btn btn-outline btn-error"
            onClick={() => {
              setIsEditMode(false);
              setEditingSkill(null);
              setForm({ name: '', description: '', isActive: true });
            }}
          >
            Cancel
          </button>
        )}
      </form>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="table glass bg-white/70 border border-red-200">
          <thead>
            <tr className="text-red-700">
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : skills.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">
                  No skills found
                </td>
              </tr>
            ) : (
              skills.map(skill => (
                <tr key={skill.id} className="hover:bg-red-50/60 transition">
                  <td className="font-semibold">{skill.name}</td>
                  <td>{skill.description}</td>
                  <td>
                    {(skill.isActive === true || skill.isActive === 'true') ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-error">Inactive</span>
                    )}
                  </td>
                  <td className="flex gap-2">
                    <button
                      className="btn btn-xs btn-outline btn-info"
                      onClick={() => handleEditSkill(skill)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-xs btn-outline btn-error"
                      onClick={() => handleDeleteSkill(skill.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SkillsList;