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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

/* =============================================
   MAPEO: CARRERAS → HABILIDADES Y ÁREAS
   ============================================= */
const carrerasData = {
  "Ing. Informatica": {
    skills: ["Python", "Java", "JavaScript", "React", "Node.js", "SQL", "MongoDB", "Linux", "Redes", "Ciberseguridad"],
    areas: ["Desarrollo web", "Desarrollo móvil", "Backend", "Frontend", "Datos / IA", "Ciberseguridad", "Cloud Computing", "Administración TI"]
  },
  "Ing. Electrica": {
    skills: ["PLC", "MATLAB", "Proteus", "Circuitos eléctricos", "Electrónica de potencia", "Instalaciones eléctricas", "AutoCAD"],
    areas: ["Automatización", "Mantenimiento eléctrico", "Energía", "Control industrial"]
  },
  "Ing. Mecatronica": {
    skills: ["Arduino", "PLC", "Robótica", "Sensores", "SolidWorks", "C++", "Automatización"],
    areas: ["Automatización", "Robótica", "IoT", "Manufactura", "Control industrial"]
  },
  "Ing. Electronica y comunicaciones": {
    skills: ["Microcontroladores", "Arduino", "Redes", "Telecomunicaciones", "IoT", "Proteus"],
    areas: ["Telecomunicaciones", "IoT", "Electrónica", "Redes"]
  },
  "Ing. Industrial": {
    skills: ["Excel avanzado", "Lean Manufacturing", "Six Sigma", "SAP", "Control de calidad"],
    areas: ["Manufactura", "Logística", "Calidad", "Producción"]
  },
  "Ing. Ingenieria Metalurgica y Ciencias de los Materiales": {
    skills: ["Análisis de materiales", "Metalurgia", "Laboratorio", "Procesos térmicos"],
    areas: ["Materiales", "Investigación", "Producción industrial"]
  },
  "Ing. Ingenieria Naval": {
    skills: ["Diseño naval", "AutoCAD", "SolidWorks", "Mecánica"],
    areas: ["Diseño naval", "Mantenimiento", "Construcción marítima"]
  },
  "Ing. Quimica": {
    skills: ["Laboratorio químico", "Procesos químicos", "Control de calidad", "Análisis químico"],
    areas: ["Procesos químicos", "Calidad", "Investigación"]
  },
  "Ing. Civil": {
    skills: ["AutoCAD", "Civil 3D", "Topografía", "Cálculo estructural", "Presupuestos"],
    areas: ["Construcción", "Estructuras", "Supervisión de obra"]
  },
  "Ing. Arquitectura": {
    skills: ["AutoCAD", "SketchUp", "Revit", "Diseño arquitectónico", "Renderizado"],
    areas: ["Diseño arquitectónico", "Urbanismo", "Renderizado"]
  },
  "Ing. Topografia Geodesica": {
    skills: ["Topografía", "GPS", "Civil 3D", "AutoCAD", "Geodesia"],
    areas: ["Topografía", "Cartografía", "Geodesia"]
  }
};

/* =============================================
   RENDERIZAR CHIPS DINÁMICOS (Habilidades/Áreas)
   ============================================= */
function renderChips(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = "";
  items.forEach(item => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = item;
    btn.setAttribute("role", "switch");
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      btn.setAttribute("aria-pressed", btn.classList.contains("active"));
      updateProgress();
    });
    container.appendChild(btn);
  });
}

// Actualizar chips al cambiar carrera
const carreraSelect = document.getElementById("carrera");
if (carreraSelect) {
  carreraSelect.addEventListener("change", (e) => {
    const carrera = e.target.value;
    if (!carrerasData[carrera]) return;
    renderChips("skills", carrerasData[carrera].skills);
    renderChips("areas", carrerasData[carrera].areas);
    updateProgress();
  });
}

/* =============================================
   HELPERS — Leer selección de chips
   ============================================= */
function getChips(groupId) {
  return [...document.querySelectorAll(`#${groupId} .chip.active`)]
    .map(c => c.textContent.trim());
}

function getExclusive(groupId) {
  const active = document.querySelector(`#${groupId} .chip.active`);
  return active ? active.textContent.trim() : "";
}

/* =============================================
   EVENTOS PARA CHIPS (Múltiple / Exclusivo)
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
   FILE DROP — CV y Carta en PDF (OPCIONALES)
   ============================================= */
// CV
const cvInput = document.getElementById("cv");
const fileText = document.getElementById("fileText");
const fileDrop = document.getElementById("fileDrop");

if (fileText) {
  fileText.textContent = "Arrastra tu CV o haz clic (opcional)";
}

if (cvInput && fileText && fileDrop) {
  cvInput.addEventListener("change", () => {
    const file = cvInput.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        showMsg("⚠️ Solo se permiten archivos PDF", "warning");
        cvInput.value = "";
        fileText.textContent = "Arrastra tu CV o haz clic (opcional)";
        fileDrop.classList.remove("has-file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showMsg("⚠️ El archivo no debe superar los 5MB", "warning");
        cvInput.value = "";
        fileText.textContent = "Arrastra tu CV o haz clic (opcional)";
        fileDrop.classList.remove("has-file");
        return;
      }
      fileText.textContent = file.name.length > 30 ? file.name.substring(0, 27) + "…" : file.name;
      fileDrop.classList.add("has-file");
    } else {
      fileText.textContent = "Arrastra tu CV o haz clic (opcional)";
      fileDrop.classList.remove("has-file");
    }
    updateProgress();
  });

  ["dragover", "dragenter"].forEach(evt =>
    fileDrop.addEventListener(evt, e => {
      e.preventDefault();
      fileDrop.style.borderColor = "var(--blue-500, #3b82f6)";
    })
  );
  ["dragleave", "drop"].forEach(evt =>
    fileDrop.addEventListener(evt, e => {
      e.preventDefault();
      fileDrop.style.borderColor = "";
    })
  );
  
  fileDrop.addEventListener("click", (e) => {
    if (e.target === fileDrop || e.target.classList.contains("file-icon") || e.target.classList.contains("file-text")) {
      cvInput.click();
    }
  });
}

// Carta de presentación (nuevo campo para dashboard)
const cartaInput = document.getElementById("carta");
const cartaText = document.getElementById("cartaText");
const cartaDrop = document.getElementById("cartaDrop");

if (cartaInput && cartaText && cartaDrop) {
  cartaInput.addEventListener("change", () => {
    const file = cartaInput.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        showMsg("⚠️ Solo se permiten archivos PDF", "warning");
        cartaInput.value = "";
        cartaText.textContent = "Arrastra tu carta o haz clic (opcional)";
        cartaDrop.classList.remove("has-file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showMsg("⚠️ El archivo no debe superar los 5MB", "warning");
        cartaInput.value = "";
        cartaText.textContent = "Arrastra tu carta o haz clic (opcional)";
        cartaDrop.classList.remove("has-file");
        return;
      }
      cartaText.textContent = file.name.length > 30 ? file.name.substring(0, 27) + "…" : file.name;
      cartaDrop.classList.add("has-file");
    } else {
      cartaText.textContent = "Arrastra tu carta o haz clic (opcional)";
      cartaDrop.classList.remove("has-file");
    }
    updateProgress();
  });

  ["dragover", "dragenter"].forEach(evt =>
    cartaDrop.addEventListener(evt, e => {
      e.preventDefault();
      cartaDrop.style.borderColor = "var(--blue-500, #3b82f6)";
    })
  );
  ["dragleave", "drop"].forEach(evt =>
    cartaDrop.addEventListener(evt, e => {
      e.preventDefault();
      cartaDrop.style.borderColor = "";
    })
  );
  
  cartaDrop.addEventListener("click", (e) => {
    if (e.target === cartaDrop || e.target.classList.contains("file-icon") || e.target.classList.contains("file-text")) {
      cartaInput.click();
    }
  });
}

/* =============================================
   VALIDACIONES DE INPUTS ESPECÍFICOS
   ============================================= */
// CURP — Forzar mayúsculas
const curpInput = document.getElementById("curp");
if (curpInput) {
  curpInput.addEventListener("input", function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18);
  });
}

// Matrícula — Solo números y letras, sin espacios
const matriculaInput = document.getElementById("matricula");
if (matriculaInput) {
  matriculaInput.addEventListener("input", function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  });
}

// Teléfono — Formato mexicano
const telefonoInput = document.getElementById("telefono");
if (telefonoInput) {
  telefonoInput.addEventListener("input", function () {
    let val = this.value.replace(/\D/g, '').slice(0, 10);
    if (val.length > 3) val = val.slice(0,3) + ' ' + val.slice(3);
    if (val.length > 7) val = val.slice(0,7) + ' ' + val.slice(7);
    this.value = val;
  });
}

// Sanitizar descripción (prevención XSS básico)
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
const requiredFields = ["email", "password", "nombre", "matricula", "carrera", "semestre"];
const exclusiveGroups = ["ingles", "modal", "turno", "interes"];

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
  // Auto-ocultar mensajes de éxito
  if (type === "success") {
    setTimeout(() => {
      mensaje.textContent = "";
      mensaje.className = "form-msg";
    }, 8000);
  }
}

/* =============================================
   SUBMIT — Registro completo con Firebase
   ============================================= */
const form = document.getElementById("registerForm");
const mensaje = document.getElementById("mensaje");
const submitBtn = document.getElementById("submitBtn");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Resetear mensajes
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
      if (btnText) btnText.textContent = "Enviando…";
    }

    try {
      // ===== 1. VALIDACIONES PREVIAS =====
      const email = document.getElementById("email")?.value.trim().toLowerCase();
      const password = document.getElementById("password")?.value;
      const nombre = document.getElementById("nombre")?.value.trim();
      const matricula = document.getElementById("matricula")?.value.trim();
      const cvFile = cvInput?.files?.[0];
      const cartaFile = cartaInput?.files?.[0];

      // Validaciones OBLIGATORIAS
      if (!email || !email.endsWith("@estudiantes.uv.mx")) {
        throw new Error("⚠️ Usa tu correo institucional @estudiantes.uv.mx");
      }
      if (!password || password.length < 8) {
        throw new Error("🔐 La contraseña debe tener al menos 8 caracteres");
      }
      if (!nombre || nombre.length < 5) {
        throw new Error("👤 Ingresa tu nombre completo");
      }
      if (!matricula) {
        throw new Error("🆔 La matrícula es requerida");
      }
      const carrera = document.getElementById("carrera")?.value;
      if (!carrera) {
        throw new Error("🎓 Selecciona tu carrera");
      }
      const semestre = document.getElementById("semestre")?.value;
      if (!semestre) {
        throw new Error("📚 Selecciona tu semestre");
      }

       // ===== 2. CREAR USUARIO EN FIREBASE AUTH =====
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
       
      // Validación de matrícula única en Firestore
      const matriculaSnap = await getDocs(
        query(collection(db, "estudiantes"), where("matricula", "==", matricula))
      );
      if (!matriculaSnap.empty) {
        throw new Error("🆔 Esta matrícula ya está registrada en el sistema");
      }
      
      // Validación CONDICIONAL de archivos (solo si se suben)
      [cvFile, cartaFile].forEach((file, idx) => {
        if (file) {
          const nombreArchivo = idx === 0 ? "CV" : "Carta";
          if (file.type !== "application/pdf") {
            throw new Error(`📄 ${nombreArchivo}: Solo se permiten archivos PDF`);
          }
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`📦 ${nombreArchivo}: No debe superar los 5MB`);
          }
        }
      });

      

      // ===== 3. SUBIR ARCHIVOS A FIREBASE STORAGE =====
      let cvURL = null, cvNombre = null;
      let cartaURL = null, cartaNombre = null;
      
      if (cvFile) {
        const storageRef = ref(storage, `cv/${uid}.pdf`);
        await uploadBytes(storageRef, cvFile);
        cvURL = await getDownloadURL(storageRef);
        cvNombre = cvFile.name;
      }
      
      if (cartaFile) {
        const storageRef = ref(storage, `cartas/${uid}.pdf`);
        await uploadBytes(storageRef, cartaFile);
        cartaURL = await getDownloadURL(storageRef);
        cartaNombre = cartaFile.name;
      }

      // ===== 4. PREPARAR DATOS PARA FIRESTORE =====
      // Unificar disponibilidad para compatibilidad con dashboard
      const modalidad = getExclusive("modal");
      const turno = getExclusive("turno");
      const disponibilidadUnificada = [modalidad, turno].filter(Boolean).join(" - ");

      const estudianteData = {
        // Metadata
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        estado: "pendiente",

        // Cuenta
        email,

        // Personal (básico) - Campos que el dashboard muestra
        nombre,
        matricula,
        carrera,
        semestre,
        promedio: document.getElementById("promedio")?.value ? 
                  parseFloat(document.getElementById("promedio").value) : null,
        telefono: document.getElementById("telefono")?.value.trim().replace(/\s/g, '') || "",
        ciudad: document.getElementById("ciudad")?.value.trim() || "",
        curp: document.getElementById("curp")?.value.trim() || "",
        nss: document.getElementById("nss")?.value.trim() || "",  // ✅ Nuevo campo dashboard
        direccion: document.getElementById("direccion")?.value.trim() || "",  // ✅ Nuevo campo dashboard

        // Perfil técnico
        habilidades: getChips("skills"),
        otrasHabilidades: document.getElementById("otrasHabilidades")?.value.trim() || "",
        nivelIngles: getExclusive("ingles"),
        experienciaPrevia: getExclusive("exp"),

        // Disponibilidad (unificada para dashboard + detallada para filtros)
        disponibilidad: disponibilidadUnificada || "",  // ✅ Campo único para dashboard
        modalidad,  // ✅ Mantener para filtros avanzados
        turno,
        dispuestoReubicarse: getExclusive("reloc"),
        horasSemanales: parseInt(horasInput?.value) || 20,

        // Preferencias (para matching con vacantes)
        areasInteres: getChips("areas"),
        tipoEmpresa: getChips("tipoEmp"),
        expectativaBeca: getExclusive("beca"),

        // Interés y documentos
        interes: getExclusive("interes"),
        descripcion: sanitizeText(document.getElementById("descripcion")?.value.trim()) || "",
        linkedin: document.getElementById("linkedin")?.value.trim() || "",

        // Documentos (CV y Carta - opcionales)
        cvUrl: cvURL,
        cvNombre: cvNombre,
        tieneCV: !!cvFile,
        cartaUrl: cartaURL,  // ✅ Nuevo campo para dashboard
        cartaNombre: cartaNombre,  // ✅ Nuevo campo para dashboard
        tieneCarta: !!cartaFile  // ✅ Para filtrar fácilmente
      };

      // ===== 5. GUARDAR EN FIRESTORE =====
      await setDoc(doc(db, "estudiantes", uid), estudianteData);

      // ===== 6. ENVIAR VERIFICACIÓN DE EMAIL =====
      try {
        await sendEmailVerification(userCredential.user);
      } catch (emailError) {
        console.warn("⚠️ No se pudo enviar email de verificación:", emailError);
        // No bloqueamos el registro por esto
      }

      // ===== 7. ÉXITO =====
      if (progressFill) progressFill.style.width = "100%";
      
      const docsMsg = [cvFile ? "CV" : null, cartaFile ? "Carta" : null]
        .filter(Boolean).join(" y ");
      const msgDocs = docsMsg ? ` con ${docsMsg}` : " (sin documentos)";
      
      showMsg(`✅ Registro exitoso${msgDocs}. Revisa tu correo para verificar tu cuenta.`, "success");
      
      // Resetear formulario
      form.reset();
      if (fileText) fileText.textContent = "Arrastra tu CV o haz clic (opcional)";
      if (cartaText) cartaText.textContent = "Arrastra tu carta o haz clic (opcional)";
      if (fileDrop) fileDrop.classList.remove("has-file");
      if (cartaDrop) cartaDrop.classList.remove("has-file");
      document.querySelectorAll(".chip.active").forEach(c => {
        c.classList.remove("active");
        c.setAttribute("aria-pressed", "false");
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
      console.error("❌ Error en registro:", error);
      
      // Limpieza: si falla después de crear auth, borrar usuario huérfano
      if (error.code?.includes("auth/") || error.code === "permission-denied") {
        const user = auth.currentUser;
        if (user) {
          await user.delete().catch(() => {});
        }
      }
      
      // Mensajes amigables por error
      const firebaseErrors = {
        "auth/email-already-in-use": "📧 Este correo ya está registrado.",
        "auth/invalid-email": "✉️ Formato de correo no válido.",
        "auth/weak-password": "🔐 Contraseña muy débil (mínimo 8 caracteres).",
        "permission-denied": "🚫 No tienes permisos. Contacta al administrador.",
        "storage/unauthorized": "📁 Error al subir archivos. Intenta de nuevo.",
        "storage/quota-exceeded": "💾 Cuota de almacenamiento excedida.",
        "failed-precondition": "🔄 La base de datos está en mantenimiento. Intenta en unos minutos."
      };
      
      const msg = firebaseErrors[error.code] || error.message || "❌ Error en el registro. Intenta de nuevo.";
      showMsg(msg, "error");
      
    } finally {
      // Restaurar formulario
      formElements.forEach(el => el.disabled = false);
      if (submitBtn) {
        submitBtn.classList.remove("loading");
        const btnText = submitBtn.querySelector(".btn-text");
        if (btnText) btnText.textContent = "Crear perfil";
      }
    }
  });
}

/* =============================================
   INICIALIZACIÓN
   ============================================= */
document.addEventListener("DOMContentLoaded", () => {
  updateProgress();
  
  // Si la carrera ya tiene valor (ej: recarga), renderizar sus chips
  const carreraInicial = carreraSelect?.value;
  if (carreraInicial && carrerasData[carreraInicial]) {
    renderChips("skills", carrerasData[carreraInicial].skills);
    renderChips("areas", carrerasData[carreraInicial].areas);
  }
  
  // Prevenir envío con Enter en inputs (mejor UX)
  form?.querySelectorAll("input").forEach(input => {
    if (input.type !== "textarea") {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          // Mover al siguiente input
          const inputs = Array.from(form.querySelectorAll("input:not([type='file']), select, textarea"));
          const idx = inputs.indexOf(e.target);
          if (idx < inputs.length - 1) inputs[idx + 1].focus();
        }
      });
    }
  });
});
