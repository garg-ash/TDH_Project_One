'use client';

import { useState, useEffect } from 'react';
import { apiService, FilterOptions, FilterParams } from '../services/api';

interface FilterProps {
  onFilterChange: (filters: FilterParams) => void;
  loading?: boolean;
}

export default function Filter({ onFilterChange, loading = false }: FilterProps) {
  const [villageCode, setvillageCode] = useState('');
  const [SectionFilter, setSectionFilter] = useState('');
  const [villageNameFilter, setvillageNameFilter] = useState('');
  const [gramPanchayatFilter, setgramPanchayatFilter] = useState('');
  const [patwarCircleFilter, setpatwarCircleFilter] = useState('');
  const [lrCircleFilter, setlrCircleFilter] = useState('');
  const [dobFilter, setdobFilter] = useState('');
  const [ageFilter, setageFilter] = useState('');
  const [nameFilter, setnameFilter] = useState('');
  const [fnameFilter, setfnameFilter] = useState('');
  const [hnoFilter, sethnoFilter] = useState('');
  const [malefemaleFilter, setmalefemaleFilter] = useState('');
  const [mobileFilter, setmobileFilter] = useState('');
  const [castFilter, setcastFilter] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    villageCodes: [],
    sections: [],
    villageNames: [],
    gramPanchayats: [],
    patwarCircles: [],
    lrCircles: [],
    ages: [],
    names: [],
    fnames: [],
    hnos: [],
    malefemales: [],
    castTypes: []
  });
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoadingOptions(true);
        const options = await apiService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchFilterOptions();
  }, []);

  // Apply filters when any filter changes
  useEffect(() => {
    const filters: FilterParams = {
      villageCode: villageCode || undefined,
      sectionFilter: SectionFilter || undefined,
      villageNameFilter: villageNameFilter || undefined,
      gramPanchayatFilter: gramPanchayatFilter || undefined,
      patwarCircleFilter: patwarCircleFilter || undefined,
      lrCircleFilter: lrCircleFilter || undefined,
      dobFilter: dobFilter || undefined,
      ageFilter: ageFilter || undefined,
      nameFilter: nameFilter || undefined,
      fnameFilter: fnameFilter || undefined,
      hnoFilter: hnoFilter || undefined,
      malefemaleFilter: malefemaleFilter || undefined,
      mobileFilter: mobileFilter || undefined,
      castFilter: castFilter || undefined,
    };

    onFilterChange(filters);
  }, [
    villageCode, SectionFilter, villageNameFilter, gramPanchayatFilter,
    patwarCircleFilter, lrCircleFilter, dobFilter, ageFilter, nameFilter,
    fnameFilter, hnoFilter, malefemaleFilter, mobileFilter, castFilter,
    onFilterChange
  ]);

  const clearAllFilters = () => {
    setvillageCode('');
    setSectionFilter('');
    setvillageNameFilter('');
    setgramPanchayatFilter('');
    setpatwarCircleFilter('');
    setlrCircleFilter('');
    setdobFilter('');
    setageFilter('');
    setnameFilter('');
    setfnameFilter('');
    sethnoFilter('');
    setmalefemaleFilter('');
    setmobileFilter('');
    setcastFilter('');
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-start mb-4">
          <div className="w-full">
            {/* First Row - First 8 filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <select
                value={villageCode}
                onChange={(e) => setvillageCode(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={loadingOptions}
              >
                <option value="">Village code</option>
                {filterOptions.villageCodes.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              
              <select
                value={SectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
                disabled={loadingOptions}
              >
                <option value="">Section / Colony</option>
                {filterOptions.sections.map((section) => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
              
              <select
                value={villageNameFilter}
                onChange={(e) => setvillageNameFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
                disabled={loadingOptions}
              >
                <option value="">Village Name</option>
                {filterOptions.villageNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              
              <select
                value={gramPanchayatFilter}
                onChange={(e) => setgramPanchayatFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
                disabled={loadingOptions}
              >
                <option value="">Gram Panchayat</option>
                {filterOptions.gramPanchayats.map((gp) => (
                  <option key={gp} value={gp}>{gp}</option>
                ))}
              </select>
              
              <select
                value={patwarCircleFilter}
                onChange={(e) => setpatwarCircleFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
                disabled={loadingOptions}
              >
                <option value="">Patwar Circle</option>
                {filterOptions.patwarCircles.map((pc) => (
                  <option key={pc} value={pc}>{pc}</option>
                ))}
              </select>
              
              <select
                value={lrCircleFilter}
                onChange={(e) => setlrCircleFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
                disabled={loadingOptions}
              >
                <option value="">LR Circle</option>
                {filterOptions.lrCircles.map((lc) => (
                  <option key={lc} value={lc}>{lc}</option>
                ))}
              </select>
              
              <select
                value={dobFilter}
                onChange={(e) => setdobFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
                disabled={loadingOptions}
              >
                <option value="">DOB</option>
                {/* Add date options if needed */}
              </select>
              
              <select
                value={ageFilter}
                onChange={(e) => setageFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
                disabled={loadingOptions}
              >
                <option value="">Age</option>
                {filterOptions.ages.map((age) => (
                  <option key={age} value={age}>{age}</option>
                ))}
              </select>
            </div>

            {/* More/Less Button and Clear Filters */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                disabled={loading}
              >
                Clear All Filters
              </button>
              
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                disabled={loading}
              >
                {showMoreFilters ? 'Show Less' : 'Show More Filters'}
              </button>
            </div>

            {/* Second Row - Remaining filters (hidden by default) */}
            {showMoreFilters && (
              <div className="flex flex-wrap gap-4 mb-4">
                <select
                  value={nameFilter}
                  onChange={(e) => setnameFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                  disabled={loadingOptions}
                >
                  <option value="">Name</option>
                  {filterOptions.names.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>

                <select
                  value={fnameFilter}
                  onChange={(e) => setfnameFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                  disabled={loadingOptions}
                >
                  <option value="">FName</option>
                  {filterOptions.fnames.map((fname) => (
                    <option key={fname} value={fname}>{fname}</option>
                  ))}
                </select>

                <select
                  value={hnoFilter}
                  onChange={(e) => sethnoFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                  disabled={loadingOptions}
                >
                  <option value="">House No.</option>
                  {filterOptions.hnos.map((hno) => (
                    <option key={hno} value={hno}>{hno}</option>
                  ))}
                </select>

                <select
                  value={malefemaleFilter}
                  onChange={(e) => setmalefemaleFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                  disabled={loadingOptions}
                >
                  <option value="">Male / Female</option>
                  {filterOptions.malefemales.map((gender) => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>

                <input 
                  type="number" 
                  placeholder='Enter Mobile No.' 
                  value={mobileFilter} 
                  onChange={(e)=> setmobileFilter(e.target.value)} 
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                  disabled={loading}
                />

                <select
                  value={castFilter}
                  onChange={(e) => setcastFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                  disabled={loadingOptions}
                >
                  <option value="">Cast</option>
                  {filterOptions.castTypes.map((cast) => (
                    <option key={cast} value={cast}>{cast}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Loading indicator */}
            {(loading || loadingOptions) && (
              <div className="text-center py-2">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">
                  {loadingOptions ? 'Loading filter options...' : 'Loading data...'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 