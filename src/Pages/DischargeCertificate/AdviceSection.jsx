import React from "react";
import AutocompleteInput from "../AutocompleteInput";
import { Trash2 } from "lucide-react";

const AdviceSection = ({
  adviceInput,
  setAdviceInput,
  opinions,
  formData,
  handleAddAdvice,
  handleRemoveItem,
}) => {
  return (
    <div className="space-y-4">
      {/* Row Layout for Advice */}
      <div className="flex items-start gap-4">
        <label className="text-base font-bold text-gray-900 whitespace-nowrap pt-2 w-[150px] flex-shrink-0">
          Advice
        </label>

        <div className="flex-1 flex gap-3 items-start">
          <div className="flex-1">
            <AutocompleteInput
              value={adviceInput}
              onChange={(value) => setAdviceInput(value)}
              suggestions={opinions}
              label=""
              placeholder="Type advice or select from list"
              className="w-full text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAddAdvice}
            className="bg-blue-600 text-white rounded-lg px-6 py-2 text-sm font-bold hover:bg-blue-700 transition-colors h-[42px]"
          >
            Add
          </button>
        </div>
      </div>

      {/* List of Advice Below Input */}
      <div className="pl-[150px] space-y-2">
        {formData.adviced.map((item, index) => {
          const opinionId =
            item.opinion_details_data?.id || item.opinion_details_data;
          const advice = opinions.find((o) => o.id === opinionId);

          return (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 group"
            >
              <span className="text-sm font-medium text-gray-700">
                {advice?.name || advice?.opinion_name || "Unknown Advice"}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveItem("adviced", index)}
                className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdviceSection;
