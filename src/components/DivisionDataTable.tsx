'use client';

import { useEffect, useState } from 'react';
import MasterFilter from './MasterFilter';
import Navbar from './Navbar';
import Filter from './Filter';

// Define interfaces for type safety
interface DivisionDataItem {
  DIVISION_ID: string;
  DIVISION_ENG: string;
  DISTRICT_ENG: string;
  PC_ENG: string;
  AC_ENG: string;
  PC_CODE: string;
  AC_CODE: string;
  AC_TOTAL_MANDAL: string;
  PC_SEAT: string;
  INC_Party_Zila: string;
}

interface TableRow {
  srNo: number;
  familyId: string;
  name: string;
  fatherName: string;
  motherName: string;
  surname: string;
  mobile1: string;
  mobile2: string;
  age: string;
  dob: string;
  parliament: string;
  assembly: string;
  district: string;
  block: string;
}

export default function GridTable() {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Fetching data from API...');
    setLoading(true);
    setError(null);
    
          fetch('http://localhost:5002/api/div_dist_pc_ac')
      .then((res) => {
        console.log('Response status:', res.status);
        console.log('Response headers:', res.headers);
        console.log('Response ok:', res.ok);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text(); // Get raw text first
      })
      .then((rawData) => {
        console.log('Raw response data:', rawData);
        console.log('Raw data type:', typeof rawData);
        console.log('Raw data length:', rawData?.length);
        
        try {
          const apiData = JSON.parse(rawData);
          console.log('Parsed API data:', apiData);
          console.log('Data type after parsing:', typeof apiData);
          console.log('Data length after parsing:', apiData?.length);
          
          if (!Array.isArray(apiData)) {
            console.error('API data is not an array:', apiData);
            setError('Invalid data format received from API - expected array');
            setLoading(false);
            return;
          }
          
          const mappedRows: TableRow[] = apiData.map((item: DivisionDataItem, index: number) => ({
            srNo: index + 1,
            familyId: item.DIVISION_ID || '',
            name: item.DIVISION_ENG || '',
            fatherName: item.DISTRICT_ENG || '',
            motherName: item.PC_ENG || '',
            surname: item.AC_ENG || '',
            mobile1: item.PC_CODE || '',
            mobile2: item.AC_CODE || '',
            age: item.AC_TOTAL_MANDAL || '',
            dob: item.PC_SEAT || '',
            parliament: item.PC_ENG || '',
            assembly: item.AC_ENG || '',
            district: item.DISTRICT_ENG || '',
            block: item.INC_Party_Zila || ''
          }));
          
          console.log('Mapped rows:', mappedRows);
          setRows(mappedRows);
          setLoading(false);
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
          setError(`Failed to parse API response: ${errorMessage}`);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('API Error:', err);
        setError(err.message || 'Failed to fetch data');
        setLoading(false);
      });
  }, []);

  const handleMasterFilterChange = (filters: any) => {
    console.log('Master filter changed:', filters);
  };

  const handleFilterChange = (filters: any) => {
    console.log('Filter changed:', filters);
  };

  const headers = [
    'SR. NO.',
    'FAMILY ID',
    'NAME',
    'FATHER NAME',
    'MOTHER NAME',
    'SURNAME',
    'MOBILE 1',
    'MOBILE 2',
    'AGE',
    'DOB',
    'PARLIAMENT',
    'ASSEMBLY',
    'DISTRICT',
    'BLOCK'
  ];

  return (
   <>
   <MasterFilter onMasterFilterChange={handleMasterFilterChange} />
   <Navbar />
   <Filter onFilterChange={handleFilterChange}/>
    <div style={{ overflowX: 'auto', padding: '10px', backgroundColor: '#f9f9f9' }}>
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', fontSize: '16px' }}>
          Loading data... Please wait.
        </div>
      )}
      
      {error && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'red', fontSize: '16px' }}>
          Error: {error}
        </div>
      )}
      
      {!loading && !error && rows.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', fontSize: '16px' }}>
          No data available to display.
        </div>
      )}
      
      {!loading && !error && rows.length > 0 && (
        <table style={tableStyle}>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} style={thStyle}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.srNo} style={rowIndex % 2 === 0 ? evenRow : oddRow}>
                <td style={tdStyle}>{row.srNo}</td>
                <td style={tdStyle}>{row.familyId}</td>
                <td style={tdStyle}>{row.name}</td>
                <td style={tdStyle}>{row.fatherName}</td>
                <td style={tdStyle}>{row.motherName}</td>
                <td style={tdStyle}>{row.surname}</td>
                <td style={tdStyle}>{row.mobile1}</td>
                <td style={tdStyle}>{row.mobile2}</td>
                <td style={tdStyle}>{row.age}</td>
                <td style={tdStyle}>{row.dob}</td>
                <td style={tdStyle}>{row.parliament}</td>
                <td style={tdStyle}>{row.assembly}</td>
                <td style={tdStyle}>{row.district}</td>
                <td style={tdStyle}>{row.block}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>

   </>
  );
}

// ---------- Styling ----------
const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  minWidth: '1400px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  backgroundColor: '#fff',
  boxShadow: '0 0 5px rgba(0,0,0,0.1)',
};

const thStyle: React.CSSProperties = {
  border: '1px solid #bbb',
  padding: '10px 8px',
  backgroundColor: '#d9e1f2', // light blue like Excel header
  fontWeight: 'bold',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  height: '40px'
};

const tdStyle: React.CSSProperties = {
  border: '1px solid #ccc',
  padding: '8px',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  height: '35px'
};

const evenRow: React.CSSProperties = {
  backgroundColor: '#ffffff'
};

const oddRow: React.CSSProperties = {
  backgroundColor: '#f4f6f8'
};
