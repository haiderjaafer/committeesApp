'use client';

import React, { useState } from "react";
import {
  UserIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import ButtonSpinner from "../ButtonSpinner";

type PermissionType = "user" | "admin";

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [permission, setPermission] = useState<PermissionType>("user");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  const validateForm = (): boolean => {
    if (!username.trim()) {
      toast.error("اسم المستخدم مطلوب");
      return false;
    }

    if (username.length < 3) {
      toast.error("اسم المستخدم يجب أن يكون 3 أحرف على الأقل");
      return false;
    }

    if (!username.match(/^[a-zA-Z0-9]+$/)) {
      toast.error("اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط");
      return false;
    }

    if (!password) {
      toast.error("كلمة المرور مطلوبة");
      return false;
    }

    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return false;
    }

    return true;
  };

 const formSubmitHandler = async (e: React.FormEvent) => { 
  e.preventDefault();

  if (!validateForm()) return;

  setLoading(true);

  try {
    // Step 1: Register user (FastAPI)
    const registerResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`,
      {
        username: username.trim(),
        password,
        permission
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Register response:', {
      status: registerResponse.status,
      data: registerResponse.data
    });

    toast.success("تم إنشاء الحساب بنجاح!", { position: 'top-right', autoClose: 3000 });

    // Step 2: Create user directory (Next.js API)
    try {
      // const directoryResponse = await axios.post(
      //   `${process.env.NEXT_PUBLIC_FOLDER_CREATION_API_BASE_URL}/api/createUserDirectory`,
      //   { username: username.trim() },
      //   {
      //     withCredentials: true,
      //     headers: { 'Content-Type': 'application/json' }
      //   }
      // );

      // console.log('Directory creation response:', {
      //   status: directoryResponse.status,
      //   data: directoryResponse.data
      // });

      // toast.success(directoryResponse.data.message || "تم إنشاء مجلد المستخدم بنجاح", {
      //   position: 'top-right',
      //   autoClose: 3000
      // });

      // Redirect to home page
      router.push("/");
      router.refresh();

    } catch (dirError: unknown) {
      console.error("Directory creation error:", dirError);
      if (dirError instanceof AxiosError) {
        const errorMessage = dirError.response?.data?.message || "فشل في إنشاء مجلد المستخدم";
        toast.error(errorMessage, { position: 'top-right', autoClose: 5000 });
      } else {
        toast.error("فشل في إنشاء مجلد المستخدم", { position: 'top-right', autoClose: 5000 });
      }
    }

  } catch (error: unknown) {
    console.error("Registration error:", error);

    if (error instanceof AxiosError) {
      let errorMessage = error.response?.data?.detail || "فشل في إنشاء الحساب";

      // Translate specific backend message
      if (errorMessage === "User already exists") {
        errorMessage = "اسم المستخدم موجود بالفعل، يرجى اختيار اسم آخر";
      }

      toast.error(errorMessage, { position: 'top-right', autoClose: 5000 });

    } else if (error instanceof Error) {
      toast.error(error.message || "فشل في إنشاء الحساب", { position: 'top-right', autoClose: 5000 });
    } else {
      toast.error("فشل في إنشاء الحساب", { position: 'top-right', autoClose: 5000 });
    }

  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-300 via-gray-500 to-gray-300 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl grid lg:grid-cols-2 overflow-hidden">
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
            إنشاء حساب جديد
          </h1>

          <p className="text-gray-600 mb-8 text-center">
            اهلا وسهلا بكم في نظام متابعة الكتب الالكترونية
          </p>

          <form onSubmit={formSubmitHandler} className="space-y-6" noValidate>
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-1">
                اسم المستخدم <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="اسم المستخدم (أحرف وأرقام فقط، 3 أحرف على الأقل)"
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                />
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">
                كلمة المرور <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="كلمة المرور (6 أحرف على الأقل)"
                  className="w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-1">
                تأكيد كلمة المرور <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="تأكيد كلمة المرور"
                  className={`w-full px-4 py-3 pl-10 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  كلمات المرور غير متطابقة
                </p>
              )}
            </div>

            {/* Permission */}
            <div>
              <label htmlFor="permission" className="block text-sm font-bold text-gray-700 mb-1">
                الصلاحية
              </label>
              <div className="relative">
                <select
                  id="permission"
                  name="permission"
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 appearance-none bg-white"
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as PermissionType)}
                >
                  <option value="user">مستخدم عادي</option>
                  <option value="admin">مدير النظام</option>
                </select>
                <ShieldCheckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {permission === "admin"
                  ? "سيكون لديك صلاحيات كاملة في النظام"
                  : "صلاحيات أساسية للاستخدام العادي"}
              </p>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-2xl font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? <ButtonSpinner /> : "إنشاء الحساب"}
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-600">
            لديك حساب بالفعل؟{" "}
            <a
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-200"
            >
              تسجيل الدخول
            </a>
          </p>
        </div>

        {/* Right Side */}
        <div className="hidden lg:block relative">
          <Image
            src="https://images.unsplash.com/photo-1527176930608-09cb256ab504?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80"
            alt="نظام متابعة الكتب الالكترونية"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-10 left-10 text-white p-4">
            <h2 className="text-3xl font-semibold mb-2">
              نظام متابعة الكتب الالكترونية
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

export default RegisterForm;