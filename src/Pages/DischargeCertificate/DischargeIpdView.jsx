import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getDischargeByIpdId } from "../../services/ipd.services";
import {
  Printer,
  ArrowLeft,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Stethoscope,
  Pill,
  ClipboardList,
  Activity,
  BookOpen,
  CheckCircle,
  AlertCircle,
  FlaskConical,
  StickyNote,
} from "lucide-react";
import { handleDischargePrint } from "../../utils/dischargePrint";

// ── helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const stayDuration = (admission, discharge) => {
  if (!admission || !discharge) return null;
  const ms = new Date(discharge) - new Date(admission);
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
};

// ── sub-components ────────────────────────────────────────────────────────────
const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}
    >
      {children}
    </span>
  );
};

const InfoRow = ({ label, value, mono = false }) =>
  value && value !== "N/A" ? (
    <div className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide w-28 shrink-0 pt-0.5">
        {label}
      </span>
      <span
        className={`text-sm text-slate-800 font-medium ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  ) : null;

const Section = ({
  icon: Icon,
  title,
  color = "blue",
  defaultOpen = true,
  children,
  badge,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const colors = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-100",
      icon: "text-blue-500",
      dot: "bg-blue-400",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-100",
      icon: "text-green-500",
      dot: "bg-green-400",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-100",
      icon: "text-purple-500",
      dot: "bg-purple-400",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      icon: "text-amber-500",
      dot: "bg-amber-400",
    },
    rose: {
      bg: "bg-rose-50",
      border: "border-rose-100",
      icon: "text-rose-500",
      dot: "bg-rose-400",
    },
    slate: {
      bg: "bg-slate-50",
      border: "border-slate-100",
      icon: "text-slate-400",
      dot: "bg-slate-400",
    },
  };
  const c = colors[color];

  return (
    <div
      className={`rounded-2xl border ${c.border} bg-white shadow-sm overflow-hidden transition-shadow hover:shadow-md`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-5 py-4 ${c.bg} text-left group`}
      >
        <span className={`p-1.5 rounded-lg bg-white shadow-sm ${c.icon}`}>
          <Icon size={16} />
        </span>
        <span className="flex-1 text-sm font-semibold text-slate-700">
          {title}
        </span>
        {badge && <Badge color={color}>{badge}</Badge>}
        <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && <div className="px-5 py-4">{children}</div>}
    </div>
  );
};

const MedTable = ({ headers, rows }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-100">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50">
          {headers.map((h) => (
            <th
              key={h}
              className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
            {row.map((cell, j) => (
              <td
                key={j}
                className="px-4 py-2.5 text-slate-700 border-b border-slate-50 last:border-0"
              >
                {cell || "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TagList = ({ items }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((item, i) => (
      <span
        key={i}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
        {item}
      </span>
    ))}
  </div>
);

// ── main component ────────────────────────────────────────────────────────────
const DischargeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (id) fetchDischargeDetails(id);
  }, [id]);

  const fetchDischargeDetails = async (dischargeId) => {
    try {
      setLoading(true);
      const res = await getDischargeByIpdId(dischargeId);
      setData(res.data || res);
    } catch {
      toast.error("Failed to fetch discharge details");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    handleDischargePrint(data, setIsPrinting);
  };


  // ── loading / empty ──────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-slate-500 text-sm font-medium">
            Loading discharge record…
          </p>
        </div>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-10 bg-white rounded-2xl shadow-sm border border-slate-100">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-xl text-slate-600 font-semibold mb-1">
            No record found
          </p>
          <p className="text-slate-400 text-sm mb-5">
            The discharge certificate you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  const stay = stayDuration(data.datetime_admission, data.datetime_discharge);
  const conditionEntries = data.discharge_condition
    ? Object.entries(data.discharge_condition).filter(
        ([k]) => k !== "date_time",
      )
    : [];

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 shadow-sm font-medium ${
                isPrinting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Printer size={15} /> 
              {isPrinting ? 'Preparing Print...' : 'Print Certificate'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-5">

        {/* ── Grid: Patient info + Admission details ──────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-5">
          <Section icon={User} title="Patient Information" color="blue">
            <InfoRow label="Full Name" value={data.patient_name} />
            <InfoRow label="Age" value={data.age} />
            <InfoRow label="Gender" value={data.gender} />
            <InfoRow label="Mobile" value={data.mobile} mono />
            <InfoRow label="Address" value={data.address} />
          </Section>

          <Section icon={Calendar} title="Admission Details" color="green">
            <InfoRow
              label="Admitted"
              value={formatDate(data.datetime_admission)}
            />
            <InfoRow
              label="Discharged"
              value={formatDate(data.datetime_discharge)}
            />
            <InfoRow label="Duration" value={stay} />
            <InfoRow label="Type" value={data.type_of_discharge} />
            <InfoRow label="Next Visit" value={data.next_visit} />
          </Section>
        </div>

        {/* ── Grid: Healthcare team + Discharge condition ─────────────────── */}
        <div className="grid sm:grid-cols-2 gap-5">
          <Section icon={Stethoscope} title="Healthcare Team" color="purple">
            <InfoRow label="Doctor" value={data.doctor_data?.doctor_name} />
            <InfoRow
              label="Specialization"
              value={data.doctor_data?.specialization_id?.specialization_name}
            />
            <InfoRow label="Staff" value={data.staff_data?.staff_name} />
            <InfoRow label="Department" value={data.staff_data?.department} />
            <InfoRow
              label="Bed"
              value={
                data.bed_data
                  ? `${data.bed_data.name} – ${data.bed_data.bed_number}`
                  : null
              }
            />
          </Section>

          {conditionEntries.length > 0 && (
            <Section icon={Activity} title="Discharge Condition" color="amber">
              {conditionEntries.map(([k, v]) => (
                <InfoRow key={k} label={k} value={v} />
              ))}
            </Section>
          )}
        </div>

        {/* ── Diagnosis + Clinical Notes ───────────────────────────────────── */}
        {(data.diagnosis?.length > 0 || data.clinical_notes?.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-5">
            {data.diagnosis?.length > 0 && (
              <Section
                icon={ClipboardList}
                title="Diagnosis"
                color="rose"
                badge={`${data.diagnosis.length}`}
              >
                <TagList items={data.diagnosis.map((d) => d.diagnosis_name)} />
              </Section>
            )}
            {data.clinical_notes?.length > 0 && (
              <Section
                icon={BookOpen}
                title="Clinical Notes"
                color="slate"
                badge={`${data.clinical_notes.length}`}
              >
                <TagList
                  items={data.clinical_notes.map((c) => c.opinion_name)}
                />
              </Section>
            )}
          </div>
        )}

        {/* ── Treatment Chart ──────────────────────────────────────────────── */}
        {data.treatment_chart?.length > 0 && (
          <Section
            icon={Pill}
            title="Treatment Chart"
            color="blue"
            badge={`${data.treatment_chart.length} medicines`}
          >
            <MedTable
              headers={["Medicine", "Dosage", "When", "Qty"]}
              rows={data.treatment_chart.map((t) => [
                t.medicine_data?.medicine_name,
                t.medicine_data?.dosage || t.dosage,
                t.medicine_data?.meal_time,
                t.medicine_data?.quantity || t.quantity,
              ])}
            />
          </Section>
        )}

        {/* ── Prescriptions ────────────────────────────────────────────────── */}
        {data.Rx?.length > 0 && (
          <Section
            icon={Pill}
            title="Prescriptions (Rx)"
            color="green"
            badge={`${data.Rx.length} items`}
          >
            <MedTable
              headers={["Medicine", "Doses", "Intake", "Qty"]}
              rows={data.Rx.map((r) => [
                r.medicine_data?.medicine_name,
                r.doses,
                r.intake_type,
                r.quantity,
              ])}
            />
          </Section>
        )}

        {/* ── Advice + Notes ───────────────────────────────────────────────── */}
        {(data.adviced?.length > 0 || data.Note?.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-5">
            {data.adviced?.length > 0 && (
              <Section
                icon={CheckCircle}
                title="Advice"
                color="green"
                badge={`${data.adviced.length}`}
              >
                <TagList
                  items={data.adviced
                    .map((a) => a.opinion_details_data?.opinion_name)
                    .filter(Boolean)}
                />
              </Section>
            )}
            {data.Note?.length > 0 && (
              <Section
                icon={StickyNote}
                title="Additional Notes"
                color="amber"
                badge={`${data.Note.length}`}
              >
                <TagList
                  items={data.Note.map(
                    (n) => n.opinion_details_data?.opinion_name,
                  ).filter(Boolean)}
                />
              </Section>
            )}
          </div>
        )}

        {/* ── Investigation ────────────────────────────────────────────────── */}
        {data.investigation && (
          <Section icon={FlaskConical} title="Investigation" color="slate">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {data.investigation}
            </p>
          </Section>
        )}

        {/* ── Doctor Signature footer ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
              Issuing Physician
            </p>
            <p className="text-base font-bold text-slate-800 mt-1">
              {data.doctor_data?.doctor_name || "—"}
            </p>
            <p className="text-sm text-slate-400">
              {data.doctor_data?.specialization_id?.specialization_name || ""}
            </p>
          </div>
          <div className="text-right">
            <div className="w-40 border-t-2 border-slate-300 pt-2">
              <p className="text-xs text-slate-400">Doctor's Signature</p>
            </div>
          </div>
        </div>

        {/* Computer-generated note */}
        <p className="text-center text-xs text-slate-400 pb-2">
          Computer generated certificate •{" "}
          {new Date().toLocaleDateString("en-IN")}
        </p>
      </div>
    </div>
  );
};

export default DischargeDetail;