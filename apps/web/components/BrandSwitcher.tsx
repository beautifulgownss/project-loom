"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, BrandListItem } from "@/lib/api";
import { useVoiceStore } from "@/lib/stores/voice-store";

export default function BrandSwitcher() {
  const [brands, setBrands] = useState<BrandListItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedBrand, setSelectedBrand } = useVoiceStore();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.listBrands({ is_active: true });
      setBrands(data);

      // If no brand is selected, select the primary one
      if (!selectedBrand && data.length > 0) {
        const primary = data.find((b) => b.is_primary) || data[0];
        setSelectedBrand(primary as any);
      }
    } catch (err) {
      console.error("Failed to load brands:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBrand = (brand: BrandListItem) => {
    setSelectedBrand(brand as any);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        Loading brands...
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <Link
        href="/brands/new"
        className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        Create Brand
      </Link>
    );
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
          <span>{selectedBrand?.name || "Select Brand"}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Active Brands
              </div>
              <div className="space-y-1">
                {brands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => handleSelectBrand(brand)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedBrand?.id === brand.id
                        ? "bg-indigo-50 text-indigo-700"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {brand.name}
                          </span>
                          {brand.is_primary && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        {brand.industry && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {brand.industry}
                          </div>
                        )}
                      </div>
                      {selectedBrand?.id === brand.id && (
                        <svg
                          className="w-5 h-5 text-indigo-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-2">
              <Link
                href="/brands"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Manage Brands
              </Link>
              <Link
                href="/brands/new"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create New Brand
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
