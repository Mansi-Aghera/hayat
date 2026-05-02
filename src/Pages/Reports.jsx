import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FileText, Download, Plus } from "lucide-react";

import { getDoctors } from "../services/doctor.services";
import { getOpds } from "../services/opd.services";
import { getIpds } from "../services/ipd.services";
import { getLabForms } from "../services/labform.services";
import { getScalps } from "../services/scalp.services";

const REPORT_TYPES = [
  { key: "opd", label: "OPD" },
  { key: "ipd", label: "IPD" },
  { key: "lab", label: "Lab" },
  { key: "scalp", label: "Scalp" },
];

const toList = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.data || data.results || [];
};

const safeText = (v) => {
  if (v === null || v === undefined) return "";
  return String(v);
};

const detectDateValue = (row) => {
  const candidates = [
    row?.date,
    row?.date_time,
    row?.datetime,
    row?.created_at,
    row?.created,
    row?.createdAt,
    row?.updated_at,
    row?.visit_date,
    row?.appointment_date,
  ];

  for (const c of candidates) {
    if (!c) continue;
    const s = String(c).trim();
    if (!s) continue;

    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;

    // Try "YYYY-MM-DD HH:mm:ss" -> ISO
    if (s.includes(" ") && s.includes(":")) {
      const isoLike = s.replace(" ", "T");
      const d2 = new Date(isoLike);
      if (!Number.isNaN(d2.getTime())) return d2;
    }
  }
  return null;
};

const rowDoctorId = (row, type) => {
  // For OPD records, check all possible doctor field variations
  if (type === "opd") {
    return (
      row?.doctor_id ||           // Direct doctor_id
      row?.doctor?.id ||          // Nested doctor object with id
      row?.doctor?._id ||         // Nested doctor object with _id
      row?.doctor_data?.id ||     // doctor_data object
      row?.doctor_data?._id ||    // doctor_data with _id
      row?.doctorId ||            // camelCase version
      row?.DoctorId ||            // PascalCase version
      row?.assigned_doctor ||     // Alternative field name
      row?.consulting_doctor ||   // Alternative field name
      (row?.doctor && typeof row.doctor === 'object' ? (row.doctor.id || row.doctor._id) : null) ||
      null
    );
  }

  // For other types
  return (
    row?.doctor_data?.id ||
    row?.doctor_data?._id ||
    row?.doctor_id ||
    row?.doctor?.id ||
    row?.doctor?._id ||
    row?.doctorId ||
    null
  );
};

const formatDateForCsv = (d) => {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  // Using DD-MM-YYYY and prefixing with tab to force Excel to treat as text, preventing #### issue
  return `\t${dd}-${mm}-${yyyy}`;
};

const escapeCsv = (v) => {
  const s = safeText(v);
  if (s.includes("\n") || s.includes(",") || s.includes("\"")) {
    return `"${s.replaceAll("\"", '""')}"`;
  }
  return s;
};

const buildCsvFromColumns = (rows, columns) => {
  const headers = (columns || []).map((c) => safeText(c.header));
  const lines = [headers.map(escapeCsv).join(",")];

  for (const r of rows || []) {
    const line = (columns || []).map((c) => {
      try {
        return escapeCsv(c.get(r));
      } catch {
        return "";
      }
    });
    lines.push(line.join(","));
  }

  return lines.join("\n");
};

const getColumnsForType = (type) => {
  const doctorName = (r) => {
    // Try multiple possible paths for doctor name
    return (
      r?.doctor_data?.doctor_name ||
      r?.doctor_data?.name ||
      r?.doctor?.doctor_name ||
      r?.doctor?.name ||
      r?.doctor_name ||
      r?.assigned_doctor_name ||
      ""
    );
  };

  const date = (r) => formatDateForCsv(detectDateValue(r));

  if (type === "opd") {
    return [
      { header: "OPD ID", get: (r) => r?.id ?? r?.opd_id ?? r?.opd_number ?? "" },
      { header: "Date", get: date },
      { header: "Patient Name", get: (r) => r?.patient_name ?? r?.name ?? r?.patient?.name ?? "" },
      { header: "Mobile", get: (r) => {
        const val = r?.mobile_no ?? r?.mobile ?? r?.phone ?? "";
        return val ? `\t${val}` : ""; // Prefix with tab to force Excel to treat as text
      }},
      { header: "Age", get: (r) => r?.age ?? "" },
      { header: "Gender", get: (r) => r?.gender ?? "" },
      { header: "Doctor", get: doctorName },
      { header: "Total Amount", get: (r) => r?.total_amount ?? r?.amount ?? r?.fees ?? "" },
      { header: "Payment Mode", get: (r) => r?.payment_mode ?? r?.payment_method ?? "" },
      { header: "Status", get: (r) => r?.status ?? r?.visit_status ?? "" },
    ];
  }

  if (type === "ipd") {
    return [
      { header: "IPD ID", get: (r) => r?.id ?? r?.ipd_id ?? r?.ipd_number ?? "" },
      { header: "Date", get: date },
      { header: "Patient Name", get: (r) => r?.patient_name ?? r?.name ?? r?.patient?.name ?? "" },
      { header: "Mobile", get: (r) => {
        const val = r?.mobile_no ?? r?.mobile ?? "";
        return val ? `\t${val}` : ""; // Prefix with tab to force Excel to treat as text
      }},
      { header: "Age", get: (r) => r?.age ?? "" },
      { header: "Gender", get: (r) => r?.gender ?? "" },
      { header: "Doctor", get: doctorName },
      { header: "Bed", get: (r) => r?.bed_data?.bed_no ?? r?.bed_no ?? r?.bed?.bed_no ?? "" },
      { header: "Total Amount", get: (r) => r?.total_amount ?? r?.amount ?? "" },
      { header: "Status", get: (r) => r?.status ?? r?.admission_status ?? "" },
    ];
  }

  if (type === "lab") {
    return [
      { header: "Lab ID", get: (r) => r?.id ?? r?.lab_id ?? "" },
      { header: "SR No", get: (r) => r?.sr_no ?? r?.serial_no ?? "" },
      { header: "Date", get: date },
      { header: "Patient Name", get: (r) => r?.name ?? r?.patient_name ?? r?.patient?.name ?? "" },
      { header: "Mobile", get: (r) => {
        const val = r?.mobile_no ?? r?.mobile ?? "";
        return val ? `\t${val}` : ""; // Prefix with tab to force Excel to treat as text
      }},
      { header: "Age", get: (r) => r?.age ?? "" },
      { header: "Gender", get: (r) => r?.gender ?? "" },
      { header: "Payment Mode", get: (r) => r?.payment_mode ?? r?.payment_method ?? "" },
      { header: "Total Amount", get: (r) => r?.total_amount ?? r?.lab_investigation_fees ?? r?.amount ?? "" },
    ];
  }

  // scalp + fallback
  return [
    { header: "ID", get: (r) => r?.id ?? "" },
    { header: "Date", get: date },
    { header: "Patient Name", get: (r) => r?.patient_name ?? r?.name ?? r?.patient?.name ?? "" },
    { header: "Mobile", get: (r) => {
      const val = r?.mobile_no ?? r?.mobile ?? "";
      return val ? `\t${val}` : ""; // Prefix with tab to force Excel to treat as text
    }},
    { header: "Age", get: (r) => r?.age ?? "" },
    { header: "Gender", get: (r) => r?.gender ?? "" },
    { header: "Amount", get: (r) => r?.total_amount ?? r?.amount ?? "" },
  ];
};

const downloadTextFile = (text, filename, mime = "text/csv;charset=utf-8") => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export default function Reports() {
  const [type, setType] = useState("opd");
  const [doctorId, setDoctorId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorLimit, setDoctorLimit] = useState(10);

  const [rawData, setRawData] = useState([]);
  const [dataLoadError, setDataLoadError] = useState(null);

  const showDoctor = type === "opd";

  useEffect(() => {
    (async () => {
      try {
        const d = await getDoctors();
        const list = toList(d);
        setDoctors(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Error loading doctors:", error);
        setDoctors([]);
        toast.error("Failed to load doctors list");
      }
    })();
  }, []);

  useEffect(() => {
    // reset doctor when switching type
    setDoctorId("");
  }, [type]);

  const shownDoctors = useMemo(() => {
    if (!Array.isArray(doctors)) return [];
    return doctors.slice(0, doctorLimit);
  }, [doctors, doctorLimit]);

  const fetchReportData = async () => {
    setLoading(true);
    setDataLoadError(null);
    try {
      let res;
      console.log(`Fetching ${type} data...`);

      if (type === "opd") {
        res = await getOpds();
        console.log("OPD Response:", res);
      } else if (type === "ipd") {
        res = await getIpds();
        console.log("IPD Response:", res);
      } else if (type === "lab") {
        res = await getLabForms();
        console.log("Lab Response:", res);
      } else if (type === "scalp") {
        res = await getScalps();
        console.log("Scalp Response:", res);
      } else {
        res = null;
      }

      const list = toList(res);
      const dataArray = Array.isArray(list) ? list : [];
      console.log(`Loaded ${dataArray.length} records for ${type}`);

      // Log first record structure for debugging
      if (dataArray.length > 0) {
        console.log(`Sample ${type} record:`, dataArray[0]);
        console.log(`Doctor field in sample:`, dataArray[0].doctor_id, dataArray[0].doctor);
      }

      setRawData(dataArray);

      if (dataArray.length === 0) {
        toast.info(`No ${type.toUpperCase()} records found`);
      } else {
        toast.success(`Loaded ${dataArray.length} ${type.toUpperCase()} records`);
      }
    } catch (e) {
      console.error(`Failed to load ${type} data:`, e);
      setDataLoadError(e.message);
      toast.error(`Failed to load ${type.toUpperCase()} report data: ${e.message || "Unknown error"}`);
      setRawData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const filtered = useMemo(() => {
    const rows = Array.isArray(rawData) ? rawData : [];

    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

    const filteredRows = rows.filter((r) => {
      // Date filtering
      const d = detectDateValue(r);
      if (from && (!d || d < from)) return false;
      if (to && (!d || d > to)) return false;

      // Doctor filtering for OPD
      if (showDoctor && doctorId) {
        const id = rowDoctorId(r, type);
        const doctorIdStr = String(doctorId);
        const rowDoctorIdStr = String(id ?? "");

        // Debug logging for doctor filtering
        if (process.env.NODE_ENV === 'development') {
          console.log(`Comparing doctor: ${rowDoctorIdStr} with filter: ${doctorIdStr}`);
        }

        return rowDoctorIdStr === doctorIdStr;
      }

      return true;
    });

    console.log(`Filtered ${filteredRows.length} records from ${rows.length} total`);
    return filteredRows;
  }, [rawData, fromDate, toDate, doctorId, showDoctor, type]);

  const todayOnly = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const s = `${yyyy}-${mm}-${dd}`;
    setFromDate(s);
    setToDate(s);
    toast.info(`Date range set to today: ${s}`);
  };

  const downloadReport = () => {
    if (!fromDate || !toDate) {
      toast.error("Please select From and To dates");
      return;
    }

    if (showDoctor && !doctorId) {
      toast.error("Please select a doctor");
      return;
    }

    if (filtered.length === 0) {
      toast.warning("No records found for the selected criteria");
      return;
    }

    const columns = getColumnsForType(type);
    const csv = buildCsvFromColumns(filtered, columns);

    const typeLabel = REPORT_TYPES.find((t) => t.key === type)?.label || type;
    const filename = `report_${typeLabel}_${fromDate}_to_${toDate}.csv`.replaceAll(" ", "_");
    downloadTextFile(csv, filename);
    toast.success(`Report downloaded with ${filtered.length} records`);
  };

  const selectedDoctorName = useMemo(() => {
    if (!doctorId) return "";
    const d = (doctors || []).find((x) => String(x?.id) === String(doctorId));
    return d?.doctor_name || d?.name || "";
  }, [doctorId, doctors]);

  const selectedSummary = useMemo(() => {
    const typeLabel = REPORT_TYPES.find((t) => t.key === type)?.label || "";
    if (!typeLabel) return "";
    const doc = showDoctor && selectedDoctorName ? ` | Doctor: ${selectedDoctorName}` : "";
    const range = fromDate && toDate ? `${fromDate} to ${toDate}` : "All dates";
    const count = ` | Total Records: ${filtered.length}`;

    return `${typeLabel} Report${doc} | Date: ${range}${count}`;
  }, [type, fromDate, toDate, showDoctor, selectedDoctorName, filtered.length]);

  return (
    <div className="hp-page">
      <div className="hp-page-bg">
        <div className="hp-blob hp-animate-float -top-24 -left-28 h-80 w-80 bg-gradient-to-br from-indigo-400/70 via-fuchsia-400/60 to-sky-400/60" />
        <div
          className="hp-blob hp-animate-float top-10 -right-24 h-72 w-72 bg-gradient-to-br from-emerald-400/60 via-cyan-400/60 to-indigo-400/50"
          style={{ animationDelay: "-1.6s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Reports Dashboard</h1>
            <div className="mt-2 text-sm text-gray-600">Generate and download filtered reports</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 hp-animate-pop">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FileText className="text-indigo-600" size={20} />
            </div>
            <div className="text-xl font-bold text-gray-800">Generate Report</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label} Report
                  </option>
                ))}
              </select>
            </div>

            {showDoctor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor (Required)</label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Doctor --</option>
                  {shownDoctors.map((d) => (
                    <option key={d.id || d._id} value={d.id || d._id}>
                      {d.doctor_name || d.name || `Doctor #${d.id || d._id}`}
                    </option>
                  ))}
                </select>

                {doctors.length > shownDoctors.length && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setDoctorLimit((p) => Math.min((doctors || []).length, p + 10))}
                      className="hp-action-btn hp-action-neutral hp-glow-btn px-4 py-2 inline-flex items-center gap-2 text-sm"
                    >
                      <Plus size={18} className="shrink-0" />
                      Load More Doctors ({shownDoctors.length}/{doctors.length})
                    </button>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  {doctors.length} doctors available
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={todayOnly}
              className="hp-action-btn hp-action-neutral hp-glow-btn px-4 py-3"
            >
              Today's Report Only
            </button>

            <button
              type="button"
              onClick={downloadReport}
              disabled={loading}
              className="hp-glow-btn bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 text-white px-5 py-3 rounded-2xl shadow-[0_18px_48px_rgba(99,102,241,0.35)] hover:shadow-[0_22px_70px_rgba(236,72,153,0.28)] transition-all duration-300 inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Download size={18} className="shrink-0" />
              {loading ? "Loading Data..." : "Download Report"}
            </button>

            <button
              type="button"
              onClick={fetchReportData}
              disabled={loading}
              className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Refresh Data
            </button>
          </div>

          {selectedSummary && (
            <div className="mt-5 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700 font-medium">{selectedSummary}</div>
              {loading && <div className="text-xs text-gray-500 mt-1">Loading data...</div>}
              {dataLoadError && (
                <div className="text-xs text-red-600 mt-1">Error: {dataLoadError}</div>
              )}
            </div>
          )}

          <div className="mt-2 text-xs text-gray-500">
            {filtered.length} record(s) match the selected criteria
          </div>
        </div>
      </div>
    </div>
  );
}