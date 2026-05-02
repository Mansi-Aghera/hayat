// src/Router/Router.jsx
import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "../components/Layout";
import RequireAuth from "../components/RequireAuth";
import { getAuth } from "../services/auth.services";

/* ===================== AUTH ===================== */
import Login from "../Pages/Login";

/* ===================== DASHBOARD ===================== */
import Dashboard from "../Pages/Dashboard";

/* ===================== DOCTOR ===================== */
import Doctor from "../Pages/Doctor";
import DoctorView from "../Pages/DoctorView.jsx";

/* ===================== STAFF ===================== */
import Staff from "../Staff/staff.jsx";
import StaffForm from "../Staff/AddUpdateStaffForm.jsx";
import StaffView from "../Staff/StaffDetail.jsx";
import StaffSalaryDetail from "../Staff/StaffSalaryDetail.jsx";

/* ===================== STAFF TRANSACTIONS ===================== */
import StaffTransactions from "../StaffTransaction/staffTransaction.jsx";
import StaffTransactionDetail from "../StaffTransaction/staffTransactionDetail.jsx";

/* ===================== BED ===================== */
import Bed from "../Pages/Bed";

/* ===================== SERVICE / MEDICINE ===================== */
import Service from "../Pages/Service";
import Medicine from "../Pages/Medicine";

/* ===================== CERTIFICATES / REPORTS ===================== */
import Home from "../Pages/Home";
import Reports from "../Pages/Reports";
import Certificates from "../Pages/Certificates";

/* ===================== LAB ===================== */
import Lab from "../Pages/Lab";

/* ===================== OPD ===================== */
import Opd from "../Opd/Opd";
import AddOpd from "../Opd/AddOpd.jsx";
import OpdVisit from "../Opd/OpdVisit/OpdVisit.jsx";
import AddVisit from "../Opd/OpdVisit/AddVisit.jsx";
import EditVisit from "../Opd/OpdVisit/EditVisit.jsx";
import OpdPrescription from "../Opd/OpdPrescription.jsx";
import OpdUpdate from "../Opd/OpdUpdate";

/* ===================== IPD ===================== */
import Ipd from "../Ipd/Ipd.jsx";
import AddIpd from "../Ipd/IpdAdd.jsx";
import ViewIpd from "../Ipd/IpdView";
import IpdUpdate from "../Ipd/IpdUpdate";
import InvestigationChartTable from "../Ipd/IpdInvestigation.jsx";
import BPSugarChartTable from "../Ipd/IpdSugarChart.jsx";
import BedSwitchSection from "../Ipd/IpdSwitchBed.jsx";
import DischargePatient from "../Ipd/IpdDischarge.jsx";
import TreatmentChartTable from "../Ipd/IpdTreatmentChart.jsx";
import PaymentManagement from "../Ipd/IpdPayment/PaymentManagement";
import HospitalServiceBilling from "../Ipd/IpdBill/HospitalServiceBilling";
import DailyRound from "../Ipd/IpdDailyRound/DailyRound.jsx";

/* ===================== OTHER PAGES ===================== */
import Scalp from "../Pages/Scalp.jsx";
import Expenses from "../Pages/Expenses.jsx";
import Fc from "../Pages/Fiteness_certificate.jsx";
import FitnessView from "../Pages/FitnessView.jsx";
import DischargeCertificate from "../Pages/DischargeCertificate/DischargeForm.jsx";
import BirthCertificate from "../Pages/Birth_certificate.jsx";
import BirthView from "../Pages/BirthView.jsx";
import DeathManagement from "../Pages/Death_certificate.jsx";
import DeathView from "../Pages/DeathView.jsx";
import ExpenditureManagement from "../Pages/Expenditure.jsx";
import ExpenditureView from "../Pages/ExpenditureView.jsx";
import ReferManagement from "../Pages/Refer_cetificate.jsx";
import ReferView from "../Pages/ReferView.jsx";
import MedicalManagement from "../Pages/Medical_certificate.jsx";
import MedicalView from "../Pages/MedicalView.jsx";
import DischargeIpd from "../Pages/DischargeCertificate/DischargeIpd.jsx"
import DischargeIpdView from "../Pages/DischargeCertificate/DischargeIpdView.jsx";
/* ===================== SETTINGS ===================== */
import Settings from "../Pages/Setting";

/* ===================== ROLE GUARD ===================== */
const RoleRoute = ({ allow, children }) => {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" replace />;
  
  const role = auth?.type || localStorage.getItem("role");
  
  if (!allow.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

/* ===================== ROLE-BASED ROUTE CONFIGURATION ===================== */
const roleAccess = {
  // Lab role - only lab and profile (dashboard)
  lab: {
    allowedRoutes: [
      'dashboard',
      'lab',
      'profile'
    ],
    exactRoutes: ['/lab'] // Add any specific routes that should be accessible
  },
  
  // Accountant role - home, opd, ipd, settings
  accountant: {
    allowedRoutes: [
      'dashboard',
      'opd',
      'ipd',
      // 'settings'
    ],
    exactRoutes: [
      '/opd',
      '/add-opd',
      '/opd-visit/:id',
      '/add-opd-visit/:id',
      '/edit-opd-visit/:id',
      '/opd-update/:id',
      '/opd-prescription/:id',
      '/ipd',
      '/add-ipd',
      '/view-ipd/:id',
      '/ipd-update/:id',
      '/ipd-payment/:id',
      '/ipd-bill/:id',
      '/ipd-daily-round/:id',
      '/ipd-discharge-certificate/:ipdId'
    ]
  },
  
  // Subadmin role - home, opd, ipd, lab, settings
  subadmin: {
    allowedRoutes: [
      'dashboard',
      'opd',
      'ipd',
      'lab',
      // 'settings'
    ],
    exactRoutes: [
      '/opd',
      '/add-opd',
      '/opd-visit/:id',
      '/add-opd-visit/:id',
      '/edit-opd-visit/:id',
      '/opd-update/:id',
      '/opd-prescription/:id',
      '/ipd',
      '/add-ipd',
      '/view-ipd/:id',
      '/ipd-update/:id',
      '/investigation/:id',
      '/ipd-bp-chart/:id',
      '/ipd-bed-switch/:id',
      '/ipd-discharge/:id',
      '/ipd-treatment-chart/:id',
      '/ipd-payment/:id',
      '/ipd-bill/:id',
      '/ipd-daily-round/:id',
      '/ipd-discharge-certificate/:ipdId',
      '/lab'
    ]
  },
  
  // Superadmin - all routes
  superadmin: {
    allowedRoutes: 'all' // Special flag for superadmin
  }
};

// Helper component to check route access based on role
const ProtectedRoute = ({ children, path }) => {
  const auth = getAuth();
  if (!auth) return <Navigate to="/login" replace />;
  
  const role = auth?.type || localStorage.getItem("role");
  
  // Superadmin has access to everything
  if (role === 'superadmin') return children;
  
  // Check if role exists in roleAccess
  if (!roleAccess[role]) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If role has allowedRoutes = 'all', grant access
  if (roleAccess[role].allowedRoutes === 'all') return children;
  
  // Check if the current path is allowed
  const isAllowed = roleAccess[role].exactRoutes?.some(route => {
    // Convert route pattern to regex (simple implementation)
    const pattern = route.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });
  
  if (isAllowed) return children;
  
  // Redirect to dashboard if not allowed
  return <Navigate to="/dashboard" replace />;
};

/* ===================== ROUTER ===================== */
const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    path: "/",
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      // Dashboard - accessible to all authenticated users
      { index: true, element: <Dashboard /> },
      { path: "dashboard", element: <Dashboard /> },

      /* SUPERADMIN ONLY ROUTES */
      {
        path: "doctor",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <Doctor />
          </RoleRoute>
        ),
      },
      {
        path: "doctor-view/:id",
        element: (
          <RoleRoute allow={["superadmin","subadmin","accountant"]}>
            <DoctorView />
          </RoleRoute>
        )
      },
      {
        path: "staff",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <Staff />
          </RoleRoute>
        ),
      },
      {
        path: "add-staff",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <StaffForm />
          </RoleRoute>
        ),
      },
      {
        path: "edit-staff/:staffId",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <StaffForm />
          </RoleRoute>
        ),
      },
      {
        path: "view-staff/:staffId",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <StaffView />
          </RoleRoute>
        ),
      },
      {
        path: "staff-salary-detail/:staffId",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <StaffSalaryDetail />
          </RoleRoute>
        ),
      },
      {
        path: "staff-transactions",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <StaffTransactions />
          </RoleRoute>
        ),
      },
      {
        path: "staff-transactions-detail/:staffId",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <StaffTransactionDetail />
          </RoleRoute>
        ),
      },
      {
        path: "bed",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <Bed />
          </RoleRoute>
        ),
      },
      {
        path: "service",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <Service />
          </RoleRoute>
        ),
      },
      {
        path: "medicine",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <Medicine />
          </RoleRoute>
        ),
      },
      {
        path: "discharge-ipd",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <DischargeIpd />
          </RoleRoute>
        ),
      },
      {
        path: "/discharge-ipd/view/:id",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <DischargeIpdView />
          </RoleRoute>
        ),
      },
      {
        path: "home",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <Home />
          </RoleRoute>
        ),
      },
      {
        path: "expenses",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <Expenses />
          </RoleRoute>
        ),
      },
      {
        path: "certificates",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <Certificates />
          </RoleRoute>
        ),
      },
      {
        path: "reports",
        element: (
          <RoleRoute allow={["superadmin"]}>
            <Reports />
          </RoleRoute>
        ),
      },
      {
        path: "scalp",
        element: (
          <RoleRoute allow={["superadmin","subadmin","accountant"]}>
            <Scalp />
          </RoleRoute>
        ),
      },
      {
        path: "fitness-certificate",
        element: (
          <RoleRoute allow={["superadmin","subadmin","accountant"]}>
            <Fc />
          </RoleRoute>
        ),
      },
      {
        path: "/fitness-view/:id",
        element: (
          <RoleRoute allow={["superadmin","subadmin","accountant"]}>
            <FitnessView />
          </RoleRoute>
        ),
      },
      {
        path: "discharge/new",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <DischargeCertificate />
          </RoleRoute>
        ),
      },
      {
        path: "discharge/ipd/:ipdId",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <DischargeCertificate />
          </RoleRoute>
        ),
      },
      {
        path: "discharge/edit/:dischargeId",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <DischargeCertificate />
          </RoleRoute>
        ),
      },
      {
        path: "birth-certificate",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <BirthCertificate />
          </RoleRoute>
        ),
      },
      {
        path: "birth-view/:id",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <BirthView />
          </RoleRoute>
        ),
      },
      {
        path: "death-certificate",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <DeathManagement />
          </RoleRoute>
        ),
      },
      {
        path: "death-view/:id",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <DeathView />
          </RoleRoute>
        ),
      },
      {
        path: "expenditure",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <ExpenditureManagement />
          </RoleRoute>
        ),
      },
      {
        path: "expenditure-view/:id",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <ExpenditureView />
          </RoleRoute>
        ),
      },
      {
        path: "refer",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <ReferManagement />
          </RoleRoute>
        ),
      },
      {
        path: "refer-view/:id",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <ReferView />
          </RoleRoute>
        ),
      },
      {
        path: "medical-certificate",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <MedicalManagement />
          </RoleRoute>
        ),
      },
      {
        path: "medical-view/:id",
        element: (
          <RoleRoute allow={["superadmin","accountant", "subadmin"]}>
            <MedicalView />
          </RoleRoute>
        ),
      },

      /* LAB ROUTES - Accessible to lab, subadmin, superadmin */
      {
        path: "lab",
        element: (
          <RoleRoute allow={["lab", "subadmin", "superadmin"]}>
            <Lab />
          </RoleRoute>
        ),
      },

      /* OPD ROUTES - Accessible to accountant, subadmin, superadmin */
      {
        path: "opd",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <Opd />
          </RoleRoute>
        ),
      },
      {
        path: "add-opd",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <AddOpd />
          </RoleRoute>
        ),
      },
      {
        path: "opd-visit/:id",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <OpdVisit />
          </RoleRoute>
        ),
      },
      {
        path: "add-opd-visit/:id",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <AddVisit />
          </RoleRoute>
        ),
      },
      {
        path: "edit-opd-visit/:id",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <EditVisit />
          </RoleRoute>
        ),
      },
      {
        path: "opd-update/:id",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <OpdUpdate />
          </RoleRoute>
        ),
      },
      {
        path: "opd-prescription/:id",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <OpdPrescription />
          </RoleRoute>
        ),
      },

      /* IPD ROUTES - Accessible to accountant, subadmin, superadmin */
      {
        path: "ipd",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <Ipd />
          </RoleRoute>
        ),
      },
      {
        path: "add-ipd",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <AddIpd />
          </RoleRoute>
        ),
      },
      {
        path: "view-ipd/:id",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <ViewIpd />
          </RoleRoute>
        ),
      },
      {
        path: "ipd-update/:id",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <IpdUpdate />
          </RoleRoute>
        ),
      },
      {
        path: "investigation/:id",
        element: (
          <RoleRoute allow={["subadmin", "superadmin","accountant"]}>
            <InvestigationChartTable />
          </RoleRoute>
        ),
      },
      {
        path: "ipd-bp-chart/:id",
        element: (
          <RoleRoute allow={["subadmin", "superadmin","accountant"]}>
            <BPSugarChartTable />
          </RoleRoute>
        ),
      },
      {
        path: "ipd-bed-switch/:id",
        element: (
          <RoleRoute allow={["subadmin", "superadmin","accountant"]}>
            <BedSwitchSection />
          </RoleRoute>
        ),
      },
      {
        path: "ipd-discharge/:id",
        element: (
          <RoleRoute allow={["subadmin", "superadmin","accountant"]}>
            <DischargePatient />
          </RoleRoute>
        ),
      },
      {
        path: "ipd-treatment-chart/:id",
        element: (
          <RoleRoute allow={["subadmin", "superadmin","accountant"]}>
            <TreatmentChartTable />
          </RoleRoute>
        ),
      },
      {
        path: "ipd-payment/:id",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <PaymentManagement />
          </RoleRoute>
        ),
      },
      {
        path: "ipd-bill/:id",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <HospitalServiceBilling />
          </RoleRoute>
        ),
      },
      {
        path: "ipd-daily-round/:id",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin"]}>
            <DailyRound />
          </RoleRoute>
        ),
      },

      /* SETTINGS - Accessible to accountant, subadmin, superadmin */
      {
        path: "settings",
        element: (
          <RoleRoute allow={["accountant", "subadmin", "superadmin","lab"]}>
            <Settings />
          </RoleRoute>
        ),
      },

      /* CATCH ALL */
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}