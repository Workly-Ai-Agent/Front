import { Navigate } from "react-router-dom";
import { useSessionStore } from "../../stores/sessionStore";

type Props = {
  children: React.ReactNode;
};

export default function PublicOnlyRoute({ children }: Props) {
  const accessToken = useSessionStore((state) => state.accessToken);
  const tokenInStorage =
    typeof window !== "undefined"
      ? localStorage.getItem("workly-access-token")
      : null;

  const isAuthenticated = Boolean(accessToken || tokenInStorage);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
