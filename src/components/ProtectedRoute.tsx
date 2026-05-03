import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/src/context/AuthContext";

interface Props {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
