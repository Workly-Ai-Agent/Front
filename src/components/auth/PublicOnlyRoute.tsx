import { Navigate } from "react-router-dom";

type Props = {
  children: React.ReactNode;
};

export default function PublicOnlyRoute({ children }: Props) {
  const tokenInStorage =
    typeof window !== "undefined"
      ? localStorage.getItem("workly-access-token")
      : null;

  const isAuthenticated = Boolean(tokenInStorage);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
