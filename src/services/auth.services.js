import api from "./api.js";

const AUTH_STORAGE_KEY = "hayatplus_auth";

/* ======================
   AUTH HELPERS
====================== */
export const getAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setAuth = (auth) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  localStorage.setItem("role", auth?.type || ""); // Store role separately for easy access
};

export const clearAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("token");
};

export const isAuthenticated = () => {
  return Boolean(getAuth());
};

/* ======================
   LOGIN FUNCTION
====================== */
export const loginAdmin = async ({ identifier, password }) => {
  const response = await api.get("/admin_login/");

  const users =
    response.data?.data ||
    response.data?.results ||
    [];

  const rawIdentifier = String(identifier || "").trim().toLowerCase();
  if (!rawIdentifier) {
    throw new Error("Email or mobile is required");
  }

  const user = users.find((u) => {
    const email = String(u?.email || "").toLowerCase();
    const mobile = String(u?.mobile_no || "").toLowerCase();
    return email === rawIdentifier || mobile === rawIdentifier;
  });

  if (!user) throw new Error("User not found");
  if (user.password !== password) throw new Error("Invalid password");

  const auth = {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile_no: user.mobile_no,
    type: user.type,
  };

  const fakeToken = `auth_${user.id}_${Date.now()}`;

  // ✅ STORE AUTH PROPERLY
  setAuth(auth);
  localStorage.setItem("token", fakeToken);

  return {
    user: auth,
    token: fakeToken,
  };
};


export const getAdminProfile = async () => {
  try {
    const response = await api.get("/admin_register/");
    return response.data;
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    throw error;
  }
};

export const UpdateAdminRegister = async (id,payload ) => {
  console.log("Updating admin profile with ID:", id);
  try {
    const response = await api.patch(`/admin_register/${id}/`, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating admin profile:", error);
    throw error;
  }
};