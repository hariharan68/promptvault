import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F3F4F6] dark:bg-[#1A1B22]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#714B67] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#6B7280] text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
