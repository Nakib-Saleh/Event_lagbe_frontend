import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaTimes,
  FaFilter,
  FaCheck,
  FaBuilding,
  FaUser,
  FaSort,
  FaChevronDown,
  FaMapMarkerAlt,
  FaUsers,
  FaBookmark,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../config/api";

const AllEvents = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("name"); // name, skill, orgs
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Skill search states
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [isSkillSearching, setIsSkillSearching] = useState(false);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // Organization search states
  const [selectedOrgs, setSelectedOrgs] = useState([]);
  const [orgSuggestions, setOrgSuggestions] = useState([]);
  const [isOrgSearching, setIsOrgSearching] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  // Sorting states
  const [sortBy, setSortBy] = useState("latest"); // latest, trending,
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Pagination states for search results
  const [displayedEvents, setDisplayedEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const eventsPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        //const eventsRes = await fetch(`http://localhost:2038/api/events?page=0&size=50`);
        const eventsRes = await fetch(API_ENDPOINTS.EVENTS + "?page=0&size=50");
        if (!eventsRes.ok) throw new Error("Failed to load events");

        const eventsData = await eventsRes.json();

        const content = Array.isArray(eventsData?.content)
          ? eventsData.content
          : Array.isArray(eventsData)
          ? eventsData
          : [];
        setEvents(content);
        setFilteredEvents(content);
      } catch (e) {
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle skill search
  const searchSkills = async (query) => {
    if (!query.trim()) {
      setSkillSuggestions([]);
      setShowSkillDropdown(false);
      return;
    }

    setIsSkillSearching(true);
    try {
      //const response = await fetch(`http://localhost:2038/api/skills/search?name=${encodeURIComponent(query)}&page=0&size=10`);
      const response = await fetch(API_ENDPOINTS.SEARCH_SKILLS(query));
      if (response.ok) {
        const data = await response.json();
        const suggestions = Array.isArray(data?.content) ? data.content : [];
        setSkillSuggestions(suggestions);
        setShowSkillDropdown(suggestions.length > 0);
      }
    } catch (error) {
      console.error("Error searching skills:", error);
      setSkillSuggestions([]);
    } finally {
      setIsSkillSearching(false);
    }
  };

  // Handle organization search
  const searchOrganizations = async (query) => {
    if (!query.trim()) {
      setOrgSuggestions([]);
      setShowOrgDropdown(false);
      return;
    }

    setIsOrgSearching(true);
    try {
      const [orgRes, orgzRes] = await Promise.all([
        //fetch(`${API_ENDPOINTS.ORGANIZATIONS}?q=${encodeURIComponent(query)}&page=0&size=5`).then(r => r.json()),
        //fetch(`${API_ENDPOINTS.ORGANIZERS}?q=${encodeURIComponent(query)}&page=0&size=5`).then(r => r.json()),
        fetch(
          `${API_ENDPOINTS.ORGANIZATIONS}?q=${encodeURIComponent(
            query
          )}&page=0&size=5`
        ).then((r) => r.json()),
        fetch(
          `${API_ENDPOINTS.ORGANIZERS}?q=${encodeURIComponent(
            query
          )}&page=0&size=5`
        ).then((r) => r.json()),
      ]);

      const mapOrg = (o) => ({
        firebaseUid: o.firebaseUid,
        name: o.name || o.username || o.email,
        type: "organization",
        email: o.email,
      });
      const mapOrgz = (p) => ({
        firebaseUid: p.firebaseUid,
        name: p.name || p.username || p.email,
        type: "organizer",
        email: p.email,
      });

      const orgContent = orgRes?.content ?? orgRes ?? [];
      const orgzContent = orgzRes?.content ?? orgzRes ?? [];
      const items = [...orgContent.map(mapOrg), ...orgzContent.map(mapOrgz)];

      setOrgSuggestions(items);
      setShowOrgDropdown(items.length > 0);
    } catch (error) {
      console.error("Error searching organizations:", error);
      setOrgSuggestions([]);
    } finally {
      setIsOrgSearching(false);
    }
  };

  // Debounced skill search
  useEffect(() => {
    if (searchType === "skill" && searchTerm) {
      const timeoutId = setTimeout(() => {
        searchSkills(searchTerm);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSkillSuggestions([]);
      setShowSkillDropdown(false);
    }
  }, [searchTerm, searchType]);

  // Debounced organization search
  useEffect(() => {
    if (searchType === "orgs" && searchTerm) {
      const timeoutId = setTimeout(() => {
        searchOrganizations(searchTerm);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setOrgSuggestions([]);
      setShowOrgDropdown(false);
    }
  }, [searchTerm, searchType]);

  // Handle skill selection
  const handleSkillSelect = (skill) => {
    if (!selectedSkills.find((s) => s.id === skill.id)) {
      setSelectedSkills((prev) => [...prev, skill]);
      setSearchTerm("");
      setSkillSuggestions([]);
      setShowSkillDropdown(false);
    }
  };

  // Handle skill removal
  const handleSkillRemove = (skillId) => {
    setSelectedSkills((prev) => prev.filter((skill) => skill.id !== skillId));
  };

  // Handle organization selection
  const handleOrgSelect = (org) => {
    if (!selectedOrgs.find((o) => o.firebaseUid === org.firebaseUid)) {
      setSelectedOrgs((prev) => [...prev, org]);
      setSearchTerm("");
      setOrgSuggestions([]);
      setShowOrgDropdown(false);
    }
  };

  // Handle organization removal
  const handleOrgRemove = (firebaseUid) => {
    setSelectedOrgs((prev) =>
      prev.filter((org) => org.firebaseUid !== firebaseUid)
    );
  };

  // Handle search functionality
  useEffect(() => {
    let filtered = [];

    if (searchType === "skill") {
      // For skill search, show all events if no skills selected, otherwise filter by selected skills
      if (selectedSkills.length === 0) {
        filtered = events;
      } else {
        // Filter events that have at least one of the selected skills
        const skillNames = selectedSkills.map((skill) =>
          skill.name.toLowerCase()
        );
        filtered = events.filter(
          (event) =>
            event.requiredSkills &&
            event.requiredSkills.some((eventSkill) =>
              skillNames.includes(eventSkill.toLowerCase())
            )
        );
      }
    } else if (searchType === "orgs") {
      // For organization search, show all events if no orgs selected, otherwise filter by selected orgs
      if (selectedOrgs.length === 0) {
        filtered = events;
      } else {
        // Filter events that are created by OR co-hosted by any of the selected organizations/organizers
        const orgFirebaseUids = selectedOrgs.map((org) => org.firebaseUid);
        filtered = events.filter((event) => {
          // Check if event is created by any selected org
          const isOwner =
            event.ownerId && orgFirebaseUids.includes(event.ownerId);

          // Check if event has any selected org as co-host
          const hasCoHost =
            event.coHosts &&
            Array.isArray(event.coHosts) &&
            event.coHosts.some((coHostId) =>
              orgFirebaseUids.includes(coHostId)
            );

          return isOwner || hasCoHost;
        });
      }
    } else if (searchType === "name") {
      // For name search, show all events if no search term, otherwise filter by title
      if (!searchTerm.trim()) {
        filtered = events;
      } else {
        filtered = events.filter(
          (event) =>
            event.title &&
            event.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    } else {
      // Default: show all events
      filtered = events;
    }

    // Apply sorting
    if (sortBy === "latest") {
      // Sort by createdAt (newest first)
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // Descending order (newest first)
      });
    } else if (sortBy === "trending") {
      // Sort by trending score (engagement metrics)
      filtered.sort((a, b) => {
        // Calculate trending score for each event
        const getTrendingScore = (event) => {
          // Weighted scoring system:
          // - Going count (actual registrations): 3x weight (highest commitment)
          // - Interested count (showing interest): 2x weight (medium commitment)
          // - Bookmark count (saved for later): 1x weight (low commitment)
          // - Shares count (viral spread): 2x weight (medium-high engagement)

          const goingScore = (event.registeredBy?.length || 0) * 3;
          const bookmarkScore = (event.bookmarkedBy?.length || 0) * 1;

          // Total trending score
          return goingScore + bookmarkScore;
        };

        const scoreA = getTrendingScore(a);
        const scoreB = getTrendingScore(b);

        // Sort by trending score (highest first)
        return scoreB - scoreA;
      });
    }

    setFilteredEvents(filtered);
    setCurrentPage(1);
  }, [searchTerm, searchType, events, selectedSkills, selectedOrgs, sortBy]);

  // Handle pagination for search results
  useEffect(() => {
    const startIndex = 0;
    const endIndex = currentPage * eventsPerPage;
    const eventsToShow = filteredEvents.slice(startIndex, endIndex);
    setDisplayedEvents(eventsToShow);
    setHasMore(endIndex < filteredEvents.length);
  }, [filteredEvents, currentPage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSortDropdown && !event.target.closest(".sort-dropdown")) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSortDropdown]);

  const handleLoadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchType("name");
    setSelectedSkills([]);
    setSelectedOrgs([]);
    setCurrentPage(1);
  };

  // Sorting helper functions
  const getSortLabel = () => {
    switch (sortBy) {
      case "latest":
        return "Latest Events";
      case "trending":
        return "Trending Events";
      default:
        return "Latest Events";
    }
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setShowSortDropdown(false);
    setCurrentPage(1);

    // Force immediate re-sort of current filtered events
    const currentFiltered = [...filteredEvents];
    let sortedEvents = [...currentFiltered];

    if (newSortBy === "latest") {
      sortedEvents.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
    } else if (newSortBy === "trending") {
      sortedEvents.sort((a, b) => {
        const getTrendingScore = (event) => {
          const goingScore = (event.registeredBy?.length || 0) * 3;
          const bookmarkScore = (event.bookmarkedBy?.length || 0) * 1;
          return goingScore + bookmarkScore;
        };

        const scoreA = getTrendingScore(a);
        const scoreB = getTrendingScore(b);
        return scoreB - scoreA;
      });
    }

    setFilteredEvents(sortedEvents);
  };

  const getSearchPlaceholder = () => {
    switch (searchType) {
      case "name":
        return "Search events by name...";
      case "skill":
        return "Type to search skills...";
      case "orgs":
        return "Type to search universities/clubs...";
      default:
        return "Search events...";
    }
  };

  const getSearchTypeLabel = () => {
    switch (searchType) {
      case "name":
        return "Name";
      case "skill":
        return "Skill";
      case "orgs":
        return "Orgs/Clubs";
      default:
        return "Name";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Explore Events
        </h1>
        <p className="text-gray-600">
          Discover amazing events and opportunities
        </p>
      </div>

      {/* Modern Search Section */}
      <div className="mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            {/* Search Type Radio Buttons */}
            <div className="flex-shrink-0">
              <div className="flex space-x-2">
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value="name"
                    checked={searchType === "name"}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`px-3 py-1.5 text-lg rounded-md font-medium transition-all duration-200 ${
                      searchType === "name"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Name
                  </div>
                </label>

                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value="skill"
                    checked={searchType === "skill"}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`px-3 py-1.5 rounded-md text-lg font-medium transition-all duration-200 ${
                      searchType === "skill"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Skills
                  </div>
                </label>

                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="searchType"
                    value="orgs"
                    checked={searchType === "orgs"}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`px-3 py-1.5 rounded-md text-lg font-medium transition-all duration-200 ${
                      searchType === "orgs"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Organizations
                  </div>
                </label>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1">
              <div
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                  isSearchFocused
                    ? "border-blue-500 shadow-xl"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center p-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={getSearchPlaceholder()}
                      className="w-full bg-transparent border-0 outline-none text-gray-900 placeholder-gray-500 text-lg"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                    />
                  </div>

                  {/* Search Icon */}
                  <div className="flex-shrink-0 ml-4">
                    {searchTerm ||
                    selectedSkills.length > 0 ||
                    selectedOrgs.length > 0 ? (
                      <button
                        onClick={clearSearch}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="p-2 text-gray-400">
                        <FaSearch className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Skill Suggestions Dropdown */}
                {searchType === "skill" && showSkillDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 rounded-b-2xl shadow-lg z-50 max-h-60 overflow-y-auto">
                    {isSkillSearching ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        Searching skills...
                      </div>
                    ) : (
                      <div className="py-2">
                        {skillSuggestions.map((skill) => (
                          <button
                            key={skill.id}
                            onClick={() => handleSkillSelect(skill)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-medium text-gray-900">
                                {skill.name}
                              </div>
                              {skill.description && (
                                <div className="text-sm text-gray-500">
                                  {skill.description}
                                </div>
                              )}
                            </div>
                            <FaCheck className="w-4 h-4 text-blue-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Organization Suggestions Dropdown */}
                {searchType === "orgs" && showOrgDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 rounded-b-2xl shadow-lg z-50 max-h-60 overflow-y-auto">
                    {isOrgSearching ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        Searching organizations...
                      </div>
                    ) : (
                      <div className="py-2">
                        {orgSuggestions.map((org) => (
                          <button
                            key={org.firebaseUid}
                            onClick={() => handleOrgSelect(org)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  org.type === "organization"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-green-100 text-green-600"
                                }`}
                              >
                                {org.type === "organization" ? (
                                  <FaBuilding className="w-4 h-4" />
                                ) : (
                                  <FaUser className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {org.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {org.type === "organization"
                                    ? "Organization"
                                    : "Organizer"}{" "}
                                  • {org.email}
                                </div>
                              </div>
                            </div>
                            <FaCheck className="w-4 h-4 text-blue-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Skills Display */}
      {searchType === "skill" && selectedSkills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedSkills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-sm font-medium"
            >
              <span>{skill.name}</span>
              <button
                onClick={() => handleSkillRemove(skill.id)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors duration-150"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Organizations Display */}
      {searchType === "orgs" && selectedOrgs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedOrgs.map((org) => (
            <div
              key={org.firebaseUid}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-medium"
            >
              <div className="w-4 h-4">
                {org.type === "organization" ? (
                  <FaBuilding className="w-3 h-3" />
                ) : (
                  <FaUser className="w-3 h-3" />
                )}
              </div>
              <span>{org.name}</span>
              <button
                onClick={() => handleOrgRemove(org.firebaseUid)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors duration-150"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sorting Section */}
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>

            {/* Sort Dropdown */}
            <div className="relative sort-dropdown">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <FaSort className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700 font-medium">
                  {getSortLabel()}
                </span>
                <FaChevronDown
                  className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${
                    showSortDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Sort Dropdown Menu */}
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleSortChange("latest")}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3 ${
                        sortBy === "latest"
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Latest Events</span>
                      {sortBy === "latest" && (
                        <FaCheck className="w-4 h-4 ml-auto text-blue-500" />
                      )}
                    </button>

                    <button
                      onClick={() => handleSortChange("trending")}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3 ${
                        sortBy === "trending"
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700"
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span>Trending Events</span>
                      {sortBy === "trending" && (
                        <FaCheck className="w-4 h-4 ml-auto text-blue-500" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-500">
            {filteredEvents.length} event
            {filteredEvents.length !== 1 ? "s" : ""} found
          </div>
        </div>
      </div>

      {/* Search Results Info */}
      {(searchTerm || selectedSkills.length > 0 || selectedOrgs.length > 0) && (
        <div className="mt-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-700 font-medium">
              {searchType === "skill" && selectedSkills.length > 0
                ? `Found ${filteredEvents.length} event${
                    filteredEvents.length !== 1 ? "s" : ""
                  } with ${selectedSkills.length} skill${
                    selectedSkills.length !== 1 ? "s" : ""
                  }`
                : searchType === "orgs" && selectedOrgs.length > 0
                ? `Found ${filteredEvents.length} event${
                    filteredEvents.length !== 1 ? "s" : ""
                  } from ${selectedOrgs.length} organization${
                    selectedOrgs.length !== 1 ? "s" : ""
                  }`
                : `Found ${filteredEvents.length} event${
                    filteredEvents.length !== 1 ? "s" : ""
                  } for "${searchTerm}" (by ${getSearchTypeLabel().toLowerCase()})`}
            </span>
          </div>
          {(filteredEvents.length > 0 ||
            selectedSkills.length > 0 ||
            selectedOrgs.length > 0) && (
            <button
              onClick={clearSearch}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading events...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <div className="w-5 h-5 bg-red-500 rounded-full mr-3"></div>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedEvents.length === 0 ? (
              <div className="col-span-full text-center py-16">
                {searchTerm ||
                selectedSkills.length > 0 ||
                selectedOrgs.length > 0 ? (
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaSearch className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No events found
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchType === "skill" && selectedSkills.length > 0
                        ? `We couldn't find any events matching the selected skills`
                        : searchType === "orgs" && selectedOrgs.length > 0
                        ? `We couldn't find any events from the selected organizations`
                        : `We couldn't find any events matching "${searchTerm}"`}
                    </p>
                    <button
                      onClick={clearSearch}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    >
                      Try a different search
                    </button>
                  </div>
                ) : (
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaFilter className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No events available
                    </h3>
                    <p className="text-gray-500">
                      Check back later for new events
                    </p>
                  </div>
                )}
              </div>
            ) : (
              displayedEvents.map((evt) => (
                <Link key={evt.id} to={`/event/${evt.id}`} className="group">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 h-full flex flex-col">
                    {evt.coverImageUrl && (
                      <div className="relative overflow-hidden flex-shrink-0">
                        <img
                          src={evt.coverImageUrl}
                          alt={evt.title}
                          className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Event Type Tag - Top Right */}
                        {evt.eventType && (
                          <div className="absolute top-3 right-3 z-10">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${
                                evt.eventType.toLowerCase() === "online"
                                  ? "bg-green-500 text-white"
                                  : "bg-blue-500 text-white"
                              }`}
                            >
                              {evt.eventType}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 min-h-[3.5rem]">
                        {evt.title}
                      </h2>
                      {evt.description && (
                        <p
                          className="text-gray-600 mb-4 text-sm leading-relaxed flex-1 min-h-[4.5rem] overflow-hidden"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {evt.description}
                        </p>
                      )}
                                             {!evt.description && (
                         <div className="flex-1 min-h-[4.5rem]"></div>
                       )}
                       
                        {/* Event Stats */}
                        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                          <div className="flex items-center bg-blue-50 px-3 py-1.5 rounded-full">
                            <FaUsers className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
                            <span className="text-sm font-semibold text-blue-700">
                              {evt.registeredBy?.length || 0}
                            </span>
                            <span className="text-xs text-blue-600 ml-1">going</span>
                          </div>
                          <div className="flex items-center bg-purple-50 px-3 py-1.5 rounded-full">
                            <FaBookmark className="w-3.5 h-3.5 text-purple-600 mr-1.5" />
                            <span className="text-sm font-semibold text-purple-700">
                              {evt.bookmarkedBy?.length || 0}
                            </span>
                            <span className="text-xs text-purple-600 ml-1">interested</span>
                          </div>
                        </div>
                       
                       {/* Location */}
                       <div className="flex items-center justify-between mb-4 flex-shrink-0">
                         <div className="flex items-center text-sm text-gray-700 min-w-0 flex-1">
                           <FaMapMarkerAlt className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                           <span className="truncate overflow-hidden">{evt.location}</span>
                         </div>
                       </div>
                      {Array.isArray(evt.requiredSkills) &&
                        evt.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2 flex-shrink-0">
                            {evt.requiredSkills
                              .slice(0, 3)
                              .map((skillName, index) => (
                                                                 <span
                                   key={index}
                                   className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium"
                                 >
                                   {skillName}
                                 </span>
                              ))}
                                                         {evt.requiredSkills.length > 3 && (
                               <span className="px-2 py-1 bg-green-100 text-green-500 rounded-md text-xs font-medium">
                                 +{evt.requiredSkills.length - 3} more
                               </span>
                             )}
                          </div>
                        )}
                      {(!evt.requiredSkills ||
                        evt.requiredSkills.length === 0) && (
                        <div className="flex-shrink-0 min-h-[2rem]"></div>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-12">
              <button
                onClick={handleLoadMore}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-full font-medium hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Load More (+
                {Math.min(
                  eventsPerPage,
                  filteredEvents.length - displayedEvents.length
                )}
                )
              </button>
            </div>
          )}

          {/* Show all results loaded message */}
          {!hasMore && filteredEvents.length > 0 && (
            <div className="text-center mt-8">
              <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Showing all {filteredEvents.length} result
                {filteredEvents.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllEvents;
