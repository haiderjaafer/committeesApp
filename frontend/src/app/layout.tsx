import type { Metadata } from "next";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import { Providers } from "./providers";
import LayoutWrapper from "./LayoutWrapper";



export const metadata: Metadata = {
  title: "نظام متابعة الكتب",
  description: "نظام متابعة الكتب والمذكرات المتأخرة",
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
       <LayoutWrapper><Providers>{children}</Providers></LayoutWrapper>
    </main>


  </body>
</html>

  );
}


// //npm install date-fns --legacy-peer-deps



