const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

// Format ISO date (YYYY-MM-DD) to backend expected format (DD-MMM-YYYY)
const formatDateForBackend = (isoDate?: string): string | undefined => {
  if (!isoDate) return undefined;
  try {
    if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(isoDate)) return isoDate;
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mon = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${mon}-${year}`;
  } catch {
    return isoDate;
  }
};

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
  created_at?: string;
  updated_at?: string;
}

export interface SurnameData {
  id: number;
  name?: string; // Make name field optional since backend might not always return it
  surname: string;
  count: number;
  castId: string;
  castIda: string;
  category_name?: string; // Optional category name field
}

export interface VillageMappingData {
  id: number;
  villageName: string;
  district: string;
  block: string;
  gp: string;
  assembly: string;
  parliament: string;
  totalVoters: number;
  mappedStatus: 'Mapped' | 'Unmapped' | 'Partial';
  lastUpdated: string;
}

export interface DivisionData {
  id: number;
  DIVISION_ID: number;
  DIVISION_CODE: string;
  DIVISION_ENG: string;
  DIVISION_MANGAL: string;
  DISTRICT_ID: number;
  DISTRICT_CODE: number;
  DISTRICT_ENG: string;
  DISTRICT_MANGAL: string;
  PC_ID: number;
  PC_CODE: number;
  PC_ENG: string;
  PC_MANGAL: string;
  AC_ID: number;
  AC_CODE: number;
  AC_ENG: string;
  AC_MANGAL: string;
  AC_TOTAL_MANDAL?: string;
  PC_SEAT?: string;
  INC_Party_Zila?: string;
}

export interface FilterOptions {
  villageCodes: string[];
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
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      username: string;
      email: string;
      role: 'super_admin' | 'admin' | 'user';
      permissions: string[];
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
      lastLogin?: string;
      createdBy?: number;
    };
    token: string;
    accessibleResources: Record<string, string[]>;
  };
}

// Admin User Management Interfaces
export interface User {
  id: number;
  username: string;
  email: string;
  mobile?: string;
  role: 'super_admin' | 'admin' | 'user';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  createdBy?: number;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  mobile?: string;
  role: 'super_admin' | 'admin' | 'user';
  permissions: string[];
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  mobile?: string;
  role?: 'super_admin' | 'admin' | 'user';
  permissions?: string[];
  isActive?: boolean;
}

export interface ChangePasswordData {
  newPassword: string;
}

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      console.error('❌ API Error Response:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error data:', errorData);
      
      // For database connection issues, return empty data instead of throwing error
      if (response.status === 500 && errorData.error && errorData.error.includes('database')) {
        console.log('Database offline, returning empty data');
        return {} as T;
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return this.handleResponse<LoginResponse>(response);
  }

  async getProfile(): Promise<{ success: boolean; data: { user: User; accessibleResources: Record<string, string[]> } }> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ success: boolean; data: { user: User; accessibleResources: Record<string, string[]> } }>(response);
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ success: boolean; message: string }>(response);
  }

  // Master filter options with cascading filters
  async fetchMasterFilterOptions(masterFilters?: {
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
  }): Promise<MasterFilterOptions> {
    try {
      let url = `${API_BASE_URL}/master-filter-options`;
      
      // Add filter parameters to URL if provided
      if (masterFilters) {
        const params = new URLSearchParams(
          Object.fromEntries(
            Object.entries(masterFilters).filter(([_, value]) => value !== undefined && value !== '')
          )
        );
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await fetch(url);
      return await this.handleResponse<MasterFilterOptions>(response);
    } catch (error) {
      console.log('🌐 Master filter options failed, returning empty options');
      return {
        parliamentOptions: [],
        assemblyOptions: [],
        districtOptions: [],
        blockOptions: [],
        tehsilOptions: []
      };
    }
  }

  // Filter options (all data)
  async fetchFilterOptions(): Promise<FilterOptions> {
    try {
      const response = await fetch(`${API_BASE_URL}/filter-options`);
      return await this.handleResponse<FilterOptions>(response);
    } catch (error) {
      console.log('🌐 Filter options failed, returning empty options');
      return {
        villageCodes: [],
        villageNames: [],
        names: [],
        fnames: [],
        motherNames: [],
        surnames: [],
        castTypes: [],
        ages: [],
        gramPanchayats: [],
        patwarCircles: [],
        lrCircles: [],
        hnos: [],
        malefemales: [],
        religions: [],
        categories: [],
        addresses: []
      };
    }
  }

  // Dependent filter options based on current filters (master + detailed)
  async fetchDependentFilterOptions(filters: FilterParams & {
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
  }): Promise<FilterOptions> {
    try {
      // Apply DOB formatting if present
      const payload: Record<string, any> = { ...filters };
      if (payload.dateOfBirth) {
        payload.dateOfBirth = formatDateForBackend(String(payload.dateOfBirth));
      }
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(payload).filter(([_, value]) => value !== undefined && value !== '')
        )
      );

      const response = await fetch(`${API_BASE_URL}/filter-options-dependent?${params}`);
      return await this.handleResponse<FilterOptions>(response);
    } catch (error) {
      console.log('🌐 Dependent filter options failed, returning empty options');
      return {
        villageCodes: [],
        villageNames: [],
        names: [],
        fnames: [],
        motherNames: [],
        surnames: [],
        castTypes: [],
        ages: [], 
        gramPanchayats: [],
        patwarCircles: [],
        lrCircles: [],
        hnos: [],
        malefemales: [],
        religions: [],
        categories: [],
        addresses: []
      };
    }
  }

  // Voters
  async getVoters(
    page: number = 1,
    limit: number = 500,
    filters: FilterParams = {}
  ): Promise<VotersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    const url = `${API_BASE_URL}/voters?${params}`;
    console.log('🌐 Making API request to:', url);
    console.log('🌐 With filters:', filters);

    const response = await fetch(url);
    console.log('🌐 Response status:', response.status);
    console.log('🌐 Response headers:', Object.fromEntries(response.headers.entries()));
    
    try {
      return await this.handleResponse<VotersResponse>(response);
    } catch (error) {
      console.log('🌐 API call failed, returning empty data');
      // Return empty data structure instead of throwing error
      return {
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: limit
        }
      };
    }
  }

  // Update voter
  async updateVoter(id: number, voterData: Partial<Voter>): Promise<{ message: string }> {
    const token = localStorage.getItem('authToken');
    const endpoint = token ? `/voters/${id}` : `/voters/${id}/demo`; // Dynamic endpoint
    const headers = token ? this.getAuthHeaders() : { 'Content-Type': 'application/json' }; // Dynamic headers
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(voterData),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  // Surname data (supports master filters as well)
  async getSurnameData(filters: {
    name?: string;
    fname?: string;
    mname?: string;
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
    count?: number | string;
    sources?: string; // comma-separated: name,fname,mname
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: SurnameData[]; pagination: { currentPage: number; itemsPerPage: number; totalItems: number; totalPages: number } }> {
    const entries = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)] as [string, string]);
    const params = new URLSearchParams(entries);

    const response = await fetch(`${API_BASE_URL}/surname-data?${params}`);
    return this.handleResponse<{ data: SurnameData[]; pagination: { currentPage: number; itemsPerPage: number; totalItems: number; totalPages: number } }>(response);
  }

  // Update surname data
  async updateSurnameData(id: number, data: { surname: string; castId: string; castIda: string }): Promise<{ message: string }> {
    const token = localStorage.getItem('authToken');
    const endpoint = token ? `/surname-data/${id}` : `/surname-data/${id}/demo`; // Dynamic endpoint
    const headers = token ? this.getAuthHeaders() : { 'Content-Type': 'application/json' }; // Dynamic headers
    
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  }

  // Export filtered data based on master filters
  async exportFilteredData(filters: {
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
    format?: 'csv' | 'excel' | 'pdf';
  }): Promise<{ success: boolean; message?: string; data?: Blob }> {
    try {
      const params = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      );

      const response = await fetch(`${API_BASE_URL}/export-filtered?${params}`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.error || `Export failed with status: ${response.status}`
        };
      }
      
      const blob = await response.blob();
      return {
        success: true,
        data: blob
      };
    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  // Save data
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

  // Village Mapping Data
  async getVillageMappingData(filters: {
    villageName?: string;
    district?: string;
    block?: string;
    gp?: string;
    assembly?: string;
    parliament?: string;
    mappedStatus?: 'Mapped' | 'Unmapped' | 'Partial';
    totalVotersMin?: number;
    totalVotersMax?: number;
    lastUpdatedMin?: string;
    lastUpdatedMax?: string;
  } = {}): Promise<VillageMappingData[]> {
    try {
      const entries = Object.entries(filters)
        .filter(([_, value]) => value !== undefined && value !== '')
        .map(([key, value]) => [key, String(value)] as [string, string]);
      const params = new URLSearchParams(entries);

      const url = `${API_BASE_URL}/village-mapping?${params}`;
      console.log('🔍 Making API call to:', url);
      console.log('🔍 With filters:', filters);

      const response = await fetch(url);
      
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response statusText:', response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorText: errorText
        });
        
        // Try to parse as JSON for better error details
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response data:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Error in getVillageMappingData:', error);
      throw error;
    }
  }

  // Update Village Mapping Data
  async updateVillageMapping(id: number, data: Partial<VillageMappingData>): Promise<{ success: boolean; message: string; updatedId: number; affectedRows: number }> {
    const token = localStorage.getItem('authToken');
    const endpoint = token ? `/village-mapping/${id}` : `/village-mapping/${id}/demo`;
    const headers = token ? this.getAuthHeaders() : { 'Content-Type': 'application/json' };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ success: boolean; message: string; updatedId: number; affectedRows: number }>(response);
  }

  // Get Division, District, PC, AC data
  async getDivisionData(): Promise<DivisionData[]> {
    const response = await fetch(`${API_BASE_URL}/div_dist_pc_ac`);
    return this.handleResponse<DivisionData[]>(response);
  }

  // Admin User Management Methods
  async getUsers(): Promise<{ success: boolean; data: User[] }> {
    const response = await fetch(`${API_BASE_URL}/auth/users`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ success: boolean; data: User[] }>(response);
  }

  async createUser(userData: CreateUserData): Promise<{ success: boolean; message: string; data: User }> {
    const response = await fetch(`${API_BASE_URL}/auth/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return this.handleResponse<{ success: boolean; message: string; data: User }>(response);
  }

  async updateUser(id: number, userData: UpdateUserData): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return this.handleResponse<{ success: boolean; message: string }>(response);
  }

  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/users/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<{ success: boolean; message: string }>(response);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return this.handleResponse<{ success: boolean; message: string }>(response);
  }

  // Process surname data
  async processSurnameData(data: SurnameData[]): Promise<{ success: boolean; processedData: any; message: string; totalRecords: number }> {
    const response = await fetch(`${API_BASE_URL}/process-surname-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    return this.handleResponse<{ success: boolean; processedData: any; message: string; totalRecords: number }>(response);
  }
}

export const apiService = new ApiService();
