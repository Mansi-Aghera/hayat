import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "../services/auth.services";
import { getDoctorsCount } from "../services/doctor.services";
import { getBedsCount } from "../services/bed.services";
import { getOpdsCount } from "../services/opd.services";
import { getIpdsCount } from "../services/ipd.services";
import { getMedicinesCount } from "../services/medicine.services";
import { getStaffCount } from "../services/staff.services";
import { getLabFormsCount } from "../services/labform.services";
import { getStaffTransactionsCount } from "../services/staffTransactions.services";
import { getServicesCount } from "../services/service.services";

export default function Dashboard() {
  const navigate = useNavigate();
  const auth = getAuth();
  const role = auth?.type;

  const [loading, setLoading] = useState(false);

  // Dummy counts (replace with API later if needed)
  const [counts, setCounts] = useState({
    doctors: 0,
    staff: 0,
    labs: 0,
    services: 0,
    medicines: 0,
    beds: 0,
    staffTransactions: 0,
    certificates: 9,
    opd: 0,
    ipd: 0,
  });

  useEffect(()=>{
    async function fetchCounts() {
      try {
        const doctorsCount = await getDoctorsCount();
        const bedsCount = await getBedsCount();
        const opdCount = await getOpdsCount();
        const ipdCount = await getIpdsCount();
        const medicinesCount = await getMedicinesCount();
        const staffCount = await getStaffCount();
        const labsCount = await getLabFormsCount();
        const staffTransactionsCount = await getStaffTransactionsCount();
        const servicesCount = await getServicesCount();
        setCounts(prev => ({
          ...prev,
          doctors: doctorsCount,
          beds: bedsCount,
          opd: opdCount,
          ipd: ipdCount,
          medicines: medicinesCount,
          staff: staffCount,
          labs: labsCount,
          staffTransactions: staffTransactionsCount,
          services: servicesCount,
        }));
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    }
    fetchCounts();
  })


  // 🔐 Redirect if not logged in
  useEffect(() => {
    if (!auth) {
      navigate("/login");
    }
  }, [auth, navigate]);

  // 🧠 Dashboard cards with role access
  const cards = useMemo(
    () => [
      {
        title: "Doctors",
        value: counts.doctors,
        route: "/doctor",
        roles: ["superadmin"],
        color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
        textColor: "text-blue-700"
      },
      {
        title: "Staff",
        value: counts.staff,
        route: "/staff",
        roles: ["superadmin"],
        color: "bg-green-50 border-green-200 hover:bg-green-100",
        textColor: "text-green-700"
      },
      {
        title: "Lab Forms",
        value: counts.labs,
        route: "/lab",
        roles: ["superadmin", "subadmin", "lab"],
        color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
        textColor: "text-purple-700"
      },
      {
        title: "Services",
        value: counts.services,
        route: "/service",
        roles: ["superadmin"],
        color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
        textColor: "text-yellow-700"
      },
      {
        title: "Medicines",
        value: counts.medicines,
        route: "/medicine",
        roles: ["superadmin"],
        color: "bg-red-50 border-red-200 hover:bg-red-100",
        textColor: "text-red-700"
      },
      {
        title: "Beds",
        value: counts.beds,
        route: "/bed",
        roles: ["superadmin"],
        color: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
        textColor: "text-indigo-700"
      },
      {
        title: "Staff Transactions",
        value: counts.staffTransactions,
        route: "/staff-transactions",
        roles: ["superadmin"],
        color: "bg-pink-50 border-pink-200 hover:bg-pink-100",
        textColor: "text-pink-700"
      },
      {
        title: "Certificates",
        value: counts.certificates,
        route: "/certificates",
        roles: ["superadmin"],
        color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
        textColor: "text-orange-700"
      },
      {
        title: "OPD",
        value: counts.opd,
        route: "/opd",
        roles: ["superadmin", "accountant", "subadmin"],
        color: "bg-teal-50 border-teal-200 hover:bg-teal-100",
        textColor: "text-teal-700"
      },
      {
        title: "IPD",
        value: counts.ipd,
        route: "/ipd",
        roles: ["superadmin", "accountant", "subadmin"],
        color: "bg-cyan-50 border-cyan-200 hover:bg-cyan-100",
        textColor: "text-cyan-700"
      },
    ],
    [counts]
  );

  const filteredCards = cards.filter(card => card.roles.includes(role));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {auth?.name || "User"}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your hospital today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.route)}
            className={`cursor-pointer rounded-lg border-2 p-5 transition-all duration-200 hover:shadow-md ${card.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className={`text-3xl font-bold mt-2 ${card.textColor}`}>
                  {loading ? "..." : card.value}
                </p>
              </div>
              <div className={`text-4xl opacity-20 ${card.textColor}`}>
                →
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Click to view details
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No dashboard items available for your role.</p>
        </div>
      )}
    </div>
  );
}