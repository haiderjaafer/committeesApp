import type { Metadata } from "next";
import "./globals.css";
import LayoutWrapper from "./LayoutWrapper";
import { Navbar } from "@/components/Navbar";



export const metadata: Metadata = {
  title: "نظام ارشفة اللجان",
  description: "نظام ارشفة اللجان لقسم الموارد البشرية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<html lang="ar" dir="rtl">
  <body className="font-serif flex flex-col min-h-screen">
    {/* <Navbar /> */}
    
    <main className="flex-grow">
       {/* <LayoutWrapper>{children}</LayoutWrapper> */}

        <>
        <Navbar/>
        {children}
        
        </>
    </main>


  </body>
</html>

  );
}
