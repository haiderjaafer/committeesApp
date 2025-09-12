'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react'; // أيقونة الساعة من lucide-react

export default function ClockComponent() {
  const [time, setTime] = useState(new Date());

  // تحديث الساعة كل ثانية
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // اليوم بالعربية
  const dayName = time.toLocaleDateString('ar-IQ', { weekday: 'long' });

  // الوقت بصيغة ١١:٢١ ص
  const timeString = time.toLocaleTimeString('ar-IQ', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  return (
    <div className="flex items-center gap-3 text-white">
      {/* أيقونة الساعة */}
      <Clock className="w-12 h-12 text-white opacity-80" />

      {/* الوقت واليوم */}
      <div className="flex flex-col text-right ">
        <span className="text-2xl font-extrabold ">{timeString}</span>
        <span className="text-2xl font-extrabold opacity-70">{dayName}</span>
      </div>
    </div>
  );
}
