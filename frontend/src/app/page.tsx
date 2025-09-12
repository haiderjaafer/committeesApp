"use client";
import WeatherClock from "@/components/ClockComponent";
import axios from "axios";
import Link from "next/link";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Typewriter from "typewriter-effect";

// Define TypeScript interface for motion component props
interface MotionProps {
  children: React.ReactNode;
  className?: string;
  initial?: any;
  animate?: any;
  transition?: any;
  whileHover?: any;
  whileTap?: any;
  exit?: any;
  style?: React.CSSProperties;
  [key: string]: any;
}

// Simple motion components with TypeScript types
const motion = {
  div: ({ children, className = "", style, ...props }: MotionProps) => (
    <div className={`${className} transition-all duration-500 ease-out`} style={style} {...props}>
      {children}
    </div>
  ),
  h1: ({ children, className = "", ...props }: MotionProps) => (
    <h1 className={`${className} animate-fade-in-up`} {...props}>
      {children}
    </h1>
  ),
  p: ({ children, className = "", ...props }: MotionProps) => (
    <p className={`${className} animate-fade-in-up animation-delay-200`} {...props}>
      {children}
    </p>
  ),
  button: ({ children, className = "", ...props }: MotionProps) => (
    <button className={`${className} hover:scale-105 active:scale-95 transition-transform duration-200`} {...props}>
      {children}
    </button>
  ),
};

interface apiResponse {
allCommitteeCount : number;
usersCount : number;

}

const BookArchiveHero = () => {

  const API_BASE_URL = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || '', []);

  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showFloatingBooks, setShowFloatingBooks] = useState(false);

  const [lastCommitteeNo, setLastCommitteeNo] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);



  // Book data with placeholder book covers
  const books = [
    { id: 1, title: "شركة مصافي الوسط", color: "from-purple-500 to-purple-700" },
    { id: 2, title: "تقنية المعلومات والاتصالات", color: "from-blue-500 to-blue-700" },
    { id: 3, title: "الشبكات والانظمة البرمجية", color: "from-green-500 to-green-700" },
    
//    { id: 4, title: "Web Security", color: "from-red-500 to-red-700" },
  //  { id: 5, title: "برمجة الانظمة والشبكات", color: "from-orange-500 to-orange-700" },
  ];


   // Set mounted to true on initial render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show floating books after a 2-second delay
  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => {
      setShowFloatingBooks(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [mounted]);

  // Auto-slide books
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setCurrentBookIndex((prev) => (prev + 1) % books.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [books.length, mounted]);

  const getRandomPosition = (index: number) => {
    return {
      left: `${10 + index * 15}%`,
      animationDelay: `${index * 1.5}s`,
    };
  };


     // 🔹 reusable function to fetch last committee number
  const fetchLastCommitteeNo = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await axios.get<{ lastCommitteeNo: string }>(
        `${API_BASE_URL}/api/committees/lastCommitteeNo`,
        { signal }
      );
      setLastCommitteeNo(res.data.lastCommitteeNo);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Request canceled");
      } else {
        console.error("Error fetching last committeeNo:", err);
        setLastCommitteeNo(null);
      }
    }
  }, []);

  // 🔹 fetch on mount with cleanup
  useEffect(() => {
    const controller = new AbortController();
    fetchLastCommitteeNo(controller.signal);
    return () => controller.abort();
  }, [fetchLastCommitteeNo]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await axios.get<apiResponse>(`${API_BASE_URL}/api/committees/getCommitteeCounts`);
        setCount(res.data.allCommitteeCount); // API returns { allCommitteeCount: "22" }
        setUsersCount(res.data.usersCount);
        
      } catch (error) {
        console.error("Error fetching count:", error);
      }
    };

    fetchCount();
  }, []);

 

  if (!mounted) return null;



  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes floatUp {
          from {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0.7;
          }
          to {
            transform: translateY(-20vh) rotate(360deg);
            opacity: 0.3;
          }
        }
        @keyframes bookRotate {
          0%,
          100% {
            transform: rotateY(0deg) rotateX(0deg);
          }
          25% {
            transform: rotateY(-5deg) rotateX(2deg);
          }
          75% {
            transform: rotateY(5deg) rotateX(-2deg);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }
        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }
        .animation-delay-800 {
          animation-delay: 0.8s;
          opacity: 0;
        }
        .floating-book {
          position: absolute;
          width: 4rem;
          height: 5rem;
          opacity: 0;
          transform: translateY(100vh);
          pointer-events: none;
        }
        .floating-book.visible {
          opacity: 1;
          animation: floatUp 8s linear infinite;
        }
        .book-3d {
          animation: bookRotate 6s ease-in-out infinite;
          transform-style: preserve-3d;
          width:300px;
        }
        .book-3d:hover {
          animation-play-state: paused;
          transform: rotateY(-10deg) rotateX(5deg) scale(1.05);
        }
        .itc-text {
          position: absolute;
          top: 18%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 3rem;
          font-weight: bold;
          color: white;
          opacity: 0.15;
          pointer-events: none;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
          z-index: 1; /* Behind floating books */
        }
          .itc1-text {
          position: absolute;
          top: 8%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 3rem;
          font-weight: bold;
          color: white;
          opacity: 0.15;
          pointer-events: none;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
          z-index: 1; /* Behind floating books */
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0 bg-repeat"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        {/* Floating Books Animation and ITC Text */}
        <div className="absolute inset-0 pointer-events-none ">
          {books.map((book, index) => (
            <div
              key={book.id}
              className={`floating-book rounded-lg shadow-2xl bg-gradient-to-br ${book.color} ${showFloatingBooks ? "visible" : ""}`}
              style={getRandomPosition(index)}
            >
              <div className="w-full h-full rounded-lg border-2 border-white/20 flex items-center justify-center ">
                <div className="w-2 h-12 bg-white/30 rounded-full"></div>
              </div>
            </div>
          ))}
          {/* ITC Text in the Background with Floating Books */}
          <div className="itc1-text">قسم تقنية المعلومات والاتصالات</div>
          <div className="itc-text">ITC</div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex items-start justify-center min-h-screen px-4 pt-60"> {/* Changed items-center to items-start, reduced pt-4 to pt-2 */}
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start"> {/* Changed items-center to items-start */}
            {/* Left Side - Text Content */}
            <div className="text-white space-y-4"> {/* Reduced space-y-6 to space-y-4 */}
              <div>
                <Typewriter
                  options={{
                    strings: ["قسم الموارد البشرية - شعبة الاجازات"],
                    autoStart: true,
                    wrapperClassName:
                      "text-5xl font-bold leading-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent",
                    loop: true,
                    delay: "natural",
                  }}
                />
              </div>

              <motion.p className="md:text-2xl text-gray-300 leading-relaxed max-w-2xl animation-delay-400 font-extrabold text-3xl">
                نظام ارشفة الوثائق الالكتروني يوفر حفظ معلومات اللجان ونسخة من كتاب اللجنة بشكل امن وبلغة برمجية حديثة في قاعدة بينانات رصينة لتسهل عمليات البحث عن لجان الشركة وطباعة تقارير اللجان
              </motion.p>

              <div className="flex space-x-4 pt-2 animate-fade-in-up animation-delay-800"> {/* Reduced pt-4 to pt-2 */}
                <Link
                  href="/addCommitteeBooks"
                  className="
                    inline-block
                    px-14 py-4
                    bg-gradient-to-r from-blue-500 to-purple-600
                    rounded-full font-semibold text-white
                    shadow-2xl
                    transform
                    transition-transform duration-150 ease-out
                    hover:scale-105 hover:shadow-xl
                    active:scale-95 active:translate-y-1
                    focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/30
                    select-none
                  "
                >
                  الاضافة
                </Link>
                <Link
                  href="/searchPanel"
                  className="
                    inline-block
                    px-16 py-4
                    bg-gradient-to-r from-blue-500 to-purple-600
                    rounded-full font-semibold text-white
                    shadow-2xl
                    transform
                    transition-transform duration-150 ease-out
                    hover:scale-105 hover:shadow-xl
                    active:scale-95 active:translate-y-1
                    focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/30
                    select-none
                  "
                >
                  البحث
                </Link>
              </div>
            </div>

            {/* Right Side - Featured Book Display */}
            <div className="flex justify-center lg:justify-end ">
              <div className="relative animate-fade-in-up animation-delay-400">
                {/* Main Book */}
                <div
                  className={`book-3d w-64 h-80 rounded-2xl shadow-2xl bg-gradient-to-br ${books[currentBookIndex].color} relative transition-all duration-700`}
                >
                  {/* Book Spine */}
                  <div className="absolute left-0 top-0 w-8 h-full bg-black/20 rounded-l-2xl"></div>

                  {/* Book Cover Content */}
                  <div className="p-8 h-full flex flex-col justify-between ">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-4 transition-all duration-700">
                        {books[currentBookIndex].title}
                      </h3>
                      <div className="w-12 h-1 bg-white/50 mb-4"></div>
                      <p className="text-white/80  leading-relaxed font-extrabold text-xl ">
                        نظام ارشفة لجان الشركة الالكتروني
                      </p>
                      <WeatherClock/>
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <div className="w-16 h-0.5 bg-white/30"></div>
                        <div className="w-12 h-0.5 bg-white/30"></div>
                        <div className="w-20 h-0.5 bg-white/30"></div>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 bg-white/40 rounded-sm"></div>
                      </div>
                    </div>
                  </div>

                  {/* Book Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 transform -skew-x-12"></div>
                </div>

                {/* Background Books Stack */}
                <div className="absolute -z-10 -right-4 -top-4 w-80 h-90 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 opacity-30"></div>
                <div className="absolute -z-20 -right-8 -top-8 w-80 h-90 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 opacity-20"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Statistics */}
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 flex space-x-2 text-white/60 animate-fade-in-up animation-delay-800"> 
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{lastCommitteeNo}</div>
            <div className="text-xl font-extrabold">اخر لجنة</div>
          </div>
          <div className="w-px h-12 bg-white/20"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{usersCount}</div>
            <div className="text-xl font-extrabold">المستخدمين</div>
          </div>
          <div className="w-px h-12 bg-white/20"></div>
      <div className="text-center">
      <div className="text-2xl font-bold text-white">
        {count !== null ? count : "…"}
      </div>
      <div className="text-xl font-extrabold">عدد الكتب</div>
    </div>
 {/* <div className="w-px h-12 bg-white/20"></div>
     <div className="text-center">
            <div className="text-2xl font-bold text-white">#####</div>
            <div className="text-xl font-extrabold">عدد الكتب لكل مستخدم</div>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default BookArchiveHero;