'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Define the suggestion type to match backend response
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
  const [suggestions, setSuggestions] = useState<BossNameSuggestion[]>([]); // ✅ Changed type
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (value.trim().length >= 2) {
        await fetchSuggestions(value.trim());
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/committees/getRecordsCommitteeBossName`,
        { BossName: query }
      );
      
      console.log('Response data:', response.data); // Debug log
      
      if (response.data.success && response.data.suggestions) {
        setSuggestions(response.data.suggestions); // ✅ Now expects array of objects
        setShowDropdown(true);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', error.response?.data);
      }
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (bossName: string) => {
    onChange(bossName);
    setShowDropdown(false);
    setSuggestions([]);
    if (onSelect) {
      onSelect(bossName);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder="اسم رئيس اللجنة"
        className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 font-arabic text-right"
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="absolute left-3 top-3">
          <div className="animate-spin h-5 w-5 border-2 border-sky-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(suggestion.bossName); // ✅ Access bossName property
              }}
              className="px-4 py-3 hover:bg-sky-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-center">
                {/* ✅ Render bossName as text */}
                <span className="font-arabic text-right flex-1">
                  {suggestion.bossName}
                </span>
                {/* ✅ Show count badge */}
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full mr-2">
                  {suggestion.count} لجنة
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDropdown && suggestions.length === 0 && !isLoading && value.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <p className="text-gray-500 font-arabic text-center text-sm">
            لا توجد نتائج
          </p>
        </div>
      )}
    </div>
  );
}