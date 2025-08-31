import React, { useState, useContext, useEffect } from "react";
import AuthContext from "../Provider/AuthContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaIdCard, FaBuilding, FaFileUpload, FaTimes } from "react-icons/fa";
import Lottie from "lottie-react";
import animationData from "../assets/ladylog.json";
import { API_ENDPOINTS } from "../config/api";

const Register = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    idDocuments: [], // array of File objects
    idDocumentUrls: [], // array of Cloudinary URLs
    organizationId: "", // for organizer registration
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);

  const { registerWithFirebaseAndMongo } = useContext(AuthContext);

  useEffect(() => {
    if (userType === "organizer") {
      //`http://localhost:2038/api/organizations`,
      fetch(API_ENDPOINTS.ORGANIZATIONS)
        .then((res) => res.json())
        .then((data) => {
          // Handle both paginated and non-paginated responses
          const items = Array.isArray(data) ? data : (data?.content ?? []);
          setOrganizations(items);
        })
        .catch(() => {
          setOrganizations([]);
        });
    }
  }, [userType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      idDocuments: [...prev.idDocuments, ...files],
    }));
  };

  const handleRemoveDocument = (index) => {
    setFormData((prev) => ({
      ...prev,
      idDocuments: prev.idDocuments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    let idDocumentUrls = [];

    if (userType === "participant") {
      if (!formData.idDocuments.length) {
        toast.error("ID documents are required for participants");
        setIsLoading(false);
        return;
      }

      try {
        // Upload each document
        const uploadPromises = formData.idDocuments.map((file) =>
          uploadToCloudinary(file)
        );
        const uploadResults = await Promise.all(uploadPromises);
        idDocumentUrls = uploadResults.map((res) => res.secure_url);
      } catch (error) {
        toast.error("Failed to upload ID documents. Please try again.");
        console.error(error);
        setIsLoading(false);
        return;
      }
    }

    // Prepare final formData to send
    const submissionData = {
      ...formData,
      idDocumentUrls, // Only for participant
    };
    console.log(submissionData);

    try {
      const result = await registerWithFirebaseAndMongo(
        userType,
        submissionData
      );

      if (result.success) {
        toast.success("Registration successful");
        setFormData({
          name: "",
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          idDocuments: [],
          idDocumentUrls: [],
        });

        setUserType("");
        navigate("/");
        window.location.reload();
      } else {
        toast.error("Registration failed.");
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserTypeColor = (type) => {
    const colors = {
      admin: "bg-red-500",
      organization: "bg-blue-500",
      organizer: "bg-green-500",
      participant: "bg-purple-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const getUserTypeIcon = (type) => {
    const icons = {
      admin: "👨‍💼",
      organization: "🏢",
      organizer: "📋",
      participant: "👤",
    };
    return icons[type] || "👤";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 transition-colors duration-300">
      
      {/* Main Container */}
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-colors duration-300">
        <div className="flex flex-col lg:flex-row min-h-[700px]">
          
          {/* Left Side - Animation */}
          <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 lg:p-12 flex items-center justify-center relative overflow-hidden transition-colors duration-300">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full"></div>
              <div className="absolute bottom-20 right-10 w-16 h-16 bg-white rounded-full"></div>
              <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white rounded-full"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="mb-8">
                <Lottie 
                  animationData={animationData} 
                  loop={true} 
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Join Event Lagbe
              </h1>
              <p className="text-blue-100 text-lg max-w-md mx-auto">
                Create your account and start organizing or participating in amazing events
              </p>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="lg:w-1/2 p-8 lg:p-12 flex items-center justify-center">
            <div className="w-full max-w-md">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Create Account
                </h2>
                <p className="text-gray-600">
                  Choose your role and join our community
                </p>
              </div>

              {/* User Type Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Your Role
                </label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
                >
                  <option value="">Choose your role</option>
                  <option value="organization">Organization</option>
                  <option value="organizer">Organizer</option>
                  <option value="participant">Participant</option>
                </select>
              </div>

              {/* User Type Badge */}
              {userType && (
                <div className="mb-6">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-white font-semibold ${getUserTypeColor(userType)}`}>
                    <span className="mr-2 text-lg">{getUserTypeIcon(userType)}</span>
                    {userType.charAt(0).toUpperCase() + userType.slice(1)} Registration
                  </div>
                </div>
              )}

              {/* Registration Form */}
              {userType && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Full Name Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Username Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaIdCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Choose a username"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter password"
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm password"
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Organization Selection (for Organizer) */}
                  {userType === "organizer" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Select Organization
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaBuilding className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
                          required
                          name="organizationId"
                          value={formData.organizationId}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              organizationId: e.target.value,
                            }))
                          }
                        >
                          <option value="">Choose organization</option>
                          {organizations.map((org) => (
                            <option key={org.id || org._id} value={org.id || org._id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* ID Documents Upload (for Participant) */}
                  {userType === "participant" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        ID Documents
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaFileUpload className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          multiple
                          required
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        Upload your ID documents (JPG, PNG, PDF)
                      </p>
                      
                      {/* File List */}
                      {formData.idDocuments && formData.idDocuments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {formData.idDocuments.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <span className="text-sm text-gray-700 truncate">{file.name}</span>
                              <button
                                type="button"
                                className="text-red-500 hover:text-red-700 transition-colors"
                                onClick={() => handleRemoveDocument(idx)}
                              >
                                <FaTimes className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating account...
                      </div>
                    ) : (
                      `Register as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`
                    )}
                  </button>

                  {/* Login Link */}
                  <div className="text-center">
                    <p className="text-gray-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
                      >
                        Sign in here
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
