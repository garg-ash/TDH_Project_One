// 'use client';

// import { useState } from 'react';
// import { apiService } from '../services/api';

// export default function AddVoterForm() {
//   const [formData, setFormData] = useState({
//     familyId: '',
//     name: '',
//     mobile1: '',
//     mobile2: '',
//     dob: '',
//     ps: '',
//     gp: '',
//     gram: '',
//     castIda: '',
//     cast: '',
//     pc: '',
//     ac: '',
//     district: '',
//     villageCode: '',
//     villageName: '',
//     gramPanchayat: '',
//     patwarCircle: '',
//     lrCircle: '',
//     age: '',
//     fname: '',
//     hno: '',
//     malefemale: '',
//     castType: ''
//   });

//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState('');

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage('');

//     try {
//       // Convert numeric fields
//       const voterData = {
//         ...formData,
//         dob: parseFloat(formData.dob) || 0,
//         cast: parseFloat(formData.cast) || 0,
//         pc: parseFloat(formData.pc) || 0,
//         age: parseInt(formData.age) || 0
//       };

//       await apiService.createVoter(voterData);
//       setMessage('✅ Voter added successfully!');
      
//       // Clear form
//       setFormData({
//         familyId: '',
//         name: '',
//         mobile1: '',
//         mobile2: '',
//         dob: '',
//         ps: '',
//         gp: '',
//         gram: '',
//         castIda: '',
//         cast: '',
//         pc: '',
//         ac: '',
//         district: '',
//         villageCode: '',
//         villageName: '',
//         gramPanchayat: '',
//         patwarCircle: '',
//         lrCircle: '',
//         age: '',
//         fname: '',
//         hno: '',
//         malefemale: '',
//         castType: ''
//       });
//     } catch (error) {
//       setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Failed to add voter'}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
//       <h2 className="text-xl font-semibold mb-4">Add New Voter</h2>
      
//       {message && (
//         <div className={`p-3 rounded mb-4 ${
//           message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//         }`}>
//           {message}
//         </div>
//       )}

//       <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Family ID</label>
//           <input
//             type="text"
//             name="familyId"
//             value={formData.familyId}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             required
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
//           <input
//             type="text"
//             name="name"
//             value={formData.name}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             required
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Mobile 1</label>
//           <input
//             type="text"
//             name="mobile1"
//             value={formData.mobile1}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             required
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Mobile 2</label>
//           <input
//             type="text"
//             name="mobile2"
//             value={formData.mobile2}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">DOB</label>
//           <input
//             type="number"
//             step="0.1"
//             name="dob"
//             value={formData.dob}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">PS</label>
//           <select
//             name="ps"
//             value={formData.ps}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="">Select PS</option>
//             <option value="Male">Male</option>
//             <option value="Female">Female</option>
//           </select>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">GP</label>
//           <input
//             type="text"
//             name="gp"
//             value={formData.gp}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Gram</label>
//           <input
//             type="text"
//             name="gram"
//             value={formData.gram}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Cast IDA</label>
//           <input
//             type="text"
//             name="castIda"
//             value={formData.castIda}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Cast</label>
//           <input
//             type="number"
//             step="0.1"
//             name="cast"
//             value={formData.cast}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">PC</label>
//           <input
//             type="number"
//             step="0.1"
//             name="pc"
//             value={formData.pc}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">AC</label>
//           <input
//             type="text"
//             name="ac"
//             value={formData.ac}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
//           <input
//             type="text"
//             name="district"
//             value={formData.district}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Village Code</label>
//           <input
//             type="text"
//             name="villageCode"
//             value={formData.villageCode}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Village Name</label>
//           <input
//             type="text"
//             name="villageName"
//             value={formData.villageName}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Gram Panchayat</label>
//           <input
//             type="text"
//             name="gramPanchayat"
//             value={formData.gramPanchayat}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Patwar Circle</label>
//           <input
//             type="text"
//             name="patwarCircle"
//             value={formData.patwarCircle}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">LR Circle</label>
//           <input
//             type="text"
//             name="lrCircle"
//             value={formData.lrCircle}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
//           <input
//             type="number"
//             name="age"
//             value={formData.age}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
//           <input
//             type="text"
//             name="fname"
//             value={formData.fname}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">House No.</label>
//           <input
//             type="text"
//             name="hno"
//             value={formData.hno}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
//           <select
//             name="malefemale"
//             value={formData.malefemale}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="">Select Gender</option>
//             <option value="Male">Male</option>
//             <option value="Female">Female</option>
//           </select>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Cast Type</label>
//           <input
//             type="text"
//             name="castType"
//             value={formData.castType}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div className="md:col-span-2 lg:col-span-3">
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading ? 'Adding Voter...' : 'Add Voter'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// } 