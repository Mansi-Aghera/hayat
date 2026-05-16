import { useState, useEffect, useRef } from "react";

export default function OpdVitalsUpdate({ id, data, onUpdate }) {
  const [vitals, setVitals] = useState({
    BP: "",
    PR: "",
    SPO: "",
    Sugar: "",
    Weight: "",
    Temp: ""
  });
  
  // Sync local state with prop data
  useEffect(() => {
    if (data) {
      setVitals({
        BP: data.BP || "",
        PR: data.PR || "",
        SPO: data.SPO || "",
        Sugar: data.Sugar || "",
        Weight: data.Weight || "",
        Temp: data.Temp || ""
      });
    }
  }, [data]);

  // Refs for input fields
  const bpRef = useRef(null);
  const prRef = useRef(null);
  const spoRef = useRef(null);
  const sugarRef = useRef(null);
  const weightRef = useRef(null);
  const tempRef = useRef(null);

  const handleInputChange = (field, value) => {
    const updatedVitals = { ...vitals, [field]: value };
    setVitals(updatedVitals);
    onUpdate(updatedVitals);
  };

  const handleKeyDown = (e, nextField) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      switch (nextField) {
        case 'pr': prRef.current?.focus(); break;
        case 'spo': spoRef.current?.focus(); break;
        case 'sugar': sugarRef.current?.focus(); break;
        case 'weight': weightRef.current?.focus(); break;
        case 'temp': tempRef.current?.focus(); break;
        default: bpRef.current?.focus();
      }
    }
  };

  return (
    <div className="w-full px-6 py-1">
        <div className="flex items-start gap-4">
            <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-2 w-[140px] flex-shrink-0">Vitals</h2>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${vitals.BP ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">BP</span>
                <input ref={bpRef} type="text" placeholder="120/80" value={vitals.BP} onChange={(e) => handleInputChange('BP', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'pr')} className="w-full outline-none text-sm bg-transparent" />
              </div>
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${vitals.PR ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">PR</span>
                <input ref={prRef} type="text" placeholder="80" value={vitals.PR} onChange={(e) => handleInputChange('PR', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'spo')} className="w-full outline-none text-sm bg-transparent" />
              </div>
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${vitals.SPO ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">SpO₂</span>
                <input ref={spoRef} type="text" placeholder="98" value={vitals.SPO} onChange={(e) => handleInputChange('SPO', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'sugar')} className="w-full outline-none text-sm bg-transparent" />
              </div>
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${vitals.Sugar ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Sugar</span>
                <input ref={sugarRef} type="text" placeholder="R:110" value={vitals.Sugar} onChange={(e) => handleInputChange('Sugar', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'temp')} className="w-full outline-none text-sm bg-transparent" />
              </div>
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${vitals.Temp ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Temp</span>
                <input ref={tempRef} type="text" placeholder="98" value={vitals.Temp} onChange={(e) => handleInputChange('Temp', e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'weight')} className="w-full outline-none text-sm bg-transparent" />
              </div>
              <div className={`flex items-center border rounded-xl px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${vitals.Weight ? 'bg-blue-50/50 border-blue-300' : 'bg-white border-gray-300'}`}>
                <span className="text-xs font-semibold text-gray-500 mr-2 whitespace-nowrap">Wt</span>
                <input ref={weightRef} type="text" placeholder="72" value={vitals.Weight} onChange={(e) => handleInputChange('Weight', e.target.value)} className="w-full outline-none text-sm bg-transparent" />
              </div>
            </div>
        </div>
    </div>
  );
}