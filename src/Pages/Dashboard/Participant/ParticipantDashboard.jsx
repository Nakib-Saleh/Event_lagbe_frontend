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
  FiBookmark,
  FiClock,
  FiUserPlus,
  FiUserCheck,
} from "react-icons/fi";
import { MdOutlineVerifiedUser, MdOutlineReport } from "react-icons/md";
import { Outlet, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { MdOutlineEmojiEvents } from "react-icons/md";
import AuthContext from "../../../Provider/AuthContext";
import { IoIosAddCircleOutline } from "react-icons/io";

const ParticipantDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Profile");
  const navigate = useNavigate(); 
  const { user: _user, userRole: _userRole } = useContext(AuthContext);
  
  const menuItems = [
    {
      title:"Profile",
      icon: <FiUser className="text-red-600" />,
    },
    {
      title: "Bookmarked Events",
      icon: <FiBookmark className="text-red-600" />,
    },
    {
      title: "Registered Events",
      icon: <MdOutlineEmojiEvents className="text-red-600 text-xl" />,
    },
    {
      title: "Followers",
      icon: <FiUserPlus className="text-red-600" />,
    },
    {
      title: "Following",
      icon: <FiUserCheck className="text-red-600" />,
    },
  ];

  const extraItems = [
    {
      title: "Calendar",
      icon: <FiCalendar className="text-red-600" />,
      badge: { text: "New", color: "badge-success" },
    }
  ];

  return (
    <div className="flex min-h-screen font-roboto"> 
      <Sidebar
        collapsed={isCollapsed}
        className="bg-white border-r border-gray-200 rounded-xl"
        style={{
          minHeight: "100vh",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center w-full">
          {!isCollapsed && (
            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-red-600 font-semibold text-lg">
                Profile
              </span>
            </div>
          )}

          {/* Toggle Button */}
          <div
            className={` p-3 border-gray-100 ${
              isCollapsed ? "w-full" : ""
            } text-center`}
          >
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              <FiMenu className="text-gray-600" />
            </button>
          </div>
        </div>

        <Menu className="py-4">
          {/* General Section */}
          {!isCollapsed && (
            <div className="px-4 mb-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                General
              </h3>
            </div>
          )}

          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              onClick={() => {
                navigate(`/participantDashboard/${item.title.toLowerCase().replace(/\s+/g, '-')}`);
                setSelected(item.title);
              }}
              className={`mx-2 mb-1 rounded-lg transition-all duration-200 ${
                selected === item.title
                  ? "bg-red-50 text-red-600"
                  : "hover:bg-gray-100"
              }`}
              style={{
                padding: "12px 16px",
                margin: "4px 8px",
                borderRadius: "8px",
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {item.icon}
                  {!isCollapsed && (
                    <span className="font-medium">{item.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && !isCollapsed && (
                    <span
                      className={`badge badge-sm ${item.badge.color} text-white`}
                    >
                      {item.badge.text}
                    </span>
                  )}
                  {!isCollapsed && (
                    <FiChevronRight className="text-gray-400 text-sm" />
                  )}
                </div>
              </div>
            </MenuItem>
          ))}

          {/* Extra Section */}
          {!isCollapsed && (
            <div className="px-4 mb-2 mt-6">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Extra
              </h3>
            </div>
          )}

          {extraItems.map((item, index) => (
            <MenuItem
              key={index}
              onClick={() => {
                const path = item.title === "Calendar"
                  ? "/participantDashboard/calendar"
                  : `/participantDashboard/${item.title.toLowerCase()}`;
                navigate(path);
                setSelected(item.title);
              }}
              className={`mx-2 mb-1 rounded-lg transition-all duration-200 ${
                selected === item.title
                  ? "bg-red-50 text-red-600"
                  : "hover:bg-gray-50"
              }`}
              style={{
                padding: "12px 16px",
                margin: "4px 8px",
                borderRadius: "8px",
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {item.icon}
                  {!isCollapsed && (
                    <span className="font-medium">{item.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && !isCollapsed && (
                    <span
                      className={`badge badge-sm ${item.badge.color} text-white`}
                    >
                      {item.badge.text}
                    </span>
                  )}
                  {!isCollapsed && (
                    <FiChevronRight className="text-gray-400 text-sm" />
                  )}
                </div>
              </div>
            </MenuItem>
          ))}
        </Menu>

        {/* Footer Card */}
        <div className="mt-auto p-4 sticky bottom-0 left-0 right-0">
          
        </div>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-[#eef1fc] rounded-r-2xl min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Participant Dashboard
        </h1>
        <div className="min-h-full">
          <Outlet></Outlet>
        </div>
      </div>
    </div>
  );
};

export default ParticipantDashboard;
