/* =============================================
   IMPORTS - FIREBASE SDK (v9 Modular)
   ============================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

/* =============================================
   MAPEO: CARRERAS → HABILIDADES
   ============================================= */
const carrerasSkills = {
  "Ing. Informatica": ["Python", "Java", "JavaScript", "React", "Node.js", "SQL", "MongoDB", "Linux", "Redes", "Ciberseguridad"],
  "Ing. Electrica": ["PLC", "Circuitos eléctricos", "MATLAB", "Electrónica de potencia", "AutoCAD"],
  "Ing. Mecatronica": ["Arduino", "PLC", "Robótica", "Automatización", "Sensores", "SolidWorks"],
  "Ing. Electronica y comunicaciones": ["Microcontroladores", "IoT", "Redes", "Telecomunicaciones", "Proteus"],
  "Ing. Industrial": ["Excel avanzado", "SAP", "Lean Manufacturing", "Six Sigma", "Control de calidad"],
  "Ing. Ingenieria Metalurgica y Ciencias de los Materiales": ["Metalurgia", "Análisis de materiales", "Procesos térmicos"],
  "Ing. Ingenieria Naval": ["Diseño naval", "SolidWorks", "Mecánica", "AutoCAD"],
  "Ing. Quimica": ["Laboratorio químico", "Procesos químicos", "Análisis químico"],
  "Ing. Civil": ["AutoCAD", "Civil 3D", "Topografía", "Cálculo estructural"],
  "Ing. Arquitectura": ["Revit", "SketchUp", "Renderizado", "Diseño arquitectónico"],
  "Ing. Topografia Geodesica": ["Topografía", "GPS", "Cartografía", "Geodesia"]
};

/* =============================================
   RENDERIZAR HABILIDADES POR CARRERA
   ============================================= */
function renderSkillsByCareer(carrerasSeleccionadas) {
  const container = document.getElementById("habilidadesPorCarrera");
  if (!container) return;
  
  container.innerHTML = "";
  
  carrerasSeleccionadas.forEach(carrera => {
    const wrapper = document.createElement("div");
    wrapper.className = "career-skills-block";
    
    const title = document.createElement("h4");
    title.className = "career-title";
    title.textContent = carrera;
    
    const chipsContainer = document.createElement("div");
    chipsContainer.className = "chip-group";
    
    const skills = carrerasSkills[carrera] || [];
    skills.forEach(skill => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = skill;
      btn.dataset.carrera = carrera;
      btn.setAttribute("role", "switch");
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => {
        btn.classList.toggle("active");
        btn.setAttribute("aria-pressed", btn.classList.contains("active"));
        updateProgress();
      });
      chipsContainer.appendChild(btn);
    });
    
    wrapper.appendChild(title);
    wrapper.appendChild(chipsContainer);
    container.appendChild(wrapper);
  });
}

/* =============================================
   HELPERS — Leer chips seleccionados
   ============================================= */
function getChips(groupId) {
  return [...document.querySelectorAll(`#${groupId} .chip.active`)]
    .map(c => c.textContent.trim());
}

function getSkillsByCareer() {
  const result = {};
  document.querySelectorAll(".career-skills-block").forEach(block => {
    const carrera = block.querySelector(".career-title")?.textContent;
    if (!carrera) return;
    const skills = [...block.querySelectorAll(".chip.active")].map(chip => chip.textContent.trim());
    result[carrera] = skills;
  });
  return result;
}

function getExclusive(groupId) {
  const active = document.querySelector(`#${groupId} .chip.active`);
  return active ? active.textContent.trim() : "";
}

/* =============================================
   EVENTOS PARA CHIPS
   ============================================= */
document.querySelectorAll(".chip-group").forEach(group => {
  const isExclusive = group.classList.contains("exclusive");
  
  group.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      if (isExclusive) {
        group.querySelectorAll(".chip").forEach(c => {
          c.classList.remove("active");
          c.setAttribute("aria-pressed", "false");
        });
        chip.classList.add("active");
        chip.setAttribute("aria-pressed", "true");
      } else {
        chip.classList.toggle("active");
        chip.setAttribute("aria-pressed", chip.classList.contains("active"));
      }
      
      if (group.id === "carreras") {
        const carrerasSeleccionadas = getChips("carreras");
        renderSkillsByCareer(carrerasSeleccionadas);
      }
      
      updateProgress();
    });
  });
});

/* =============================================
   RANGE SLIDER — Horas por semana
   ============================================= */
const hrsRange = document.getElementById("hrsRange");
const hrsLabel = document.getElementById("hrsLabel");
const horasInput = document.getElementById("horasSemanales");

if (hrsRange && hrsLabel && horasInput) {
  hrsRange.addEventListener("input", () => {
    hrsLabel.textContent = `${hrsRange.value} hrs`;
    horasInput.value = hrsRange.value;
    updateProgress();
  });
}

/* =============================================
   FILE DROPS — Configuración reutilizable
   ============================================= */
function setupFileDrop(inputId, dropId, textId, isOptional = true) {
  const input = document.getElementById(inputId);
  const drop = document.getElementById(dropId);
  const textEl = document.getElementById(textId);
  
  if (!input || !drop || !textEl) return;
  
  const originalText = textEl.textContent;
  if (isOptional && !originalText.includes("(opcional)")) {
    textEl.textContent = originalText.replace(")", " (opcional)");
  }
  
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
        showMsg(`⚠️ ${inputId === "logo" ? "El logo" : "El documento"} debe ser PDF o imagen`, "warning");
        input.value = "";
        textEl.textContent = originalText;
        drop.classList.remove("has-file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showMsg("⚠️ El archivo no debe superar los 5MB", "warning");
        input.value = "";
        textEl.textContent = originalText;
        drop.classList.remove("has-file");
        return;
      }
      textEl.textContent = file.name.length > 30 ? file.name.substring(0, 27) + "…" : file.name;
      drop.classList.add("has-file");
    } else {
      textEl.textContent = originalText;
      drop.classList.remove("has-file");
    }
    updateProgress();
  });
  
  ["dragover", "dragenter"].forEach(evt =>
    drop.addEventListener(evt, e => {
      e.preventDefault();
      drop.style.borderColor = "var(--blue-500, #3b82f6)";
    })
  );
  ["dragleave", "drop"].forEach(evt =>
    drop.addEventListener(evt, e => {
      e.preventDefault();
      drop.style.borderColor = "";
    })
  );
  
  drop.addEventListener("click", (e) => {
    if (e.target === drop || e.target.classList.contains("file-icon") || e.target.classList.contains("file-text")) {
      input.click();
    }
  });
}

setupFileDrop("logo", "logoDrop", "logoText", true);
setupFileDrop("convenio", "convenioDrop", "convenioText", true);
setupFileDrop("constancia", "constanciaDrop", "constanciaText", true);
// ✅ NUEVO: Carta de aceptación (para dashboard)
setupFileDrop("carta", "cartaDrop", "cartaText", true);

/* =============================================
   VALIDACIONES DE INPUTS
   ============================================= */
// RFC — Forzar mayúsculas y formato
const rfcInput = document.getElementById("rfc");
if (rfcInput) {
  rfcInput.addEventListener("input", function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 13);
  });
}

// Teléfono — Formato mexicano
const contactoTelInput = document.getElementById("contactoTel");
if (contactoTelInput) {
  contactoTelInput.addEventListener("input", function () {
    let val = this.value.replace(/\D/g, '').slice(0, 10);
    if (val.length > 3) val = val.slice(0,3) + ' ' + val.slice(3);
    if (val.length > 7) val = val.slice(0,7) + ' ' + val.slice(7);
    this.value = val;
  });
}

// Sanitizar descripciones (prevención XSS)
function sanitizeText(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* =============================================
   BARRA DE PROGRESO
   ============================================= */
const progressFill = document.getElementById("progressFill");
const requiredFields = ["email", "password", "nombreEmpresa", "sector", "ciudad", "contactoNombre", "vacanteTitulo"];
const exclusiveGroups = ["tipoPrograma", "modalidad", "turno"];

function updateProgress() {
  let filled = 0;
  const total = requiredFields.length + exclusiveGroups.length;
  
  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === "file") {
      if (el.files && el.files.length > 0) filled++;
    } else if (el.value?.trim() !== "") {
      filled++;
    }
  });
  
  exclusiveGroups.forEach(id => {
    if (document.querySelector(`#${id} .chip.active`)) filled++;
  });
  
  if (progressFill) {
    progressFill.style.width = `${Math.min(100, Math.round((filled / total) * 100))}%`;
  }
}

document.querySelectorAll("input, select, textarea").forEach(el => {
  el.addEventListener("input", updateProgress);
  el.addEventListener("change", updateProgress);
});

/* =============================================
   UTILIDAD — Mostrar mensaje
   ============================================= */
function showMsg(text, type) {
  const mensaje = document.getElementById("mensaje");
  if (!mensaje) return;
  mensaje.textContent = text;
  mensaje.className = `form-msg ${type}`;
  mensaje.scrollIntoView({ behavior: "smooth", block: "nearest" });
  if (type === "success") {
    setTimeout(() => {
      mensaje.textContent = "";
      mensaje.className = "form-msg";
    }, 8000);
  }
}

/* =============================================
   SUBMIT — Registro de empresa con Firebase
   ============================================= */
const form = document.getElementById("registerForm");
const mensaje = document.getElementById("mensaje");
const submitBtn = document.getElementById("submitBtn");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (mensaje) {
      mensaje.textContent = "";
      mensaje.className = "form-msg";
    }
    
    // Estado de carga: deshabilitar formulario
    const formElements = form.querySelectorAll("input, select, textarea, button");
    formElements.forEach(el => el.disabled = true);
    if (submitBtn) {
      submitBtn.classList.add("loading");
      const btnText = submitBtn.querySelector(".btn-text");
      if (btnText) btnText.textContent = "Registrando…";
    }
    
    try {
      // ===== 1. VALIDACIONES PREVIAS =====
      const email = document.getElementById("email")?.value.trim().toLowerCase();
      const password = document.getElementById("password")?.value;
      const nombreEmpresa = document.getElementById("nombreEmpresa")?.value.trim();
      const sector = document.getElementById("sector")?.value;
      const ciudad = document.getElementById("ciudad")?.value.trim();
      const contactoNombre = document.getElementById("contactoNombre")?.value.trim();
      const vacanteTitulo = document.getElementById("vacanteTitulo")?.value.trim();
      
      // Archivos (todos opcionales)
      const logoFile = document.getElementById("logo")?.files?.[0];
      const convenioFile = document.getElementById("convenio")?.files?.[0];
      const constanciaFile = document.getElementById("constancia")?.files?.[0];
      const cartaFile = document.getElementById("carta")?.files?.[0]; // ✅ Nuevo
      
      // Validaciones OBLIGATORIAS
      if (!email || !email.includes("@")) {
        throw new Error("✉️ Ingresa un correo electrónico válido");
      }
      if (!password || password.length < 8) {
        throw new Error("🔐 La contraseña debe tener al menos 8 caracteres");
      }
      if (!nombreEmpresa || nombreEmpresa.length < 3) {
        throw new Error("🏢 Ingresa el nombre de la empresa");
      }
      if (!sector) {
        throw new Error("🏭 Selecciona el sector de la empresa");
      }
      if (!ciudad) {
        throw new Error("📍 Ingresa la ciudad");
      }
      if (!contactoNombre) {
        throw new Error("👤 Ingresa el nombre del contacto");
      }
      if (!vacanteTitulo) {
        throw new Error("💼 Ingresa el título de la vacante");
      }
      
      // Validaciones CONDICIONALES de archivos
      const archivos = [
        { file: logoFile, nombre: "Logo", permitirImagen: true },
        { file: convenioFile, nombre: "Convenio", permitirImagen: false },
        { file: constanciaFile, nombre: "Constancia", permitirImagen: false },
        { file: cartaFile, nombre: "Carta de aceptación", permitirImagen: false }
      ];
      
      for (const { file, nombre, permitirImagen } of archivos) {
        if (file) {
          const tipoValido = permitirImagen 
            ? (file.type === "application/pdf" || file.type.startsWith("image/"))
            : (file.type === "application/pdf");
          if (!tipoValido) {
            throw new Error(`📄 ${nombre} debe ser ${permitirImagen ? "PDF o imagen" : "PDF"}`);
          }
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`📦 ${nombre} no debe superar los 5MB`);
          }
        }
      }
      
      // ===== 2. CREAR USUARIO EN FIREBASE AUTH =====
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // ===== 3. FUNCIÓN AUXILIAR PARA SUBIR ARCHIVOS =====
      async function subirArchivo(file, path) {
        if (!file) return null;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
      }
      
      // ===== 4. SUBIR ARCHIVOS A STORAGE =====
      let logoURL = null, convenioURL = null, constanciaURL = null, cartaURL = null;
      
      if (logoFile) {
        const ext = logoFile.name.split(".").pop();
        logoURL = await subirArchivo(logoFile, `empresas/${uid}/logo.${ext}`);
      }
      if (convenioFile) {
        convenioURL = await subirArchivo(convenioFile, `empresas/${uid}/convenio.pdf`);
      }
      if (constanciaFile) {
        constanciaURL = await subirArchivo(constanciaFile, `empresas/${uid}/constancia.pdf`);
      }
      if (cartaFile) { // ✅ Nuevo
        cartaURL = await subirArchivo(cartaFile, `empresas/${uid}/carta.pdf`);
      }
      
      // ===== 5. PREPARAR DATOS PARA FIRESTORE (ALINEADOS CON DASHBOARD) =====
      const empresaData = {
        // Metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        estado: "pendiente",
        rol: "empresa",
        
        // Cuenta
        email,
        
        // Datos de la empresa
        nombreEmpresa,
        rfc: document.getElementById("rfc")?.value.trim() || "",
        sector,
        tamaño: document.getElementById("tamaño")?.value || "",
        fundacion: document.getElementById("fundacion")?.value || "",
        ciudad,
        sitioWeb: document.getElementById("sitioWeb")?.value.trim() || "",
        descripcionEmpresa: sanitizeText(document.getElementById("descripcionEmpresa")?.value.trim()) || "",
        logo: logoURL,
        tieneLogo: !!logoFile,
        
        // Contacto (✅ ALINEADO CON DASHBOARD: "telefono" en vez de "contactoTel")
        contactoNombre,
        contactoPuesto: document.getElementById("contactoPuesto")?.value.trim() || "",
        telefono: document.getElementById("contactoTel")?.value.trim().replace(/\s/g, '') || "", // ✅ Campo que espera el dashboard
        contactoEmail: document.getElementById("contactoEmail")?.value.trim() || "",
        
        // Perfil de la vacante
        tipoPrograma: getExclusive("tipoPrograma"),
        vacanteTitulo,
        vacanteArea: document.getElementById("vacanteArea")?.value.trim() || "",
        carrerasAceptadas: getChips("carreras"),
        semestreMin: document.getElementById("semestreMin")?.value || "",
        promedioMin: document.getElementById("promedioMin")?.value ? 
                     parseFloat(document.getElementById("promedioMin").value) : null,
        habilidadesReq: getSkillsByCareer(),
        otrasHabilidades: document.getElementById("otrasHabilidades")?.value.trim() || "",
        inglesReq: getExclusive("inglesReq"),
        expReq: getExclusive("expReq"),
        descripcionVacante: sanitizeText(document.getElementById("descripcionVacante")?.value.trim()) || "",
        
        // Condiciones
        modalidad: getExclusive("modalidad"),
        turno: getExclusive("turno"),
        duracion: getExclusive("duracion"),
        horasSemanales: parseInt(horasInput?.value) || 20,
        becaOfrecida: getExclusive("becaOfrecida"),
        plazas: document.getElementById("plazas")?.value || "1",
        beneficios: getChips("beneficios"),
        
        // ✅ Documentos (NOMBRES ALINEADOS CON DASHBOARD)
        convenioUrl: convenioURL,        // ✅ Dashboard espera "convenioUrl"
        tieneConvenio: !!convenioFile,
        constanciaUrl: constanciaURL,    // ✅ Consistencia de nombres
        tieneConstancia: !!constanciaFile,
        cartaUrl: cartaURL,              // ✅ Nuevo campo para dashboard
        tieneCarta: !!cartaFile
      };
      
      // ===== 6. GUARDAR EN FIRESTORE =====
      await setDoc(doc(db, "empresas", uid), empresaData);
      
      // ===== 7. ENVIAR VERIFICACIÓN DE EMAIL =====
      try {
        await sendEmailVerification(userCredential.user);
      } catch (emailError) {
        console.warn("⚠️ No se pudo enviar email de verificación:", emailError);
      }
      
      // ===== 8. ÉXITO =====
      if (progressFill) progressFill.style.width = "100%";
      
      const docsSubidos = [convenioFile, constanciaFile, cartaFile, logoFile].filter(f => f).length;
      const docsMsg = docsSubidos > 0 ? ` (${docsSubidos} documento${docsSubidos > 1 ? 's' : ''} subido${docsSubidos > 1 ? 's' : ''})` : " (sin documentos)";
      showMsg(`✅ Empresa registrada${docsMsg}. Revisa tu correo para verificar tu cuenta.`, "success");
      
      // Resetear formulario
      form.reset();
      document.querySelectorAll(".chip.active").forEach(c => {
        c.classList.remove("active");
        c.setAttribute("aria-pressed", "false");
      });
      document.querySelectorAll(".has-file").forEach(el => el.classList.remove("has-file"));
      
      // Restaurar textos de file drops
      ["logoText", "convenioText", "constanciaText", "cartaText"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = el.textContent.replace(/\(subido\)/i, "(opcional)");
      });
      
      if (hrsLabel) hrsLabel.textContent = "20 hrs";
      if (horasInput) horasInput.value = "20";
      if (hrsRange) hrsRange.value = "20";
      
      updateProgress();
      
      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        window.location.href = "FIEEPruebabeta/menu/index.html";
      }, 3000);
      
    } catch (error) {
      console.error("❌ Error en registro de empresa:", error);
      
      // Limpieza: si falla después de crear auth, borrar usuario huérfano
      if (error.code?.includes("auth/") || error.code === "permission-denied") {
        const user = auth.currentUser;
        if (user) {
          await user.delete().catch(() => {});
        }
      }
      
      // Mensajes amigables
      const firebaseErrors = {
        "auth/email-already-in-use": "📧 Este correo ya está registrado.",
        "auth/invalid-email": "✉️ Formato de correo no válido.",
        "auth/weak-password": "🔐 Contraseña muy débil (mínimo 8 caracteres).",
        "permission-denied": "🚫 No tienes permisos. Contacta al administrador.",
        "storage/unauthorized": "📁 Error al subir archivos. Intenta de nuevo.",
        "storage/quota-exceeded": "💾 Cuota de almacenamiento excedida."
      };
      
      const msg = firebaseErrors[error.code] || error.message || "❌ Error en el registro. Intenta de nuevo.";
      showMsg(msg, "error");
      
    } finally {
      // Restaurar formulario
      formElements.forEach(el => el.disabled = false);
      if (submitBtn) {
        submitBtn.classList.remove("loading");
        const btnText = submitBtn.querySelector(".btn-text");
        if (btnText) btnText.textContent = "Registrar empresa";
      }
    }
  });
}

/* =============================================
   INICIALIZACIÓN
   ============================================= */
document.addEventListener("DOMContentLoaded", () => {
  updateProgress();
  
  // Prevenir envío con Enter en inputs (mejor UX)
  form?.querySelectorAll("input").forEach(input => {
    if (input.type !== "textarea") {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const inputs = Array.from(form.querySelectorAll("input:not([type='file']), select, textarea"));
          const idx = inputs.indexOf(e.target);
          if (idx < inputs.length - 1) inputs[idx + 1].focus();
        }
      });
    }
  });
});
