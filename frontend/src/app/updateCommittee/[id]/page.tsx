// import UpdateCommitteeByID from "@/components/UpdateCommitteeByID/UpdateCommitteeByIDComponent";
// // import { verifyTokenForPage } from "@/utiles/verifyToken";
// // import { cookies } from "next/headers";

// interface PageProps {
//   params: Promise<{
//     id: string;
//   }>;
// }

// const UpdateCommitteeByIDPage = async ({ params }: PageProps) => {
//   const { id } = await params; // Now await the params Promise

// //   const cookieStore = await cookies();
// //   const token = cookieStore.get("jwt_cookies_auth_token")?.value || '';
// //   const payload = verifyTokenForPage(token);

// //   if (!payload) {
// //     // Optional: redirect or render error
// //     return <div>Unauthorized</div>; // Consider redirecting to an error page
// //   }

//   return (
//     <div>
//       <UpdateCommitteeByID committeeId={id} payload={payload} />
//     </div>
//   );
// };

// export default UpdateCommitteeByIDPage;


import UpdateCommitteeByID from "@/components/UpdateCommitteeByID/UpdateCommitteeByIDComponent";
// import { verifyTokenForPage } from "@/utiles/verifyToken";
// import { cookies } from "next/headers";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const UpdateCommitteeByIDPage = async ({ params }: PageProps) => {
  const { id } = await params; // Now await the params Promise

  // Static payload as requested
  const payload = {
    id: 1,
    username: "admin",
    permission: "administrator",

  };

//   const cookieStore = await cookies();
//   const token = cookieStore.get("jwt_cookies_auth_token")?.value || '';
//   const payload = verifyTokenForPage(token);

//   if (!payload) {
//     // Optional: redirect or render error
//     return <div>Unauthorized</div>; // Consider redirecting to an error page
//   }

  return (
    <div>
      <UpdateCommitteeByID committeeId={id} payload={payload} />
    </div>
  );
};

export default UpdateCommitteeByIDPage;