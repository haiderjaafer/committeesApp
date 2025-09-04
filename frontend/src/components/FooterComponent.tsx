'use client';


import { useEffect, useRef, useState } from "react";

function FooterComponent() {
  const footerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const footerElement = footerRef.current;
    if (!footerElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1, // Trigger when 10% of the footer is visible
      }
    );

    observer.observe(footerElement);

    return () => {
      if (footerElement) observer.unobserve(footerElement);
    };
  }, []);



  return (
    <footer
      ref={footerRef}
      className={`hidden sm:block w-full text-black shadow-md transition-colors duration-500 ${
        isVisible
          // ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text" // background when near viewport
          ?"bg-gray-400"
          : "bg-transparent" // background when not near
      }`}
    >
      
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center text-center sm:text-start">

        
        <p className="text-sm sm:text-base font-extrabold">
          جميع الحقوق محفوظة &copy; قسم تقنية المعلومات
        </p>
        <p>&nbsp; / &nbsp;</p>
        <p className="text-xs sm:text-sm mt-2 sm:mt-0 font-extrabold">
          شعبة الشبكات والانظمة البرمجية
        </p>

      
      </div>
   

    </footer>
  );
}

export default FooterComponent;
