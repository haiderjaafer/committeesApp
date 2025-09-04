'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { arSA } from 'date-fns/locale'; // Use arSA for Arabic day names
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import './ArabicDatePicker.css'; // custom override

registerLocale('ar', arSA);

const iraqiArabicMonths = [
  'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'
];

interface ArabicDatePickerProps {
  selected: string;
  onChange: (date: string) => void;
  label?: string;
  allowEmpty?: boolean; // New prop to control empty date behavior
}

export default function ArabicDatePicker({
  selected,
  onChange,
  allowEmpty = true, // Default to allowing empty dates
}: ArabicDatePickerProps) {
  const [date, setDate] = useState<Date | null>(null);
  
  // Use ref to store the onChange function to avoid dependency issues
  const onChangeRef = useRef(onChange);
  const previousValueRef = useRef<string>('');
  const selectedRef = useRef<string>('');

  // Update the ref when onChange changes
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // FIXED: Initialize and sync with selected prop, handling empty values properly
  useEffect(() => {
    if (selected !== selectedRef.current) {
      selectedRef.current = selected;
      
      // Handle empty/null values based on allowEmpty prop
      if (!selected || selected.trim() === '') {
        setDate(null);
      } else {
        try {
          const newDate = new Date(selected);
          // Check if the date is valid
          if (!isNaN(newDate.getTime())) {
            setDate(newDate);
          } else {
            setDate(null);
          }
        } catch (error) {
          console.warn('Invalid date format:', error);
          console.warn('Invalid date format:', selected);
          setDate(null);
        }
      }
    }
  }, [selected, allowEmpty]);

  // Handle date changes and call onChange
  useEffect(() => {
    const newValue = date ? format(date, 'yyyy-MM-dd') : '';
    
    // Only call onChange if the value actually changed AND it's different from the selected prop
    if (newValue !== previousValueRef.current && newValue !== selectedRef.current) {
      previousValueRef.current = newValue;
      selectedRef.current = newValue;
      onChangeRef.current(newValue);
    }
  }, [date]);

  // Memoized change handler to prevent unnecessary re-renders
  const handleDateChange = useCallback((newDate: Date | null) => {
    setDate(newDate);
  }, []);

  return (
    <div className="mb-4" dir="rtl">
      <div className="relative">
        <DatePicker
          selected={date}
          onChange={handleDateChange}
          locale="ar"
          dateFormat="yyyy-MM-dd"
          placeholderText="اختر التاريخ"
          className="w-full h-12 p-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          calendarStartDay={6}
          isClearable
          showPopperArrow={false}
          popperPlacement="bottom-end"
          renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
            <div className="flex justify-between items-center px-2 py-1 bg-gray-100 text-sm font-bold text-gray-700">
              <button type="button" onClick={decreaseMonth} className="px-2 py-1 hover:text-red-600">
                ◀
              </button>
              <span>
                {iraqiArabicMonths[date.getMonth()]} {date.getFullYear()}
              </span>
              <button type="button" onClick={increaseMonth} className="px-2 py-1 hover:text-green-600">
                ▶
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}