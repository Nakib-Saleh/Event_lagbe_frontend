import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../Components/MainLayout";
import ErrorPage from "../Components/Errorpage";
import Home from "../Pages/Home";
import Register from "../Pages/Register";
import Login from "../Pages/Login";
import AdminDashboard from "../Pages/Dashboard/Admin/AdminDashboard";
import Verification from "../Pages/Dashboard/Admin/Verification";
import OrganizationVerification from "../Pages/Dashboard/Organization/Verification";
import UserList from "../Pages/Dashboard/Admin/UserList";
import SkillsList from "../Pages/Dashboard/Admin/SkillsList";
import AdminCalendar from "../Pages/Dashboard/Admin/Calendar";
import DeactivateExpiredEvents from "../Pages/Dashboard/Admin/DeactivateExpiredEvents";
import CreateAdmin from "../Pages/Dashboard/Admin/CreateAdmin";
import PrivateRoute from "./PrivateRoutes";
import OrganizationDashboard from "../Pages/Dashboard/Organization/OrganizationDashboard";
import OrganizerList from "../Pages/Dashboard/Organization/OrganizerList";
import AdminProfile from "../Pages/Dashboard/Admin/AdminProfile";
import OrgProfile from "../Pages/Dashboard/Organization/OrgProfile";
import ParticipantDashboard from "../Pages/Dashboard/Participant/ParticipantDashboard";
import ParticipantProfile from "../Pages/Dashboard/Participant/ParticipantProfile";
import BookmarkedEvents from "../Pages/Dashboard/Participant/BookmarkedEvents";
import RegisteredEvents from "../Pages/Dashboard/Participant/RegisteredEvents";
import Followers from "../Pages/Dashboard/Participant/Followers";
import Following from "../Pages/Dashboard/Participant/Following";
import ParticipantCalendar from "../Pages/Dashboard/Participant/Calendar";
import OrganizerDashboard from "../Pages/Dashboard/Organizer/OrganizerDashboard";
import OrganizerProfile from "../Pages/Dashboard/Organizer/OrganizerProfile";
import RunningEvents from "../Pages/Dashboard/Organizer/RunningEvents";
import OrganizerPastEvents from "../Pages/Dashboard/Organizer/PastEvents";
import OrganizerFollowers from "../Pages/Dashboard/Organizer/Followers";
import OrganizerFollowing from "../Pages/Dashboard/Organizer/Following";
import OrganizerRegisteredList from "../Pages/Dashboard/Organizer/RegisteredList";
import OrganizationRegisteredList from "../Pages/Dashboard/Organization/RegisteredList";
import PublicProfile from "../Pages/PublicProfile";
import EventAdd from "../Pages/EventAdd";
import EventEdit from "../Pages/EventEdit";
import Connect from "../Pages/Connect";
import AllEvents from "../Pages/AllEvents";
import EventDetails from "../Pages/EventDetails";

const PublicRoutes = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout></MainLayout>,
    children: [
      {
        path: "/",
        element: <Home></Home>,
      },
      {
        path: "/Connect",
        element: (
          <PrivateRoute>
            <Connect></Connect>
          </PrivateRoute>
        ),
      },
      {
        path: "/events",
        element: <AllEvents></AllEvents>,
      },
      {
        path: "/event/:eventId",
        element: <EventDetails></EventDetails>,
      },
      {
        path: "/event-edit/:eventId",
        element: (
          <PrivateRoute allowedRoles={["organization", "organizer"]}>
            <EventEdit></EventEdit>
          </PrivateRoute>
        ),
      },
      {
        path: "/adminDashboard",
        element: (
          <PrivateRoute allowedRoles={["admin"]}>
            <AdminDashboard></AdminDashboard>
          </PrivateRoute>
        ),
        children: [
          {
            path: "/adminDashboard",
            element: <Navigate to="/adminDashboard/profile" replace />,
          },
          {
            path: "/adminDashboard/profile",
            element: <AdminProfile></AdminProfile>,
          },
          {
            path: "/adminDashboard/verification",
            element: <Verification></Verification>,
          },
          {
            path: "/adminDashboard/users",
            element: <UserList></UserList>,
          },
          {
            path: "/adminDashboard/skills",
            element: <SkillsList></SkillsList>,
          },
          {
            path: "/adminDashboard/calendar",
            element: <AdminCalendar></AdminCalendar>,
          },
          {
            path: "/adminDashboard/deactivate-expired-events",
            element: <DeactivateExpiredEvents></DeactivateExpiredEvents>,
          },
          {
            path: "/adminDashboard/create-admin",
            element: <CreateAdmin></CreateAdmin>,
          },
        ],
      },
      {
        path: "/organizationDashboard",
        element: (
          <PrivateRoute allowedRoles={["organization"]}>
            <OrganizationDashboard></OrganizationDashboard>
          </PrivateRoute>
        ),
        children: [
          {
            path: "/organizationDashboard",
            element: <Navigate to="/organizationDashboard/profile" replace />,
          },
          {
            path: "/organizationDashboard/profile",
            element: <OrgProfile></OrgProfile>,
          },
          {
            path: "/organizationDashboard/verification",
            element: <OrganizationVerification></OrganizationVerification>,
          },
          {
            path: "/organizationDashboard/organizers",
            element: <OrganizerList></OrganizerList>,
          },
          {
            path: "/organizationDashboard/events",
            element: <Navigate to="/organizationDashboard/events/running" replace />,
          },
          {
            path: "/organizationDashboard/events/running",
            element: <RunningEvents></RunningEvents>,
          },
          {
            path: "/organizationDashboard/events/past",
            element: <OrganizerPastEvents></OrganizerPastEvents>,
          },
          {
            path: "/organizationDashboard/followers",
            element: <Followers></Followers>,
          },
          {
            path: "/organizationDashboard/following",
            element: <Following></Following>,
          },
          {
            path: "/organizationDashboard/registered-list",
            element: <OrganizationRegisteredList></OrganizationRegisteredList>,
          },
        ],
      },
      {
        path: "/participantDashboard",
        element: (
          <PrivateRoute allowedRoles={["participant"]}>
            <ParticipantDashboard></ParticipantDashboard>
          </PrivateRoute>
        ),
        children: [
          {
            path: "/participantDashboard",
            element: <Navigate to="/participantDashboard/profile" replace />,
          },
          {
            path: "/participantDashboard/profile",
            element: <ParticipantProfile></ParticipantProfile>,
          },
          {
            path: "/participantDashboard/bookmarked-events",
            element: <BookmarkedEvents></BookmarkedEvents>,
          },
          {
            path: "/participantDashboard/registered-events",
            element: <RegisteredEvents></RegisteredEvents>,
          },
          {
            path: "/participantDashboard/followers",
            element: <Followers></Followers>,
          },
          {
            path: "/participantDashboard/following",
            element: <Following></Following>,
          },
          {
            path: "/participantDashboard/calendar",
            element: <ParticipantCalendar></ParticipantCalendar>,
          },
        ],
      },
      {
        path: "/organizerDashboard",
        element: (
          <PrivateRoute allowedRoles={["organizer"]}>
            <OrganizerDashboard></OrganizerDashboard>
          </PrivateRoute>
        ),
        children: [
          {
            path: "/organizerDashboard",
            element: <Navigate to="/organizerDashboard/profile" replace />,
          },
          {
            path: "/organizerDashboard/profile",
            element: <OrganizerProfile></OrganizerProfile>,
          },
          {
            path: "/organizerDashboard/events/running",
            element: <RunningEvents></RunningEvents>,
          },
          {
            path: "/organizerDashboard/events/past",
            element: <OrganizerPastEvents></OrganizerPastEvents>,
          },
          {
            path: "/organizerDashboard/followers",
            element: <OrganizerFollowers></OrganizerFollowers>,
          },
          {
            path: "/organizerDashboard/following",
            element: <OrganizerFollowing></OrganizerFollowing>,
          },
          {
            path: "/organizerDashboard/registered-list",
            element: <OrganizerRegisteredList></OrganizerRegisteredList>,
          },
        ],
      },
      {
        path: "/add-event",
        element: (
          <PrivateRoute allowedRoles={["organization","organizer"]}>
            <EventAdd></EventAdd>
          </PrivateRoute>
        ),
      },
      {
        path: "/profile/:firebaseUid",
        element: <PublicProfile></PublicProfile>,
      },
      {
        path: "/register",
        element: <Register></Register>,
      },
      {
        path: "/login",
        element: <Login></Login>,
      },
      {
        path: "/error",
        element: <ErrorPage></ErrorPage>,
      },
      {
        path: "*",
        element: <ErrorPage></ErrorPage>,
      },
    ],
  },
]);

export default PublicRoutes;
