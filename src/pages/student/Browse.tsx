import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listingService } from '@/services';
import { CATEGORIES, CITIES } from '@/constants';
import { Search, SlidersHorizontal, X, MapPin, Clock, IndianRupee, Wifi } from 'lucide-react';
import type { ListingFilters, Listing } from '@/types';

function ListingCard({ listing }: { listing: Listing }) {
  const company = listing.company;
  return (
    <Link to={`/internships/${listing.id}`} className="card hover:shadow-md transition-all hover:border-primary-100 border border-transparent group">
      <div className="flex items-start gap-3 mb-3">
        {company?.logo_url ? (
          <img src={company.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg flex-shrink-0">
            {company?.name?.[0] ?? '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">{listing.title}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                {company?.name}
                {company?.verification_status === 'verified' && (
                  <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-medium ml-1">✓ Verified</span>
                )}
              </p>
            </div>
            {listing.featured && (
              <span className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-full font-bold flex-shrink-0">Featured</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {listing.required_skills.slice(0, 4).map((s) => (
          <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{s}</span>
        ))}
        {listing.required_skills.length > 4 && (
          <span className="text-xs text-gray-400">+{listing.required_skills.length - 4} more</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        {listing.remote ? (
          <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Remote</span>
        ) : listing.location ? (
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.location}</span>
        ) : null}
        {listing.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {listing.duration}</span>}
        {listing.stipend_amount ? (
          <span className="flex items-center gap-1 font-medium text-gray-700">
            <IndianRupee className="w-3 h-3" />
            {listing.stipend_amount.toLocaleString()}/{listing.stipend_period === 'monthly' ? 'mo' : 'total'}
          </span>
        ) : listing.stipend_period === 'unpaid' ? (
          <span className="text-gray-400">Unpaid</span>
        ) : null}
        <span className="ml-auto text-gray-400">{listing.application_count} applied</span>
      </div>
    </Link>
  );
}

export default function BrowsePage() {
  const [filters, setFilters] = useState<ListingFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => listingService.getActive(filters),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, query: searchInput }));
  };

  const clearFilter = (key: keyof ListingFilters) => {
    setFilters((f) => { const n = { ...f }; delete n[key]; return n; });
  };

  const activeFilterCount = Object.keys(filters).filter((k) => filters[k as keyof ListingFilters] !== undefined).length;

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse Internships</h1>
        <p className="text-gray-500 text-sm">{listings.length} listings available</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-base pl-9 pr-4"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by role, skills, company…"
          />
        </div>
        <button type="submit" className="btn-primary px-5">Search</button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
            showFilters || activeFilterCount > 0
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>
          )}
        </button>
      </form>

      {/* Filters panel */}
      {showFilters && (
        <div className="card mb-4 p-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
              <select
                className="input-base text-sm"
                value={filters.category ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value || undefined }))}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Location</label>
              <select
                className="input-base text-sm"
                value={filters.location ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value || undefined }))}
              >
                <option value="">Any location</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Type</label>
              <select
                className="input-base text-sm"
                value={filters.remote === undefined ? '' : String(filters.remote)}
                onChange={(e) => setFilters((f) => ({ ...f, remote: e.target.value === '' ? undefined : e.target.value === 'true' }))}
              >
                <option value="">All types</option>
                <option value="true">Remote only</option>
                <option value="false">On-site only</option>
              </select>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setFilters({}); setSearchInput(''); }}
              className="mt-3 text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.query && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">
              "{filters.query}" <button onClick={() => clearFilter('query')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.category && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">
              {filters.category} <button onClick={() => clearFilter('category')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.location && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">
              {filters.location} <button onClick={() => clearFilter('location')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.remote !== undefined && (
            <span className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">
              {filters.remote ? 'Remote' : 'On-site'} <button onClick={() => clearFilter('remote')}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Listing grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-40 bg-gray-50" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No listings found</h3>
          <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
