import {  User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Logout } from "./auth/Logout";
import { TbLockPassword } from "react-icons/tb";

interface Props {
  userData: {
    username: string;
    permission: string;
    userID: string;
  } | null;
}

export default function UserDropdown({ userData }: Props) {
//   const router = useRouter();

//   const handleLogout = async () => {
//     try {
//       await fetch("http://localhost:9000/auth/logout", {
//         method: "POST",
//         credentials: "include", // Required to send cookies
//       });

//       router.push("/login");
//     } catch (error) {
//       console.error("Logout failed", error);
//     }
//   };

  if (!userData) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild  className="border-indigo-500" >
        <Button variant="ghost" className="flex items-center gap-2 text-black cursor-pointer ">
          <User className="w-4 h-4 text-black  " />
          {/* <span className="text-sm font-semibold">{userData.username}</span> */}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-44  transition-all duration-300 ease-in-out" align="end">

    
      <DropdownMenuItem className="flex items-center justify-between gap-4 whitespace-nowrap">
  {/* Left: User Info */}
  <div className="flex items-center min-w-0 gap-2 overflow-hidden">
    <User className="w-4 h-4 text-sky-600 shrink-0" />
    <span className="text-sm font-semibold truncate">{userData.username}</span>
  </div>

  {/* Right: Greeting */}
  <span className="font-bold shrink-0">أهلا وسهلا</span>
</DropdownMenuItem>


           <DropdownMenuSeparator />

                    <DropdownMenuItem className="flex flex-row items-center justify-between gap-x-8">

                        <TbLockPassword color="skyblue"/>

                   <span className=" font-bold">تغيير كلمة المرور</span>
                   

                    </DropdownMenuItem>


            <DropdownMenuSeparator />

        <Logout/>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
