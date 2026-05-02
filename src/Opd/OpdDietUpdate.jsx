import { useEffect, useState, useRef } from "react";
import { ChevronUp, ChevronDown, Trash2} from "lucide-react";
import { getOpdById, diet, updateOpd, createDiet } from "../services/opd.services";

export default function OpdDietUpdate({ id }) {
  const [opd, setOpd] = useState({ suggested_diet: [] });
  const [dietList, setDietList] = useState([]);
  const [loading, setLoading] = useState({});

  // ADD FORM
  const [form, setForm] = useState({
    diet_name: "",
    diet_id: null,
  });

  // SEARCH RESULTS
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dietHighlightIndex, setDietHighlightIndex] = useState(-1);

  // Refs for input fields
  const dietInputRef = useRef(null);
  const addButtonRef = useRef(null);

  useEffect(() => {
    fetchOpd();
    fetchDiet();
  }, [id]);

  // 🔹 FETCH OPD
  const fetchOpd = async () => {
    try {
      const res = await getOpdById(id);
      const opdData = Array.isArray(res.data) ? res.data[0] : res.data;
      
      // Transform the data - suggested_diet is array of objects {id, name}
      const transformedDiet = (opdData?.suggested_diet || []).map((item, index) => ({
        index: index,
        diet_id: item.id,
        diet_name: item.name
      }));
      
      setOpd({
        ...opdData,
        suggested_diet: transformedDiet,
      });
    } catch (error) {
      console.error("Error fetching OPD:", error);
    }
  };

  // 🔹 FETCH MASTER DIET
  const fetchDiet = async () => {
    try {
      const res = await diet();
      let data = [];

      if (Array.isArray(res)) {
        data = res;
      } else if (Array.isArray(res.results)) {
        data = res.results;
      } else if (Array.isArray(res.data)) {
        data = res.data;
      }

      setDietList(data);
    } catch (error) {
      console.error("Error fetching diet:", error);
      setDietList([]);
    }
  };

  // 🔹 HANDLE SEARCH INPUT
  const handleSearchInput = (value) => {
    setForm({ ...form, diet_name: value });
    setDietHighlightIndex(-1);
    
    if (value.trim()) {
      const filtered = dietList.filter(d =>
        d.name?.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  // 🔹 SELECT FROM DROPDOWN
  const selectDiet = (diet) => {
    setForm({
      ...form,
      diet_name: diet.name,
      diet_id: diet.id,
    });
    setShowDropdown(false);
    setTimeout(() => {
      addButtonRef.current?.focus();
    }, 100);
  };

  // 🔹 KEYBOARD NAVIGATION HANDLERS
  const handleDietKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDietHighlightIndex(prev => prev < searchResults.length ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDietHighlightIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && dietHighlightIndex >= 0 && dietHighlightIndex < searchResults.length) {
        selectDiet(searchResults[dietHighlightIndex]);
      } else if (showDropdown && dietHighlightIndex === searchResults.length) {
        setShowDropdown(false);
        addButtonRef.current?.focus();
      } else {
        addButtonRef.current?.focus();
      }
    }
  };
  
  // 🔹 FIND OR CREATE DIET
  const findOrCreateDiet = async (name) => {
    // Check if it exists locally
    const existing = dietList.find(
      d => d.name?.toLowerCase() === name.toLowerCase()
    );
    
    if (existing) {
      return { id: existing.id, name: existing.name, isNew: false };
    }
    
    // Create new
    try {
      const newDiet = await createDiet({ name });
      const createdDiet = newDiet.data || newDiet;
      
      // Add to local list
      setDietList(prev => [...prev, createdDiet]);
      
      return { id: createdDiet.id, name: createdDiet.name, isNew: true };
    } catch (error) {
      console.error("Error creating diet:", error);
      throw error;
    }
  };

  // 🔹 ADD NEW DIET ENTRY
  const handleAdd = async () => {
  if (!form.diet_name.trim()) {
    alert("Please enter diet suggestion");
    return;
  }

  try {
    setLoading({ add: true });

    // 1️⃣ find or create diet
    const result = await findOrCreateDiet(form.diet_name);

    // 2️⃣ extract ONLY ids from existing OPD diets
    const existingIds = opd.suggested_diet.map(
      item => item.diet_id
    );

    // 3️⃣ avoid duplicates
    if (existingIds.includes(result.id)) {
      alert("Diet already added");
      return;
    }
    

    // 4️⃣ final payload (ARRAY OF NUMBERS)
    const updatedDiet = [...existingIds, result.id];

    // 5️⃣ PATCH
    await updateOpd(id, {
      suggested_diet: updatedDiet,
    });

    // reset UI
    setForm({ diet_name: "", diet_id: null });
    setSearchResults([]);
    setShowDropdown(false);

    await fetchOpd();
    
    // Focus back on input after adding
    setTimeout(() => {
      dietInputRef.current?.focus();
    }, 100);
  } catch (error) {
    console.error("Error adding diet:", error);
    alert("Failed to add diet");
  } finally {
    setLoading({ add: false });
  }
};


const handleDelete = async (index) => {
  try {
    setLoading({ [index]: true });

    // 1️⃣ build new id list without deleted index
    const updatedIds = opd.suggested_diet
      .filter((_, i) => i !== index)
      .map(item => item.diet_id);

    // 2️⃣ PATCH updated list
    await updateOpd(id, {
      suggested_diet: updatedIds,
    });

    // 3️⃣ refresh
    await fetchOpd();
  } catch (error) {
    console.error("Error deleting diet:", error);
    alert("Failed to delete diet");
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
              <h2 className="text-base font-semibold text-gray-800 whitespace-nowrap pt-1 w-[150px] flex-shrink-0">Suggested Diet</h2>

              {/* Input + Button row */}
              <div className="flex-1 flex flex-col md:flex-row gap-3 items-center w-full">
              {/* Diet Input with Dropdown */}
              <div className="relative w-full md:w-4/5">
                <input
                  ref={dietInputRef}
                  placeholder="Type diet suggestion"
                  value={form.diet_name}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={handleDietKeyDown}
                  onFocus={() => form.diet_name && handleSearchInput(form.diet_name)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="border rounded-lg px-4 py-1 w-full"
                />
                
                {/* Dropdown Suggestions */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {searchResults.map((d, index) => (
                      <div
                        key={d.id}
                        onMouseDown={() => selectDiet(d)}
                        onMouseEnter={() => setDietHighlightIndex(index)}
                        className={`px-4 py-2 cursor-pointer border-b last:border-b-0 ${dietHighlightIndex === index ? 'bg-teal-100' : 'hover:bg-teal-50'}`}
                      >
                        <div className="font-medium">{d.name}</div>
                      </div>
                    ))}
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

          {/* LIST OF DIETS */}
          <div className="mt-2">
            {opd.suggested_diet.length === 0 ? (
              ""
            ) : (
              <div className="space-y-3">
                {opd.suggested_diet.map((item) => (
                  <div
                    key={item.index}
                  >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="font-medium text-gray-900">
                              {item.diet_name}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(item.index)}
                            disabled={loading[item.index]}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            {loading[item.index] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
    </div>
  );
}