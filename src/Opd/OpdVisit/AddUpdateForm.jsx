import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Save } from 'lucide-react';

import ChiefComplaintsForm from './ChiefComplaint';
import VitalsForm from './Vital';
import ExaminationForm from './Examination';
import DiagnosisForm from './Diagnosis';
import MedicationsForm from './Medicine';

import HistoryForm from './History';
import AdviceForm from './AdviceNote';
import DietForm from './DietNextVisit';

/* =========================
   HELPERS
========================= */

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value.id ?? null;
  return Number(value) || null;
};

const normalizeInitialData = (data) => {
  if (!data) return {};

  return {
    opd_data: data.opd_data,

    chief_complaints: (data.chief_complaints || []).map(c => ({
      complaints_data: normalizeId(c.complaints_data),
      complaint_name: c.complaint_name || c.complaints_data?.name || '',
      duration: c.duration || '',
      optional: c.optional || 'No Opinion',
    })),

    vitals: data.vitals || {
      BP: '', PR: '', SPO: '', Temp: '', Sugar: '', Weight: ''
    },

    examination: data.examination || {
      RS: '', CVS: '', CNS: '', PA: '', Others: ''
    },

    given_medicine: (data.given_medicine || []).map(m => ({
      medicine_data: normalizeId(m.medicine_data),
      name: m.name || m.medicine_data?.medicine_name || m.medicine_data?.name || '',
      quantity: m.quantity || 1,
      doses: m.doses || '',
      intake_type: m.intake_type || 'After Meal',
    })),

    diagnosis_detail: (data.diagnosis_detail || []).map(d => ({
      diagnosis_data: normalizeId(d.diagnosis_data),
      name: d.name || d.diagnosis_data?.diagnosis_name || d.diagnosis_data?.name || '',
      duration: d.duration || '',
    })),

    adviced: (data.adviced || []).map(a => ({
      opinion_details_data: normalizeId(a.opinion_details_data),
    })),

    Note: (data.Note || []).map(n => ({
      opinion_details_data: normalizeId(n.opinion_details_data),
    })),

    past_history: (data.past_history || []).map(p => ({
      past_history_data: normalizeId(p.past_history_data),
      name: p.name || p.past_history_data?.name || '',
      duration: p.duration || '',
    })),

    suggested_diet: (data.suggested_diet || [])
      .map(d => normalizeId(d))
      .filter(Boolean),

    nextVisit: data.nextVisit || [],
  };
};

/* =========================
   COMPONENT
========================= */

const OpdVisitForm = ({
  initialData = null,
  opdId = null,
  patientName = null,
  isEdit = false,
  onSubmit,
  loading = false,
}) => {

  const normalizedData = normalizeInitialData(initialData);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: normalizedData,
  });

  // 🔹 Update form when initialData changes (for async loading in AddVisit)
  useEffect(() => {
    if (initialData) {
      reset(normalizeInitialData(initialData));
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (opdId) {
      setValue('opd_data', opdId);
    }
  }, [opdId, setValue]);

  /* =========================
     SUBMIT
  ========================= */

  const onSubmitForm = (data) => {

    const payload = {
      opd_data: Number(data.opd_data),

      chief_complaints: (data.chief_complaints || []).map(cc => ({
        complaints_data: Number(cc.complaints_data),
        duration: cc.duration,
        optional: cc.optional,
      })),

      vitals: {
        BP: data.vitals?.BP || '',
        PR: Number(data.vitals?.PR) || null,
        SPO: Number(data.vitals?.SPO) || null,
        Sugar: data.vitals?.Sugar || '',
        Weight: data.vitals?.Weight || '',
        Temp: data.vitals?.Temp || '',
      },

      examination: data.examination,

      given_medicine: (data.given_medicine || []).map(m => ({
        medicine_data: Number(m.medicine_data),
        quantity: Number(m.quantity),
        doses: m.doses,
        intake_type: m.intake_type,
      })),

      diagnosis_detail: (data.diagnosis_detail || []).map(d => ({
        diagnosis_data: Number(d.diagnosis_data),
        duration: d.duration,
      })),

      adviced: (data.adviced || []).map(a => ({
        opinion_details_data: Number(a.opinion_details_data),
      })),

      Note: (data.Note || []).map(n => ({
        opinion_details_data: Number(n.opinion_details_data),
      })),

      past_history: (data.past_history || []).map(p => ({
        past_history_data: Number(p.past_history_data),
        duration: p.duration,
      })),

      suggested_diet: (data.suggested_diet || []).map(id => Number(id)),

      nextVisit: data.nextVisit,
    };

    onSubmit(payload);
  };

  /* =========================
     UI
  ========================= */

  return (
    <div className="max-w-5xl">
      <div className="bg-white rounded-lg shadow border">

        <div className="border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 uppercase">
            {isEdit ? 'Edit OPD Visit' : (patientName || 'New OPD Visit')}
          </h2>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-5">

            {/* OPD ID */}
            <div className="font-bold text-xl">
              #{opdId || initialData?.opd_data}
            </div>

            <Controller
              name="opd_data"
              control={control}
              rules={{ required: true }}
              render={({ field }) => <input type="hidden" {...field} />}
            />

            {/* SECTIONS */}
            <VitalsForm control={control} />
            <ChiefComplaintsForm control={control} watch={watch} setValue={setValue} />
            <ExaminationForm control={control} />
            <DiagnosisForm control={control} watch={watch} setValue={setValue} />
            <HistoryForm control={control} watch={watch} setValue={setValue} />
            
            <MedicationsForm control={control} watch={watch} setValue={setValue} />
            <AdviceForm control={control} watch={watch} setValue={setValue} />
            <DietForm control={control} watch={watch} setValue={setValue} />

            {/* ACTIONS */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Visit'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default OpdVisitForm;
