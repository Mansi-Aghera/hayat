// src/Pages/Doctor.jsx
import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Trash2, Plus, ArrowLeft } from "lucide-react";
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../services/doctor.services";
import {
  getSpecializations,
  createSpecialization,
} from "../services/specialization.services";

export default function Doctor() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [viewingDoctor, setViewingDoctor] = useState(null);

  const [formData, setFormData] = useState({
    doctor_name: "",
    specialization: "",
    specialization_id: "",
    email: "",
    mobile_no: "",
    address: "",
    date_of_joining: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    doctor_name: "",
    specialization_id: "",
    email: "",
    mobile_no: "",
    date_of_joining: "",
  });

  const [specializations, setSpecializations] = useState([]);
  const [specLoading, setSpecLoading] = useState(false);
  const [showSpecSuggestions, setShowSpecSuggestions] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const extractDoctorId = (doctor) => {
    const v =
      doctor?.id ??
      doctor?.pk ??
      doctor?.doctor_id ??
      doctor?.doctorId ??
      doctor?._id;

    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const normalizePhoneDigits = (value) => String(value ?? "").replace(/\D/g, "");

  const validateDoctorName = (value) => {
    const v = String(value ?? "").trim();
    if (!v) return "Doctor name is required";
    if (v.length < 2) return "Doctor name must be at least 2 characters";
    return "";
  };

  const validateSpecialization = (typed, specializationId) => {
    const t = String(typed ?? "").trim();
    if (!t && !specializationId) return "Specialization is required";
    return "";
  };

  const validateEmail = (value) => {
    const v = String(value ?? "").trim();
    if (!v) return "Email is required";
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
    return ok ? "" : "Please enter a valid email address";
  };

  const validatePhone = (value) => {
    const digits = normalizePhoneDigits(value);
    if (!digits) return "Mobile number is required";
    if (digits.length !== 10) return "Mobile number must be 10 digits";
    return "";
  };

  const validateJoiningDate = (value) => {
    const v = String(value ?? "").trim();
    if (!v) return "Joining date is required";
    return "";
  };

  const validateField = (name, value, snapshot = formData) => {
    if (name === "doctor_name") return validateDoctorName(value);
    if (name === "specialization")
      return validateSpecialization(value, snapshot.specialization_id);
    if (name === "specialization_id")
      return validateSpecialization(snapshot.specialization, value);
    if (name === "email") return validateEmail(value);
    if (name === "mobile_no") return validatePhone(value);
    if (name === "date_of_joining") return validateJoiningDate(value);
    return "";
  };

  const validateForm = (snapshot = formData) => {
    const next = {
      doctor_name: validateDoctorName(snapshot.doctor_name),
      specialization_id: validateSpecialization(
        snapshot.specialization,
        snapshot.specialization_id
      ),
      email: validateEmail(snapshot.email),
      mobile_no: validatePhone(snapshot.mobile_no),
      date_of_joining: validateJoiningDate(snapshot.date_of_joining),
    };
    setFieldErrors(next);
    return (
      !next.doctor_name &&
      !next.specialization_id &&
      !next.email &&
      !next.mobile_no &&
      !next.date_of_joining
    );
  };

  // Suggestions: call specialization API while typing
  useEffect(() => {
    const q = String(formData.specialization ?? "").trim();
    if (!q) {
      setSpecializations([]);
      setShowSpecSuggestions(false);
      return;
    }

    const t = setTimeout(async () => {
      setSpecLoading(true);
      try {
        const data = await getSpecializations(q);
        let normalized = data;
        if (!Array.isArray(normalized) && normalized) {
          normalized = normalized.results || normalized.data || [];
        }

        const list = Array.isArray(normalized) ? normalized : [];
        const qLower = q.toLowerCase();
        const filtered = list.filter((spec) => {
          const name = String(spec?.specialization_name ?? spec?.name ?? "")
            .trim()
            .toLowerCase();
          return name.includes(qLower);
        });

        setSpecializations(filtered);
        setShowSpecSuggestions(true);
      } catch {
        setSpecializations([]);
        setShowSpecSuggestions(false);
      } finally {
        setSpecLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [formData.specialization]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await getDoctors();
      let normalized = data;
      if (!Array.isArray(normalized) && normalized) {
        normalized = normalized.results || normalized.data || [];
      }
      setDoctors(Array.isArray(normalized) ? normalized : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingDoctor(null);
    setViewingDoctor(null);
    setFormData({
      doctor_name: "",
      specialization: "",
      specialization_id: "",
      email: "",
      mobile_no: "",
      address: "",
      date_of_joining: "",
    });
    setFieldErrors({
      doctor_name: "",
      specialization_id: "",
      email: "",
      mobile_no: "",
      date_of_joining: "",
    });
    setSpecializations([]);
    setShowSpecSuggestions(false);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (doctor) => {
    const id = extractDoctorId(doctor);
    setEditingDoctor({ ...doctor, id: id ?? doctor?.id });
    setViewingDoctor(null);

    const specializationText =
      doctor?.specialization ||
      (typeof doctor?.specialization_id === "object" && doctor?.specialization_id
        ? doctor.specialization_id.specialization_name || doctor.specialization_id.name || ""
        : "");

    const specializationId =
      typeof doctor?.specialization_id === "object" && doctor?.specialization_id
        ? doctor.specialization_id.id
        : doctor?.specialization_id || "";

    const next = {
      doctor_name: doctor?.doctor_name || doctor?.name || "",
      specialization: specializationText,
      specialization_id: specializationId,
      email: doctor?.email || "",
      mobile_no: String(doctor?.mobile_no ?? ""),
      address: doctor?.address || "",
      date_of_joining: doctor?.date_of_joining
        ? String(doctor.date_of_joining).split("T")[0]
        : "",
    };

    setFormData(next);
    validateForm(next);
    setSpecializations([]);
    setShowSpecSuggestions(false);
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDoctor(null);
    setError("");
  };

  const openView = (doctor) => {
    setViewingDoctor(doctor);
    setIsModalOpen(false);
    setEditingDoctor(null);
    setError("");
  };

  const closeView = () => {
    setViewingDoctor(null);
    setError("");
  };

  const handleSelectSpecialization = (spec) => {
    const specName =
      spec?.specialization_name || spec?.name || spec?.title || String(spec?.id || "");

    const next = {
      ...formData,
      specialization: specName,
      specialization_id: spec?.id || "",
    };

    setFormData(next);
    setFieldErrors((prev) => ({
      ...prev,
      specialization_id: validateSpecialization(specName, spec?.id || ""),
    }));

    setShowSpecSuggestions(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let nextValue = value;
    if (name === "mobile_no") {
      nextValue = normalizePhoneDigits(value);
    }

    const next = {
      ...formData,
      [name]: nextValue,
      ...(name === "specialization" ? { specialization_id: "" } : null),
    };

    setFormData(next);

    if (
      name === "doctor_name" ||
      name === "specialization" ||
      name === "specialization_id" ||
      name === "email" ||
      name === "mobile_no" ||
      name === "date_of_joining"
    ) {
      setFieldErrors((prev) => ({
        ...prev,
        [name === "specialization" ? "specialization_id" : name]: validateField(
          name,
          nextValue,
          next
        ),
      }));
    }

    if (error) setError("");
  };

  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    if (
      name === "doctor_name" ||
      name === "specialization" ||
      name === "email" ||
      name === "mobile_no" ||
      name === "date_of_joining"
    ) {
      setFieldErrors((prev) => ({
        ...prev,
        [name === "specialization" ? "specialization_id" : name]: validateField(
          name,
          value,
          formData
        ),
      }));
    }
  };

  const buildPayload = (snapshot) => {
    const payload = {
      doctor_name: String(snapshot.doctor_name ?? "").trim(),
      specialization: String(snapshot.specialization ?? "").trim(),
      address: String(snapshot.address ?? "").trim(),
      mobile_no: normalizePhoneDigits(snapshot.mobile_no),
      email: String(snapshot.email ?? "").trim(),
      date_of_joining: snapshot.date_of_joining,
    };

    return payload;
  };

  const extractSpecializationId = (spec) => {
    if (!spec) return null;

    // Common API shapes: {id: 1}, {data: {id: 1}}, {results: [{id:1}]}
    const candidate =
      spec?.id !== undefined
        ? spec
        : spec?.data && typeof spec.data === "object"
          ? spec.data
          : Array.isArray(spec?.results) && spec.results[0]
            ? spec.results[0]
            : spec;

    const v =
      candidate?.id ??
      candidate?.pk ??
      candidate?.specialization_id ??
      candidate?._id;
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const resolveSpecializationId = async (snapshot) => {
    const typed = String(snapshot?.specialization ?? "").trim();
    const existing = snapshot?.specialization_id;
    if (existing) return existing;
    if (!typed) return "";

    // 1) Try to find an existing specialization (best effort)
    try {
      const data = await getSpecializations(typed);
      let normalized = data;
      if (!Array.isArray(normalized) && normalized) {
        normalized = normalized.results || normalized.data || [];
      }
      const list = Array.isArray(normalized) ? normalized : [];
      const typedLower = typed.toLowerCase();
      const exact = list.find((s) => {
        const name = String(s?.specialization_name ?? s?.name ?? "")
          .trim()
          .toLowerCase();
        return name === typedLower;
      });
      const foundId = extractSpecializationId(exact);
      if (foundId) return foundId;
    } catch {
      // ignore; fallback to create
    }

    // 2) Create specialization automatically
    const created = await createSpecialization(typed);
    const createdId = extractSpecializationId(created);
    if (createdId) return createdId;

    // 3) Fallback: some backends return only name on create. Re-fetch and find by exact match.
    const dataAfter = await getSpecializations(typed);
    let normalizedAfter = dataAfter;
    if (!Array.isArray(normalizedAfter) && normalizedAfter) {
      normalizedAfter = normalizedAfter.results || normalizedAfter.data || [];
    }
    const listAfter = Array.isArray(normalizedAfter) ? normalizedAfter : [];
    const typedLowerAfter = typed.toLowerCase();
    const exactAfter = listAfter.find((s) => {
      const name = String(s?.specialization_name ?? s?.name ?? "")
        .trim()
        .toLowerCase();
      return name === typedLowerAfter;
    });
    const foundAfterId = extractSpecializationId(exactAfter);
    if (foundAfterId) return foundAfterId;

    throw new Error(
      "Specialization was created but the API did not return an id, and lookup also failed."
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const ok = validateForm(formData);
    if (!ok) {
      setError("Please fix the highlighted fields and try again.");
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload(formData);

      // Ensure backend receives specialization_id even if user typed manually
      if (!formData.specialization_id) {
        const specId = await resolveSpecializationId(formData);
        if (specId) {
          payload.specialization_id = specId;
          setFormData((prev) => ({ ...prev, specialization_id: specId }));
        }
      } else {
        payload.specialization_id = formData.specialization_id;
      }

      if (editingDoctor) {
        const id = extractDoctorId(editingDoctor);
        if (!id) {
          setError("Update failed: doctor id not found");
          return;
        }
        await updateDoctor(id, payload);
      } else {
        await createDoctor(payload);
      }

      closeModal();
      fetchDoctors();
    } catch (err) {
      const data = err.response?.data;
      const status = err.response?.status;

      if (err?.isAxiosError && !err.response) {
        // Helpful debug info for true network errors (CORS/HTTPS/DNS/offline)
        // eslint-disable-next-line no-console
        console.error("Doctor API Network Error", {
          message: err?.message,
          code: err?.code,
          url: err?.config?.url,
          method: err?.config?.method,
          baseURL: err?.config?.baseURL,
        });
      }

      const stringify = (v) => {
        if (v === undefined || v === null) return "";
        if (typeof v === "string") return v;
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      };

      let globalMsg =
        (typeof data?.detail === "string" && data.detail) ||
        (typeof data?.message === "string" && data.message) ||
        (typeof err.message === "string" && err.message) ||
        "Failed to save doctor";

      if (!err.response) globalMsg = "Network error. Please try again.";
      else if (status === 400)
        globalMsg = "Could not save doctor. Please fix the highlighted fields.";

      // If backend returned structured errors, keep them visible too
      if (status === 400 && data && typeof data === "object") {
        const detailExtra = stringify(data);
        if (detailExtra && detailExtra !== "{}") {
          setError(`${globalMsg}`);
        } else {
          setError(globalMsg);
        }
      } else {
        setError(globalMsg);
      }

      const firstMsg = (v) => {
        if (!v) return "";
        if (Array.isArray(v)) return String(v[0] ?? "");
        if (typeof v === "string") return v;
        return String(v?.detail || v?.message || "");
      };

      if (data && typeof data === "object") {
        const nextErrors = {
          doctor_name: firstMsg(data.doctor_name) || firstMsg(data.name),
          email: firstMsg(data.email),
          mobile_no: firstMsg(data.mobile_no) || firstMsg(data.mobile),
          specialization_id:
            firstMsg(data.specialization_id) ||
            firstMsg(data.specialization) ||
            firstMsg(data.specialization_name),
          date_of_joining:
            firstMsg(data.date_of_joining) || firstMsg(data.joining_date),
        };

        setFieldErrors((prev) => ({
          ...prev,
          doctor_name: nextErrors.doctor_name || prev.doctor_name,
          email: nextErrors.email || prev.email,
          mobile_no: nextErrors.mobile_no || prev.mobile_no,
          specialization_id: nextErrors.specialization_id || prev.specialization_id,
          date_of_joining: nextErrors.date_of_joining || prev.date_of_joining,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    setLoading(true);
    try {
      await deleteDoctor(id);
      fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to delete doctor");
    } finally {
      setLoading(false);
    }
  };

  const getSpecializationDisplay = (spec) => {
    if (!spec) return "-";
    if (typeof spec === "object" && spec !== null) {
      return spec.specialization_name || spec.name || spec.id || "-";
    }
    return String(spec);
  };

  const normalizedDoctors = useMemo(() => {
    return (doctors || []).map((d) => ({ ...d, __id: extractDoctorId(d) ?? d?.id }));
  }, [doctors]);

  return (
    <div className="hp-page">
      <div className="hp-page-bg">
        <div className="hp-blob hp-animate-float -top-24 -left-28 h-72 w-72 sm:h-80 sm:w-80 bg-gradient-to-br from-indigo-400/70 via-fuchsia-400/60 to-sky-400/60" />
        <div
          className="hp-blob hp-animate-float top-10 -right-24 h-64 w-64 sm:h-72 sm:w-72 bg-gradient-to-br from-emerald-400/60 via-cyan-400/60 to-indigo-400/50"
          style={{ animationDelay: "-1.6s" }}
        />
      </div>

      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6">
        <div className="mb-5 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Doctors</h1>

          <button
            type="button"
            onClick={openAddModal}
            className="hp-glow-btn hp-animate-pop inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 px-4 sm:px-6 py-3 text-white shadow-[0_18px_48px_rgba(99,102,241,0.35)] hover:shadow-[0_22px_70px_rgba(236,72,153,0.28)] transition-all duration-300"
          >
            <Plus size={18} />
            <span>Add New Doctor</span>
          </button>
        </div>

        {error && !isModalOpen && !viewingDoctor && (
          <div className="mb-5 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {isModalOpen ? (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 sm:p-6 hp-animate-pop">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="hp-action-btn hp-action-neutral hp-glow-btn inline-flex w-full sm:w-auto items-center justify-center gap-2 px-3 py-2"
              >
                <ArrowLeft size={16} />
                <span>Back to List</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    name="doctor_name"
                    placeholder="Doctor Name *"
                    value={formData.doctor_name}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    className={`w-full border rounded-lg px-4 py-3 sm:py-2 focus:outline-none focus:ring-2 ${
                      fieldErrors.doctor_name
                        ? "border-red-400 focus:ring-red-400"
                        : "border-gray-300 focus:ring-indigo-500"
                    }`}
                  />
                  {fieldErrors.doctor_name ? (
                    <div className="mt-1 text-sm text-red-600">{fieldErrors.doctor_name}</div>
                  ) : null}
                </div>

                <div className="relative md:col-span-2">
                  <input
                    type="text"
                    name="specialization"
                    placeholder="Specialization * (type and select)"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    onFocus={() => {
                      if ((formData.specialization || "").trim()) setShowSpecSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSpecSuggestions(false), 150)}
                    className={`w-full border rounded-lg px-4 py-3 sm:py-2 focus:outline-none focus:ring-2 ${
                      fieldErrors.specialization_id
                        ? "border-red-400 focus:ring-red-400"
                        : "border-gray-300 focus:ring-indigo-500"
                    }`}
                  />

                  {fieldErrors.specialization_id ? (
                    <div className="mt-1 text-sm text-red-600">
                      {fieldErrors.specialization_id}
                    </div>
                  ) : null}

                  {showSpecSuggestions && (specLoading || specializations.length > 0) ? (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                      {specLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500">Loading…</div>
                      ) : (
                        specializations.map((spec) => (
                          <button
                            key={spec.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectSpecialization(spec)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                          >
                            {spec.specialization_name || spec.name || `#${spec.id}`}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    className={`w-full border rounded-lg px-4 py-3 sm:py-2 focus:outline-none focus:ring-2 ${
                      fieldErrors.email
                        ? "border-red-400 focus:ring-red-400"
                        : "border-gray-300 focus:ring-indigo-500"
                    }`}
                    inputMode="email"
                    autoComplete="email"
                  />
                  {fieldErrors.email ? (
                    <div className="mt-1 text-sm text-red-600">{fieldErrors.email}</div>
                  ) : null}
                </div>

                <div>
                  <input
                    type="tel"
                    name="mobile_no"
                    placeholder="Mobile Number *"
                    value={formData.mobile_no}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    className={`w-full border rounded-lg px-4 py-3 sm:py-2 focus:outline-none focus:ring-2 ${
                      fieldErrors.mobile_no
                        ? "border-red-400 focus:ring-red-400"
                        : "border-gray-300 focus:ring-indigo-500"
                    }`}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  {fieldErrors.mobile_no ? (
                    <div className="mt-1 text-sm text-red-600">{fieldErrors.mobile_no}</div>
                  ) : null}
                </div>

                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 md:col-span-2"
                />

                <input
                  type="date"
                  name="date_of_joining"
                  value={formData.date_of_joining}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  className={`w-full border rounded-lg px-4 py-3 sm:py-2 focus:outline-none focus:ring-2 md:col-span-2 ${
                    fieldErrors.date_of_joining
                      ? "border-red-400 focus:ring-red-400"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                />
                {fieldErrors.date_of_joining ? (
                  <div className="md:col-span-2 -mt-3 text-sm text-red-600">
                    {fieldErrors.date_of_joining}
                  </div>
                ) : null}
              </div>

              <div className="sticky bottom-0 -mx-3 sm:mx-0 px-3 sm:px-0 py-3 bg-white/90 backdrop-blur border-t border-gray-100 rounded-b-2xl sm:border-0 sm:bg-transparent sm:backdrop-blur-0 sm:rounded-none">
                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-6 py-3 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !!fieldErrors.doctor_name ||
                      !!fieldErrors.specialization_id ||
                      !!fieldErrors.email ||
                      !!fieldErrors.mobile_no ||
                      !!fieldErrors.date_of_joining
                    }
                    className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {loading ? "Saving..." : editingDoctor ? "Update Doctor" : "Add Doctor"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : viewingDoctor ? (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 sm:p-6 hp-animate-pop">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Doctor Details</h2>
              <button
                type="button"
                onClick={closeView}
                className="hp-action-btn hp-action-neutral hp-glow-btn inline-flex w-full sm:w-auto items-center justify-center gap-2 px-3 py-2"
              >
                <ArrowLeft size={16} />
                <span>Back to List</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <InfoCard label="Doctor Name" value={viewingDoctor?.doctor_name || viewingDoctor?.name || "-"} />
              <InfoCard
                label="Specialization"
                value={
                  viewingDoctor?.specialization
                    ? viewingDoctor.specialization
                    : getSpecializationDisplay(viewingDoctor?.specialization_id)
                }
              />
              <InfoCard label="Mobile" value={viewingDoctor?.mobile_no || "-"} />
              <InfoCard label="Email" value={viewingDoctor?.email || "-"} />
              <InfoCard label="Address" value={viewingDoctor?.address || "-"} wide />
              <InfoCard label="Join Date" value={String(viewingDoctor?.date_of_joining || "").split("T")[0] || "-"} />
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => openEditModal(viewingDoctor)}
                className="hp-action-btn hp-action-edit hp-glow-btn inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 sm:py-2"
              >
                <Pencil size={16} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(extractDoctorId(viewingDoctor) ?? viewingDoctor?.id)}
                className="hp-action-btn hp-action-danger hp-glow-btn inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 sm:py-2"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="hp-animate-pop" style={{ animationDelay: "120ms" }}>
            {loading && normalizedDoctors.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Loading doctors…</div>
            ) : normalizedDoctors.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-gray-600 shadow-sm">
                No doctors found.
              </div>
            ) : (
              <div className="hidden sm:block hp-table-wrap">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white/40 backdrop-blur">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doctor Name
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                          Specialization
                        </th>
                         <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                          Email
                        </th>
                         <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                          Address
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                          Number
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">
                          Date Of Joining
                        </th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {normalizedDoctors.map((doctor) => (
                        <tr
                          key={doctor.__id ?? doctor.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-medium text-gray-900">
                            {doctor?.doctor_name || doctor?.name || "-"}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs text-gray-600">
                            {doctor?.specialization
                              ? doctor.specialization
                              : getSpecializationDisplay(doctor?.specialization_id)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-medium text-gray-900">
                            {doctor?.email || doctor?.email || "-"}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-medium text-gray-900">
                            {doctor?.address || doctor?.address || "-"}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-medium text-gray-900">
                            {doctor?.mobile_no || doctor?.mobile_no || "-"}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-medium text-gray-900">
                            {doctor?.date_of_joining || doctor?.date_of_joining || "-"}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex justify-end items-center gap-2 sm:gap-3">
                              <button
                                type="button"
                                onClick={() => openView(doctor)}
                                className="hp-action-btn hp-action-neutral hp-glow-btn px-2 py-1 sm:px-3 sm:py-2 inline-flex items-center gap-2"
                                title="View"
                              >
                                <Eye size={14} className="shrink-0" />
                                <span className="hidden sm:inline">View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(doctor)}
                                className="hp-action-btn hp-action-edit hp-glow-btn px-2 py-1 sm:px-3 sm:py-2 inline-flex items-center gap-2"
                                title="Edit"
                              >
                                <Pencil size={14} className="shrink-0" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(doctor.__id ?? doctor.id)}
                                className="hp-action-btn hp-action-danger hp-glow-btn px-2 py-1 sm:px-3 sm:py-2 inline-flex items-center gap-2"
                                title="Delete"
                              >
                                <Trash2 size={14} className="shrink-0" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value, wide = false }) {
  return (
    <div className={`rounded-xl border border-gray-100 bg-white p-4 ${wide ? "md:col-span-2" : ""}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-gray-900 break-words">{value}</div>
    </div>
  );
}
