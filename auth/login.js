/* =============================================
   IMPORTS - FIREBASE SDK (v9 Modular)
   ============================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* =============================================
   CONFIGURACIÓN FIREBASE
   ============================================= */
const firebaseConfig = {
  apiKey: "AIzaSyCszpw8-ZkXfBtlsCRt5c9KYVt53wQmhwg",
  authDomain: "plataformafiee.firebaseapp.com",
  projectId: "plataformafiee",
  storageBucket: "plataformafiee.firebasestorage.app",
  messagingSenderId: "154061761265",
  appId: "1:154061761265:web:b4ccc8601a87e53c845750",
  measurementId: "G-DNVVFQPQ2Q"
};

/* =============================================
   INICIALIZAR FIREBASE
   ============================================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =============================================
   DEBUG
   ============================================= */
const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log("🔐 [Login]", ...args);
}

function error(...args) {
  if (DEBUG) console.error("❌ [Login]", ...args);
}

/* =============================================
   REFERENCIAS DOM
   ============================================= */
const screenLogin = document.getElementById("screen-login");
const screenRegister = document.getElementById("screen-register");

const loginForm = {
  email: document.getElementById("l-email"),
  pass: document.getElementById("l-pass"),
  btn: document.getElementById("login-btn"),
  err: document.getElementById("login-err"),
  errMsg: document.getElementById("login-err-msg"),
  emailErr: document.getElementById("l-email-err"),
  passErr: document.getElementById("l-pass-err")
};

const togglePass = document.getElementById("toggle-l-pass");
const linkToRegister = document.getElementById("link-to-register");
const linkToLogin = document.getElementById("link-to-login");

/* =============================================
   ESTADO GLOBAL
   ============================================= */
let isLoading = false;
let appInitialized = false;
let redirecting = false;

/* =============================================
   UI
   ============================================= */
function showScreen(screen) {
  log(`Cambiando pantalla: ${screen}`);

  screenLogin?.classList.toggle("active", screen === "login");
  screenRegister?.classList.toggle("active", screen === "register");

  hideError(loginForm.err);
  clearFieldErrors();
}

function setupPasswordToggle(input, toggleBtn) {
  toggleBtn?.addEventListener("click", () => {
    const isPass = input.type === "password";

    input.type = isPass ? "text" : "password";

    toggleBtn.classList.toggle("fa-eye", !isPass);
    toggleBtn.classList.toggle("fa-eye-slash", isPass);
  });
}

function showError(element, message) {
  if (!element) return;

  element.style.display = "flex";

  const span = element.querySelector("span");

  if (span) {
    span.textContent = message;
  } else {
    element.textContent = message;
  }
}

function hideError(element) {
  if (element) {
    element.style.display = "none";
  }
}

function clearFieldErrors() {
  document.querySelectorAll(".field-err").forEach(el => {
    el.style.display = "none";
    el.closest(".field")?.classList.remove("error");
  });
}

function showFieldError(fieldId, message) {
  const errEl = document.getElementById(fieldId);

  if (!errEl) return;

  errEl.textContent = message;
  errEl.style.display = "block";

  errEl.closest(".field")?.classList.add("error");
}

function setLoadingState(loading) {
  if (!loginForm.btn) return;

  if (loading) {
    loginForm.btn.disabled = true;
    loginForm.btn.classList.add("loading");

    const span = loginForm.btn.querySelector("span");

    if (span) {
      loginForm.btn.dataset.originalText = span.textContent;
      span.textContent = "Verificando...";
    }

  } else {

    loginForm.btn.disabled = false;
    loginForm.btn.classList.remove("loading");

    const span = loginForm.btn.querySelector("span");

    if (span && loginForm.btn.dataset.originalText) {
      span.textContent = loginForm.btn.dataset.originalText;
    }
  }
}

/* =============================================
   DETECTAR ROL
   ============================================= */
async function detectUserRole(uid) {

  log(`🔍 Detectando rol para UID: ${uid}`);

  const collections = [
    { name: "estudiantes", role: "estudiante" },
    { name: "empresas", role: "empresa" },
    { name: "admins", role: "admin" }
  ];

  for (const { name, role } of collections) {

    try {

      log(`→ Consultando colección: ${name}`);

      const docRef = doc(db, name, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {

        const data = docSnap.data();

        log(`✅ Encontrado en ${name} - Rol: ${data.rol || role}`);

        return data.rol || role;

      } else {

        log(`❌ No existe documento en ${name}`);
      }

    } catch (err) {

      error(`⚠️ Error consultando ${name}:`, err);
    }
  }

  return null;
}

/* =============================================
   REDIRECCIÓN
   ============================================= */
function redirectToDashboard(role) {

  if (redirecting) return;

  redirecting = true;

  log(`🚀 Redirigiendo con rol: ${role}`);

  sessionStorage.setItem("userRole", role);
  sessionStorage.setItem("authTimestamp", Date.now().toString());

  window.location.href = "../FIEEPruebabeta/menu/index.html";
}

/* =============================================
   VALIDACIÓN LOGIN
   ============================================= */
function validateLogin() {

  let isValid = true;

  clearFieldErrors();

  const email = loginForm.email.value.trim();
  const pass = loginForm.pass.value;

  if (!email) {

    showFieldError("l-email-err", "El correo es requerido");
    isValid = false;

  } else if (!email.includes("@")) {

    showFieldError("l-email-err", "Correo inválido");
    isValid = false;
  }

  if (!pass) {

    showFieldError("l-pass-err", "La contraseña es requerida");
    isValid = false;

  } else if (pass.length < 6) {

    showFieldError("l-pass-err", "Contraseña muy corta");
    isValid = false;
  }

  return isValid;
}

/* =============================================
   ERRORES LOGIN
   ============================================= */
function handleLoginError(err) {

  const errors = {
    "auth/invalid-email": "Correo inválido",
    "auth/user-not-found": "Usuario no encontrado",
    "auth/wrong-password": "Contraseña incorrecta",
    "auth/too-many-requests": "Demasiados intentos",
    "auth/network-request-failed": "Error de conexión",
    "auth/user-disabled": "Cuenta deshabilitada"
  };

  const message =
    errors[err.code] ||
    err.message ||
    "Error al iniciar sesión";

  showError(loginForm.err, `❌ ${message}`);
}

/* =============================================
   LOGIN
   ============================================= */
async function handleLogin() {

  if (isLoading) return;

  if (!validateLogin()) return;

  isLoading = true;

  setLoadingState(true);

  hideError(loginForm.err);

  const email = loginForm.email.value.trim();
  const password = loginForm.pass.value;

  try {

    log(`🔐 Iniciando login: ${email}`);

    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = credential.user;

    log(`✅ Auth correcto UID: ${user.uid}`);

    const role = await detectUserRole(user.uid);

    if (!role) {
      throw new Error(
        "No se encontró tu perfil en el sistema"
      );
    }

    redirectToDashboard(role);

  } catch (err) {

    error("❌ Error login:", err);

    handleLoginError(err);

  } finally {

    isLoading = false;

    setLoadingState(false);
  }
}

/* =============================================
   EVENTOS
   ============================================= */
function setupEventListeners() {

  log("🔧 Configurando eventos...");

  setupPasswordToggle(loginForm.pass, togglePass);

  linkToRegister?.addEventListener("click", e => {
    e.preventDefault();
    showScreen("register");
  });

  linkToLogin?.addEventListener("click", e => {
    e.preventDefault();
    showScreen("login");
  });

  loginForm.btn?.addEventListener("click", e => {
    e.preventDefault();
    handleLogin();
  });

  loginForm.email?.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      loginForm.pass.focus();
    }
  });

  loginForm.pass?.addEventListener("keypress", e => {
    if (e.key === "Enter") {
      handleLogin();
    }
  });

  log("✅ Eventos configurados");
}

/* =============================================
   UTILIDADES DEBUG
   ============================================= */
window.forceLogout = async function () {

  try {

    await signOut(auth);

    sessionStorage.clear();
    localStorage.clear();

    alert("✅ Sesión cerrada");

    window.location.reload();

  } catch (err) {

    console.error(err);
  }
};

window.checkAuthState = function () {

  console.log("👤 Usuario actual:", auth.currentUser);

  return auth.currentUser;
};

/* =============================================
   INIT APP
   ============================================= */
function initializeLoginApp() {

  if (appInitialized) return;

  appInitialized = true;

  log("🚀 Inicializando login app...");

  showScreen("login");

  setupEventListeners();

  loginForm.email?.focus();

  const user = auth.currentUser;

  const urlParams = new URLSearchParams(window.location.search);

  const forceLogin =
    urlParams.get("forceLogin") === "true";

  const isLocalTesting =
    DEBUG && location.hostname === "localhost";

  if (user && (forceLogin || isLocalTesting)) {

    log("🧪 Modo testing activo");

    const info = document.createElement("p");

    info.style.cssText = `
      background:#eaf4ff;
      color:#0057b8;
      padding:10px;
      border-radius:8px;
      margin-bottom:1rem;
      font-size:13px;
    `;

    info.innerHTML = `
      🧪 Sesión activa detectada
      <button
        onclick="window.forceLogout()"
        style="
          margin-left:10px;
          padding:5px 10px;
          border:none;
          border-radius:5px;
          background:#0057b8;
          color:white;
          cursor:pointer;
        "
      >
        Cerrar sesión
      </button>
    `;

    loginForm.err.parentNode?.insertBefore(
      info,
      loginForm.err
    );

  } else if (!user) {

    log("✅ Sin sesión activa");
  }

  log("✨ App inicializada");
}

/* =============================================
   AUTH STATE CHANGED
   ============================================= */
onAuthStateChanged(auth, async (user) => {

  if (!appInitialized) return;

  if (redirecting) return;

  const urlParams = new URLSearchParams(window.location.search);

  const forceLogin =
    urlParams.get("forceLogin") === "true";

  if (
    user &&
    !forceLogin &&
    window.location.pathname.includes("login.html")
  ) {

    try {

      log("🔄 Usuario detectado automáticamente");

      const role = await detectUserRole(user.uid);

      if (role) {

        redirectToDashboard(role);

      } else {

        showError(
          loginForm.err,
          "⚠️ Usuario sin perfil válido"
        );
      }

    } catch (err) {

      error("❌ Error detectando rol:", err);
    }
  }
});

/* =============================================
   START
   ============================================= */
if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initializeLoginApp
  );

} else {

  initializeLoginApp();
}
