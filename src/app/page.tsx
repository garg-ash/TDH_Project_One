'use client';

import { useState } from 'react';
import Navbar from "@/components/Navbar";
import Filter from "@/components/Filter";
import DataTable from "@/components/DataTable";
import { FilterParams } from "@/services/api";

export default function Home() {
  const [filters, setFilters] = useState<FilterParams>({});
  const [loading, setLoading] = useState(false);

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
  };

  return (
    <div>
      <Navbar />
      <Filter onFilterChange={handleFilterChange} loading={loading} />
      <div className="p-4">
        <DataTable filters={filters} />
      </div>
    </div>
  );
}


