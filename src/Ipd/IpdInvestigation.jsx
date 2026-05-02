import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  updateInvestigation, 
  deleteInvestigation, 
  updateIpd,
  getIpdById
} from '../services/ipd.services';
import IpdPatientInfo from './IpdCommonInfo';

const InvestigationChartTable = () => {
  const { id } = useParams();
  let navigate = useNavigate()
  const [investigations, setInvestigations] = useState([]);
  const [originalInvestigations, setOriginalInvestigations] = useState([]); // Store original data
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newEntry, setNewEntry] = useState({
    date_time: '',
    WBC: '',
    platlet: '',
    CRP: '',
    ESR: '',
    HB: '',
    SGOT: '',
    SGPT: '',
    urea: '',
    creatinine: '',
    unknown1: '',
    unknown2: '', 
    unknown3: '',
    unknown4: '',
    unknown5: '',
  });

  useEffect(() => {
    if (id) {
      fetchInvestigationData();
    }
  }, [id]);

  const fetchInvestigationData = async () => {
    setFetchLoading(true);
    try {
      const response = await getIpdById(id);
      if (response.data && response.data.investigation_chart) {
        setInvestigations(response.data.investigation_chart);
        setOriginalInvestigations(response.data.investigation_chart); // Store original
      } else {
        setInvestigations([]);
        setOriginalInvestigations([]);
      }
    } catch (error) {
      console.error('Error fetching investigation data:', error);
      alert('Failed to fetch investigation data');
      setInvestigations([]);
      setOriginalInvestigations([]);
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
    setInvestigations(prev => 
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
      
      const updatedInvestigations = [formattedEntry];
      const payload = { investigation_chart: updatedInvestigations };
      
      await updateIpd(id, payload);
      
      // Update both states
      setInvestigations(updatedInvestigations);
      setOriginalInvestigations(updatedInvestigations);
      
      setNewEntry({
        date_time: '',
        WBC: '',
        platlet: '',
        CRP: '',
        ESR: '',
        HB: '',
        SGOT: '',
        SGPT: '',
        urea: '',
        creatinine: '',
        unknown1: '',
        unknown2: '',
        unknown3: '',
        unknown4: '',
        unknown5: '',
      });
      
      alert('Investigation added successfully!');
    } catch (error) {
      console.error('Error adding investigation:', error);
      alert('Failed to add investigation');
      fetchInvestigationData();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEntry = async (index) => {
    setLoading(true);
    try {
      const entryToUpdate = investigations[index];
      const originalDate = originalInvestigations[index]?.date_time || entryToUpdate.date_time;
      
      // Check if date_time is already in API format (DD-MM-YYYY HH:MM)
      const isAlreadyApiFormat = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/.test(entryToUpdate.date_time);
      
      const formattedEntry = {
        ...entryToUpdate,
        // Only format if it's not already in API format
        date_time: isAlreadyApiFormat ? entryToUpdate.date_time : formatDateTimeForAPI(entryToUpdate.date_time)
      };
      
      // If date_time is empty, use the original date
      if (!formattedEntry.date_time || formattedEntry.date_time.trim() === '') {
        formattedEntry.date_time = originalDate;
      }
      
      await updateInvestigation(id, index, formattedEntry);
      
      // Update both states with the properly formatted entry
      const updatedInvestigations = investigations.map((item, i) => 
        i === index ? formattedEntry : item
      );
      
      setInvestigations(updatedInvestigations);
      setOriginalInvestigations(updatedInvestigations);
      
      setEditingIndex(null);
      alert('Investigation updated successfully!');
    } catch (error) {
      console.error('Error updating investigation:', error);
      alert('Failed to update investigation');
      fetchInvestigationData();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (index) => {

    setLoading(true);
    try {
      await deleteInvestigation(id, index);
      
      const updatedInvestigations = investigations.filter((_, i) => i !== index);
      setInvestigations(updatedInvestigations);
      setOriginalInvestigations(updatedInvestigations);
      
    } catch (error) {
      console.error('Error deleting investigation:', error);
      alert('Failed to delete investigation');
      fetchInvestigationData();
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (index) => {
    const currentItem = investigations[index];
    
    // Check if the date is already in input format (YYYY-MM-DDTHH:MM)
    const isInputFormat = currentItem.date_time && currentItem.date_time.includes('T');
    
    setInvestigations(prev => 
      prev.map((item, i) => 
        i === index 
          ? {
              ...item,
              // Only convert if it's not already in input format
              date_time: isInputFormat ? item.date_time : formatDateTimeForInput(item.date_time)
            }
          : item
      )
    );
    setEditingIndex(index);
  };

  const cancelEditing = () => {
    // Revert to original data without refetching
    setInvestigations([...originalInvestigations]);
    setEditingIndex(null);
  };

  // Format datetime for display (shows as "DD MMM YYYY, HH:MM AM/PM")
  const formatDateTimeForDisplay = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // Check if it's already in input format (YYYY-MM-DDTHH:MM)
      if (dateString.includes('T')) {
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-');
        dateString = `${day}-${month}-${year} ${timePart}`;
      }
      
      const parts = dateString.split(' ');
      const dateParts = parts[0].split('-');
      
      if (dateParts.length === 3) {
        const day = dateParts[0];
        const month = dateParts[1];
        const year = dateParts[2];
        
        const date = new Date(`${year}-${month}-${day}T00:00`);
        
        if (parts.length > 1) {
          const timeParts = parts[1].split(':');
          if (timeParts.length >= 2) {
            date.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]));
          }
        }
        
        const options = { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric'
        };
        const formattedDate = date.toLocaleDateString('en-GB', options);
        
        if (parts.length > 1) {
          const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          };
          const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
          return `${formattedDate}, ${formattedTime}`;
        }
        
        return formattedDate;
      }
    } catch (error) {
      console.error('Error formatting date for display:', error);
    }
    
    return dateString;
  };

  // Format datetime for input field (convert to YYYY-MM-DDTHH:MM for datetime-local input)
  const formatDateTimeForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      // If it's already in input format, return as is
      if (dateString.includes('T')) {
        return dateString;
      }
      
      const parts = dateString.split(' ');
      const dateParts = parts[0].split('-');
      
      if (dateParts.length === 3) {
        const day = dateParts[0];
        const month = dateParts[1];
        const year = dateParts[2];
        const time = parts.length > 1 ? parts[1] : '00:00';
        
        // Ensure time has seconds part for datetime-local input
        const timeWithSeconds = time.includes(':') && time.split(':').length === 2 
          ? `${time}:00` 
          : time;
        
        return `${year}-${month}-${day}T${timeWithSeconds}`;
      }
    } catch (error) {
      console.error('Error formatting date for input:', error);
    }
    
    return '';
  };

  // Format datetime for API (convert YYYY-MM-DDTHH:MM to DD-MM-YYYY HH:MM)
  const formatDateTimeForAPI = (dateString) => {
    if (!dateString) return '';
    
    try {
      // If it's already in API format, return as is
      if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      const dateTimeParts = dateString.split('T');
      const dateParts = dateTimeParts[0].split('-');
      
      if (dateParts.length === 3) {
        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];
        const time = dateTimeParts.length > 1 ? dateTimeParts[1] : '00:00';
        
        // Remove seconds if present
        const timeParts = time.split(':');
        const timeWithoutSeconds = `${timeParts[0]}:${timeParts[1]}`;
        
        return `${day}-${month}-${year} ${timeWithoutSeconds}`;
      }
    } catch (error) {
      console.error('Error formatting date for API:', error);
    }
    
    return dateString;
  };

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Loading investigation data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-5 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 text-center flex justify-between">
       <h2 className="text-3xl font-bold text-slate-800 mb-2">Investigation Chart</h2>
       <button className='border rounded-3xl px-4' onClick={()=>navigate(-1)}>Back</button>
      </div>
      
      <IpdPatientInfo ipdId={id}/>

      {/* Add New Entry Form */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <span className="text-2xl">➕</span> Add New Investigation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
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
            <label className="text-sm font-medium text-slate-700">WBC (cells/μL)</label>
            <input
              type="text"
              name="WBC"
              value={newEntry.WBC}
              onChange={handleNewEntryChange}
              placeholder="e.g., 7500"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Platelet (cells/μL)</label>
            <input
              type="text"
              name="platlet"
              value={newEntry.platlet}
              onChange={handleNewEntryChange}
              placeholder="e.g., 250000"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">CRP (mg/L)</label>
            <input
              type="text"
              name="CRP"
              value={newEntry.CRP}
              onChange={handleNewEntryChange}
              placeholder="e.g., 5.2"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">ESR (mm/hr)</label>
            <input
              type="text"
              name="ESR"
              value={newEntry.ESR}
              onChange={handleNewEntryChange}
              placeholder="e.g., 15"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">HB (g/dL)</label>
            <input
              type="text"
              name="HB"
              value={newEntry.HB}
              onChange={handleNewEntryChange}
              placeholder="e.g., 13.5"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">SGOT (U/L)</label>
            <input
              type="text"
              name="SGOT"
              value={newEntry.SGOT}
              onChange={handleNewEntryChange}
              placeholder="e.g., 32"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">SGPT (U/L)</label>
            <input
              type="text"
              name="SGPT"
              value={newEntry.SGPT}
              onChange={handleNewEntryChange}
              placeholder="e.g., 28"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Urea</label>
            <input
              type="text"
              name="urea"
              value={newEntry.urea}
              onChange={handleNewEntryChange}
              placeholder="Urea"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Creatinine</label>
            <input
              type="text"
              name="creatinine"
              value={newEntry.creatinine}
              onChange={handleNewEntryChange}
              placeholder="Creatinine"
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              name="unknown1"
              value={newEntry.unknown1}
              onChange={handleNewEntryChange}
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              name="unknown2"
              value={newEntry.unknown2}
              onChange={handleNewEntryChange}
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              name="unknown3"
              value={newEntry.unknown3}
              onChange={handleNewEntryChange}
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              name="unknown4"
              value={newEntry.unknown4}
              onChange={handleNewEntryChange}
              className="px-3 py-1 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              name="unknown5"
              value={newEntry.unknown5}
              onChange={handleNewEntryChange}
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
          {loading ? '⏳ Adding...' : '✓ Add Investigation'}
        </button>
      </div>

      {/* Investigation Table */}
      {investigations.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center border-2 border-dashed border-slate-300">
          <div className="text-6xl mb-4 opacity-50">📋</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No Investigation Records</h3>
          <p className="text-slate-600">Add your first investigation entry using the form above</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-800">
              Investigation Records ({investigations.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    Date & Time
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    WBC
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    Platelet
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    CRP
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    ESR
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    HB
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    SGOT
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    SGPT
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    Urea
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs">
                    Creatinine
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs"></th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs"></th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs"></th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs"></th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 uppercase tracking-wide text-xs"></th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700 uppercase tracking-wide text-xs w-48">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {investigations.map((entry, index) => (
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
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="WBC"
                          value={entry.WBC || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.WBC || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="platlet"
                          value={entry.platlet || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.platlet || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="CRP"
                          value={entry.CRP || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.CRP || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="ESR"
                          value={entry.ESR || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.ESR || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="HB"
                          value={entry.HB || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.HB || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="SGOT"
                          value={entry.SGOT || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.SGOT || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="SGPT"
                          value={entry.SGPT || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.SGPT || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="urea"
                          value={entry.urea || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.urea || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="creatinine"
                          value={entry.creatinine || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.creatinine || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="unknown1"
                          value={entry.unknown1 || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.unknown1 || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="unknown2"
                          value={entry.unknown2 || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.unknown2 || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="unknown3"
                          value={entry.unknown3 || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.unknown3 || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="unknown4"
                          value={entry.unknown4 || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.unknown4 || '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700 min-w-[140px]">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          name="unknown5"
                          value={entry.unknown5 || ''}
                          onChange={(e) => handleEditChange(e, index)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span>{entry.unknown5 || '-'}</span>
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
                            title="Edit entry"
                            className="px-3 py-1 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(index)}
                            disabled={loading}
                            title="Delete entry"
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

export default InvestigationChartTable;