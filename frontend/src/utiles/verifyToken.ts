
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  id: number;
  username: string;
  permission: string;
}

export function verifyTokenForPage(token: string): JWTPayload | null {
  try {
    if (!token || token.trim() === '') {
      console.log("No token provided");
      return null;
    }

    const privateKey = process.env.JWT_SECRET as string;
    
    

    if (!privateKey) {
      console.error("Missing JWT_SECRET");
      throw new Error("Missing JWT_SECRET");
    }

    const userPayload = jwt.verify(token, privateKey) as JWTPayload;

   

    if (!userPayload.id || !userPayload.username) {
      console.error("Invalid token structure - missing required fields");
      return null;
    }

    return userPayload;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}






// import jwt from 'jsonwebtoken';

// export interface JWTPayload {
//   id: number;
//   username: string;
//   permission: string;
 
// }
// //  Safely verify JWT and return decoded payload
// export function verifyTokenForPage(token: string): JWTPayload | null {
//   try {
//     // Add token validation first
//     if (!token || token.trim() === '') {
//       console.error("No token provided");
//       return null;
//     }

//     const privateKey = process.env.JWT_SECRET as string;
//     console.log("privateKey", privateKey);
//     console.log("token", token); // Add this to debug
    
//     if (!privateKey) throw new Error("Missing JWT_SECRET");
    
//     const userPayload = jwt.verify(token, privateKey) as JWTPayload;
    
//     if (!userPayload.id || !userPayload.username) {
//       console.error("Invalid token structure - missing required fields");
//       return null;
//     }
//     return userPayload;
//   } catch (error) {
//     console.error("Invalid or expired token", error);
//     return null;
//   }
// }