// 'use client';

// import { useState, useEffect } from 'react';
// import { apiService, Voter } from '../services/api';

// export default function DataFetchingExamples() {
//   const [voters, setVoters] = useState<Voter[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Example 1: Basic data fetching with useEffect
//   const fetchVotersBasic = async () => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const response = await apiService.getVoters();
//       setVoters(response.voters);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Example 2: Fetch with filters
//   const fetchVotersWithFilters = async (filters: any) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       const response = await apiService.getVoters(filters);
//       setVoters(response.voters);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to fetch data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Example 3: Fetch single voter
//   const fetchSingleVoter = async (id: string) => {
//     try {
//       const voter = await apiService.getVoter(id);
//       console.log('Single voter:', voter);
//       return voter;
//     } catch (err) {
//       console.error('Error fetching single voter:', err);
//       throw err;
//     }
//   };

//   // Example 4: Create new voter
//   const createNewVoter = async (voterData: Partial<Voter>) => {
//     try {
//       const newVoter = await apiService.createVoter(voterData);
//       console.log('Created voter:', newVoter);
      
//       // Refresh the list
//       await fetchVotersBasic();
      
//       return newVoter;
//     } catch (err) {
//       console.error('Error creating voter:', err);
//       throw err;
//     }
//   };

//   // Example 5: Update voter
//   const updateVoterData = async (id: string, updates: Partial<Voter>) => {
//     try {
//       const updatedVoter = await apiService.updateVoter(id, updates);
//       console.log('Updated voter:', updatedVoter);
      
//       // Update local state
//       setVoters(prev => prev.map(voter => 
//         voter._id === id ? updatedVoter : voter
//       ));
      
//       return updatedVoter;
//     } catch (err) {
//       console.error('Error updating voter:', err);
//       throw err;
//     }
//   };

//   // Example 6: Delete voter
//   const deleteVoterData = async (id: string) => {
//     try {
//       await apiService.deleteVoter(id);
//       console.log('Deleted voter with ID:', id);
      
//       // Remove from local state
//       setVoters(prev => prev.filter(voter => voter._id !== id));
//     } catch (err) {
//       console.error('Error deleting voter:', err);
//       throw err;
//     }
//   };

//   // Example 7: Fetch filter options
//   const fetchFilterOptions = async () => {
//     try {
//       const options = await apiService.getFilterOptions();
//       console.log('Filter options:', options);
//       return options;
//     } catch (err) {
//       console.error('Error fetching filter options:', err);
//       throw err;
//     }
//   };

//   // Load data on component mount
//   useEffect(() => {
//     fetchVotersBasic();
//   }, []);

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6">
//       <h2 className="text-xl font-semibold mb-4">Data Fetching Examples</h2>
      
//       {/* Loading and Error States */}
//       {loading && (
//         <div className="text-center py-4">
//           <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
//           <span className="ml-2">Loading...</span>
//         </div>
//       )}
      
//       {error && (
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//           <strong>Error:</strong> {error}
//         </div>
//       )}

//       {/* Example Buttons */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//         <button
//           onClick={fetchVotersBasic}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//         >
//           Fetch All Voters
//         </button>
        
//         <button
//           onClick={() => fetchVotersWithFilters({ villageCode: '101' })}
//           className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
//         >
//           Fetch Filtered Voters
//         </button>
        
//         <button
//           onClick={() => fetchFilterOptions()}
//           className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
//         >
//           Fetch Filter Options
//         </button>
        
//         <button
//           onClick={() => createNewVoter({
//             familyId: 'TEST001',
//             name: 'Test User',
//             mobile1: '1234567890',
//             ps: 'Male',
//             gp: 'Test Area',
//             district: 'Test District'
//           })}
//           className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
//         >
//           Create Test Voter
//         </button>
//       </div>

//       {/* Data Display */}
//       <div className="mt-6">
//         <h3 className="text-lg font-medium mb-3">Fetched Data ({voters.length} voters)</h3>
//         <div className="overflow-x-auto">
//           <table className="min-w-full border border-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-4 py-2 text-left border-b">Name</th>
//                 <th className="px-4 py-2 text-left border-b">Family ID</th>
//                 <th className="px-4 py-2 text-left border-b">Mobile</th>
//                 <th className="px-4 py-2 text-left border-b">District</th>
//                 <th className="px-4 py-2 text-left border-b">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {voters.slice(0, 5).map((voter) => (
//                 <tr key={voter._id} className="hover:bg-gray-50">
//                   <td className="px-4 py-2 border-b">{voter.name}</td>
//                   <td className="px-4 py-2 border-b">{voter.familyId}</td>
//                   <td className="px-4 py-2 border-b">{voter.mobile1}</td>
//                   <td className="px-4 py-2 border-b">{voter.district}</td>
//                   <td className="px-4 py-2 border-b">
//                     <div className="flex space-x-2">
//                       <button
//                         onClick={() => updateVoterData(voter._id, { name: voter.name + ' (Updated)' })}
//                         className="text-blue-600 hover:text-blue-800 text-sm"
//                       >
//                         Update
//                       </button>
//                       <button
//                         onClick={() => deleteVoterData(voter._id)}
//                         className="text-red-600 hover:text-red-800 text-sm"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
        
//         {voters.length > 5 && (
//           <p className="text-sm text-gray-600 mt-2">
//             Showing first 5 of {voters.length} voters
//           </p>
//         )}
//       </div>

//       {/* Code Examples */}
//       <div className="mt-8">
//         <h3 className="text-lg font-medium mb-3">Code Examples</h3>
//         <div className="bg-gray-100 p-4 rounded text-sm">
//           <pre className="whitespace-pre-wrap">
// {`// 1. Basic data fetching
// const fetchData = async () => {
//   const response = await apiService.getVoters();
//   setVoters(response.voters);
// };

// // 2. Fetch with filters
// const fetchFilteredData = async () => {
//   const response = await apiService.getVoters({
//     villageCode: '101',
//     page: 1,
//     limit: 10
//   });
//   setVoters(response.voters);
// };

// // 3. Create new voter
// const createVoter = async () => {
//   const newVoter = await apiService.createVoter({
//     familyId: 'FAM001',
//     name: 'John Doe',
//     mobile1: '9876543210'
//   });
// };

// // 4. Update voter
// const updateVoter = async (id, updates) => {
//   const updatedVoter = await apiService.updateVoter(id, updates);
// };

// // 5. Delete voter
// const deleteVoter = async (id) => {
//   await apiService.deleteVoter(id);
// };`}
//           </pre>
//         </div>
//       </div>
//     </div>
//   );
// } 