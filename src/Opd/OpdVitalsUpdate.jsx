import { useState, useEffect, useRef } from "react";
import { getOpdById, updateOpd } from "../services/opd.services";

export default function OpdVitalsUpdate({ id }) {
  const [loading, setLoading] = useState(false);
  const [vitals, setVitals] = useState({
    BP: "",
    PR: "",
    SPO: "",
    Sugar: "",
    Weight: "",
    Temp: ""
  });
  
  // Ref to track latest vitals for the global save event (prevents stale closure)
  const vitalsRef = useRef(vitals);
  useEffect(() => { vitalsRef.current = vitals; }, [vitals]);

  // Add this state to store saved vitals separately
  const [savedVitals, setSavedVitals] = useState({
    BP: "",
    PR: "",
    SPO: "",
    Sugar: "",
    Weight: "",
    Temp: ""
  });

  // State to track if vitals exist
  const [hasVitals, setHasVitals] = useState(false);

  // Refs for input fields
  const bpRef = useRef(null);
  const prRef = useRef(null);
  const spoRef = useRef(null);
  const sugarRef = useRef(null);
  const weightRef = useRef(null);
  const tempRef = useRef(null);
  const saveButtonRef = useRef(null);

  useEffect(() => {
    fetchExistingVitals();

    // 🔹 Listen for global save request from Footer
    const handleGlobalSave = () => handleSave(true);
    window.addEventListener('opd_save_all_requested', handleGlobalSave);
    return () => window.removeEventListener('opd_save_all_requested', handleGlobalSave);
  }, [id]); 

  // 🔹 FETCH EXISTING VITALS
  const fetchExistingVitals = async () => {
    try {
      const res = await getOpdById(id);
      const opdData = Array.isArray(res.data) ? res.data[0] : res.data;

      if (opdData?.vitals) {
        // Fill in saved vitals from server
        const serverVitals = {
          BP: opdData.vitals.BP || "",
          PR: opdData.vitals.PR || "",
          SPO: opdData.vitals.SPO || "",
          Sugar: opdData.vitals.Sugar || "",
          Weight: opdData.vitals.Weight || "",
          Temp: opdData.vitals.Temp || ""
        };

        setSavedVitals(serverVitals);
        setHasVitals(true);

        // Pre-fill input form with existing vitals
        setVitals(serverVitals);
      } else {
        setHasVitals(false);
        setSavedVitals({
          BP: "",
          PR: "",
          SPO: "",
          Sugar: "",
          Weight: "",
          Temp: ""
        });
      }
    } catch (error) {
      console.error("Error fetching vitals:", error);
      setHasVitals(false);
    }
  };

  // 🔹 HANDLE INPUT CHANGE
  const handleInputChange = (field, value) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  // 🔹 HANDLE ENTER KEY PRESS
  const handleKeyDown = (e, nextField) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission

      switch (nextField) {
        case 'pr':
          prRef.current?.focus();
          break;
        case 'spo':
          spoRef.current?.focus();
          break;
        case 'sugar':
          sugarRef.current?.focus();
          break;
        case 'weight':
          weightRef.current?.focus();
          break;
        case 'temp':
          tempRef.current?.focus();
          break;
        case 'save':
          saveButtonRef.current?.click();
          break;
        default:
          bpRef.current?.focus();
      }
    }
  };

  // 🔹 SAVE VITALS
  const handleSave = async (isSilent = false) => {
    try {
      setLoading(true);

      // Create payload with only non-empty values
      const payload = { vitals: {} };

      // Add only fields that have values from the LATEST state (via ref)
      Object.keys(vitalsRef.current).forEach(key => {
        if (vitalsRef.current[key] !== "") {
          payload.vitals[key] = vitalsRef.current[key];
        }
      });

      // Don't send empty vitals object if manually saving (but manual is removed)
      // If silent save and empty, just return
      if (Object.keys(payload.vitals).length === 0) {
        return;
      }

      // Send update to server
      await updateOpd(id, payload);

      // IMPORTANT: Fetch the updated data from server
      await fetchExistingVitals();

      // Broadcast update to sync sticky header
      window.dispatchEvent(new Event('opd_info_updated'));

      if (!isSilent) {
        // Focus back to BP field after saving
        setTimeout(() => {
          bpRef.current?.focus();
        }, 100);
      }

    } catch (error) {
      console.error("Error saving vitals:", error);
      if (!isSilent) alert("Failed to save vitals");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 FORMAT VITALS FOR DISPLAY - Use savedVitals instead of vitals
  const formatVitalsForDisplay = () => {
    const displayItems = [];

    // Use savedVitals (from server) for display
    if (savedVitals.BP) displayItems.push({ label: "BP", value: savedVitals.BP });
    if (savedVitals.PR) displayItems.push({ label: "PR", value: savedVitals.PR });
    if (savedVitals.SPO) displayItems.push({ label: "SpO₂", value: `${savedVitals.SPO}%` });
    if (savedVitals.Sugar) displayItems.push({ label: "Sugar", value: savedVitals.Sugar });
    if (savedVitals.Temp) displayItems.push({ label: "Temp", value: savedVitals.Temp });
    if (savedVitals.Weight) displayItems.push({ label: "Weight", value: savedVitals.Weight });

    return displayItems;
  };

  return (
    <div className="px-6">
      {/* COLLAPSIBLE CONTENT */}
      <div className="overflow-hidden transition-all duration-300 ease-in-out">
        {/* VITALS FORM - Inline title + fields */}
        <div className="">
          <div className="flex items-start gap-4">
            {/* Title - inline */}
            <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 min-w-[140px]">Vitals</h2>

            {/* Input fields row - Added 7th column for Save Button */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">

              {/* Blood Pressure */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  Blood Pressure (BP)
                </label>
                <input
                  ref={bpRef}
                  type="text"
                  placeholder="e.g., 120/80"
                  value={vitals.BP}
                  onChange={(e) => handleInputChange('BP', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'pr')}
                  className="w-full border rounded-lg px-3 py-1"
                  autoFocus
                />
              </div>

              {/* Pulse Rate */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  Pulse Rate (PR)
                </label>
                <div className="relative">
                  <input
                    ref={prRef}
                    type="text"
                    placeholder="e.g., 80"
                    value={vitals.PR}
                    onChange={(e) => handleInputChange('PR', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'spo')}
                    className="w-full border rounded-lg px-3 py-1"
                  />
                  <div className="absolute right-3 top-1.5 text-gray-400 text-xs">bpm</div>
                </div>
              </div>

              {/* Oxygen Saturation */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  SpO₂
                </label>
                <div className="relative">
                  <input
                    ref={spoRef}
                    type="text"
                    placeholder="e.g., 98"
                    value={vitals.SPO}
                    onChange={(e) => handleInputChange('SPO', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'sugar')}
                    className="w-full border rounded-lg px-3 py-1"
                  />
                  <div className="absolute right-3 top-1.5 text-gray-400 text-xs">%</div>
                </div>
              </div>

              {/* Blood Sugar */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  Blood Sugar
                </label>
                <input
                  ref={sugarRef}
                  type="text"
                  placeholder="e.g., R:110"
                  value={vitals.Sugar}
                  onChange={(e) => handleInputChange('Sugar', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'temp')}
                  className="w-full border rounded-lg px-3 py-1"
                />
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  Temperature
                </label>
                <div className="relative">
                  <input
                    ref={tempRef}
                    type="text"
                    placeholder="e.g., 98"
                    value={vitals.Temp}
                    onChange={(e) => handleInputChange('Temp', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'weight')}
                    className="w-full border rounded-lg px-3 py-1"
                  />
                  <div className="absolute right-3 top-1.5 text-gray-400 text-xs">°F</div>
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <label className="block text-xs font-medium text-gray-700">
                  Weight
                </label>
                <div className="relative">
                  <input
                    ref={weightRef}
                    type="text"
                    placeholder="e.g., 72"
                    value={vitals.Weight}
                    onChange={(e) => handleInputChange('Weight', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'save')}
                    className="w-full border rounded-lg px-3 py-1"
                  />
                  <div className="absolute right-3 top-1.5 text-gray-400 text-xs">kg</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}