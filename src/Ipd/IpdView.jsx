import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getIpdById } from "../services/ipd.services";
import { ArrowLeft } from "lucide-react";

export default function ViewIpd() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [ipd, setIpd] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- Fetch IPD ---------------- */
  useEffect(() => {
    if (id) fetchIpdDetails();
  }, [id]);

  const fetchIpdDetails = async () => {
    try {
      setLoading(true);
      const data = await getIpdById(id);
      setIpd(data?.data || data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to fetch IPD");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Date Helpers ---------------- */
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return isNaN(date)
      ? dateString
      : date.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  /* ---------------- UI States ---------------- */
  if (loading)
    return <div className="p-6 text-center text-sm">Loading...</div>;

  if (error)
    return <div className="p-6 text-center text-red-600 text-sm">{error}</div>;

  if (!ipd)
    return <div className="p-6 text-center text-sm">IPD Not Found</div>;

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-5 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/ipd")}
              className="p-1 rounded hover:bg-gray-200"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-lg font-semibold">IPD Details</h2>
          </div>
          <button
            onClick={() => navigate(`/ipd-update/${ipd.id || ipd._id}`)}
            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded"
          >
            Edit
          </button>
        </div>

        {/* Patient Info */}
        <Section title="Patient Info">
          <Grid>
            <Item label="SR No" value={ipd.sr_no} />
            <Item label="Name" value={ipd.patient_name} />
            <Item label="Age" value={ipd.age && `${ipd.age} yrs`} />
            <Item label="Gender" value={ipd.gender} />
            <Item label="Mobile" value={ipd.mobile} />
            <Item label="Address" value={ipd.address} full />
          </Grid>
        </Section>

        {/* Medical Info */}
        <Section title="Medical Info">
          <Grid>
            <Item
              label="Doctor"
              value={ipd.doctor_data?.doctor_name}
              sub={ipd.doctor_data?.specialization_id?.specialization_name}
            />
            <Item
              label="Bed"
              value={`${ipd.bed_data?.name || ""} ${
                ipd.bed_data?.bed_number ? `- ${ipd.bed_data.bed_number}` : ""
              }`}
            />
            <Item label="Referred By" value={ipd.referred_by} />
          </Grid>
        </Section>

        {/* Admission */}
        <Section title="Admission">
          <Grid>
            <Item label="Date" value={formatDate(ipd.date)} />
            <Item
              label="Admission Time"
              value={formatDateTime(ipd.datetime_admission)}
            />
            <Item
              label="Admitted By"
              value={ipd.admitted_by || ipd.referred_by}
              full
            />
          </Grid>
        </Section>

        {/* Past History */}
        {ipd.past_historys?.length > 0 && (
          <Section title="Past History">
            <div className="flex flex-wrap gap-1">
              {ipd.past_historys.map((h, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                >
                  {h.past_history_data?.name}
                  {h.duration && ` (${h.duration})`}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Complaints */}
        {ipd.daily_chief_complaints?.length > 0 && (
          <Section title="Complaints">
            <ul className="text-xs text-gray-700 space-y-0.5">
              {ipd.daily_chief_complaints.map((c, i) => (
                <li key={i}>
                  • {c.complaints_data?.name}
                  {c.duration && (
                    <span className="text-gray-500"> – {c.duration}</span>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* general examination */}
        {ipd.general_examination?.length > 0 && (
          <Section title="General Examination">
            <ul className="text-xs text-gray-700 space-y-0.5">
              {ipd.general_examination.map((c, i) => (
                  <>
                    <li className="font-medium">BP:  {c.BP || "-"} </li>
                    <li className="font-medium">RR:  {c.RR || "-"}</li>
                    <li className="font-medium">SPO2:  {c.SPO2 || "-"} </li>
                    <li className="font-medium">Pulse:  {c.pulse || "-"} </li>
                    <li className="font-medium">Sugar:  {c.sugar || "-"} </li>
                    <li className="font-medium">Temperature:  {c.temperature || "-"} </li>
                  </>
              ))}
            </ul>
          </Section>
        )}

        {/* Treatment */}
        {ipd.daily_given_treatment?.length > 0 && (
          <Section title="Daily Treatment">
            <div className="space-y-2">
              {ipd.daily_given_treatment.map((d, i) => (
                <div key={i} className="bg-gray-50 p-2 rounded">
                  <p className="text-[11px] text-gray-500 mb-1">
                    {formatDateTime(d.datetime)}
                  </p>
                  <ul className="text-xs space-y-0.5">
                    {d.given_treatment.map((m, idx) => (
                      <li key={idx}>
                        • {m.medicine_data?.medicine_name}
                        {m.dosage && (
                          <span className="text-gray-500"> ({m.dosage})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

      </div>
    </div>
  );
}

/* ---------------- Reusable Components ---------------- */

const Section = ({ title, children }) => (
  <div>
    <h3 className="text-xl font-semibold text-gray-700 mb-1">{title}</h3>
    {children}
  </div>
);

const Grid = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>
);

const Item = ({ label, value, sub, full }) => (
  <div className={full ? "md:col-span-2" : ""}>
    <p className="text-[11px] text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-800">
      {value || "-"}
    </p>
    {sub && <p className="text-[11px] text-gray-500">{sub}</p>}
  </div>
);
