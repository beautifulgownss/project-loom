"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, BrandListItem } from "@/lib/api";
import { useVoiceStore } from "@/lib/stores/voice-store";

export default function BrandsPage() {
  const [brands, setBrandsState] = useState<BrandListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setSelectedBrand, setBrands } = useVoiceStore();

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.listBrands({ is_active: true });
      setBrandsState(data);
      setBrands(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load brands");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBrand = async (brandId: number) => {
    if (!confirm("Are you sure you want to delete this brand?")) return;

    try {
      await apiClient.deleteBrand(brandId);
      loadBrands();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete brand");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading brands...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Voice Studio</h1>
            <p className="text-gray-600 mt-2">
              Manage your brand voices and tone preferences
            </p>
          </div>
          <Link
            href="/brands/new"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Create Brand
          </Link>
        </div>

        {/* Brands Grid */}
        {brands.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No brands yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first brand voice to get started with AI-powered
              messaging
            </p>
            <Link
              href="/brands/new"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Create Your First Brand
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Brand Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {brand.name}
                      </h3>
                      {brand.is_primary && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                    {brand.industry && (
                      <p className="text-sm text-gray-500 mt-1">
                        {brand.industry}
                      </p>
                    )}
                  </div>
                </div>

                {/* Brand Personality */}
                {brand.personality && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {brand.personality}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <Link
                    href={`/brands/${brand.id}`}
                    className="flex-1 text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedBrand(brand as any);
                    }}
                    className="flex-1 text-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => handleDeleteBrand(brand.id)}
                    className="text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
