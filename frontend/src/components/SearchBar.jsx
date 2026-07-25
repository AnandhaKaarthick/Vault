import React, { useState, useEffect } from 'react';
import { Search, X, Star, Clock } from 'lucide-react';

const CATEGORIES = [
  "All",
  "Academic & Marksheets",
  "Certificates & Courses",
  "Tax",
  "Financial & Bank",
  "Identity & Official",
  "Utility & Bills",
  "Travel & Tickets",
  "Medical & Health",
  "Receipts & Invoices",
  "Other / Unsorted"
];

const PLACEHOLDERS = [
  "find my 12th marksheet...",
  "python course certificate...",
  "how much was my electricity bill...",
  "when does my passport expire...",
  "semester 6 transcript..."
];

export default function SearchBar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedCategory,
  onCategorySelect,
  isExpiringOnly,
  onToggleExpiring,
  isStarredOnly,
  onToggleStarred,
  onClearAll
}) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <div className="w-full space-y-3 mb-6">
      {/* High-Contrast Full-Width Search Input Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#1C2620]">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[placeholderIndex]}
          className="w-full pl-11 pr-28 py-3 bg-[#FFFFFF] border border-[#1C2620]/25 rounded text-[#1C2620] font-sans text-sm italic placeholder:text-[#1C2620]/60 focus:outline-none focus:border-[#28493F] focus:ring-1 focus:ring-[#28493F] shadow-sm"
        />

        <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center gap-1.5">
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onClearAll();
              }}
              className="text-[#1C2620]/60 hover:text-[#1C2620] p-1.5 rounded hover:bg-[#1C2620]/5 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onSearchSubmit(searchQuery)}
            className="btn-primary px-4 py-2 font-mono text-xs uppercase tracking-widest rounded shadow-sm transition-all active:scale-95 shrink-0"
          >
            SEARCH
          </button>
        </div>
      </div>

      {/* Dedicated Filter Pills Row Under Search Bar */}
      <div className="w-full overflow-x-auto scroll-hide py-1">
        <div className="flex items-center gap-2 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCategorySelect(cat)}
              className={`
                px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition-all duration-150 shrink-0 select-none font-bold
                ${selectedCategory === cat && !isExpiringOnly && !isStarredOnly
                  ? 'btn-primary shadow-sm' 
                  : 'bg-white text-[#1C2620] hover:bg-[#28493F] hover:text-white border border-[#1C2620]/20'
                }
              `}
            >
              {cat === 'All' ? 'All Documents' : cat}
            </button>
          ))}

          {/* Expiring Soon Pill */}
          <button
            type="button"
            onClick={onToggleExpiring}
            className={`
              px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-150 shrink-0 select-none font-bold
              ${isExpiringOnly 
                ? 'bg-[#B4402F] text-white border border-[#B4402F] shadow-sm' 
                : 'bg-white text-[#1C2620] hover:bg-[#B4402F] hover:text-white border border-[#1C2620]/20'
              }
            `}
          >
            <span>Expiring Soon</span>
            <span className="w-1.5 h-1.5 bg-[#B4402F] rounded-full"></span>
          </button>

          {/* Starred Pill */}
          <button
            type="button"
            onClick={onToggleStarred}
            className={`
              px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-150 shrink-0 select-none font-bold
              ${isStarredOnly 
                ? 'bg-yellow-600 text-white border border-yellow-600 shadow-sm' 
                : 'bg-white text-[#1C2620] hover:bg-yellow-600 hover:text-white border border-[#1C2620]/20'
              }
            `}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Starred</span>
          </button>
        </div>
      </div>
    </div>
  );
}
