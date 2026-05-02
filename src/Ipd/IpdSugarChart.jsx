import React, { useState, useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import { 
  updateSugarChart, 
  deleteSugarChart, 
  updateIpd,
  getIpdById
} from '../services/ipd.services';
import IpdPatientInfo from './IpdCommonInfo';

const BPSugarChartTable = () => {
  const { id } = useParams();
  let navigate = useNavigate()
  const [records, setRecords] = useState([]);
  const [originalRecords, setOriginalRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newEntry, setNewEntry] = useState({
    date_time: '',
    BP: '',
    PR: '',
    SPO2: '',
    Sugar: '',
    Other: ''
  });

  useEffect(() => {
    if (id) {
      fetchChartData();
    }
  }, [id]);

  const fetchChartData = async () => {
    setFetchLoading(true);
    try {
      const response = await getIpdById(id);
      if (response.data && response.data.bp_sugar_chart) {
        setRecords(response.data.bp_sugar_chart);
        setOriginalRecords(response.data.bp_sugar_chart);
      } else {
        setRecords([]);
        setOriginalRecords([]);
      }
    } catch (error) {
      console.error('Error fetching BP/Sugar chart data:', error);
      alert('Failed to fetch BP/Sugar chart data');
      setRecords([]);
      setOriginalRecords([]);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleNewEntryChange = (e) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditChange = (e, index) => {
    const { name, value } = e.target;
    setRecords(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [name]: value } : item
      )
    );
  };

  const handleAddEntry = async () => {
    if (!newEntry.date_time) {
      alert('Date and time are required');
      return;
    }

    setLoading(true);
    try {
      const formattedEntry = {
        ...newEntry,
        date_time: formatDateTimeForAPI(newEntry.date_time)
      };
      
      const updatedRecords = [...records, formattedEntry];
      const payload = { bp_sugar_chart: updatedRecords };
      
      await updateIpd(id, payload);
      
      // Update both states
      setRecords(updatedRecords);
      setOriginalRecords(updatedRecords);
      
      // Reset form
      setNewEntry({
        date_time: '',
        BP: '',
        PR: '',
        SPO2: '',
        Sugar: '',
        Other: ''
      });
      
      alert('Record added successfully!');
    } catch (error) {
      console.error('Error adding record:', error);
      alert('Failed to add record');
      fetchChartData();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEntry = async (index) => {
    setLoading(true);
    try {
      const entryToUpdate = records[index];
      const originalDate = originalRecords[index]?.date_time || entryToUpdate.date_time;
      
      // Format date for API
      const formattedEntry = {
        ...entryToUpdate,
        date_time: formatDateTimeForAPI(entryToUpdate.date_time)
      };
      
      // If date_time is empty or invalid, use the original date
      if (!formattedEntry.date_time || formattedEntry.date_time.trim() === '') {
        formattedEntry.date_time = originalDate;
      }
      
      await updateSugarChart(id, index, formattedEntry);
      
      // Update both states with the properly formatted entry
      const updatedRecords = records.map((item, i) => 
        i === index ? formattedEntry : item
      );
      
      setRecords(updatedRecords);
      setOriginalRecords(updatedRecords);
      
      setEditingIndex(null);
      alert('Record updated successfully!');
    } catch (error) {
      console.error('Error updating record:', error);
      alert('Failed to update record');
      fetchChartData();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (index) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteSugarChart(id, index);
      
      const updatedRecords = records.filter((_, i) => i !== index);
      setRecords(updatedRecords);
      setOriginalRecords(updatedRecords);
      
      alert('Record deleted successfully!');
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record');
      fetchChartData();
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (index) => {
    const currentItem = records[index];
    
    setRecords(prev => 
      prev.map((item, i) => 
        i === index 
          ? {
              ...item,
              date_time: formatDateTimeForInput(item.date_time)
            }
          : item
      )
    );
    setEditingIndex(index);
  };

  const cancelEditing = () => {
    // Revert to original data without refetching
    setRecords([...originalRecords]);
    setEditingIndex(null);
  };

  // Format datetime for display (shows as "DD/MM/YYYY, HH:MM AM/PM")
  const formatDateTimeForDisplay = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // Check if it's already in input format (YYYY-MM-DDTHH:MM)
      if (dateString.includes('T')) {
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');
        
        const date = new Date(year, month - 1, day, hour, minute);
        return formatDateToDisplay(date);
      }
      
      // Parse DD/MM/YYYY HH:MM format
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('/');
      const [hourStr, minute] = timePart.split(':');
      const period = timePart.includes('PM') ? 'PM' : 'AM';
      
      let hour = parseInt(hourStr);
      if (period === 'PM' && hour < 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      const date = new Date(year, month - 1, day, hour, minute);
      return formatDateToDisplay(date);
    } catch (error) {
      console.error('Error formatting date for display:', error);
    }
    
    return dateString;
  };

  // Helper function to format date for display
  const formatDateToDisplay = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12 || 12;
    const formattedHours = hours.toString().padStart(2, '0');
    
    return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${period}`;
  };

  // Format datetime for input field (convert to YYYY-MM-DDTHH:MM for datetime-local input)
  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      // If it's already in input format, return as is
      if (dateString.includes('T')) {
        return dateString;
      }
      
      // Parse DD/MM/YYYY HH:MM AM/PM format
      const [datePart, timePartWithPeriod] = dateString.split(' ');
      const [day, month, year] = datePart.split('/');
      
      // Extract time and period
      const timeMatch = timePartWithPeriod.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!timeMatch) return '';
      
      let [_, hourStr, minuteStr, period] = timeMatch;
      let hour = parseInt(hourStr);
      const minute = minuteStr;
      
      // Convert 12-hour format to 24-hour format
      if (period && period.toUpperCase() === 'PM' && hour < 12) {
        hour += 12;
      }
      if (period && period.toUpperCase() === 'AM' && hour === 12) {
        hour = 0;
      }
      
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.padStart(2, '0');
      
      return `${year}-${month}-${day}T${formattedHour}:${formattedMinute}`;
    } catch (error) {
      console.error('Error formatting date for input:', error);
    }
    
    return '';
  };

  // Format datetime for API (convert YYYY-MM-DDTHH:MM to DD/MM/YYYY HH:MM AM/PM)
  const formatDateTimeForAPI = (dateString) => {
    if (!dateString) return '';
    
    try {
      // If it's already in API format (DD/MM/YYYY), return as is
      if (dateString.includes('/')) {
        // But might be missing period, so check and format properly
        const [datePart, timePart] = dateString.split(' ');
        if (datePart && timePart && !timePart.includes('AM') && !timePart.includes('PM')) {
          // Add period if missing
          const [hourStr, minuteStr] = timePart.split(':');
          let hour = parseInt(hourStr);
          const minute = minuteStr;
          const period = hour >= 12 ? 'PM' : 'AM';
          
          hour = hour % 12 || 12;
          const formattedHour = hour.toString().padStart(2, '0');
          
          return `${datePart} ${formattedHour}:${minute} ${period}`;
        }
        return dateString;
      }
      
      // Format from input format (YYYY-MM-DDTHH:MM)
      const [datePart, timePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-');
      
      const [hourStr, minuteStr] = timePart.split(':');
      let hour = parseInt(hourStr);
      const minute = minuteStr;
      
      // Convert to 12-hour format with AM/PM
      const period = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      const formattedHour = hour.toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${formattedHour}:${minute} ${period}`;
    } catch (error) {
      console.error('Error formatting date for API:', error);
    }
    
    return dateString;
  };

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Loading BP/Sugar chart data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-5 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 text-center flex justify-between">
       <h2 className="text-3xl font-bold text-slate-800 mb-2">Blood Pressure and Sugar Chart</h2>
       <button className='border rounded-3xl px-4' onClick={()=>navigate(-1)}>Back</button>
      </div>

      <IpdPatientInfo ipdId={id}/>
      
      {/* Add New Entry Form */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <span className="text-2xl">➕</span> Add New Vital Signs Record
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="date_time"
              value={newEntry.date_time}
              onChange={handleNewEntryChange}
              required
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Blood Pressure</label>
            <input
              type="text"
              name="BP"
              value={newEntry.BP}
              onChange={handleNewEntryChange}
              placeholder="e.g., 120/80"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Pulse Rate (BPM)</label>
            <input
              type="text"
              name="PR"
              value={newEntry.PR}
              onChange={handleNewEntryChange}
              placeholder="e.g., 72"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">SPO2 (%)</label>
            <input
              type="text"
              name="SPO2"
              value={newEntry.SPO2}
              onChange={handleNewEntryChange}
              placeholder="e.g., 98"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Blood Sugar (mg/dL)</label>
            <input
              type="text"
              name="Sugar"
              value={newEntry.Sugar}
              onChange={handleNewEntryChange}
              placeholder="e.g., 120"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Other Notes</label>
            <input
              type="text"
              name="Other"
              value={newEntry.Other}
              onChange={handleNewEntryChange}
              placeholder="Additional observations"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>
        <button
          onClick={handleAddEntry}
          disabled={loading || !newEntry.date_time}
          className={`px-5 py-1 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
            loading || !newEntry.date_time
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-sm hover:shadow-md'
          }`}
        >
          {loading ? '⏳ Adding...' : '✓ Add Record'}
        </button>
      </div>

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border-2 border-dashed border-slate-300">
          <div className="text-6xl mb-4 opacity-50">📊</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No BP/Sugar Records</h3>
          <p className="text-slate-600">Add your first vital signs record using the form above</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-800">
              Vital Signs Records ({records.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs min-w-[180px]">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    BP
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    PR
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    SPO2
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    Sugar
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    Other
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700 uppercase tracking-wide text-xs w-48">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.map((entry, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-slate-800 font-medium min-w-[180px]">
                      {editingIndex === index ? (
                        <input
                          type="datetime-local"
                          name="date_time"
                          value={entry.date_time || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm">
                          {formatDateTimeForDisplay(entry.date_time)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="BP"
                          value={entry.BP || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          placeholder="120/80"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className={`font-medium ${entry.BP ? 'text-blue-600' : 'text-slate-400'}`}>
                          {entry.BP || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="PR"
                          value={entry.PR || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          placeholder="72"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className={`font-medium ${entry.PR ? 'text-green-600' : 'text-slate-400'}`}>
                          {entry.PR || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="SPO2"
                          value={entry.SPO2 || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          placeholder="98"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className={`font-medium ${entry.SPO2 ? 'text-cyan-600' : 'text-slate-400'}`}>
                          {entry.SPO2 || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="Sugar"
                          value={entry.Sugar || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          placeholder="120"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className={`font-medium ${entry.Sugar ? 'text-purple-600' : 'text-slate-400'}`}>
                          {entry.Sugar || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="Other"
                          value={entry.Other || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          placeholder="Additional notes"
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="max-w-[200px] truncate inline-block" title={entry.Other || ''}>
                          {entry.Other || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingIndex === index ? (
                        <div className="flex gap-2 justify-center flex-wrap">
                          <button
                            onClick={() => handleUpdateEntry(index)}
                            disabled={loading}
                            title="Save changes"
                            className="px-3 py-1 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ✓ Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={loading}
                            title="Cancel editing"
                            className="px-3 py-1 text-xs font-medium bg-slate-500 hover:bg-slate-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center flex-wrap">
                          <button
                            onClick={() => startEditing(index)}
                            title="Edit record"
                            className="px-3 py-1 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(index)}
                            disabled={loading}
                            title="Delete record"
                            className="px-3 py-1 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BPSugarChartTable;