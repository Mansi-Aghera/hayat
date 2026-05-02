import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createIpd } from "../services/ipd.services";
import { getBeds,updateBed  } from "../services/bed.services";
import { getDoctors } from "../services/doctor.services";

export default function AddIpd() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [beds, setBeds] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    mobile: "",
  });

  const [form, setForm] = useState({
    sr_no: "",
    date: "",
    datetime_admission: "",
    patient_name: "",
    age: "",
    gender: "",
    address: "",
    mobile: "",
    referred_by: "",
    bed_id: "",
    doctor_id: "",
  });

  // --- Validation helpers ---
  const normalizePhone = (value) => String(value ?? "").trim();

  // Accepts digits with optional + at start, spaces/dashes/() allowed
  // Validates based on count of digits (7..15 typical range)
  const validatePhoneRequired = (value) => {
    const v = normalizePhone(value);
    if (!v) return "Mobile number is required";
    if (!/^\+?[0-9()\-\s]+$/.test(v)) {
      return "Mobile number can contain only digits, spaces, +, -, ( )";
    }
    const digits = v.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      return "Mobile number must be between 7 and 15 digits";
    }
    return "";
  };

  const validateForm = (data) => {
    const next = {
      mobile: validatePhoneRequired(data.mobile),
    };
    setFieldErrors(next);
    return !next.mobile;
  };

  /* ---------------- FETCH DROPDOWNS ---------------- */
  useEffect(() => {
    fetchBeds();
    fetchDoctors();
  }, []);

  const fetchBeds = async () => {
    try {
      const res = await getBeds();
      setBeds(res?.data || res || []);
    } catch (err) {
      console.error("Bed fetch error", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await getDoctors();
      setDoctors(res?.data || res || []);
    } catch (err) {
      console.error("Doctor fetch error", err);
    }
  };

  /* ---------------- HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    let nextValue = value;
    if (name === "mobile") {
      nextValue = String(value ?? "").replace(/[^\d+\-\s()]/g, "");
    }

    setForm((prev) => ({ ...prev, [name]: nextValue }));

    if (name === "mobile") {
      setFieldErrors((prev) => ({
        ...prev,
        mobile: validatePhoneRequired(nextValue),
      }));
    }
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      setFieldErrors((prev) => ({
        ...prev,
        mobile: validatePhoneRequired(value),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patient_name || !form.mobile || !form.bed_id || !form.doctor_id) {
      alert("Please fill required fields");
      return;
    }

    const ok = validateForm(form);
    if (!ok) return;

    try {
      setLoading(true);

      const payload = {
        sr_no: form.sr_no,
        date: form.date,
        datetime_admission: form.datetime_admission,
        patient_name: form.patient_name,
        age: Number(form.age),
        gender: form.gender,
        address: form.address,
        mobile: form.mobile,
        referred_by: form.referred_by,

        // Backend expects IDs only
        bed_data: Number(form.bed_id),
        doctor_data: Number(form.doctor_id),
      };

      await createIpd(payload);
      await updateBed(form.bed_id, {
        status: "occupied"
      });
      alert("IPD created successfully");
      navigate("/ipd");
    } catch (err) {
      console.error(err);
      alert("Failed to create IPD");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Add IPD</h2>
            <button
              type="button"
              onClick={() => navigate("/ipd")}
              className="text-gray-600 border rounded-full p-2 hover:text-gray-800 font-medium cursor-pointer"
            >
              Back to List
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: SR No & Patient Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sr No *
                </label>
                <input
                  name="sr_no"
                  value={form.sr_no}
                  onChange={handleChange}
                  placeholder="Sr No *"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name *
                </label>
                <input
                  name="patient_name"
                  value={form.patient_name}
                  onChange={handleChange}
                  placeholder="Patient Name *"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Row 2: Age & Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Age *"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
                >
                  <option value="">Select Gender *</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Row 3: Address & Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile *
                </label>
                <input
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  onBlur={handleFieldBlur}
                  placeholder="Mobile *"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    fieldErrors.mobile
                      ? "border-red-400 focus:ring-red-400"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                  inputMode="tel"
                  autoComplete="tel"
                />
                {fieldErrors.mobile ? (
                  <div className="mt-2 text-sm text-red-600">{fieldErrors.mobile}</div>
                ) : null}
              </div>
            </div>

            {/* Row 4: Date & Admission DateTime */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry By
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admission Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="datetime_admission"
                  value={form.datetime_admission}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Row 5: Referred By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admitted By
              </label>
              <input
                name="referred_by"
                value={form.referred_by}
                onChange={handleChange}
                placeholder="Referred By"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Bed & Doctor Selection Section */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Bed & Doctor Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BED DROPDOWN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bed *
                  </label>
                  <select
                    name="bed_id"
                    value={form.bed_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
                  >
                    <option value="">Select Bed *</option>
                    {beds
                      .filter((b) => b.status !== "occupied")
                      .map((bed) => (
                        <option key={bed.id} value={bed.id}>
                          {bed.name} - Bed {bed.bed_number}
                        </option>
                      ))}
                  </select>
                </div>

                {/* DOCTOR DROPDOWN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Doctor *
                  </label>
                  <select
                    name="doctor_id"
                    value={form.doctor_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-700"
                  >
                    <option value="">Select Doctor *</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.doctor_name} (
                        {doc.specialization_id?.specialization_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate("/ipd")}
                className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !!fieldErrors.mobile}
                className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {loading ? "Saving..." : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}