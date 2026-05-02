import React from "react";
import OpdPatientInfo from "../OpdCommonInfo";
import VisitPad from "./OpdVisitPad";
import { useParams,useNavigate } from "react-router-dom";

function OpdVisit() {
  const { id } = useParams();
  let navigate = useNavigate();
  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-2xl font-semibold mb-4">OPD Visit Pad</h2>
        <button onClick={()=>navigate(-1)} className=" mb-4 border rounded-full py-1 px-4">Back</button> 
      </div>
      <OpdPatientInfo opdId={id} />
       <div className="m-2 text-end">
        <button 
          onClick={() => navigate(`/add-opd-visit/${id}`)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow"
        >
          + Add Visit Pad
        </button>
      </div>
      <VisitPad opdId={id} />
    </div>
  );
}

export default OpdVisit;