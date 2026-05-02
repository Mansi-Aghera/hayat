import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const DailyExamination = ({ dailyExamination, setDailyExamination }) => {
  const handleExaminationChange = (index, field, value) => {
    const updatedExamination = [...dailyExamination];
    updatedExamination[index][field] = value;
    setDailyExamination(updatedExamination);
  };

  const handleAddExamination = () => {
    setDailyExamination(prev => [
      ...prev,
      {
        BP: '',
        PR: '',
        SPO2: '',
        date_time: new Date().toISOString().slice(0, 16)
      }
    ]);
  };

  const handleRemoveExamination = (index) => {
    if (dailyExamination.length > 1) {
      setDailyExamination(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex items-start gap-4">
        <div className="min-w-[140px] pt-2">
          <h3 className="text-base font-semibold text-gray-800 whitespace-nowrap">Examination</h3>
          <button
            onClick={handleAddExamination}
            className="mt-3 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 w-full shadow-sm"
          >
            <Plus size={14} />
            Add New
          </button>
        </div>
        
        <div className="flex-1 space-y-4">
          {dailyExamination.map((exam, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow transition-shadow">
              <div className="flex items-start gap-4">
                <div className="min-w-[140px] flex flex-col gap-2">
                  {dailyExamination.length > 1 && (
                    <button
                      onClick={() => handleRemoveExamination(index)}
                      className="text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded text-xs flex items-center gap-1 justify-center border border-red-200 w-fit"
                      title="Remove"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">BP</label>
                    <input
                      type="text"
                      placeholder="e.g. 120/80"
                      value={exam.BP}
                      onChange={(e) => handleExaminationChange(index, 'BP', e.target.value)}
                      className="border border-gray-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">PR</label>
                    <input
                      type="text"
                      placeholder="e.g. 72"
                      value={exam.PR}
                      onChange={(e) => handleExaminationChange(index, 'PR', e.target.value)}
                      className="border border-gray-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">SPO2</label>
                    <input
                      type="text"
                      placeholder="e.g. 98%"
                      value={exam.SPO2}
                      onChange={(e) => handleExaminationChange(index, 'SPO2', e.target.value)}
                      className="border border-gray-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={exam.date_time}
                      onChange={(e) => handleExaminationChange(index, 'date_time', e.target.value)}
                      className="border border-gray-300 rounded-lg px-2.5 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyExamination;