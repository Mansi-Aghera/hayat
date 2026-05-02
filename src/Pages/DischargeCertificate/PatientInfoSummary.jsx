import React from 'react';

const PatientInfoSummary = ({ patientData }) => {
  return (
    <div className="bg-blue-50 rounded-xl p-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-500">Patient Name</p>
          <p className="font-semibold">{patientData.patient_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Age/Gender</p>
          <p className="font-semibold">{patientData.age} / {patientData.gender}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">IPD No.</p>
          <p className="font-semibold">{patientData.sr_no}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Admission Date</p>
          <p className="font-semibold">{patientData.datetime_admission}</p>
        </div>
      </div>
    </div>
  );
};

export default PatientInfoSummary;