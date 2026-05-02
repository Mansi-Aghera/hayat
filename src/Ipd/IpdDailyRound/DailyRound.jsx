import React, { useState, useEffect } from 'react';
import { getIpdDailyRoundById } from '../../services/ipd.services';
import DailyRoundForm from './DailyRoundForm';
import { useParams } from 'react-router-dom';
import DailyRoundDetail from './DailyRoundDetail';

const DailyRoundManagement = () => {
  const [dailyRounds, setDailyRounds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  let {id} = useParams()

  useEffect(() => {
    fetchDailyRounds();
  }, [id]);

  const fetchDailyRounds = async () => {
    setLoading(true);
    try {
      const response = await getIpdDailyRoundById(id);
      const data = response.data;
      // Handle both array and single object responses
      setDailyRounds(Array.isArray(data) ? data : [data].filter(Boolean));
    } catch (error) {
      console.error('Error fetching daily rounds:', error);
      setDailyRounds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  const handleSubmitSuccess = () => {
    setShowForm(false);
    fetchDailyRounds();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow p-6 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-800">Daily Rounds</h2>
          {!showForm && (
            <button
              onClick={handleAddClick}
              className="px-4 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Daily Round
            </button>
          )}
        </div>

        {/* Show form when add is clicked */}
        {showForm && (
          <DailyRoundForm
            ipdId={id}
            onCancel={handleCancelForm}
            onSubmitSuccess={handleSubmitSuccess}
          />
        )}
      </div>

      {/* Show existing daily rounds */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Existing Daily Rounds</h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading daily rounds...</span>
          </div>
        ) : dailyRounds.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">No daily rounds found for this patient</p>
            <p className="text-gray-400">Click "Add Daily Round" to create the first one</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-40">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Chief Complaints</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-44">Vitals</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Treatment</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Special Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {dailyRounds.map((round, index) => {
                  const treatments = round.daily_given_treatment?.flatMap(g => g.given_treatment || []) || [];
                  const complaints = round.daily_chief_complaints || [];
                  const vitals = round.daily_examination?.[0] || {};
                  
                  return (
                    <tr key={round.id || index} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-4 py-4 text-sm text-gray-500 font-medium text-center">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {round.datetime?.split("T")[0]}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {round.datetime?.split("T")[1]?.slice(0, 5)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-bold text-blue-700">
                          {round.staff_data?.staff_name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 uppercase font-semibold tracking-tight">
                          {round.staff_data?.department || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {complaints.length > 0 ? complaints.map((c, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase">
                              {c?.complaints_data?.name || 'CMP'} {c.duration && `(${c.duration})`}
                            </span>
                          )) : <span className="text-gray-400 text-xs italic">No complaints</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="grid grid-cols-1 gap-1">
                          {vitals.BP && (
                            <div className="flex items-center justify-between gap-2 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase">BP</span>
                              <span className="text-xs font-bold text-emerald-800">{vitals.BP}</span>
                            </div>
                          )}
                          {vitals.PR && (
                            <div className="flex items-center justify-between gap-2 px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                              <span className="text-[10px] font-bold text-blue-700 uppercase">PR</span>
                              <span className="text-xs font-bold text-blue-800">{vitals.PR}</span>
                            </div>
                          )}
                          {vitals.SPO2 && (
                            <div className="flex items-center justify-between gap-2 px-2 py-0.5 rounded bg-purple-50 border border-purple-100">
                              <span className="text-[10px] font-bold text-purple-700 uppercase">SpO₂</span>
                              <span className="text-xs font-bold text-purple-800">{vitals.SPO2}%</span>
                            </div>
                          )}
                          {!vitals.BP && !vitals.PR && !vitals.SPO2 && (
                            <span className="text-gray-400 text-xs italic">No vitals rec.</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {treatments.length > 0 ? (
                            <>
                              {treatments.slice(0, 3).map((t, i) => (
                                <div key={i} className="flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-gray-50 border border-gray-100">
                                  <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[100px]">
                                    {t.medicine_data?.medicine_name || t.medicine_name || 'Med'}
                                  </span>
                                  <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded border text-blue-600 whitespace-nowrap">
                                    {t.dosage}
                                  </span>
                                </div>
                              ))}
                              {treatments.length > 3 && (
                                <div className="text-[10px] text-gray-500 font-bold ml-1">
                                  +{treatments.length - 3} more
                                </div>
                              )}
                            </>
                          ) : <span className="text-gray-400 text-xs italic">No treatment</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <p className="text-xs text-amber-800 font-medium line-clamp-2 italic leading-relaxed">
                          {round.special_notes || '-'}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default DailyRoundManagement;