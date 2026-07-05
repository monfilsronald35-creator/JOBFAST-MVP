/**
 * CategoryMarketplace.jsx
 *
 * Route: /marketplace/:categoryId
 *
 * Delegates entirely to MarketplaceCore for the browse/booking/review
 * experience.  This file only handles routing params and the back button.
 *
 * Backward compatible: same route, same prop (categoryId → role for MarketplaceCore).
 * The `categoryId` in the URL maps directly to a marketplace role key
 * (e.g., /marketplace/restaurant → role = 'restaurant').
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MarketplaceCore from '../components/marketplace/MarketplaceCore';
import { getMarketplaceConfig } from '../config/marketplaceConfig';

export default function CategoryMarketplace() {
  const { categoryId } = useParams();
  const navigate       = useNavigate();
  const config         = getMarketplaceConfig(categoryId);

  return (
    <div className="min-h-screen bg-[#0B1528] text-white">
      {/* Sticky top bar with back button */}
      <div className="sticky top-0 z-10 bg-[#0B1528]/95 backdrop-blur-sm border-b border-slate-800/50 flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white transition text-lg leading-none"
        >
          ←
        </button>
        <span className="text-base">{config.icon}</span>
        <h1 className="text-sm font-bold text-white">{config.browseTitle}</h1>
      </div>

      {/* Marketplace engine — handles search, filter, listings, booking, reviews */}
      <MarketplaceCore role={categoryId} />
    </div>
  );
}