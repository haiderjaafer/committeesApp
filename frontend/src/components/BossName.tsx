'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Eye, Check } from 'lucide-react';


interface BossNameSuggestion {
  bossName: string;
  count: number;
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (bossName: string) => void;
}

export function BossNameAutocomplete({ value, onChange, onSelect }: AutocompleteProps) {
  const [suggestions, setSuggestions] = useState<BossNameSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>(''); //  Track the selected value
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false); //  Use ref instead of state for immediate effect
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  const fetchSuggestions = useCallback(async (query: string) => {
    //  Don't fetch if we're selecting or if query matches selected value
    if (isSelectingRef.current || query === selectedValue) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/committees/getRecordsCommitteeBossName`,
        { BossName: query }
      );
      
      if (response.data.success && response.data.suggestions) {
        setSuggestions(response.data.suggestions);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, selectedValue]);

  useEffect(() => {
    //  Don't search if we're selecting or if value matches selected value
    if (isSelectingRef.current || value === selectedValue) {
      return;
    }

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchSuggestions(value.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [value, selectedValue, fetchSuggestions]);

  const handleSelect = useCallback((bossName: string) => {
    console.log(' Selected:', bossName);
    
    //  Mark as selecting immediately using ref
    isSelectingRef.current = true;
    
    //  Update selected value
    setSelectedValue(bossName);
    
    //  Close dropdown and clear suggestions
    setShowDropdown(false);
    setSuggestions([]);
    
    //  Update value
    onChange(bossName);
    
    //  Call parent callback
    if (onSelect) {
      onSelect(bossName);
    }
    
    //  Reset selecting flag
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 300);
  }, [onChange, onSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    //  If user is typing something different, clear selected value
    if (newValue !== selectedValue) {
      setSelectedValue('');
      isSelectingRef.current = false;
    }
    
    onChange(newValue);
  }, [onChange, selectedValue]);

  const handleFocus = useCallback(() => {
    //  Only show dropdown if:
    // 1. We have suggestions
    // 2. Value is long enough
    // 3. We're not currently selecting
    // 4. The current value is NOT the selected value
    if (
      suggestions.length > 0 && 
      value.trim().length >= 2 && 
      !isSelectingRef.current &&
      value !== selectedValue
    ) {
      setShowDropdown(true);
    }
  }, [suggestions.length, value, selectedValue]);

  const handleBlur = useCallback(() => {
    //  Close dropdown after a delay
    setTimeout(() => {
      if (!isSelectingRef.current) {
        setShowDropdown(false);
      }
    }, 200);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setSuggestions([]);
    }
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="اسم رئيس اللجنة"
        className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="absolute left-3 top-3">
          <div className="animate-spin h-5 w-5 border-2 border-sky-500 border-t-transparent rounded-full"></div>
        </div>
      )}
{showDropdown && suggestions.length > 0 && !isSelectingRef.current && value !== selectedValue && (
  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
    {suggestions.map((suggestion, index) => (
      <div
        key={`${suggestion.bossName}-${index}`}
        className="border-b border-gray-100 last:border-b-0 hover:bg-sky-50 transition-colors"
      >
        <div className="flex items-center gap-2 px-4 py-3">
          {/* Boss name and count */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-arabic text-right">
                {suggestion.bossName}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {suggestion.count} لجنة
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Select button */}
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(suggestion.bossName);
              }}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
              title="اختيار"
            >
              <Check className="h-4 w-4" />
            </button>

            {/* View details button - Use onClick instead */}
            <button
              onClick={(e) => {
                console.log("new tab");
                e.preventDefault();
                e.stopPropagation();
                // Open in new tab
                window.open(
                  `/bossNameDetails/${encodeURIComponent(suggestion.bossName)}`,
                  '_blank',
                  'noopener,noreferrer'
                );
              }}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
              title="عرض التفاصيل"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
)}

      {showDropdown && suggestions.length === 0 && !isLoading && value.trim().length >= 2 && value !== selectedValue && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <p className="text-gray-500 font-arabic text-center text-sm">
            لا توجد نتائج
          </p>
        </div>
      )}
    </div>
  );
}