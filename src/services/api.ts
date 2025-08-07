const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface Voter {
  id: number;
  name: string;
  fname?: string;
  mname?: string;
  surname?: string;
  cast_id?: string;
  cast_ida?: string;
  mobile1?: string;
  mobile2?: string;
  age?: number;
  date_of_birth?: string;
  parliament?: string;
  assembly?: string;
  district?: string;
  block?: string;
  tehsil?: string;
  village?: string;
  booth?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SurnameData {
  id: number;
  surname: string;
  count: number;
  castId: string;
  castIda: string;
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
  motherNames: string[];
  addresses: string[];
  surnames: string[];
  religions: string[];
  categories: string[];
}

export interface FilterParams {
  parliament?: string;
  assembly?: string;
  district?: string;
  block?: string;
  tehsil?: string;
  castId?: string;
  castIda?: string;
  mobile1?: string;
  mobile2?: string;
  ageMin?: number;
  ageMax?: number;
  dateOfBirth?: string;
  village?: string;
  booth?: string;
  name?: string;
  fname?: string;
  mname?: string;
  surname?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface VotersResponse {
  data: Voter[];
  pagination: PaginationInfo;
}

export interface MasterFilterOptions {
  parliamentOptions: string[];
  assemblyOptions: string[];
  districtOptions: string[];
  blockOptions: string[];
  tehsilOptions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return this.handleResponse<LoginResponse>(response);
  }

  // Master filter options
  async fetchMasterFilterOptions(): Promise<MasterFilterOptions> {
    const response = await fetch(`${API_BASE_URL}/master-filter-options`);
    return this.handleResponse<MasterFilterOptions>(response);
  }

  // Filter options
  async fetchFilterOptions(): Promise<FilterOptions> {
    const response = await fetch(`${API_BASE_URL}/filter-options`);
    return this.handleResponse<FilterOptions>(response);
  }

  // Get voters with filters and pagination
  async getVoters(
    page: number = 1,
    limit: number = 500,
    filters: FilterParams = {}
  ): Promise<VotersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/voters?${params}`);
    return this.handleResponse<VotersResponse>(response);
  }

  // Update voter
  async updateVoter(id: number, voterData: Partial<Voter>): Promise<{ message: string }> {
    const token = localStorage.getItem('authToken');
    const endpoint = token ? `/voters/${id}` : `/voters/${id}/demo`;
    const headers = token ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(voterData),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  // Get surname data
  async getSurnameData(filters: { name?: string; fname?: string; mname?: string } = {}): Promise<SurnameData[]> {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/surname-data?${params}`);
    return this.handleResponse<SurnameData[]>(response);
  }

  // Update surname data
  async updateSurnameData(id: number, data: { surname: string; castId: string; castIda: string }): Promise<{ message: string }> {
    const token = localStorage.getItem('authToken');
    const endpoint = token ? `/surname-data/${id}` : `/surname-data/${id}/demo`;
    const headers = token ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  // Export data
  async exportData(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export`, {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  }

  // Save data (bulk update)
  async saveData(voters: Voter[]): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ voters }),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  // Lock data
  async lockData(voterIds: number[]): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/lock`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ voterIds }),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return this.handleResponse<{ status: string; message: string }>(response);
  }
}

export const apiService = new ApiService();
