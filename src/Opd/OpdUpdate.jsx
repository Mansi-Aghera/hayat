import { useParams, useNavigate } from "react-router-dom";
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

export default function OpdUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div className="max-w-7xl mx-auto pb-8">
      {/* 1. Sticky Header - Patient Information & Attending Doctor */}
      <div className="sticky top-0 z-[100] bg-gray-50/80 backdrop-blur-md pb-2 -mx-4 px-4 border-b border-gray-200">
        <OpdInfoUpdate id={id} navigate={navigate} />
      </div>

      {/* 2. Main Unified Form Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-0"> {/* No extra padding on container, handled by internal components */}

          {/* Chief Complaints Section */}
          <div className="py-6 border-b border-gray-50">
            <OpdComplaintsUpdate id={id} />
          </div>

          {/* Vitals Section */}
          <div className="py-6 border-b border-gray-50 bg-gray-50/30">
            <OpdVitalsUpdate id={id} />
          </div>

          {/* Examination Section */}
          <div className="py-6 border-b border-gray-50">
            <OpdExaminationUpdate id={id} />
          </div>

          {/* Past History Section */}
          <div className="py-6 border-b border-gray-50 bg-gray-50/30">
            <OpdPastHistoryUpdate id={id} />
          </div>

          {/* Diagnosis Section (Moved up for better flow) */}
          <div className="py-6 border-b border-gray-50">
            <OpdDiagnosisUpdate id={id} />
          </div>

          {/* Medicine Section */}
          <div className="py-6 border-b border-gray-50 bg-blue-50/20">
            <OpdMedicineUpdate id={id} />
          </div>

          {/* Additional Details (Next Visit, Diet, Notes, Advice) - Stacked Flow */}
          <div className="divide-y divide-gray-100">
            <div className="p-6">
              <OpdNextVisitUpdate id={id} />
            </div>
            <div className="p-6 bg-gray-50/20">
              <OpdNotesUpdate id={id} />
            </div>
            <div className="p-6">
              <OpdDietUpdate id={id} />
            </div>
            <div className="p-6 bg-gray-50/20">
              <OpdAdviceUpdate id={id} />
            </div>
          </div>

          {/* Visit Pad Section - Integrated into bottom of form */}
          <div className="border-t border-gray-200 bg-gray-50/50 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Visit Pad</h2>
                <p className="text-sm text-gray-500">History of recent visits and notes</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/add-opd-visit/${id}`)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm flex items-center gap-2"
                >
                  + Add Visit
                </button>
                <button
                  onClick={() => navigate(`/opd-visit/${id}`)}
                  className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 text-sm"
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
        <OpdFooterSummary id={id} />
      </div>
    </div>
  );
}