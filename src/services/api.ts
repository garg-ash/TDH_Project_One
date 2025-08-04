const API_BASE_URL = 'http://localhost:3001/api';

export interface Voter {
  _id: string;
  familyId: string;
  name: string;
  mobile1: string;
  mobile2: string;
  dob: number;
  ps: string;
  gp: string;
  gram: string;
  castIda: string;
  cast: number;
  pc: number;
  ac: string;
  district: string;
  villageCode: string;
  villageName: string;
  gramPanchayat: string;
  patwarCircle: string;
  lrCircle: string;
  age: number;
  fname: string;
  hno: string;
  malefemale: string;
  castType: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  villageCodes: string[];
  sections: string[];
  villageNames: string[];
  gramPanchayats: string[];
  patwarCircles: string[];
  lrCircles: string[];
  ages: number[];
  names: string[];
  fnames: string[];
  hnos: string[];
  malefemales: string[];
  castTypes: string[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface VotersResponse {
  voters: Voter[];
  pagination: PaginationInfo;
}

export interface FilterParams {
  villageCode?: string;
  sectionFilter?: string;
  villageNameFilter?: string;
  gramPanchayatFilter?: string;
  patwarCircleFilter?: string;
  lrCircleFilter?: string;
  dobFilter?: string;
  ageFilter?: string;
  nameFilter?: string;
  fnameFilter?: string;
  hnoFilter?: string;
  malefemaleFilter?: string;
  mobileFilter?: string;
  castFilter?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface BulkUpdateItem {
  id: string;
  columnId: string;
  value: any;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Get voters with filtering and pagination
  async getVoters(params: FilterParams = {}): Promise<VotersResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    return this.request<VotersResponse>(`/voters?${queryParams.toString()}`);
  }

  // Get single voter
  async getVoter(id: string): Promise<Voter> {
    return this.request<Voter>(`/voters/${id}`);
  }

  // Create new voter
  async createVoter(voterData: Partial<Voter>): Promise<Voter> {
    return this.request<Voter>('/voters', {
      method: 'POST',
      body: JSON.stringify(voterData),
    });
  }

  // Update voter
  async updateVoter(id: string, voterData: Partial<Voter>): Promise<Voter> {
    return this.request<Voter>(`/voters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(voterData),
    });
  }

  // Bulk update voters
  async bulkUpdateVoters(updates: BulkUpdateItem[]): Promise<Voter[]> {
    return this.request<Voter[]>('/voters/bulk', {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
  }

  // Delete voter
  async deleteVoter(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/voters/${id}`, {
      method: 'DELETE',
    });
  }

  // Get filter options
  async getFilterOptions(): Promise<FilterOptions> {
    return this.request<FilterOptions>('/filter-options');
  }

  // Seed sample data
  async seedSampleData(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/seed-data', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService(); 