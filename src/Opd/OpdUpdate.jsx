import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOpdById, updateOpd } from "../services/opd.services";
import OpdPastHistoryUpdate from "./OpdPastHistoryUpdate";
import OpdComplaintsUpdate from "./OpdChiefComplaints";
import OpdVitalsUpdate from "./OpdVitalsUpdate";
import OpdExaminationUpdate from "./OpdExaminationUpdate";
import OpdDiagnosisUpdate from "./OpdDiagnosisUpdate";
import OpdAdviceUpdate from "./OpdAdviceUpdate";
import OpdNotesUpdate from "./OpdNoteUpdate";
import OpdDietUpdate from "./OpdDietUpdate";
import OpdMedicineUpdate from "./OpdMedicineUpdate";
import OpdNextVisitUpdate from "./OpdNextVisitUpdate";
import OpdInfoUpdate from "./OpdInfo";
import VisitPad from "./OpdVisit/OpdVisitPad";
import OpdFooterSummary from "./OpdFooterSummary";
import OpdSummarySidebar from "./OpdSummarySidebar";

export default function OpdUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opd, setOpd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpd();
  }, [id]);

  const fetchOpd = async () => {
    try {
      setLoading(true);
      const res = await getOpdById(id);
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      setOpd(data);
    } catch (error) {
      console.error("Error fetching OPD:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocalUpdate = (newData) => {
    setOpd(prev => ({ ...prev, ...newData }));
  };

  if (loading || !opd) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 pb-8">
      {/* 1. Sticky Header - Compact Patient Information */}
      <div className="sticky top-0 z-[100] mb-6">
        <OpdInfoUpdate id={id} navigate={navigate} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 2. Main Form Container - Left Column */}
        <div className="flex-1 w-full lg:max-w-5xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">

              {/* Chief Complaints Section */}
              <div className="py-4 border-b border-gray-100">
                <OpdComplaintsUpdate id={id} data={opd.chief_complaints} onUpdate={(val) => handleLocalUpdate({ chief_complaints: val })} />
              </div>

              {/* Vitals Section */}
              <div className="py-4 border-b border-gray-100 bg-gray-50/50">
                <OpdVitalsUpdate id={id} data={opd.vitals} onUpdate={(val) => handleLocalUpdate({ vitals: val })} />
              </div>

              {/* Examination Section */}
              <div className="py-4 border-b border-gray-100">
                <OpdExaminationUpdate id={id} data={opd.examination} onUpdate={(val) => handleLocalUpdate({ examination: val })} />
              </div>

              {/* Past History Section */}
              <div className="py-4 border-b border-gray-100 bg-gray-50/50">
                <OpdPastHistoryUpdate id={id} data={opd.past_history} onUpdate={(val) => handleLocalUpdate({ past_history: val })} />
              </div>

              {/* Diagnosis Section */}
              <div className="py-4 border-b border-gray-100">
                <OpdDiagnosisUpdate id={id} data={opd.diagnosis_detail} onUpdate={(val) => handleLocalUpdate({ diagnosis_detail: val })} />
              </div>

              {/* Medicine Section */}
              <div className="py-4 border-b border-gray-100 bg-blue-50/20">
                <OpdMedicineUpdate id={id} data={opd.given_medicine} onUpdate={(val) => handleLocalUpdate({ given_medicine: val })} />
              </div>

              {/* Additional Details - Stacked Compact Flow */}
              <div className="">
                <OpdNextVisitUpdate id={id} data={opd.nextVisit} onUpdate={(val) => handleLocalUpdate({ nextVisit: val })} />
                <OpdNotesUpdate id={id} data={opd.Note} onUpdate={(val) => handleLocalUpdate({ Note: val })} />
                <OpdDietUpdate id={id} data={opd.suggested_diet} onUpdate={(val) => handleLocalUpdate({ suggested_diet: val })} />
                <OpdAdviceUpdate id={id} data={opd.adviced} onUpdate={(val) => handleLocalUpdate({ adviced: val })} />
              </div>

              {/* Visit Pad Section - Integrated into bottom of form */}
              <div className="border-t border-gray-200 bg-gray-50/50 p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      Visit Pad
                      <span className="text-xs font-normal text-gray-500">History of recent visits</span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/add-opd-visit/${id}`)}
                      className="px-4 py-1.5 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium shadow-sm text-xs flex items-center gap-1.5"
                    >
                      + Add Visit
                    </button>
                    <button
                      onClick={() => navigate(`/opd-visit/${id}`)}
                      className="px-4 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 text-xs"
                    >
                      Full History
                    </button>
                  </div>
                </div>
                <VisitPad opdId={id} />
              </div>
            </div>
          </div>

          {/* 3. Footer Summary (Finalizes the encounter) */}
          <div className="mt-6">
            <OpdFooterSummary id={id} localOpd={opd} />
          </div>
        </div>

        {/* 4. Side Summary - Right Column */}
        <div className="w-full lg:w-80 shrink-0">
          <OpdSummarySidebar id={id} localOpd={opd} />
        </div>
      </div>
    </div>
  );
}