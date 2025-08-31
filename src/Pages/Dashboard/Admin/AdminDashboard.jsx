import React, { useState } from "react";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import {
  FiBarChart2,
  FiGlobe,
  FiDroplet,
  FiZap,
  FiShoppingCart,
  FiCalendar,
  FiFileText,
  FiHeart,
  FiGithub,
  FiChevronRight,
  FiMenu,
  FiUsers,
  FiUser,
  FiUserPlus,
  FiUserCheck,
  FiClock,
  FiHome,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { MdOutlineVerifiedUser, MdOutlineReport, MdOutlineAdminPanelSettings } from "react-icons/md";
import { FaCrown } from "react-icons/fa";
import { Outlet, useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Profile");
  const navigate = useNavigate(); 
  
  const menuItems = [
    {
      title: "Profile",
      icon: <FiUser className="text-lg" />,
      description: "Manage your profile",
      color: "from-red-500 to-pink-600"
    },
    {
      title: "Verification",
      icon: <MdOutlineVerifiedUser className="text-lg" />,
      description: "Verify users and organizations",
      color: "from-red-500 to-pink-600",
      badge: { text: "New", color: "badge-success" }
    },
    {
      title: "Users",
      icon: <FiUsers className="text-lg" />,
      description: "Manage all users",
      color: "from-purple-500 to-pink-600"
    },
  ];

  const extraItems = [
    {
      title: "Skills",
      icon: <FiFileText className="text-lg" />,
      description: "Manage skills",
      color: "from-orange-500 to-red-600"
    },
    {
      title: "Create-Admin",
      icon: <FiUserPlus className="text-lg" />,
      description: "Create new admin",
      color: "from-indigo-500 to-blue-600"
    },
    {
      title: "Deactivate-Expired-Events",
      icon: <FiClock className="text-lg" />,
      description: "Manage expired events",
      color: "from-yellow-500 to-orange-600",
      badge: { text: "Admin", color: "badge-warning" }
    },
  ];

  return (
    <div className="flex min-h-screen font-roboto bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar
        collapsed={isCollapsed}
        className="bg-white border-r border-gray-200 shadow-2xl"
        style={{
          minHeight: "100vh",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaCrown className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent">
                    Admin Panel
                  </h1>
                  <p className="text-xs text-gray-500">Event Lagbe</p>
                </div>
              </div>
            )}

            {/* Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md"
            >
              <FiMenu className="text-gray-600 text-lg" />
            </button>
          </div>
        </div>

        <Menu className="py-6 px-4">
          {/* General Section */}
          {!isCollapsed && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                General Management
              </h3>
            </div>
          )}

          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              onClick={() => {
                navigate(`/adminDashboard/${item.title.toLowerCase()}`);
                setSelected(item.title);
              }}
              className={`mb-2 rounded-xl transition-all duration-300 group ${
                selected === item.title
                  ? "bg-gradient-to-r " + item.color + " text-white shadow-lg transform scale-105"
                  : "hover:bg-gray-50 hover:shadow-md"
              }`}
              style={{
                padding: isCollapsed ? "12px" : "16px 20px",
                borderRadius: "12px",
              }}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
                  <div className={`${isCollapsed ? 'p-3' : 'p-2'} rounded-lg transition-all duration-300 ${
                    selected === item.title
                      ? " text-white group-hover:text-black"
                      : "text-gray-600 group-hover:text-gray-800"
                  }`}>
                    {item.icon}
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1">
                      <span className={`font-semibold text-sm ${
                        selected === item.title ? "text-white group-hover:text-black" : "text-gray-700"
                      }`}>
                        {item.title}
                      </span>
                      <p className={`text-xs mt-1 ${
                        selected === item.title ? "text-white/80 group-hover:text-black" : "text-gray-500"
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className={`badge badge-xs ${item.badge.color} text-white`}>
                        {item.badge.text}
                      </span>
                    )}
                    <FiChevronRight className={`text-sm transition-transform duration-300 ${
                      selected === item.title ? "text-white/80 group-hover:text-black" : "text-gray-400"
                    } group-hover:translate-x-1`} />
                  </div>
                )}
              </div>
            </MenuItem>
          ))}

          {/* Extra Section */}
          {!isCollapsed && (
            <div className="mb-6 mt-8">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                System Tools
              </h3>
            </div>
          )}

          {extraItems.map((item, index) => (
            <MenuItem
              key={index}
              onClick={() => {
                const path = item.title === "Calendar"
                  ? "/adminDashboard/calendar"
                  : `/adminDashboard/${item.title.toLowerCase()}`;
                navigate(path);
                setSelected(item.title);
              }}
              className={`mb-2 rounded-xl transition-all duration-300 group ${
                selected === item.title
                  ? "bg-gradient-to-r " + item.color + " text-white shadow-lg transform scale-105"
                  : "hover:bg-gray-50 hover:shadow-md"
              }`}
              style={{
                padding: isCollapsed ? "12px" : "16px 20px",
                borderRadius: "12px",
              }}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
                  <div className={`${isCollapsed ? 'p-3' : 'p-2'} rounded-lg transition-all duration-300 ${
                    selected === item.title
                      ? " text-white group-hover:text-black"
                      : "text-gray-600 group-hover:text-gray-800"
                  }`}>
                    {item.icon}
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1">
                      <span className={`font-semibold text-sm ${
                        selected === item.title ? "text-white group-hover:text-black" : "text-gray-700"
                      }`}>
                        {item.title}
                      </span>
                      <p className={`text-xs mt-1 ${
                        selected === item.title ? "text-white/80 group-hover:text-black" : "text-gray-500"
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className={`badge badge-xs ${item.badge.color} text-white`}>
                        {item.badge.text}
                      </span>
                    )}
                    <FiChevronRight className={`text-sm transition-transform duration-300 ${
                      selected === item.title ? "text-white/80 group-hover:text-black" : "text-gray-400"
                    } group-hover:translate-x-1`} />
                  </div>
                )}
              </div>
            </MenuItem>
          ))}
        </Menu>

        {/* Footer */}
        <div className="mt-auto p-6 border-t border-gray-100">
          {!isCollapsed && (
            <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <FaCrown className="text-white text-sm" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Super Admin</p>
                  <p className="text-xs text-gray-500">Full Access</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Welcome back! Manage your platform efficiently.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
