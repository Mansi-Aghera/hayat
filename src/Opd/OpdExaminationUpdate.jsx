import { useEffect, useState, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getOpdById, updateOpd } from "../services/opd.services";

export default function OpdExaminationUpdate({ id }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [examination, setExamination] = useState({
    RS: "BL Clear",
    CVS: "S1 S2+",
    CNS: "Conscious",
    PA: "Soft non tender",
    opinion: "",
  });
  
  // Ref to track latest examination for the global save event
  const examinationRef = useRef(examination);
  useEffect(() => { examinationRef.current = examination; }, [examination]);

  const [savedExamination, setSavedExamination] = useState(null);

  // Refs for input fields
  const rsRef = useRef(null);
  const cvsRef = useRef(null);
  const paRef = useRef(null);
  const cnsRef = useRef(null);
  const opinionRef = useRef(null);
  const saveButtonRef = useRef(null);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchExamination();

    // 🔹 Listen for global save request from Footer
    const handleGlobalSave = () => handleSave(true);
    window.addEventListener('opd_save_all_requested', handleGlobalSave);
    return () => window.removeEventListener('opd_save_all_requested', handleGlobalSave);
  }, [id]); 

  const fetchExamination = async () => {
    try {
      const res = await getOpdById(id);
      const opd = Array.isArray(res.data) ? res.data[0] : res.data;

      if (opd?.examination) {
        setSavedExamination(opd.examination);
        setExamination(prev => ({
          ...prev,
          ...opd.examination
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= SAVE ================= */
  const handleSave = async (isSilent = false) => {
    try {
      setLoading(true);

      const payload = { examination: {} };

      Object.keys(examinationRef.current).forEach((key) => {
        if (examinationRef.current[key]?.trim()) {
          payload.examination[key] = examinationRef.current[key];
        }
      });

      if (!Object.keys(payload.examination).length) {
        return;
      }

      await updateOpd(id, payload);
      setSavedExamination(payload.examination);
      
      if (!isSilent) {
        // Focus back to RS field after save
        setTimeout(() => {
          rsRef.current?.focus();
        }, 100);
      }
    } catch (err) {
      console.error(err);
      if (!isSilent) alert("Failed to save examination");
    } finally {
      setLoading(false);
    }
  };

  const formatExaminationForDisplay = () => {
    if (!savedExamination) return [];
    const displayItems = [];
    if (savedExamination.RS) displayItems.push({ label: "RS", value: savedExamination.RS });
    if (savedExamination.CVS) displayItems.push({ label: "CVS", value: savedExamination.CVS });
    if (savedExamination.CNS) displayItems.push({ label: "CNS", value: savedExamination.CNS });
    if (savedExamination.PA) displayItems.push({ label: "PA", value: savedExamination.PA });
    if (savedExamination.opinion) displayItems.push({ label: "Opinion", value: savedExamination.opinion });
    return displayItems;
  };

  const hasExamination = savedExamination && Object.values(savedExamination).some(v => v);

  /* ================= ENTER KEY NAVIGATION ================= */
  const handleKeyDown = (e, nextField) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      
      switch(nextField) {
        case 'cvs':
          cvsRef.current?.focus();
          break;
        case 'pa':
          paRef.current?.focus();
          break;
        case 'cns':
          cnsRef.current?.focus();
          break;
        case 'opinion':
          opinionRef.current?.focus();
          break;
        case 'save':
          saveButtonRef.current?.click();
          break;
        default:
          rsRef.current?.focus();
      }
    }
  };

  const placeholders = {
    RS: "e.g. BL CLEAR",
    CVS: "e.g. S1 S2+",
    PA: "e.g. Soft, Non-tender",
    CNS: "e.g. Conscious",
    opinion: "Clinical Opinion"
  };

  /* ================= UI ================= */
  return (
    <div className="w-full px-6 py-1">
        <>

          {/* EXAMINATION FORM - Inline title + fields */}
          <div className="">
            <div className="flex items-start gap-4">
              {/* Title - inline */}
              <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 w-[140px] flex-shrink-0">Examination</h2>

              {/* Input fields row */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* RS */}
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${examination.RS ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">RS</span>
                <input
                  ref={rsRef}
                  type="text"
                  value={examination.RS}
                  onChange={(e) =>
                    setExamination({ ...examination, RS: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, 'cvs')}
                  placeholder={placeholders.RS}
                  className={`w-full outline-none text-sm bg-transparent ${examination.RS ? 'text-blue-700 font-bold' : 'text-gray-700'}`}
                  autoFocus
                />
              </div>

              {/* CVS */}
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${examination.CVS ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">CVS</span>
                <input
                  ref={cvsRef}
                  type="text"
                  value={examination.CVS}
                  onChange={(e) =>
                    setExamination({ ...examination, CVS: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, 'cns')}
                  placeholder={placeholders.CVS}
                  className={`w-full outline-none text-sm bg-transparent ${examination.CVS ? 'text-blue-700 font-bold' : 'text-gray-700'}`}
                />
              </div>

              {/* CNS */}
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${examination.CNS ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">CNS</span>
                <input
                  ref={cnsRef}
                  type="text"
                  value={examination.CNS}
                  onChange={(e) =>
                    setExamination({ ...examination, CNS: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, 'pa')}
                  placeholder={placeholders.CNS}
                  className={`w-full outline-none text-sm bg-transparent ${examination.CNS ? 'text-blue-700 font-bold' : 'text-gray-700'}`}
                />
              </div>

              {/* PA */}
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${examination.PA ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">PA</span>
                <input
                  ref={paRef}
                  type="text"
                  value={examination.PA}
                  onChange={(e) =>
                    setExamination({ ...examination, PA: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, 'opinion')}
                  placeholder={placeholders.PA}
                  className={`w-full outline-none text-sm bg-transparent ${examination.PA ? 'text-blue-700 font-bold' : 'text-gray-700'}`}
                />
              </div>

              {/* OPINION */}
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${examination.opinion ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Opinion</span>
                <input
                  ref={opinionRef}
                  type="text"
                  value={examination.opinion}
                  onChange={(e) =>
                    setExamination({ ...examination, opinion: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, 'save')}
                  placeholder={placeholders.opinion}
                  className={`w-full outline-none text-sm bg-transparent ${examination.opinion ? 'text-blue-700 font-bold' : 'text-gray-700'}`}
                />
            </div>
          </div>
        </div>
      </div>
    </>
  </div>
  );
}