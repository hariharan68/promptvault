import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f4f6fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#868da3] text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
