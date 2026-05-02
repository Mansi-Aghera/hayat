import { useEffect, useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import { getOpdById, opinion, updateOpd, createOpinion, deleteOpdOpinion, updateOpdOpinion } from "../services/opd.services";

export default function OpdAdviceUpdate({ id }) {
  const [opd, setOpd] = useState({ adviced: [] });
  const [opinionList, setOpinionList] = useState([]);
  const [loading, setLoading] = useState({});

  // ADD FORM
  const [form, setForm] = useState({
    opinion_name: "",
    opinion_id: null,
  });

  // SEARCH RESULTS
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [adviceHighlightIndex, setAdviceHighlightIndex] = useState(-1);

  // Refs for input fields
  const adviceInputRef = useRef(null);
  const addButtonRef = useRef(null);

  useEffect(() => {
    fetchOpd();
    fetchOpinion();
  }, [id]);

  // 🔹 GET CURRENT DATETIME IN FORMAT YYYY-MM-DD HH:MM:SS
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 🔹 FORMAT DATETIME FOR DISPLAY
  const formatDateTimeForDisplay = (datetime) => {
    if (!datetime) return "";
    
    try {
      const date = new Date(datetime);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return datetime;
    }
  };

  // 🔹 FETCH OPD
  const fetchOpd = async () => {
    try {
      const res = await getOpdById(id);
      const opdData = Array.isArray(res.data) ? res.data[0] : res.data;
      
      // Transform the data
      const transformedAdvice = (opdData?.adviced || []).map((item, index) => ({
        index: index,
        datetime: item.datetime || "",
        formatted_datetime: formatDateTimeForDisplay(item.datetime),
        opinion_id: item.opinion_details_data?.id,
        opinion_name: item.opinion_details_data?.opinion_name
      }));
      
      setOpd({
        ...opdData,
        adviced: transformedAdvice,
      });
    } catch (error) {
      console.error("Error fetching OPD:", error);
    }
  };

  // 🔹 FETCH MASTER OPINION
  const fetchOpinion = async () => {
    try {
      const res = await opinion();
      let data = [];

      if (Array.isArray(res)) {
        data = res;
      } else if (Array.isArray(res.results)) {
        data = res.results;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      }

      setOpinionList(data);
    } catch (error) {
      console.error("Error fetching opinion:", error);
      setOpinionList([]);
    }
  };

  // 🔹 HANDLE SEARCH INPUT
  const handleSearchInput = (value) => {
    setForm({ ...form, opinion_name: value });
    setAdviceHighlightIndex(-1);
    
    if (value.trim()) {
      const filtered = opinionList.filter(o =>
        o.opinion_name?.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // 🔹 SELECT FROM DROPDOWN
  const selectOpinion = (opinion) => {
    setForm({
      ...form,
      opinion_name: opinion.opinion_name,
      opinion_id: opinion.id,
    });
    setShowDropdown(false);
    setTimeout(() => {
      addButtonRef.current?.focus();
    }, 100);
  };

  // 🔹 KEYBOARD NAVIGATION HANDLERS
  const handleAdviceKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAdviceHighlightIndex(prev => prev < searchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAdviceHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && adviceHighlightIndex >= 0 && adviceHighlightIndex < searchResults.length) {
        selectOpinion(searchResults[adviceHighlightIndex]);
      } else if (showDropdown && adviceHighlightIndex === searchResults.length) {
        setShowDropdown(false);
        addButtonRef.current?.focus();
      } else {
        addButtonRef.current?.focus();
      }
    }
  };

  // 🔹 FIND OR CREATE OPINION
  const findOrCreateOpinion = async (name) => {
    // Check if it exists locally
    const existing = opinionList.find(
      o => o.opinion_name?.toLowerCase() === name.toLowerCase()
    );
    
    if (existing) {
      return { id: existing.id, isNew: false };
    }
    
    // Create new
    try {
      const newOpinion = await createOpinion({ opinion_name: name });
      const createdOpinion = newOpinion.data || newOpinion;
      
      // Add to local list
      setOpinionList(prev => [...prev, createdOpinion]);
      
      return { id: createdOpinion.id, isNew: true };
    } catch (error) {
      console.error("Error creating opinion:", error);
      throw error;
    }
  };

  // 🔹 ADD NEW ADVICE ENTRY
  const handleAdd = async () => {
    if (!form.opinion_name.trim()) {
      alert("Please enter advice/opinion");
      return;
    }

    try {
      setLoading({ add: true });

      // 1️⃣ get opinion id (existing or new)
      const result = await findOrCreateOpinion(form.opinion_name);

      // 2️⃣ build new entry with current datetime
      const newEntry = {
        datetime: getCurrentDateTime(), // Auto-set current datetime
        opinion_details_data: result.id,
      };

      // 3️⃣ rebuild full array in backend format
      const existingEntries = opd.adviced.map(item => ({
        datetime: item.datetime || "",
        opinion_details_data: item.opinion_id,
      }));

      const updatedAdvice = [...existingEntries, newEntry];

      // 4️⃣ PATCH whole array
      await updateOpd(id, {
        adviced: updatedAdvice,
      });

      // 5️⃣ reset UI
      setForm({
        opinion_name: "",
        opinion_id: null,
      });
      setSearchResults([]);
      setShowDropdown(false);

      await fetchOpd();

      setTimeout(() => {
        adviceInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error("Error adding advice:", error);
      alert("Failed to add advice");
    } finally {
      setLoading({ add: false });
    }
  };

  // 🔹 DELETE ADVICE ENTRY
  const handleDelete = async (index) => {
      try {
        setLoading({ [index]: true });
        
        // Use the specific delete endpoint
        await deleteOpdOpinion(id, index);
        
        // Refresh the list
        await fetchOpd();
        
      } catch (error) {
        console.error("Error deleting advice:", error);
        alert("Failed to delete advice");
      } finally {
        setLoading({ [index]: false });
      }
  };

  return (
    <div className="w-full pr-4">
        <>
          {/* ADD SECTION - Inline title + fields */}
          <div className="">
            <div className="flex items-start gap-4 w-full">
              {/* Title - inline */}
              <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 min-w-[100px]">Advice</h2>

              {/* Input + Button row */}
              <div className="flex-1 flex flex-col md:flex-row gap-3 items-center w-full">
              {/* Opinion Input with Dropdown */}
              <div className="relative w-full md:w-4/5">
                <input
                  ref={adviceInputRef}
                  placeholder="Type advice/opinion"
                  value={form.opinion_name}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={handleAdviceKeyDown}
                  onFocus={() => form.opinion_name && handleSearchInput(form.opinion_name)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="border rounded-lg px-4 py-1 w-full"
                />
                
                {/* Dropdown Suggestions */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {searchResults.map((o, index) => (
                      <div
                        key={o.id}
                        onMouseDown={() => selectOpinion(o)}
                        onMouseEnter={() => setAdviceHighlightIndex(index)}
                        className={`px-4 py-2 cursor-pointer border-b last:border-b-0 ${adviceHighlightIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
                      >
                        <div className="font-medium">{o.opinion_name}</div>
                        {o.description && (
                          <div className="text-sm text-gray-500">{o.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No results message */}
                {showDropdown && form.opinion_name && searchResults.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-3">
                    <div className="text-gray-500">
                      No matches found. Press "Add" to create "{form.opinion_name}"
                    </div>
                  </div>
                )}
              </div>

              {/* Add Button */}
              <button
                ref={addButtonRef}
                onClick={handleAdd}
                disabled={loading.add}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full md:w-1/5 h-[42px] md:h-auto"
              >
                {loading.add ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  "Add"
                )}
              </button>
              </div>
            </div>
          </div>

          {/* LIST OF ADVICE */}
          <div className="mt-4 flex flex-wrap gap-2">
            {opd.adviced.map((item) => (
               <div
                  key={item.index}
                  className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 transition-all hover:bg-blue-100/50"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-blue-800 text-sm">
                      {item.opinion_name}
                    </span>
                    {item.datetime && (
                      <span className="text-[10px] text-blue-400 font-medium">
                        {item.formatted_datetime || formatDateTimeForDisplay(item.datetime)}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDelete(item.index)}
                    disabled={loading[item.index]}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    title="Delete advice"
                  >
                    {loading[item.index] ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
            ))}
          </div>
        </>
    </div>
  );
}