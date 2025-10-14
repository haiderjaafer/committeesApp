import { cookies } from "next/headers";

import ClientLayout from "./ClientLayout";
import { verifyTokenForPage } from "@/utiles/verifyToken";


interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default async function LayoutWrapper({ children }: LayoutWrapperProps) {   // this LayoutWrapper is server component will render client component ClientLayout with prop
   const cookieStore = await cookies();
  const token = cookieStore.get("jwt_cookies_auth_token")?.value; 

  const payload = token ? verifyTokenForPage(token) : null;  // check for token not null will run verifyTokenForPage esle null

  // If no valid token, pass null to ClientLayout and let it handle redirection
  const userData = payload                      // userData and payload as same type of JWTPayload coz verifyTokenForPage of type JWTPayload
    ? {
        userID: payload.id?.toString() || "",
        username: payload.username || "",
        permission: payload.permission || "",
      }
    : null;
  

  return (
    <ClientLayout userData={userData}>
      {children}
    </ClientLayout>
  );
}



















