// src/pages/Home.jsx
import React, { useState, useEffect, useMemo, useContext } from "react";
import { Link } from "react-router-dom";
import {
  FiCalendar,
  FiUsers,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiCheckCircle,
  FiTrendingUp,
} from "react-icons/fi";
import AuthContext from "../Provider/AuthContext";
import pic1 from "../assets/bd.JPG";
import pic2 from "../assets/finals.jpg";
import pic3 from "../assets/foreign.jpg";
import { API_ENDPOINTS } from "../config/api";

const Home = () => {
  const { user, userRole } = useContext(AuthContext);

  const [currentSlide, setCurrentSlide] = useState(0);

  // Entities for "People You Can Follow"
  const [participants, setParticipants] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loadingFollow, setLoadingFollow] = useState(true);
  const [errorFollow, setErrorFollow] = useState(null);

  // Events state
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorEvents, setErrorEvents] = useState(null);

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const eventsRes = await fetch(
          //`http://localhost:2038/api/events?page=0&size=200`,
          API_ENDPOINTS.EVENTS + "?page=0&size=200"
        );
        if (!eventsRes.ok) throw new Error("Failed to load events");

        const eventsData = await eventsRes.json();
        const content = Array.isArray(eventsData?.content)
          ? eventsData.content
          : Array.isArray(eventsData)
          ? eventsData
          : [];
        setEvents(content);
      } catch (e) {
        setErrorEvents(e.message || "Failed to load events");
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  // Fetch people/orgs (participants endpoint returns a plain array — not `.content`)
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [participantsRes, organizersRes, organizationsRes] =
          await Promise.all([
            //`http://localhost:2038/api/participant`,
            //`http://localhost:2038/api/organizer`,
            //`http://localhost:2038/api/organization`,
            fetch(API_ENDPOINTS.PARTICIPANTS),
            fetch(API_ENDPOINTS.ORGANIZERS),
            fetch(API_ENDPOINTS.ORGANIZATIONS),
          ]);

        if (!participantsRes.ok)
          throw new Error(`participants: ${participantsRes.status}`);
        if (!organizersRes.ok)
          throw new Error(`organizers: ${organizersRes.status}`);
        if (!organizationsRes.ok)
          throw new Error(`organizations: ${organizationsRes.status}`);

        const participantsData = await participantsRes.json();
        const organizersData = await organizersRes.json();
        const organizationsData = await organizationsRes.json();

        // IMPORTANT: participants is a plain array (to match Connect.jsx)
        const p = Array.isArray(participantsData) ? participantsData : [];
        const o = Array.isArray(organizersData?.content)
          ? organizersData.content
          : [];
        const g = Array.isArray(organizationsData?.content)
          ? organizationsData.content
          : [];

        const taggedParticipants = p.map((it) => ({
          ...it,
          __entityType: "Participant",
        }));
        const taggedOrganizers = o.map((it) => ({
          ...it,
          __entityType: "Organizer",
        }));
        const taggedOrganizations = g.map((it) => ({
          ...it,
          __entityType: "Organization",
        }));

        setParticipants(taggedParticipants);
        setOrganizers(taggedOrganizers);
        setOrganizations(taggedOrganizations);
        setLoadingFollow(false);
      } catch (err) {
        console.error("Fetch follow suggestions failed:", err);
        setErrorFollow(err);
        setLoadingFollow(false);
      }
    };

    fetchAll();
  }, []);

  // Build a quick lookup of firebaseUids the current user already follows
  const followingFirebaseUids = useMemo(
    () => new Set(user?.following || []),
    [user?.following]
  );

  // After data loads (and when user.following changes), initialize local "followed" ids
  useEffect(() => {
    // This effect is kept for potential future use but currently not needed
    // as we're not using followedUsers state in the UI
  }, [participants, organizers, organizations, followingFirebaseUids]);

  // Derive a stable display name
  const displayName = (item) =>
    item?.name ||
    item?.fullName ||
    item?.displayName ||
    item?.organizationName ||
    item?.company ||
    "Unknown";

  // Derive a stable id for UI keys and button state
  const deriveStableId = (item) => {
    const type = item?.__entityType || "Participant";
    const uid = item?.firebaseUid || item?.id || item?._id || displayName(item);
    return `${type}:${uid}`;
  };

  // Exclude: yourself + anyone already in user.following; then randomize and pick 6
  const featuredSix = useMemo(() => {
    const merged = [...participants, ...organizers, ...organizations];

    // Deduplicate by firebaseUid first (if present), otherwise by derived id
    const seen = new Set();
    const deduped = [];
    for (const item of merged) {
      const key = item?.firebaseUid || deriveStableId(item);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }

    // Filter out yourself + already followed
    const filtered = deduped.filter((item) => {
      const fid = item?.firebaseUid;
      if (!fid) return true; // if no firebaseUid, we can't match — let it pass
      if (user?.firebaseUid && fid === user.firebaseUid) return false; // exclude self
      if (followingFirebaseUids.has(fid)) return false; // exclude already-followed
      return true;
    });

    // Shuffle (Fisher–Yates)
    const shuffled = [...filtered];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 6);
  }, [
    participants,
    organizers,
    organizations,
    user?.firebaseUid,
    followingFirebaseUids,
  ]);

  // Events filtering and sorting logic
  const trendingEvents = useMemo(() => {
    if (!events.length) return [];

    // Sort by trending score (engagement metrics)
    const sorted = [...events].sort((a, b) => {
      const getTrendingScore = (event) => {
        const goingScore = (event.registeredBy?.length || 0) * 3;
        const bookmarkScore = (event.bookmarkedBy?.length || 0) * 1;
        return goingScore + bookmarkScore;
      };

      const scoreA = getTrendingScore(a);
      const scoreB = getTrendingScore(b);
      return scoreB - scoreA;
    });

    return sorted.slice(0, 3);
  }, [events]);

  const latestEvents = useMemo(() => {
    if (!events.length) return [];

    // Sort by createdAt (newest first)
    const sorted = [...events].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });

    return sorted.slice(0, 3);
  }, [events]);

  const userSpecificEvents = useMemo(() => {
    if (!events.length || !user) return [];

    let filteredEvents = [];

    if (userRole === "participant") {
      // Filter events by user's bookmarked event IDs
      const bookmarkedIds = user.bookmarkedEventIds || [];
      filteredEvents = events.filter((event) =>
        bookmarkedIds.includes(event.id)
      );
    } else if (userRole === "organizer" || userRole === "organization") {
      // Filter events by user's created event IDs
      const createdIds = user.eventIds || [];
      filteredEvents = events.filter((event) => createdIds.includes(event.id));
    }

    // Sort by creation date (newest first)
    return filteredEvents
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [events, user, userRole]);

  // Helper function to format event data for display
  const formatEventForDisplay = (event) => ({
    title: event.title,
    date: new Date(event.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    location: event.location || event.eventType || "Location TBD",
    participants: `${event.registeredBy?.length || 0}+`,
    image:
      event.coverImageUrl ||
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    id: event.id,
  });

  const carouselSlides = [
    {
      image: pic1,
      title: "One Click to Every Event",
      subtitle:
        "The ultimate platform for students and organizations to discover, create, and participate in amazing events",
      overlay: true,
    },
    {
      image: pic2,
      title: "Build Your Skills Through Real Projects",
      subtitle:
        "Join events that match your interests and showcase your talents to the world",
      overlay: true,
    },
    {
      image: pic3,
      title: "Network with Industry Professionals",
      subtitle:
        "Connect with organizations and build meaningful relationships for your future career",
      overlay: true,
    },
  ];

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselSlides.length]);

  const nextSlide = () =>
    setCurrentSlide((p) => (p + 1) % carouselSlides.length);
  const prevSlide = () =>
    setCurrentSlide(
      (p) => (p - 1 + carouselSlides.length) % carouselSlides.length
    );
  const goToSlide = (i) => setCurrentSlide(i);

  const stats = [
    { number: "500+", label: "Events Created" },
    { number: "10K+", label: "Students Connected" },
    { number: "100+", label: "Organizations" },
    { number: "50+", label: "Skills Categories" },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Student",
      content:
        "Event Lagbe helped me find amazing opportunities to showcase my skills and connect with industry professionals.",
      rating: 5,
    },
    {
      name: "Dr. Michael Chen",
      role: "University Professor",
      content:
        "This platform has revolutionized how we organize and manage student events. Highly recommended!",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Event Organizer",
      content:
        "The platform makes event management so much easier. Great features and excellent support team.",
      rating: 5,
    },
  ];

  const badgeClass = (type) => {
    if (type === "Participant") return "bg-blue-100 text-blue-800";
    if (type === "Organizer") return "bg-green-100 text-green-800";
    return "bg-purple-100 text-purple-800";
  };

  return (
    <div className="min-h-screen">
      {/* Carousel Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Slides */}
        <div className="relative h-full">
          {carouselSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {slide.overlay && (
                <div className="absolute inset-0 bg-black bg-opacity-50" />
              )}
              <div className="relative h-full flex items-center justify-center">
                <div className="text-center text-white max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h1 className="text-4xl md:text-6xl font-bold mb-6">
                    {slide.title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/events"
                      className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors duration-300 transform hover:scale-105"
                    >
                      Find Your Event
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <FiChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
          aria-label="Next slide"
        >
          <FiChevronRight className="w-6 h-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {carouselSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-yellow-400 scale-125"
                  : "bg-white bg-opacity-50 hover:bg-opacity-75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white bg-opacity-20">
          <div
            className="h-full bg-yellow-400 transition-all duration-5000 ease-linear"
            style={{
              width: `${((currentSlide + 1) / carouselSlides.length) * 100}%`,
            }}
          />
        </div>
      </section>

      {/* Events Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Discover Amazing Events
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find the perfect events that match your interests and skills
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Trending Events */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                <div className="flex items-center gap-3">
                  <FiTrendingUp className="text-2xl" />
                  <h3 className="text-xl font-bold">Trending Events</h3>
                </div>
                <p className="text-orange-100 mt-2">
                  Most popular events this week
                </p>
              </div>
              <div className="p-6 space-y-4">
                {loadingEvents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">
                      Loading trending events...
                    </p>
                  </div>
                ) : errorEvents ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-500">
                      Failed to load events
                    </p>
                  </div>
                ) : trendingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">
                      No trending events found
                    </p>
                  </div>
                ) : (
                  trendingEvents.map((event) => {
                    const formattedEvent = formatEventForDisplay(event);
                    return (
                      <Link
                        key={event.id}
                        to={`/event/${event.id}`}
                        className="block"
                      >
                        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex gap-3">
                            <img
                              src={formattedEvent.image}
                              alt={formattedEvent.title}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {formattedEvent.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {formattedEvent.date}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formattedEvent.location}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <FiUsers className="text-gray-400 text-sm" />
                                <span className="text-xs text-gray-500">
                                  {formattedEvent.participants} participants
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
                <Link
                  to="/events"
                  className="block text-center text-blue-600 hover:text-blue-700 font-medium mt-4"
                >
                  View All Trending →
                </Link>
              </div>
            </div>

            {/* Latest Events */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-white">
                <div className="flex items-center gap-3">
                  <FiCalendar className="text-2xl" />
                  <h3 className="text-xl font-bold">Latest Events</h3>
                </div>
                <p className="text-blue-100 mt-2">Fresh events just added</p>
              </div>
              <div className="p-6 space-y-4">
                {loadingEvents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">
                      Loading latest events...
                    </p>
                  </div>
                ) : errorEvents ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-500">
                      Failed to load events
                    </p>
                  </div>
                ) : latestEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">
                      No latest events found
                    </p>
                  </div>
                ) : (
                  latestEvents.map((event) => {
                    const formattedEvent = formatEventForDisplay(event);
                    return (
                      <Link
                        key={event.id}
                        to={`/event/${event.id}`}
                        className="block"
                      >
                        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex gap-3">
                            <img
                              src={formattedEvent.image}
                              alt={formattedEvent.title}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {formattedEvent.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {formattedEvent.date}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formattedEvent.location}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <FiUsers className="text-gray-400 text-sm" />
                                <span className="text-xs text-gray-500">
                                  {formattedEvent.participants} participants
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
                <Link
                  to="/events"
                  className="block text-center text-blue-600 hover:text-blue-700 font-medium mt-4"
                >
                  View All Latest →
                </Link>
              </div>
            </div>

            {/* User Specific Events */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 text-white">
                <div className="flex items-center gap-3">
                  <FiStar className="text-2xl" />
                  <h3 className="text-xl font-bold">
                    {userRole === "participant"
                      ? "Bookmarked Events"
                      : "Created Events"}
                  </h3>
                </div>
                <p className="text-green-100 mt-2">
                  {userRole === "participant"
                    ? "Your saved events"
                    : "Events you created"}
                </p>
              </div>
              <div className="p-6 space-y-4">
                {!user ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">
                      Please log in to see your events
                    </p>
                  </div>
                ) : loadingEvents ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">
                      Loading your events...
                    </p>
                  </div>
                ) : errorEvents ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-500">
                      Failed to load events
                    </p>
                  </div>
                ) : userSpecificEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">
                      {userRole === "participant"
                        ? "No bookmarked events yet"
                        : "No created events yet"}
                    </p>
                  </div>
                ) : (
                  userSpecificEvents.map((event) => {
                    const formattedEvent = formatEventForDisplay(event);
                    return (
                      <Link
                        key={event.id}
                        to={`/event/${event.id}`}
                        className="block"
                      >
                        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex gap-3">
                            <img
                              src={formattedEvent.image}
                              alt={formattedEvent.title}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {formattedEvent.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {formattedEvent.date}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formattedEvent.location}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <FiUsers className="text-gray-400 text-sm" />
                                <span className="text-xs text-gray-500">
                                  {formattedEvent.participants} participants
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
              <Link
                to={userRole === "participant" 
                  ? "/participantDashboard/bookmarked-events" 
                  : `/${userRole}Dashboard/events/running`}
                className="block text-center text-blue-600 hover:text-blue-700 font-medium items-end"
              >
                {userRole === "participant"
                  ? "View All Bookmarked →"
                  : "View All Created →"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-xl text-blue-100">
              See how we're helping students and organizations grow together
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-yellow-300 mb-2">
                  {stat.number}
                </div>
                <div className="text-lg text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Create Account
              </h3>
              <p className="text-gray-600">
                Sign up as a student or organization and complete your profile
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Discover Events
              </h3>
              <p className="text-gray-600">
                Browse events, filter by skills, and find opportunities that
                match your interests
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Connect & Participate
              </h3>
              <p className="text-gray-600">
                Join events, collaborate with others, and build your network
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Real feedback from students and organizations using our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <FiStar key={j} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{t.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-gray-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* People You Can Follow (real data, random 6 excluding already-followed + self) */}
      {user && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                People You Can Follow
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Connect with participants, organizers, and organizations to
                expand your network
              </p>
            </div>

            {loadingFollow && (
              <div className="text-center py-12 text-blue-600 text-xl">
                Loading...
              </div>
            )}
            {errorFollow && (
              <div className="text-center py-12 text-red-600 text-xl">
                Error: {errorFollow.message}
              </div>
            )}

            {!loadingFollow && !errorFollow && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredSix.map((item) => {
                    const id = deriveStableId(item);
                    const type = item?.__entityType || "Participant";
                    return (
                      <div
                        key={id}
                        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <img
                            src={
                              item?.profilePictureUrl ||
                              "https://res.cloudinary.com/dfvwazcdk/image/upload/v1753161431/generalProfilePicture_inxppe.png"
                            }
                            alt={displayName(item)}
                            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {displayName(item)}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${badgeClass(
                                  type
                                )}`}
                              >
                                {type}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-2">
                              {(Array.isArray(item?.followers) &&
                                item.followers.length) ||
                                0}{" "}
                              followers
                            </p>

                            {/* Skills (optional) */}
                            {Array.isArray(item?.skills) &&
                              item.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                  {item.skills.slice(0, 3).map((skill, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                  {item.skills.length > 3 && (
                                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                                      +{item.skills.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}

                            {/* Follow */}
                            <Link
                              to={`/profile/${item.firebaseUid}`}
                              className={`w-full btn font-bold border-2 border-blue-500 bg-blue-50 py-2 px-4 rounded-lg font-medium`}
                            >
                              View Profile
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center mt-12">
                  <Link
                    to="/Connect"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-lg"
                  >
                    View All People to Follow
                    <FiPlus className="text-sm" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
