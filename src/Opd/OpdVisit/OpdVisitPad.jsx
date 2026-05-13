import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { opdVisitById, deleteOpdVisit } from '../../services/opd.services';
import { CalendarDays, Trash2, Edit, Clock, Activity, FileText, Pill, Stethoscope, AlertCircle, ClipboardList, History, ChevronRight as ChevronRightIcon, } from 'lucide-react';

const VisitPad = ({ opdId }) => {
  const [allVisits, setAllVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  let navigate = useNavigate();

  useEffect(() => {
    fetchVisitData();
  }, [opdId]);

  const fetchVisitData = async () => {
    try {
      setLoading(true);
      const response = await opdVisitById(opdId);

      if (response.status === 'success' && response.data && response.data.length > 0) {
        const sortedVisits = response.data.sort((a, b) =>
          new Date(b.datetime || b.created_at) - new Date(a.datetime || a.created_at)
        );
        setAllVisits(sortedVisits);
        setSelectedVisit(sortedVisits[0]);
        setSelectedIndex(0);
      } else {
        setAllVisits([]);
        setSelectedVisit(null);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load visit data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVisit = (index) => {
    setSelectedVisit(allVisits[index]);
    setSelectedIndex(index);
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateShort = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTimeCompact = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteVisit = async (visitId) => {
    if (!window.confirm("Are you sure you want to delete this visit?")) return;

    try {
      await deleteOpdVisit(visitId);

      const updatedVisits = allVisits.filter(v => v.id !== visitId);
      setAllVisits(updatedVisits);

      if (updatedVisits.length > 0) {
        setSelectedVisit(updatedVisits[0]);
        setSelectedIndex(0);
      } else {
        setSelectedVisit(null);
      }
    } catch (err) {
      alert("Failed to delete visit");
      console.error(err);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3">
        <div className="flex items-center text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
        <button
          onClick={fetchVisitData}
          className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!allVisits || allVisits.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-6">
        No visit data available
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-3 space-y-4">

      {/* Compact Date Selector with Time */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center mb-2">
          <CalendarDays className="w-4 h-4 text-blue-600 mr-1.5" />
          <h2 className="text-sm font-semibold text-gray-800">Select Visit</h2>
        </div>
        <div className="flex overflow-x-auto space-x-2 pb-1">
          {allVisits.map((visit, index) => (
            <button
              key={visit.id}
              onClick={() => handleSelectVisit(index)}
              className={`flex-shrink-0 px-3 py-2 rounded border text-xs transition-all ${selectedIndex === index
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                  : 'border-gray-200 hover:border-blue-300'
                }`}
            >
              <div className="text-center">
                <div>{formatDateShort(visit.datetime)}</div>
                <div className={`mt-0.5 ${selectedIndex === index ? 'text-blue-600' : 'text-gray-500'}`}>
                  {formatTime(visit.datetime)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Visit Details Grid */}
      {selectedVisit && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">

            {/* Visit Info */}
            <CompactCard
              title="Visit Info"
              icon={Clock}
              actions={
                <div className="flex gap-2">
                  <Edit
                    className="w-4 h-4 text-gray-500 cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/edit-opd-visit/${selectedVisit.id}`)}
                  />
                  <Trash2
                    className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700"
                    onClick={() => handleDeleteVisit(selectedVisit.id)}
                  />
                </div>
              }
            >
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formatDateTimeCompact(selectedVisit.datetime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Visit ID:</span>
                  <span className="font-medium">#{selectedVisit.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">OPD ID:</span>
                  <span className="font-medium">#{selectedVisit.opd_data}</span>
                </div>
              </div>
            </CompactCard>

            {/* Chief Complaints - Compact */}
            <CompactCard title="Complaints" icon={AlertCircle}>
              <div className="space-y-1">
                {selectedVisit.chief_complaints?.map((complaint, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-gray-700">{complaint.complaints_data?.name}</span>
                    {complaint.duration && (
                      <span className="text-gray-600 ml-2 text-xs">({complaint.duration})</span>
                    )}
                    {complaint.optional && complaint.optional !== 'No Opinion' && (
                      <div className="text-xs text-gray-500 mt-0.5">{complaint.optional}</div>
                    )}
                  </div>
                ))}
              </div>
            </CompactCard>

            {/* Vitals - Compact Grid */}
            <CompactCard title="Vitals" icon={Activity}>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">BP</div>
                  <div className="font-semibold">{selectedVisit.vitals?.BP || '--'}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">PR</div>
                  <div className="font-semibold">{selectedVisit.vitals?.PR || '--'}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">SPO₂</div>
                  <div className="font-semibold">{selectedVisit.vitals?.SPO || '--'}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Sugar</div>
                  <div className="font-semibold">{selectedVisit.vitals?.Sugar || '--'}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Weight</div>
                  <div className="font-semibold">{selectedVisit.vitals?.Weight || '--'}</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600">Temperature</div>
                  <div className="font-semibold">{selectedVisit.vitals?.Temp || '--'}</div>
                </div>
              </div>
            </CompactCard>

            {/* Examination */}
            <CompactCard title="Examination" icon={Stethoscope}>
              <div className="grid grid-cols-5 gap-2 text-sm">
                <div>
                  <div className="text-xs text-gray-600">RS</div>
                  <div className="font-medium">{selectedVisit.examination?.RS || '--'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">CVS</div>
                  <div className="font-medium">{selectedVisit.examination?.CVS || '--'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">CNS</div>
                  <div className="font-medium">{selectedVisit.examination?.CNS || '--'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">PA</div>
                  <div className="font-medium">{selectedVisit.examination?.PA || '--'}</div>
                </div>
                {selectedVisit.examination?.Others && (
                  <div>
                    <div className="text-xs text-gray-600">Other</div>
                    <div className="font-medium">{selectedVisit.examination.Others}</div>
                  </div>
                )}
              </div>
            </CompactCard>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Diagnosis */}
            {selectedVisit.diagnosis_detail?.length > 0 && (
              <CompactCard title="Diagnosis" icon={FileText}>
                <div className="space-y-1.5">
                  {selectedVisit.diagnosis_detail.map((diagnosis, index) => (
                    <div key={index} className="text-sm flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span className="font-medium">{diagnosis.diagnosis_data?.diagnosis_name}</span>
                      {diagnosis.duration && (
                        <span className="text-gray-600 text-xs ml-2">({diagnosis.duration})</span>
                      )}
                    </div>
                  ))}
                </div>
              </CompactCard>
            )}

            {/* Diet */}
            <CompactCard title="suggested Diet" icon={FileText}>
              {selectedVisit.suggested_diet?.length > 0 ? (
                selectedVisit.suggested_diet.map((d, i) => (
                  <div key={i} className="font-medium text-sm">
                    • {d.name || "--"}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400 text-center">
                  No diet recorded
                </div>
              )}
            </CompactCard>

            {/* Medical History */}
            {selectedVisit.past_history?.length > 0 && (
              <CompactCard title="Medical History" icon={History}>
                <div className="space-y-1">
                  {selectedVisit.past_history.map((history, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{history.past_history_data?.name}</span>
                      <span className="text-gray-600 text-xs">{history.duration}</span>
                    </div>
                  ))}
                </div>
              </CompactCard>
            )}

            {/* Prescriptions - Compact */}
            <CompactCard title="Prescriptions" icon={Pill}>
              {selectedVisit.given_medicine?.length > 0 ? (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Medicine</th>
                      <th className="text-left py-1">Dose</th>
                      <th className="text-left py-1">Qty</th>
                      <th className="text-left py-1">Intake</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVisit.given_medicine.map((m, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1 font-medium">
                          {m.medicine_data?.medicine_name || "--"}
                        </td>
                        <td>{m.doses || "--"}</td>
                        <td>{m.quantity || "--"}</td>
                        <td>{m.intake_type || "--"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-sm text-gray-400 text-center">
                  No prescriptions available
                 </div>
              )}
            </CompactCard>

            {/* Advice */}
            {selectedVisit.adviced?.length > 0 && (
              <CompactCard title="Advice" icon={ClipboardList}>
                <div className="space-y-1.5">
                  {selectedVisit.adviced.map((advice, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">{advice.opinion_details_data?.opinion_name}</div>
                      <div className="text-xs text-gray-500">{advice.datetime}</div>
                    </div>
                  ))}
                </div>
              </CompactCard>
            )}

            {/* Next Visit */}
            {selectedVisit.nextVisit?.length > 0 && (
              <CompactCard title="Next Visit" icon={CalendarDays}>
                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                  {selectedVisit.nextVisit.map((visit, index) => (
                    <div key={index} className="text-center">
                      <div className="font-semibold text-blue-700">{visit.visit}</div>
                      <div className="text-xs text-blue-600 mt-0.5">{visit.datetime}</div>
                    </div>
                  ))}
                </div>
              </CompactCard>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const CompactCard = ({ title, icon: Icon, children, actions }) => (
  <div className="bg-white rounded border border-gray-200">
    <div className="border-b border-gray-100 px-3 py-2 flex justify-between items-center">
      <div className="flex items-center">
        {Icon && <Icon className="w-4 h-4 text-blue-600 mr-1.5" />}
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      {actions}
    </div>
    <div className="px-3 py-2">{children}</div>
  </div>
);


export default VisitPad;