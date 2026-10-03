import { Navigate, useLocation } from "react-router-dom";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const tokenInStorage =
    typeof window !== "undefined"
      ? localStorage.getItem("workly-access-token")
      : null;
  const location = useLocation();

  const isAuthenticated = Boolean(tokenInStorage);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
