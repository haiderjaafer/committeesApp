'use client';

import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LogOut } from 'lucide-react';

export const Logout = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        }
      );
      toast.success('تم تسجيل الخروج بنجاح');
      router.push('/login');
      router.refresh();
    } catch (error) {
      // Proper error handling without 'any'
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.detail || 'فشل تسجيل الخروج';
        toast.error(errorMessage);
      } else {
        toast.error('فشل تسجيل الخروج');
      }
      console.error('Logout error:', error);
    }
  };

  return (
   
    <button
  onClick={handleLogout}
  className="px-3 py-2 w-full flex items-center justify-between rounded hover:bg-sky-100 transition-colors duration-200"
>
  <LogOut color="skyblue" className="h-4 w-4" />
  <span className="text-sm font-extrabold text-black">تسجيل الخروج</span>
</button>

   
  );
};


//flex: Makes the button a flex container.
// justify-between: Distributes space between the icon and the text.
//w-full: Ensures enough width for spacing. You can control the width if needed