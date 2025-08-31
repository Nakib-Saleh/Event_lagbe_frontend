import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthContext from "../Provider/AuthContext";

/**
 * PrivateRoute Component
 * - Restricts access to authenticated users only.
 * - Redirects unauthenticated users to the login page.
 *
 * Usage:
 * <PrivateRoute><SomeComponent /></PrivateRoute>
 */
const PrivateRoute = ({ children, allowedRoles }) => {
    const { loading, user, userRole } = useContext(AuthContext);
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Authenticated but not authorized
        return <Navigate to="/error" replace />;
    }

    // Authenticated (and authorized if roles specified)
    return children;
};

export default PrivateRoute;
