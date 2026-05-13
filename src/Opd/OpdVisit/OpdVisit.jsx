import React, { useState, useEffect } from "react";
import OpdPatientInfo from "../OpdCommonInfo";
import VisitPad from "./OpdVisitPad";
import { useParams, useNavigate } from "react-router-dom";
import { getOpdById } from "../../services/opd.services";

function OpdVisit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opdData, setOpdData] = useState(null);

  useEffect(() => {
    if (id) {
      fetchOpdData();
    }
  }, [id]);

  const fetchOpdData = async () => {
    try {
      const res = await getOpdById(id);
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      setOpdData(data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddVisit = () => {
    navigate(`/add-opd-visit/${id}`, {
      state: {
        patientName: opdData?.patient_name,
        prefillData: opdData ? {
          opd_data: parseInt(id),
          diagnosis_detail: opdData.diagnosis_detail || [],
          past_history: opdData.past_history || [],
          given_medicine: opdData.given_medicine || [],
        } : null
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between">
        <h2 className="text-2xl font-semibold mb-4">OPD Visit Pad</h2>
        <button onClick={() => navigate(-1)} className=" mb-4 border rounded-full py-1 px-4">Back</button>
      </div>
      <OpdPatientInfo opdId={id} data={opdData} />
      <div className="m-2 text-end">
        <button
          onClick={handleAddVisit}
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