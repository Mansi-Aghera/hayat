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
    <div className="w-full px-6 py-1">
      {/* COLLAPSIBLE CONTENT */}
      <div className="overflow-hidden transition-all duration-300 ease-in-out">
        {/* VITALS FORM - Inline title + fields */}
        <div className="">
          <div className="flex items-start gap-4">
            {/* Title - inline */}
            <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 w-[140px] flex-shrink-0">Vitals</h2>

            {/* Input fields row */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">

              {/* Blood Pressure */}
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${vitals.BP ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">BP</span>
                <input
                  ref={bpRef}
                  type="text"
                  placeholder="120/80"
                  value={vitals.BP}
                  onChange={(e) => handleInputChange('BP', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'pr')}
                  className={`w-full outline-none text-sm bg-transparent ${vitals.BP ? 'text-blue-700 font-bold' : 'text-gray-700'}`}
                  autoFocus
                />
              </div>

              {/* Pulse Rate */}
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${vitals.PR ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">PR</span>
                <input
                  ref={prRef}
                  type="text"
                  placeholder="80"
                  value={vitals.PR}
                  onChange={(e) => handleInputChange('PR', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'spo')}
                  className={`w-full outline-none text-sm bg-transparent ${vitals.PR ? 'text-blue-700 font-bold' : 'text-gray-700'}`}
                />
                <span className="text-gray-400 text-[10px] ml-1">bpm</span>
              </div>

              {/* Oxygen Saturation */}
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${vitals.SPO ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">SpO₂</span>
                <input
                  ref={spoRef}
                  type="text"
                  placeholder="98"
                  value={vitals.SPO}
                  onChange={(e) => handleInputChange('SPO', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'sugar')}
                  className={`w-full outline-none text-sm bg-transparent ${vitals.SPO ? 'text-blue-700 font-bold' : 'text-gray-700'}`}
                />
                <span className="text-gray-400 text-[10px] ml-1">%</span>
              </div>

              {/* Blood Sugar */}
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${vitals.Sugar ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Sugar</span>
                <input
                  ref={sugarRef}
                  type="text"
                  placeholder="R:110"
                  value={vitals.Sugar}
                  onChange={(e) => handleInputChange('Sugar', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'temp')}
                  className={`w-full outline-none text-sm bg-transparent ${vitals.Sugar ? 'text-blue-700 font-bold' : 'text-gray-700'}`}
                />
              </div>

              {/* Temperature */}
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${vitals.Temp ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Temp</span>
                <input
                  ref={tempRef}
                  type="text"
                  placeholder="98"
                  value={vitals.Temp}
                  onChange={(e) => handleInputChange('Temp', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'weight')}
                  className={`w-full outline-none text-sm bg-transparent ${vitals.Temp ? 'text-blue-700 font-bold' : 'text-gray-700'}`}
                />
                <span className="text-gray-400 text-[10px] ml-1">°F</span>
              </div>

              {/* Weight */}
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${vitals.Weight ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Wt</span>
                <input
                  ref={weightRef}
                  type="text"
                  placeholder="72"
                  value={vitals.Weight}
                  onChange={(e) => handleInputChange('Weight', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'save')}
                  className={`w-full outline-none text-sm bg-transparent ${vitals.Weight ? 'text-blue-700 font-bold' : 'text-gray-700'}`}
                />
                <span className="text-gray-400 text-[10px] ml-1">kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}