'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { cn } from '@/lib/utils';
import RotatingLogo from './RotatingLogo/RotatingLogo';
import UserDropdown from './UserDropdownMenu';


export type NavItem = {
  title: string;
  href?: string;
  target?: string;
  children?: NavItem[];
  description?: string;
};

interface UserData {
  userID: string;
  username: string;
  permission: string;
}

interface NavbarProps {
  userData?: UserData | null;
}

const NAV_ITEMS: NavItem[] = [
  {
    title: 'الإضافة',
    children: [
      {
        title: 'إضافة كتاب',
        href: '/addCommitteeBooks/',
        description: 'إضافة كتاب لجنة جديد إلى النظام',
      },
    ],
  },
  {
    title: 'البحث',
    children: [
      {
        title: 'بحث',
        href: '/searchPanel',
        description: 'خيارات البحث المتقدم مع فلاتر متعددة',
      },
    ],
  },
  {
    title: 'التقارير',
    children: [
      {
        title: 'تقرير الكتب',
        href: '/committeeReport',
        description: ' تقرير كتب اللجنة حسب تأريخ الادخال ',
      },
      {
        title: ' تقرير الكتب حسب رئيس اللجنة',
        href: '/bossNameReport',
        description: 'تقرير الكتب حسب رئيس اللجنة    ',
      },
    ],
  },
];

export function Navbar({ userData }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debugging logs
  console.log('Navbar - userData:', userData);
  console.log('Navbar - activeSubmenu:', activeSubmenu);
  console.log('Navbar - isScrolled:', isScrolled);

  // Handle mouse enter for desktop hover
  const handleMouseEnter = (title: string) => {
    console.log('Mouse enter on:', title);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveSubmenu(title);
  };

  // Handle mouse leave for desktop hover with delay
  const handleMouseLeave = () => {
    console.log('Mouse leave');
    timeoutRef.current = setTimeout(() => {
      console.log('Closing submenu after delay');
      setActiveSubmenu(null);
    }, 300); // Increased delay to allow clicks
  };

  // Handle click for mobile submenu toggle
  const handleSubmenuToggle = (title: string) => {
    console.log('Submenu toggled:', title);
    setActiveSubmenu(activeSubmenu === title ? null : title);
  };

  // Handle clicks within the dropdown to prevent propagation
  const handleDropdownClick = (e: React.MouseEvent) => {
    console.log('Dropdown clicked');
    e.stopPropagation(); // Prevent click from triggering parent events
  };

  return (
    <header
      ref={headerRef}
      className={cn(
        'sticky top-0 z-50 w-full border-b shadow-sm transition-all duration-200',
        isScrolled ? 'bg-[#2c70dd]' : 'bg-gray-100' 
      )}
      dir="rtl"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Mobile Navigation Trigger */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-sky-100/50 transition-colors duration-300"
                onClick={() => console.log('Mobile menu button clicked')}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">تبديل القائمة</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="text-right bg-background/95">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Make changes to your profile here
              </SheetDescription>
              <div className="flex flex-col space-y-4 pt-6">
                {NAV_ITEMS.map((item) => (
                  <div key={item.title} className="flex flex-col">
                    {item.children ? (
                      <>
                        <button
                          onClick={() => handleSubmenuToggle(item.title)}
                          className={cn(
                            'flex items-center justify-between font-medium font-arabic py-2 text-base',
                            'hover:text-sky-600 hover:bg-sky-50 rounded-md px-3 transition-all duration-300'
                          )}
                        >
                          {item.title}
                          <span
                            className={cn(
                              'transition-transform duration-300',
                              activeSubmenu === item.title ? 'rotate-180' : ''
                            )}
                          >
                            ↓
                          </span>
                        </button>
                        {activeSubmenu === item.title && (
                          <div className="flex flex-col pr-4 space-y-2 mt-2">
                           
                            {item.children.map((child) => (
                              <Link
                                key={child.title}
                                href={child.href || '#'}
                                target={child.target || '_self'}
                                className={cn(
                                  'text-sm py-1.5 block font-arabic text-right',
                                  'hover:text-sky-600 hover:bg-sky-50 rounded-md px-3 transition-all duration-300'
                                )}
                                onClick={() => {
                                  console.log('Mobile menu item clicked:', child.title);
                                  setIsOpen(false);
                                  setActiveSubmenu(null);
                                }}
                              >
                                <div className="flex flex-col items-end">
                                  <span>{child.title}</span>
                                  {child.description && (
                                    <span className="text-xs text-muted-foreground mt-1">
                                      {child.description}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href || '#'}
                        target={item.target || '_self'}
                        className={cn(
                          'font-medium font-arabic py-2 text-base',
                          'hover:text-sky-600 hover:bg-sky-50 rounded-md px-3 transition-all duration-300'
                        )}
                        onClick={() => {
                          console.log('Mobile menu item clicked:', item.title);
                          setIsOpen(false);
                        }}
                      >
                        {item.title}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo and Company Name */}
        <Link
          href="/"
          className="hidden md:flex gap-1.5 items-center mx-4 font-sans focus:outline-none focus:ring-0"
        >
          <RotatingLogo />
          <span
            className={cn(
              'inline-block text-lg bg-clip-text text-black animate-pulse',
              isScrolled ? 'font-extrabold text-white' : 'font-extrabold'
            )}
          >
            شركة مصافي الوسط
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-2">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.title}
              className="relative p-2" // Added padding to prevent gap
              onMouseEnter={() => handleMouseEnter(item.title)}
              onMouseLeave={handleMouseLeave}
            >
              {item.children ? (
                <>
                  <Button
                    variant="ghost"
                    className={cn(
                      'font-arabic text-base font-semibold px-4 py-2',
                      'hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-300'
                    )}
                    onClick={(e) => {
                      console.log('Menu button clicked:', item.title);
                      e.stopPropagation(); // Prevent click from closing dropdown
                      setActiveSubmenu(activeSubmenu === item.title ? null : item.title);
                    }}
                  >
                    {item.title} 
                    <span
                      className={cn(
                        'mr-1 transition-transform duration-300',
                        activeSubmenu === item.title ? 'rotate-180' : ''
                      )}
                    >
                      ↑
                    </span>
                  </Button>
                  {activeSubmenu === item.title && (
                    <div
                      className={cn(
                        'absolute right-0 mt-1 w-64 rounded-xl bg-popover shadow-xl border border-sky-100/50',
                        'backdrop-blur-sm z-[1000]'
                      )}
                      onClick={handleDropdownClick}
                    >
                     
                      <div className="py-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.title}
                            href={child.href || '#'}
                            target={child.target || '_self'}
                            className={cn(
                              'text-sm block px-4 py-2 font-arabic text-right',
                              'hover:text-sky-600 hover:bg-sky-50 rounded-md transition-all duration-300'
                            )}
                            onClick={(e) => {
                              console.log('Desktop submenu item clicked:', child.title);
                              // Let navigation occur naturally; no need to setActiveSubmenu(null)
                            }}
                          >  
                            <div className="flex flex-col">
                              <span className="font-extrabold">{child.title} </span>
                              {child.description && (
                                <span className="text-xs font-bold text-muted-foreground mt-1">
                                  {child.description}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href || '#'}
                  target={item.target || '_self'}
                  className={cn(
                    'font-arabic text-base font-semibold px-4 py-2',
                    'hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-300'
                  )}
                  onClick={() => console.log('Desktop menu item clicked:', item.title)}
                >
                  {item.title}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* System Name */}
        <Link href="/" className="hidden md:flex items-center mx-4 font-arabic">
          <span
            className={cn(
              'inline-block text-lg bg-clip-text text-black animate-pulse',
              isScrolled ? 'font-extrabold text-white' : 'font-bold'
            )}
          >
            نظام ارشفة اللجان الالكتروني
          </span>
       {userData ? <UserDropdown userData={userData} /> : null } 
        </Link>
        

        
      </div>

    </header>
  );
}

export default Navbar;