'use client';

import React, { useState } from "react";
import { UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import ButtonSpinner from "../ButtonSpinner";


const LoginForm: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const formSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!username) return toast.error("اسم المستخدم مطلوب");
    if (!password) return toast.error("كلمة المرور مطلوبة");

    try {
      setLoading(true);

      const response = await axios.post(
       `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`,
        { username, password },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
       }
     );

      console.log('Login response:', response.data);
      toast.success("تم تسجيل الدخول بنجاح");
      
      router.push("/");
      router.refresh();

    } catch (error: unknown) {
      console.error("Login error:", error);
      
      // Proper error handling with type guards
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.detail || "فشل تسجيل الدخول";
        toast.error(errorMessage);
      } else if (error instanceof Error) {
        toast.error(error.message || "فشل تسجيل الدخول");
      } else {
        toast.error("فشل تسجيل الدخول");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-300 via-gray-500 to-gray-300 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl grid lg:grid-cols-2 overflow-hidden">
        {/* Left Side - Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6 text-center flex items-center justify-center">
            <Image 
              src="/slogan.gif" 
              alt="Logo" 
              width={100} 
              height={100}
              priority
            />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
            الدخول الى حسابك
          </h1>
          
          <p className="text-gray-600 mb-8 text-center">
          اهلا وسهلا بكم في نظام ارشفة اللجان الالكتروني
          </p>

          <form onSubmit={formSubmitHandler} className="space-y-6" noValidate>
            {/* Username Field */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-bold text-gray-700 mb-1"
              >
                اسم المستخدم
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="اسم المستخدم"
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-bold text-gray-700 mb-1"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                
                {/* Eye Icon Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition duration-200"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between text-sm">
              <a 
                href="#" 
                className="font-bold text-indigo-600 hover:text-indigo-500 transition duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("تواصل مع تقنية المعلومات لاستعادة كلمة المرور");
                }}
              >
                هل نسيت كلمة المرور؟
              </a>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-2xl font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? <ButtonSpinner /> : "الدخول"}
              </button>
            </div>
          </form>

          {/* Register Link */}
          <p className="mt-10 text-center text-sm text-gray-600">
            لست عضوًا؟{" "}
            <a 
              href="/register" 
              //  href="#" 
              className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-200"
            >
              سجل الآن
            </a>
          </p>
        </div>

        {/* Right Side - Background Image */}
        <div className="hidden lg:block relative">
          <Image
            src="https://images.unsplash.com/photo-1527176930608-09cb256ab504?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80"
            alt="نظام ارشفة اللجان الالكتروني"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-10 left-10 text-white p-4">
            <h2 className="text-3xl font-semibold mb-2">
              نظام ارشفة اللجان الالكتروني
            </h2>
            <p className="text-lg">
              قسم تقنية المعلومات - شعبة الشبكات والانظمة البرمجية
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;