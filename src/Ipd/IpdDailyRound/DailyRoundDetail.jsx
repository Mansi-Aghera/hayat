import { Calendar, Clock, User, Pill, StickyNote } from "lucide-react";

const DailyRoundDetail = ({ round }) => {
  if (!round) return null;

  const treatments = round.daily_given_treatment?.flatMap(g => g.given_treatment || []) || [];
  const complaints = round.daily_chief_complaints || [];
  const vitals = round.daily_examination?.[0] || {};

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 text-sm space-y-3">
      
      {/* HEADER */}
      <div className="flex justify-between items-start pb-2 border-b border-gray-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-gray-800">
            <span className="font-bold text-base">Round #{round.id}</span>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {round.datetime?.split("T")[0]}
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {round.datetime?.split("T")[1]?.slice(0, 5)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <User size={14} />
            <span className="font-medium">{round.staff_data?.staff_name || 'N/A'}</span>
            {round.staff_data?.department && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600">{round.staff_data.department}</span>
              </>
            )}
          </div>
        </div>
        <span className="text-blue-700 font-semibold text-sm bg-blue-50 px-3 py-1 rounded-lg">
          IPD {round.ipd_data}
        </span>
      </div>

      {/* COMPLAINTS */}
      {complaints.length > 0 && (
        <div>
          <div className="text-gray-600 font-semibold mb-2 flex items-center gap-2">
            <span>Complaints</span>
            <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded">
              {complaints.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {complaints.map((c, i) => (
              <div key={i} className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-sm">
                <span className="font-medium">{c?.complaints_data?.name || 'Complaint'}</span>
                {c?.duration && (
                  <span className="ml-2 text-rose-700 font-medium">({c.duration})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VITALS */}
      {(vitals.BP || vitals.PR || vitals.SPO2) && (
        <div>
          <div className="text-gray-600 font-semibold mb-2">Vitals</div>
          <div className="grid grid-cols-3 gap-3">
            {vitals.BP && (
              <div className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="text-xs text-emerald-700 font-medium mb-1">BP</div>
                <div className="font-bold text-emerald-800 text-base">{vitals.BP}</div>
              </div>
            )}
            {vitals.PR && (
              <div className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-100">
                <div className="text-xs text-blue-700 font-medium mb-1">PR</div>
                <div className="font-bold text-blue-800 text-base">{vitals.PR}</div>
              </div>
            )}
            {vitals.SPO2 && (
              <div className="px-3 py-1 rounded-lg bg-purple-50 border border-purple-100">
                <div className="text-xs text-purple-700 font-medium mb-1">SpO₂</div>
                <div className="font-bold text-purple-800 text-base">{vitals.SPO2}%</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TREATMENTS */}
      {treatments.length > 0 && (
        <div>
          <div className="text-gray-600 font-semibold mb-2 flex items-center gap-2">
            <Pill size={16} />
            <span>Treatment</span>
            <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded">
              {treatments.length}
            </span>
          </div>
          <div className="space-y-2">
            {treatments.slice(0, 3).map((t, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1 rounded-lg bg-gray-50 border border-gray-100">
                <span className="font-medium text-gray-800 truncate">
                  {t.medicine_data?.medicine_name || t.medicine_name || 'Unknown Medicine'}
                </span>
                <span className="text-gray-700 text-sm bg-white px-2 py-1 rounded-md border font-medium">
                  {t.dosage || 'No dosage'}
                </span>
              </div>
            ))}
            {treatments.length > 3 && (
              <div className="text-center text-gray-500 text-sm pt-1">
                +{treatments.length - 3} more treatments
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOTES */}
      {round.special_notes && (
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <StickyNote size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-amber-800 text-sm leading-relaxed">
              {round.special_notes}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyRoundDetail;