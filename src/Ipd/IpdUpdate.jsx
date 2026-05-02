import { useParams, useNavigate } from "react-router-dom";
import IpdInfoUpdate from "./IpdInfo";
import IpdPastHistoryUpdate from "./IpdPastHsitoryUpdate";
import SystemeticExaminationUpdate from "./IpdSystemeticExamination";
import GeneralExaminationUpdate from "./IpdGeneralExamination";
import IpdPersonalHoUpdate from "./IpdPersonalHo";
import IpdChiefComplaintUpdate from "./IpdChiefComplaint";
import IpdProvisionalDiagnosisUpdate from "./IpdProvisionalDiagnosis";
import IpdTreatmentUpdate from "./IpdTreatment";
import IpdFooterSummary from "./IpdFooterSummary";

export default function IpdUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <div>
      {/* Patient Information */}
      <IpdInfoUpdate id={id} navigate={navigate} />

      {/* Main Examination & History Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 space-y-6">
        {/* Chief Complaints */}
        <div>
          <IpdChiefComplaintUpdate id={id} />
        </div>
        <hr className="border-gray-100" />

        {/* Past History */}
        <div>
          <IpdPastHistoryUpdate id={id} />
        </div>
        <hr className="border-gray-100" />

        {/* Personal History */}
        <div>
          <IpdPersonalHoUpdate id={id} />
        </div>
        <hr className="border-gray-100" />

        {/* General Examination */}
        <div>
          <GeneralExaminationUpdate id={id} />
        </div>
        <hr className="border-gray-100" />

        {/* Systemic Examination */}
        <div>
          <SystemeticExaminationUpdate id={id} />
        </div>
        <hr className="border-gray-100" />

        {/* Provisional Diagnosis */}
        <div>
          <IpdProvisionalDiagnosisUpdate id={id} />
        </div>
        <hr className="border-gray-100" />

        {/* Treatment */}
        <div>
          <IpdTreatmentUpdate id={id} />
        </div>
      </div>
      
      {/* Footer Summary (Beds, Doctor, Services, Admission) */}
      <IpdFooterSummary id={id} />
    </div>
  )
}