// useDischargeForm.jsx
import { useState, useEffect } from 'react';
import { diagnosis, medicine, createDiagnosis, createMedicine, getIpdById } from '../../services/ipd.services';
import { opinion, createOpinion } from '../../services/opd.services';
import { toast } from 'react-toastify';

export const useDischargeForm = (ipdId, dischargeId, isEditMode) => {
  const [formData, setFormData] = useState({
    discharge_type: 'discharge',
    datetime_discharge: new Date().toISOString().slice(0, 16),
    discharge_condition: {
      GC: '',
      BP: '',
      PR: '',
      "RSB/L": '',
      CVS: '',
      CNS: '',
      date_time: new Date().toISOString().slice(0, 10)
    },
    diagnosis: [],
    clinical_notes: [],
    adviced: [],
    Note: [],
    treatment_chart: [],
    Rx: [],
    next_visit: '',
    investigation: '',
    dd_note: '',
    staff_data: null,
    bed_data: null,
    doctor_data: null,
    patient_name: '',
    age: '',
    gender: '',
    address: '',
    mobile: '',
    datetime_admission: '',
    sr_no: '',
    date: new Date().toISOString().slice(0, 16)
  });

  const [opinions, setOpinions] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ipdLoading, setIpdLoading] = useState(false);
  
  const [diagnosisInput, setDiagnosisInput] = useState({ id: '', name: '' });
  const [clinicalNoteInput, setClinicalNoteInput] = useState({ id: '', name: '' });
  const [adviceInput, setAdviceInput] = useState({ id: '', name: '' });
  const [noteInput, setNoteInput] = useState({ id: '', name: '' });
  
  const [treatmentForm, setTreatmentForm] = useState({
    medicine_id: '',
    medicine_name: '',
    dosage: '',
    date_time: new Date().toISOString().slice(0, 10),
    status: '',
    quantity: ''
  });

  const [rxForm, setRxForm] = useState({
    medicine_id: '',
    medicine_name: '',
    doses: '',
    intake_type: '',
    quantity: ''
  });

  // Fetch IPD data if ipdId is provided and not in edit mode
  useEffect(() => {
    if (ipdId && !isEditMode) {
      fetchIpdData(ipdId);
    }
  }, [ipdId, isEditMode]);


  // Fetch dropdown data on component mount
  useEffect(() => {
    fetchDropdownData();
  }, []);
  

  const fetchIpdData = async (id) => {
    try {
      setIpdLoading(true);
      const response = await getIpdById(id);
      const ipdData = response.data || response;

      // Format admission date for datetime-local input
      const removeMeridian = (dateTime) => {
        if (!dateTime) return "";

        // "16-02-2026 02:30 PM" → "16-02-2026 02:30"
        return dateTime.replace(/\s(AM|PM)$/i, "");
      };


      setFormData(prev => ({
        ...prev,
        patient_name: ipdData.patient_name || '',
        age: ipdData.age || '',
        gender: ipdData.gender || '',
        address: ipdData.address || '',
        mobile: ipdData.mobile || '',
        bed_data: ipdData.bed_data.id || null,
        doctor_data: ipdData.doctor_data.id || null,
        sr_no: ipdData.sr_no || '',
        datetime_admission: removeMeridian(ipdData.datetime_admission)
        // You might also want to set other fields from IPD
        // diagnosis: ipdData.diagnosis || [],
        // treatment_chart: ipdData.treatment_chart || [],
        // Rx: ipdData.Rx || [],
      }));

      toast.success('IPD patient data loaded successfully');
    } catch (error) {
      console.error('Error fetching IPD data:', error);
      toast.error('Failed to fetch IPD patient data');
    } finally {
      setIpdLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    setLoading(true);
    try {
      const [opinionsData, diagnosesData, medicinesData] = await Promise.all([
        opinion(),
        diagnosis(),
        medicine()
      ]);
      
      // Transform API data to match your structure
      const transformedOpinions = Array.isArray(opinionsData) 
        ? opinionsData.map(item => ({
            id: item.id,
            name: item.opinion_name || item.name,
            label: item.opinion_name || item.name
          }))
        : [];
      
      const transformedDiagnoses = Array.isArray(diagnosesData)
        ? diagnosesData.map(item => ({
            id: item.id,
            name: item.diagnosis_name || item.name,
            label: item.diagnosis_name || item.name,
            dosage: item.dosage,
            meal_time: item.meal_time,
          }))
        : [];
      
      const transformedMedicines = Array.isArray(medicinesData)
        ? medicinesData.map(item => ({
            id: item.id,
            name: item.medicine_name || item.name,
            medicine_name: item.medicine_name || item.name,
            label: item.medicine_name || item.name,
            dosage: item.dosage,
            meal_time: item.meal_time,
          }))
        : [];

      setOpinions(transformedOpinions);
      setDiagnoses(transformedDiagnoses);
      setMedicines(transformedMedicines);
      
      console.log('Dropdown data loaded:', {
        opinions: transformedOpinions.length,
        diagnoses: transformedDiagnoses.length,
        medicines: transformedMedicines.length
      });
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load dropdown data');
    } finally {
      setLoading(false);
    }
  };

  // Rest of your existing handlers remain the same...
  const handleCreateNewOpinion = async (name, type) => {
    try {
      const newOpinion = await createOpinion({ opinion_name: name });
      const transformedOpinion = {
        id: newOpinion.id,
        name: newOpinion.opinion_name || name,
        label: newOpinion.opinion_name || name
      };
      toast.success(`New ${type} created successfully!`);
      setOpinions(prev => [...prev, transformedOpinion]);
      return transformedOpinion.id;
    } catch (error) {
      console.error('Error creating opinion:', error);
      toast.error(`Failed to create new ${type}`);
      throw error;
    }
  };

  const handleCreateNewMedicine = async (name) => {
    try {
      const medicineData = {
        medicine_name: name,
        medicine_type: 'Tablet',
        unit: 'Tablet',
        rate: 0,
        manufacturer: ''
      };
      const newMedicine = await createMedicine(medicineData);
      const transformedMedicine = {
        id: newMedicine.id,
        name: newMedicine.medicine_name || name,
        medicine_name: newMedicine.medicine_name || name,
        label: newMedicine.medicine_name || name
      };
      toast.success('New medicine created successfully!');
      setMedicines(prev => [...prev, transformedMedicine]);
      return transformedMedicine.id;
    } catch (error) {
      console.error('Error creating medicine:', error);
      toast.error('Failed to create new medicine');
      throw error;
    }
  };

  const handleCreateNewDiagnosis = async (name) => {
    try {
      const newDiagnosis = await createDiagnosis({ diagnosis_name: name });
      const transformedDiagnosis = {
        id: newDiagnosis.id,
        name: newDiagnosis.diagnosis_name || name,
        label: newDiagnosis.diagnosis_name || name
      };
      toast.success('New diagnosis created successfully!');
      setDiagnoses(prev => [...prev, transformedDiagnosis]);
      return transformedDiagnosis.id;
    } catch (error) {
      console.error('Error creating diagnosis:', error);
      toast.error('Failed to create new diagnosis');
      throw error;
    }
  };

  // Diagnosis handlers
  const handleAddDiagnosis = async () => {
    if (!diagnosisInput.name || !diagnosisInput.name.trim()) {
      toast.warning('Please enter a diagnosis');
      return;
    }

    let diagnosisId = '';
    
    if (diagnosisInput.id) {
      diagnosisId = diagnosisInput.id;
    } else {
      const existingDiagnosis = diagnoses.find(d => 
        d.name.toLowerCase() === diagnosisInput.name.toLowerCase()
      );

      if (existingDiagnosis) {
        diagnosisId = existingDiagnosis.id;
      } else {
        try {
          const newDiagnosisId = await handleCreateNewDiagnosis(diagnosisInput.name);
          diagnosisId = newDiagnosisId;
        } catch (error) {
          return;
        }
      }
    }

    // Check for duplicates
    const isDuplicate = formData.diagnosis.some(
      item => item.diagnosis_data === parseInt(diagnosisId)
    );

    if (isDuplicate) {
      toast.warning('This diagnosis has already been added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      diagnosis: [...prev.diagnosis, { diagnosis_data: parseInt(diagnosisId) }]
    }));
    setDiagnosisInput({ id: '', name: '' });
    toast.success('Diagnosis added successfully');
  };

  // Clinical Notes handlers
  const handleAddClinicalNote = async () => {
    if (!clinicalNoteInput.name || !clinicalNoteInput.name.trim()) {
      toast.warning('Please enter a clinical note');
      return;
    }

    let opinionId = '';
    
    if (clinicalNoteInput.id) {
      opinionId = clinicalNoteInput.id;
    } else {
      const existingOpinion = opinions.find(o => 
        o.name.toLowerCase() === clinicalNoteInput.name.toLowerCase()
      );

      if (existingOpinion) {
        opinionId = existingOpinion.id;
      } else {
        try {
          const newOpinionId = await handleCreateNewOpinion(clinicalNoteInput.name, 'clinical note');
          opinionId = newOpinionId;
        } catch (error) {
          return;
        }
      }
    }

    // Check for duplicates
    const isDuplicate = formData.clinical_notes.some(
      item => item.opinion_data === parseInt(opinionId)
    );

    if (isDuplicate) {
      toast.warning('This clinical note has already been added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      clinical_notes: [...prev.clinical_notes, { opinion_data: parseInt(opinionId) }]
    }));
    setClinicalNoteInput({ id: '', name: '' });
    toast.success('Clinical note added successfully');
  };

  // Advice handlers
  const handleAddAdvice = async () => {
  if (!adviceInput.name || !adviceInput.name.trim()) {
    toast.warning('Please enter advice');
    return;
  }
  

  let opinionId = null;

  if (adviceInput.id) {
    opinionId = adviceInput.id;
    console.log('Using existing advice ID:', opinionId);
  } else {
    const existingOpinion = opinions.find(
      o => o.name.toLowerCase() === adviceInput.name.toLowerCase()
    );

    if (existingOpinion) {
      opinionId = existingOpinion.id;
    } else {
      try {
        opinionId = await handleCreateNewOpinion(adviceInput.name, 'advice');
      } catch {
        return;
      }
    }
  }

  // ✅ Duplicate check (FIXED KEY)
  const isDuplicate = formData.adviced.some(
    item => item.opinion_details_data === Number(opinionId)
  );

  if (isDuplicate) {
    toast.warning('This advice has already been added');
    return;
  }

  // ✅ STORE WHAT BACKEND EXPECTS
  setFormData(prev => ({
    ...prev,
    adviced: [
      ...prev.adviced,
      { opinion_details_data: Number(opinionId) }
    ]
  }));

  setAdviceInput({ id: '', name: '' });
  toast.success('Advice added successfully');
};


  // Note handlers
  const handleAddNote = async () => {
    if (!noteInput.name || !noteInput.name.trim()) {
      toast.warning('Please enter a note');
      return;
    }

    let opinionId = '';
    
    if (noteInput.id) {
      opinionId = noteInput.id;
    } else {
      const existingOpinion = opinions.find(o => 
        o.name.toLowerCase() === noteInput.name.toLowerCase()
      );

      if (existingOpinion) {
        opinionId = existingOpinion.id;
      } else {
        try {
          const newOpinionId = await handleCreateNewOpinion(noteInput.name, 'note');
          opinionId = newOpinionId;
        } catch (error) {
          return;
        }
      }
    }

    // Check for duplicates
    const isDuplicate = formData.Note.some(
      item => item.opinion_details_data === parseInt(opinionId)
    );

    if (isDuplicate) {
      toast.warning('This note has already been added');
      return;
    }

    setFormData(prev => ({
      ...prev,
      Note: [...prev.Note, { opinion_details_data: parseInt(opinionId) }]
    }));
    setNoteInput({ id: '', name: '' });
    toast.success('Note added successfully');
  };

  // Treatment Chart handlers
  const handleTreatmentChange = (field, value) => {
    setTreatmentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTreatment = async () => {
    if (!treatmentForm.medicine_name.trim()) {
      toast.warning('Please enter medicine name');
      return;
    }
    if (!treatmentForm.dosage.trim()) {
      toast.warning('Please enter dosage');
      return;
    }
    if (!treatmentForm.date_time) {
      toast.warning('Please select date');
      return;
    }

    let medicineId = treatmentForm.medicine_id;
    
    if (!medicineId) {
      const existingMedicine = medicines.find(m => 
        m.medicine_name?.toLowerCase() === treatmentForm.medicine_name.toLowerCase()
      );

      if (existingMedicine) {
        medicineId = existingMedicine.id;
      } else {
        try {
          const newMedicineId = await handleCreateNewMedicine(treatmentForm.medicine_name);
          medicineId = newMedicineId;
        } catch (error) {
          return;
        }
      }
    }

    // Check for duplicates (optional - based on medicine and date)
    const isDuplicate = formData.treatment_chart.some(
      item => item.medicine_data === parseInt(medicineId) && 
              item.date_time === treatmentForm.date_time
    );

    if (isDuplicate) {
      toast.warning('This treatment has already been added for this date');
      return;
    }

    const newTreatment = {
      medicine_data: parseInt(medicineId),
      dosage: treatmentForm.dosage,
      date_time: treatmentForm.date_time,
      status: treatmentForm.status || "",
      quantity: treatmentForm.quantity || ""
    };

    setFormData(prev => ({
      ...prev,
      treatment_chart: [...prev.treatment_chart, newTreatment]
    }));

    setTreatmentForm({
      medicine_id: '',
      medicine_name: '',
      dosage: '',
      date_time: new Date().toISOString().slice(0, 10),
      status: '',
      quantity: ''
    });
    toast.success('Treatment added successfully');
  };

  // Rx handlers
  const handleRxChange = (field, value) => {
    setRxForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddRx = async () => {
    if (!rxForm.medicine_name.trim()) {
      toast.warning('Please enter medicine name');
      return;
    }
    if (!rxForm.doses.trim()) {
      toast.warning('Please enter doses');
      return;
    }

    let medicineId = rxForm.medicine_id;
    
    if (!medicineId) {
      const existingMedicine = medicines.find(m => 
        m.medicine_name?.toLowerCase() === rxForm.medicine_name.toLowerCase()
      );

      if (existingMedicine) {
        medicineId = existingMedicine.id;
      } else {
        try {
          const newMedicineId = await handleCreateNewMedicine(rxForm.medicine_name);
          medicineId = newMedicineId;
        } catch (error) {
          return;
        }
      }
    }

    // Check for duplicates
    const isDuplicate = formData.Rx.some(
      item => item.medicine_data === parseInt(medicineId)
    );

    if (isDuplicate) {
      toast.warning('This medicine has already been added to Rx');
      return;
    }

    const newRx = {
      medicine_data: parseInt(medicineId),
      doses: rxForm.doses,
      intake_type: rxForm.intake_type || "After Meal",
      quantity: rxForm.quantity || "2"
    };

    setFormData(prev => ({
      ...prev,
      Rx: [...prev.Rx, newRx]
    }));

    setRxForm({
      medicine_id: '',
      medicine_name: '',
      doses: '',
      intake_type: '',
      quantity: ''
    });
    toast.success('Rx added successfully');
  };

  // Remove handlers
  const handleRemoveItem = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
    toast.success('Item removed successfully');
  };

  return {
    formData,
    setFormData,
    opinions,
    diagnoses,
    medicines,
    loading,
    ipdLoading,
    handlers: {
      diagnosisInput,
      setDiagnosisInput,
      clinicalNoteInput,
      setClinicalNoteInput,
      adviceInput,
      setAdviceInput,
      noteInput,
      setNoteInput,
      treatmentForm,
      setTreatmentForm,
      rxForm,
      setRxForm,
      handleAddDiagnosis,
      handleAddClinicalNote,
      handleAddAdvice,
      handleAddNote,
      handleTreatmentChange,
      handleAddTreatment,
      handleRxChange,
      handleAddRx,
      handleRemoveItem,
      handleCreateNewOpinion,
      handleCreateNewMedicine,
      handleCreateNewDiagnosis
    }
  };
};