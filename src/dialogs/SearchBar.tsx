"use client";

import { Search } from "lucide-react";

interface SearchSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="sticky top-0 z-40 bg-white w-full">
      <div className="flex flex-wrap items-center justify-between gap-10 py-5">
        {/* Title */}
        <h2
          style={{ fontFamily: "CustomFontMP" }}
          className="text-lg sm:text-2xl text-[#E3000F] whitespace-nowrap"
        >
          Our Meals
        </h2>

        {/* Search Box */}
        <div className="relative flex-1 max-w-md w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search items"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm sm:text-base text-black"
          />
        </div>
      </div>
    </div>
  );
};

export default SearchSection;
