/* =============================================
   IMPORTS - FIREBASE SDK (v9 Modular)
   ============================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  serverTimestamp,
  getCountFromServer
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* =============================================
   ESTADO GLOBAL
   ============================================= */
let currentUser = null;
let userRole = null;
let userData = null;

/* =============================================
   UTILIDADES
   ============================================= */
function fmt(ts) {
  if (!ts) return 'Sin fecha';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}"></i> ${msg}`;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3500);
}

function showModal(html) {
  document.getElementById('modalOverlay').innerHTML = `
    <div class="modal">
      <button class="modal__close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
      ${html}
    </div>`;
  document.getElementById('modalOverlay').classList.add('open');
}

window.closeModal = () => {
  document.getElementById('modalOverlay').classList.remove('open');
};

function loading(el, msg = 'Cargando...') {
  if (el) el.innerHTML = `<div class="data-loading"><div class="spinner-sm"></div><span>${msg}</span></div>`;
}

/* =============================================
   MENÚS POR ROL
   ============================================= */
const menus = {
  estudiante: [
    { section: 'Principal', items: [
      { id: 'inicio', icon: 'fa-house', label: 'Inicio', page: 'inicio' },
      { id: 'ofertas', icon: 'fa-briefcase', label: 'Ofertas', page: 'ofertas' },
      { id: 'postulaciones', icon: 'fa-paper-plane', label: 'Mis Postulaciones', page: 'postulaciones' }
    ]},
    { section: 'Mi Perfil', items: [
      { id: 'perfil', icon: 'fa-user', label: 'Mi Perfil', page: 'perfil' },
      { id: 'documentos', icon: 'fa-file-lines', label: 'Documentos', page: 'documentos' }
    ]},
    { section: 'Información', items: [
      { id: 'notificaciones', icon: 'fa-bell', label: 'Notificaciones', page: 'notificaciones' },
      { id: 'ayuda', icon: 'fa-circle-info', label: 'Ayuda', page: 'ayuda' }
    ]}
  ],
  empresa: [
    { section: 'Principal', items: [
      { id: 'inicio', icon: 'fa-house', label: 'Inicio', page: 'inicio' },
      { id: 'vacantes', icon: 'fa-briefcase', label: 'Mis Vacantes', page: 'vacantes' },
      { id: 'candidatos', icon: 'fa-users', label: 'Candidatos', page: 'candidatos' }
    ]},
    { section: 'Gestión', items: [
      { id: 'crear-vacante', icon: 'fa-plus-circle', label: 'Crear Vacante', page: 'crear-vacante' },
      { id: 'perfil-empresa', icon: 'fa-building', label: 'Perfil de Empresa', page: 'perfil-empresa' }
    ]},
    { section: 'Información', items: [
      { id: 'notificaciones', icon: 'fa-bell', label: 'Notificaciones', page: 'notificaciones' },
      { id: 'reportes', icon: 'fa-chart-bar', label: 'Reportes', page: 'reportes' }
    ]}
  ],
  admin: [
    { section: 'Panel', items: [
      { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard', page: 'dashboard' },
      { id: 'estudiantes', icon: 'fa-graduation-cap', label: 'Estudiantes', page: 'estudiantes' },
      { id: 'empresas', icon: 'fa-building', label: 'Empresas', page: 'empresas' }
    ]},
    { section: 'Moderación', items: [
      { id: 'pendientes', icon: 'fa-clock', label: 'Pendientes', page: 'pendientes' },
      { id: 'vacantes-admin', icon: 'fa-briefcase', label: 'Vacantes', page: 'vacantes-admin' }
    ]},
    { section: 'Sistema', items: [
      { id: 'admins', icon: 'fa-user-shield', label: 'Administradores', page: 'admins' },
      { id: 'configuracion', icon: 'fa-cog', label: 'Configuración', page: 'configuracion' }
    ]}
  ]
};

/* =============================================
   TEMPLATES HTML DE PÁGINAS
   ============================================= */
const pages = {

  /* ======= ESTUDIANTE ======= */

  'estudiante:inicio': () => `
    <div class="welcome-banner">
      <div>
        <p class="welcome__tag">Bienvenida de vuelta</p>
        <h1 class="welcome__name">Hola, ${userData?.nombre?.split(' ')[0] || 'Estudiante'} 👋</h1>
        <p class="welcome__sub">${userData?.carrera || 'Carrera'} · ${userData?.semestre || '?'}° semestre</p>
      </div>
      <div class="welcome__actions">
        <button class="btn-white" onclick="showPage('perfil')"><i class="fa-solid fa-user"></i> Mi perfil</button>
        <button class="btn-gold" onclick="showPage('ofertas')"><i class="fa-solid fa-briefcase"></i> Ver ofertas</button>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-card__icon blue"><i class="fa-solid fa-briefcase"></i></div><div><div class="stat-card__num" id="stat-ofertas">-</div><div class="stat-card__label">Ofertas disponibles</div></div></div>
      <div class="stat-card"><div class="stat-card__icon gold"><i class="fa-solid fa-paper-plane"></i></div><div><div class="stat-card__num" id="stat-postulaciones">-</div><div class="stat-card__label">Postulaciones activas</div></div></div>
      <div class="stat-card"><div class="stat-card__icon green"><i class="fa-solid fa-star"></i></div><div><div class="stat-card__num" id="stat-matches">-</div><div class="stat-card__label">En revisión</div></div></div>
      <div class="stat-card"><div class="stat-card__icon gray"><i class="fa-solid fa-percent"></i></div><div><div class="stat-card__num" id="stat-perfil">-</div><div class="stat-card__label">Perfil completado</div></div></div>
    </div>
    <div class="section-row"><h2>Ofertas recientes para ti</h2><button onclick="showPage('ofertas')">Ver todas <i class="fa-solid fa-arrow-right"></i></button></div>
    <div class="offers-grid" id="ofertas-grid"></div>
  `,

  'estudiante:ofertas': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Ofertas disponibles</h2></div>
    <div class="filters" id="filterBtns">
      <button class="filter-chip active" onclick="filterOffers('all', this)">Todas</button>
      <button class="filter-chip" onclick="filterOffers('pp', this)">Prácticas Profesionales</button>
      <button class="filter-chip" onclick="filterOffers('ss', this)">Servicio Social</button>
      <button class="filter-chip" onclick="filterOffers('remoto', this)">Remoto</button>
    </div>
    <div class="offers-grid" id="ofertas-grid"></div>
  `,

  'estudiante:postulaciones': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Mis Postulaciones</h2><span style="font-size:12px;color:var(--gray-400)" id="postulaciones-count">Cargando...</span></div>
    <div class="filters">
      <button class="filter-chip active" onclick="filterPostulaciones('all',this)">Todas</button>
      <button class="filter-chip" onclick="filterPostulaciones('pendiente',this)">Pendiente</button>
      <button class="filter-chip" onclick="filterPostulaciones('revision',this)">En revisión</button>
      <button class="filter-chip" onclick="filterPostulaciones('aceptado',this)">Aceptadas</button>
      <button class="filter-chip" onclick="filterPostulaciones('rechazado',this)">Rechazadas</button>
    </div>
    <div class="data-list" id="postulaciones-list"></div>
  `,

'estudiante:perfil': () => `
  <div class="section-row"><h2 style="font-size:1.2rem">Mi Perfil</h2>
    <button class="btn-primary-sm" onclick="editarPerfil()"><i class="fa-solid fa-pen"></i> Editar perfil</button>
  </div>
  <div class="profile-card">
    <div class="profile-card__top">
      <div class="profile-card__avatar">${(userData?.nombre?.[0]||'E').toUpperCase()}</div>
      <div>
        <div class="profile-card__name">${userData?.nombre || 'Sin nombre'}</div>
        <div class="profile-card__detail">${userData?.carrera || ''} · Matrícula: ${userData?.matricula || '...'}</div>
        <div class="profile-card__detail">${userData?.email || ''}</div>
      </div>
    </div>
    <div class="profile-fields">
      <!-- Académico -->
      <div class="field-group"><label>Semestre</label><span>${userData?.semestre ? userData.semestre + '°' : 'No especificado'}</span></div>
      <div class="field-group"><label>Promedio</label><span>${userData?.promedio ? userData.promedio.toFixed(1) : 'No especificado'}</span></div>
      <div class="field-group"><label>Programa</label><span class="status-pill ${userData?.interes?.includes('Prácticas') ? 'aprobado' : 'pendiente'}">${userData?.interes || 'No especificado'}</span></div>
      
      <!-- Personal -->
      <div class="field-group"><label>Teléfono</label><span>${userData?.telefono || 'No especificado'}</span></div>
      <div class="field-group"><label>Ciudad</label><span>${userData?.ciudad || 'No especificada'}</span></div>
      <div class="field-group span2"><label>Dirección</label><span>${userData?.direccion || 'No especificada'}</span></div>
      <div class="field-group"><label>CURP</label><span>${userData?.curp || 'No especificada'}</span></div>
      <div class="field-group"><label>NSS</label><span>${userData?.nss || 'No especificado'}</span></div>

      <!-- Técnico -->
      <div class="field-group span2"><label>Habilidades técnicas</label><span>${Array.isArray(userData?.habilidades) ? userData.habilidades.join(', ') : userData?.habilidades || 'No especificadas'}</span></div>
      <div class="field-group"><label>Otras habilidades</label><span>${userData?.otrasHabilidades || 'Ninguna'}</span></div>
      <div class="field-group"><label>Nivel de inglés</label><span>${userData?.nivelIngles || 'No especificado'}</span></div>
      <div class="field-group"><label>Experiencia previa</label><span>${userData?.experienciaPrevia || 'No especificada'}</span></div>

      <!-- Disponibilidad -->
      <div class="field-group"><label>Disponibilidad</label><span>${userData?.disponibilidad || 'No especificada'}</span></div>
      <div class="field-group"><label>Horas/semana</label><span>${userData?.horasSemanales ? userData.horasSemanales + ' hrs' : 'No especificadas'}</span></div>
      <div class="field-group"><label>¿Reubicación?</label><span>${userData?.dispuestoReubicarse || 'No especificado'}</span></div>

      <!-- Preferencias -->
      <div class="field-group span2"><label>Áreas de interés</label><span>${Array.isArray(userData?.areasInteres) ? userData.areasInteres.join(', ') : 'No especificadas'}</span></div>
      <div class="field-group"><label>Tipo de empresa</label><span>${Array.isArray(userData?.tipoEmpresa) ? userData.tipoEmpresa.join(', ') : 'No especificado'}</span></div>
      <div class="field-group"><label>Expectativa de beca</label><span>${userData?.expectativaBeca || 'No especificada'}</span></div>

      <!-- Extra -->
      <div class="field-group span2"><label>Descripción personal</label><span>${userData?.descripcion || 'Sin descripción'}</span></div>
      <div class="field-group span2"><label>LinkedIn / Portafolio</label><span>${userData?.linkedin ? `<a href="${userData.linkedin}" target="_blank">${userData.linkedin}</a>` : 'No agregado'}</span></div>
    </div>
    <div class="progress-label"><span>Completitud del perfil</span><strong id="pct-label">Calculando...</strong></div>
    <div class="progress-track"><div class="progress-fill" id="pct-bar" style="width:0%"></div></div>
  </div>
`,

  'estudiante:documentos': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Mis Documentos</h2></div>
    <div class="doc-upload-card">
      <div class="doc-upload-card__icon">📄</div>
      <div class="doc-upload-card__info">
        <div class="doc-upload-card__title">Curriculum Vitae (PDF)</div>
        <div class="doc-upload-card__sub" id="cv-status">${userData?.cvNombre || 'No subido'}</div>
      </div>
      <label class="btn-primary-sm" style="cursor:pointer">
        <i class="fa-solid fa-upload"></i> ${userData?.cvUrl ? 'Actualizar' : 'Subir CV'}
        <input type="file" accept=".pdf" style="display:none" onchange="subirCV(event)">
      </label>  
      ${userData?.cvUrl ? `<a href="${userData.cvUrl}" target="_blank" class="btn-secondary-sm"><i class="fa-solid fa-eye"></i> Ver</a>` : ''}
    </div>
    <div class="doc-upload-card">
      <div class="doc-upload-card__icon">🪪</div>
      <div class="doc-upload-card__info">
        <div class="doc-upload-card__title">Carta de Presentación (PDF)</div>
        <div class="doc-upload-card__sub" id="carta-status">${userData?.cartaNombre || 'No subida'}</div>
      </div>
      <label class="btn-primary-sm" style="cursor:pointer">
        <i class="fa-solid fa-upload"></i> ${userData?.cartaUrl ? 'Actualizar' : 'Subir Carta'}
        <input type="file" accept=".pdf" style="display:none" onchange="subirCarta(event)">
      </label>
      ${userData?.cartaUrl ? `<a href="${userData.cartaUrl}" target="_blank" class="btn-secondary-sm"><i class="fa-solid fa-eye"></i> Ver</a>` : ''}
    </div>
  `,

  'estudiante:notificaciones': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Notificaciones</h2></div>
    <div class="notif-list" id="notif-list"><div class="data-loading"><div class="spinner-sm"></div><span>Cargando...</span></div></div>
  `,

  'estudiante:ayuda': () => `
    <div class="empty-state">
      <i class="fa-solid fa-circle-question"></i>
      <p>¿Necesitas ayuda?<br>Contacta al área de Vinculación:</p>
      <strong>vinculacion@fiee.edu.mx</strong>
    </div>
  `,

  /* ======= EMPRESA ======= */

  'empresa:inicio': () => `
    <div class="welcome-banner empresa">
      <div>
        <p class="welcome__tag">Panel de Empresa</p>
        <h1 class="welcome__name">${userData?.nombreEmpresa || 'Empresa'} 👋</h1>
        <p class="welcome__sub">${userData?.sector || 'Sector'} · ${userData?.ciudad || 'Ubicación'}</p>
      </div>
      <div class="welcome__actions">
        <button class="btn-white" onclick="showPage('perfil-empresa')"><i class="fa-solid fa-building"></i> Mi empresa</button>
        <button class="btn-gold" onclick="showPage('crear-vacante')"><i class="fa-solid fa-plus"></i> Nueva vacante</button>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-card__icon gold"><i class="fa-solid fa-briefcase"></i></div><div><div class="stat-card__num" id="stat-vacantes">-</div><div class="stat-card__label">Vacantes activas</div></div></div>
      <div class="stat-card"><div class="stat-card__icon blue"><i class="fa-solid fa-users"></i></div><div><div class="stat-card__num" id="stat-candidatos">-</div><div class="stat-card__label">Candidatos recibidos</div></div></div>
      <div class="stat-card"><div class="stat-card__icon green"><i class="fa-solid fa-check"></i></div><div><div class="stat-card__num" id="stat-aceptados">-</div><div class="stat-card__label">Aceptados</div></div></div>
      <div class="stat-card"><div class="stat-card__icon gray"><i class="fa-solid fa-clock"></i></div><div><div class="stat-card__num">${userData?.estado === 'aprobado' ? '✓' : '⏳'}</div><div class="stat-card__label">Estado: ${userData?.estado || 'pendiente'}</div></div></div>
    </div>
    <div class="section-row"><h2>Vacantes recientes</h2><button onclick="showPage('vacantes')">Ver todas <i class="fa-solid fa-arrow-right"></i></button></div>
    <div class="offers-grid" id="vacantes-home-grid"></div>
  `,

  'empresa:vacantes': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Mis Vacantes</h2>
      <button class="btn-primary-sm" onclick="showPage('crear-vacante')"><i class="fa-solid fa-plus"></i> Crear vacante</button>
    </div>
    <div class="data-list" id="vacantes-list"></div>
  `,

  'empresa:crear-vacante': () => {
  // Pre-llenar con datos del perfil de empresa
  const p = userData || {};
  
  return `
    <div class="section-row"><h2 style="font-size:1.2rem">Crear Nueva Vacante</h2>
      <button class="btn-secondary-sm" onclick="usarPerfilComoBase()"><i class="fa-solid fa-clone"></i> Usar perfil como base</button>
    </div>
    
    <div class="form-card">
      <div class="form-grid">
        <div class="form-group span2">
          <label>Título del puesto *</label>
          <input type="text" id="v-titulo" placeholder="Ej: Desarrollador Web Jr." 
                 value="${p.vacanteTitulo || ''}">
        </div>
        <div class="form-group">
          <label>Área / Departamento *</label>
          <input type="text" id="v-area" placeholder="Ej: Desarrollo de Software"
                 value="${p.vacanteArea || ''}">
        </div>
        <div class="form-group">
          <label>Tipo de programa *</label>
          <select id="v-tipo">
            <option value="">Seleccionar...</option>
            <option value="ss" ${p.tipoPrograma?.includes('Servicio social')?'selected':''}>Servicio Social</option>
            <option value="pp" ${p.tipoPrograma?.includes('Prácticas')?'selected':''}>Prácticas Profesionales</option>
            <option value="ambos" ${p.tipoPrograma==='Ambos'?'selected':''}>Ambos</option>
          </select>
        </div>
        <div class="form-group">
          <label>Modalidad *</label>
          <select id="v-modalidad">
            <option value="presencial" ${p.modalidad==='Presencial'?'selected':''}>Presencial</option>
            <option value="remoto" ${p.modalidad==='Remoto'?'selected':''}>Remoto</option>
            <option value="hibrido" ${p.modalidad==='Híbrido'?'selected':''}>Híbrido</option>
          </select>
        </div>
        <div class="form-group">
          <label>Horas semanales *</label>
          <input type="number" id="v-horas" min="10" max="40" placeholder="20"
                 value="${p.horasSemanales || 20}">
        </div>
        <div class="form-group">
          <label>Beca ofrecida</label>
          <input type="text" id="v-beca" placeholder="Ej: $3,000/mes"
                 value="${p.becaOfrecida || ''}">
        </div>
        <div class="form-group span2">
          <label>Carreras aceptadas</label>
          <input type="text" id="v-carreras" placeholder="Ej: Ing. Informatica, Ing. Mecatronica"
                 value="${Array.isArray(p.carrerasAceptadas) ? p.carrerasAceptadas.join(', ') : ''}">
          <p style="font-size:11px;color:var(--gray-400);margin-top:.25rem">
            ${p.carrerasAceptadas?.length ? '💡 Sugerido desde tu perfil' : 'Separa con comas'}
          </p>
        </div>
        <div class="form-group">
          <label>Semestre mínimo</label>
          <select id="v-semestreMin">
            <option value="">Sin requisito</option>
            ${['6','7','8','9','10'].map(s => `<option value="${s}" ${p.semestreMin===s?'selected':''}>${s}°</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Promedio mínimo</label>
          <input type="number" id="v-promedioMin" min="0" max="100" step="0.5" placeholder="Ej: 80"
                 value="${p.promedioMin || ''}">
        </div>
        <div class="form-group span2">
          <label>Habilidades requeridas</label>
          <textarea id="v-habilidades" rows="2" placeholder="Ej: Python, React, SQL">${p.otrasHabilidades || ''}</textarea>
          ${p.habilidadesReq && Object.keys(p.habilidadesReq).length > 0 ? 
            `<p style="font-size:11px;color:var(--blue-600);margin-top:.25rem">
              💡 Desde perfil: ${Object.entries(p.habilidadesReq).map(([c,h])=>`${c}: ${h.slice(0,3).join(', ')}`).join(' | ')}
            </p>` : ''}
        </div>
        <div class="form-group">
          <label>Inglés requerido</label>
          <select id="v-ingles">
            <option value="">Seleccionar...</option>
            ${['No requerido','Básico','Intermedio','Avanzado'].map(n => `<option value="${n}" ${p.inglesReq===n?'selected':''}>${n}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Experiencia previa</label>
          <select id="v-exp">
            <option value="">Seleccionar...</option>
            ${['No requerida','Deseable','Obligatoria'].map(e => `<option value="${e}" ${p.expReq===e?'selected':''}>${e}</option>`).join('')}
          </select>
        </div>
        <div class="form-group span2">
          <label>Descripción del puesto *</label>
          <textarea id="v-descripcion" rows="4" placeholder="Describe actividades, responsabilidades y requisitos...">${p.descripcionVacante || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Fecha límite</label>
          <input type="date" id="v-fecha-limite">
        </div>
        <div class="form-group">
          <label>Número de plazas</label>
          <input type="number" id="v-plazas" min="1" placeholder="${p.plazas || 1}" value="${p.plazas || 1}">
        </div>
        <div class="form-group span2">
          <label>Beneficios adicionales</label>
          <input type="text" id="v-beneficios" placeholder="Ej: Transporte, Capacitación, Seguro médico"
                 value="${Array.isArray(p.beneficios) ? p.beneficios.join(', ') : ''}">
        </div>
      </div>
      
      <div class="form-actions">
        <button class="btn-secondary" onclick="showPage('vacantes')">Cancelar</button>
        <button class="btn-gold" onclick="crearVacante()"><i class="fa-solid fa-paper-plane"></i> Publicar vacante</button>
      </div>
    </div>
    
    <!-- Script para botón "Usar perfil como base" -->
    <script>
      window.usarPerfilComoBase = function() {
        const p = window.userData || {};
        // Pre-llenar campos clave
        ['v-titulo','v-area','v-beca','v-carreras','v-descripcion','v-habilidades','v-beneficios'].forEach(id => {
          const el = document.getElementById(id);
          if (el && p[id.replace('v-','')]) el.value = Array.isArray(p[id.replace('v-','')]) ? p[id.replace('v-','')].join(', ') : p[id.replace('v-','')];
        });
        // Selects
        const selects = { 'v-tipo': p.tipoPrograma, 'v-modalidad': p.modalidad?.toLowerCase(), 'v-ingles': p.inglesReq, 'v-exp': p.expReq };
        Object.entries(selects).forEach(([id, val]) => {
          const el = document.getElementById(id);
          if (el && val) {
            const opt = [...el.options].find(o => o.value.toLowerCase().includes(val.toLowerCase()) || o.text.includes(val));
            if (opt) el.value = opt.value;
          }
        });
        // Números
        if (p.horasSemanales) document.getElementById('v-horas').value = p.horasSemanales;
        if (p.promedioMin) document.getElementById('v-promedioMin').value = p.promedioMin;
        if (p.semestreMin) document.getElementById('v-semestreMin').value = p.semestreMin;
        if (p.plazas) document.getElementById('v-plazas').value = p.plazas;
        
        toast('✅ Campos pre-llenados desde tu perfil');
      };
    </script>
  `;
},

  'empresa:candidatos': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Candidatos Postulados</h2></div>
    <div class="filters" id="cand-filters">
      <button class="filter-chip active" onclick="filterCandidatos('all',this)">Todos</button>
      <button class="filter-chip" onclick="filterCandidatos('pendiente',this)">Pendientes</button>
      <button class="filter-chip" onclick="filterCandidatos('revision',this)">En revisión</button>
      <button class="filter-chip" onclick="filterCandidatos('aceptado',this)">Aceptados</button>
      <button class="filter-chip" onclick="filterCandidatos('rechazado',this)">Rechazados</button>
    </div>
    <div class="data-list" id="candidatos-list"></div>
  `,

  'empresa:perfil-empresa': () => `
  <div class="section-row"><h2 style="font-size:1.2rem">Perfil de Empresa</h2>
    <button class="btn-primary-sm" onclick="editarPerfilEmpresa()"><i class="fa-solid fa-pen"></i> Editar</button>
  </div>
  
  <div class="profile-card">
    <!-- Encabezado -->
    <div class="profile-card__top">
      ${userData?.logo ? `<img src="${userData.logo}" alt="Logo" class="profile-card__avatar" style="object-fit:contain">` : 
        `<div class="profile-card__avatar" style="background:var(--gold)">${(userData?.nombreEmpresa?.[0]||'E').toUpperCase()}</div>`}
      <div>
        <div class="profile-card__name">${userData?.nombreEmpresa || 'Sin nombre'}</div>
        <div class="profile-card__detail">${userData?.sector || ''} · RFC: ${userData?.rfc || '...'}</div>
        <div class="profile-card__detail">${userData?.email || ''}</div>
        <span class="status-pill ${userData?.estado || 'pendiente'}" style="margin-top:.5rem;display:inline-block">
          ${userData?.estado || 'pendiente'}
        </span>
      </div>
    </div>

    <!-- Datos generales -->
    <h3 style="margin:1.5rem 0 .75rem;font-size:1rem;border-bottom:1px solid var(--gray-200);padding-bottom:.5rem">📋 Datos generales</h3>
    <div class="profile-fields">
      <div class="field-group"><label>Ciudad</label><span>${userData?.ciudad || 'No especificada'}</span></div>
      <div class="field-group"><label>Sitio web</label><span>${userData?.sitioWeb ? `<a href="${userData.sitioWeb}" target="_blank">${userData.sitioWeb}</a>` : 'No especificado'}</span></div>
      <div class="field-group"><label>Tamaño</label><span>${userData?.tamaño ? userData.tamaño + ' empleados' : 'No especificado'}</span></div>
      <div class="field-group"><label>Fundación</label><span>${userData?.fundacion || 'No especificado'}</span></div>
      <div class="field-group span2"><label>Descripción</label><span>${userData?.descripcionEmpresa || 'Sin descripción'}</span></div>
    </div>

    <!-- Contacto -->
    <h3 style="margin:1.5rem 0 .75rem;font-size:1rem;border-bottom:1px solid var(--gray-200);padding-bottom:.5rem">👤 Contacto</h3>
    <div class="profile-fields">
      <div class="field-group"><label>Responsable</label><span>${userData?.contactoNombre || 'No especificado'}</span></div>
      <div class="field-group"><label>Puesto</label><span>${userData?.contactoPuesto || 'No especificado'}</span></div>
      <div class="field-group"><label>Teléfono</label><span>${userData?.telefono || userData?.contactoTel || 'No especificado'}</span></div>
      <div class="field-group"><label>Correo de contacto</label><span>${userData?.contactoEmail || userData?.email || 'No especificado'}</span></div>
    </div>

    <!-- Perfil de vacante (pre-configuración) -->
    <h3 style="margin:1.5rem 0 .75rem;font-size:1rem;border-bottom:1px solid var(--gray-200);padding-bottom:.5rem">💼 Perfil de vacante (pre-configuración)</h3>
    <div class="profile-fields">
      <div class="field-group"><label>Programa</label><span class="status-pill ${userData?.tipoPrograma?.includes('Prácticas') ? 'aprobado' : 'pendiente'}">${userData?.tipoPrograma || 'No especificado'}</span></div>
      <div class="field-group"><label>Título base</label><span>${userData?.vacanteTitulo || 'No especificado'}</span></div>
      <div class="field-group"><label>Área</label><span>${userData?.vacanteArea || 'No especificada'}</span></div>
      <div class="field-group span2"><label>Carreras aceptadas</label><span>${Array.isArray(userData?.carrerasAceptadas) ? userData.carrerasAceptadas.join(', ') : 'Todas'}</span></div>
      <div class="field-group"><label>Semestre mínimo</label><span>${userData?.semestreMin ? userData.semestreMin + '°' : 'Sin requisito'}</span></div>
      <div class="field-group"><label>Promedio mínimo</label><span>${userData?.promedioMin ? userData.promedioMin.toFixed(1) : 'Sin requisito'}</span></div>
      <div class="field-group span2"><label>Habilidades requeridas</label><span>${userData?.habilidadesReq ? Object.entries(userData.habilidadesReq).map(([c, h]) => `<strong>${c}:</strong> ${h.join(', ')}`).join('<br>') : 'No especificadas'}</span></div>
      <div class="field-group"><label>Inglés requerido</label><span>${userData?.inglesReq || 'No especificado'}</span></div>
      <div class="field-group"><label>Experiencia</label><span>${userData?.expReq || 'No especificado'}</span></div>
      <div class="field-group span2"><label>Descripción base</label><span>${userData?.descripcionVacante || 'Sin descripción'}</span></div>
    </div>

    <!-- Condiciones -->
    <h3 style="margin:1.5rem 0 .75rem;font-size:1rem;border-bottom:1px solid var(--gray-200);padding-bottom:.5rem">⚙️ Condiciones</h3>
    <div class="profile-fields">
      <div class="field-group"><label>Modalidad</label><span>${userData?.modalidad || 'No especificada'}</span></div>
      <div class="field-group"><label>Turno</label><span>${userData?.turno || 'No especificado'}</span></div>
      <div class="field-group"><label>Duración</label><span>${userData?.duracion || 'No especificada'}</span></div>
      <div class="field-group"><label>Horas/semana</label><span>${userData?.horasSemanales ? userData.horasSemanales + ' hrs' : 'No especificadas'}</span></div>
      <div class="field-group"><label>Beca ofrecida</label><span>${userData?.becaOfrecida || 'No especificada'}</span></div>
      <div class="field-group"><label>Plazas típicas</label><span>${userData?.plazas || '1'}</span></div>
      <div class="field-group span2"><label>Beneficios</label><span>${Array.isArray(userData?.beneficios) ? userData.beneficios.join(', ') : 'No especificados'}</span></div>
    </div>

    <!-- Documentos -->
    <h3 style="margin:1.5rem 0 .75rem;font-size:1rem;border-bottom:1px solid var(--gray-200);padding-bottom:.5rem">📄 Documentos</h3>
    <div class="profile-fields">
      <div class="field-group"><label>Convenio</label><span>${userData?.convenioUrl ? `<a href="${userData.convenioUrl}" target="_blank">Ver convenio</a>` : 'No subido'}</span></div>
      <div class="field-group"><label>Constancia fiscal</label><span>${userData?.constanciaUrl ? `<a href="${userData.constanciaUrl}" target="_blank">Ver documento</a>` : 'No subido'}</span></div>
      <div class="field-group"><label>Carta de aceptación</label><span>${userData?.cartaUrl ? `<a href="${userData.cartaUrl}" target="_blank">Ver carta</a>` : 'No subida'}</span></div>
      <div class="field-group"><label>Logo</label><span>${userData?.logo ? `<a href="${userData.logo}" target="_blank">Ver logo</a>` : 'No subido'}</span></div>
    </div>
  </div>
`,

  'empresa:notificaciones': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Notificaciones</h2></div>
    <div class="notif-list" id="notif-list"><div class="data-loading"><div class="spinner-sm"></div><span>Cargando...</span></div></div>
  `,

  'empresa:reportes': () => `
    <div class="empty-state"><i class="fa-solid fa-chart-bar"></i><p>Reportes y estadísticas estarán disponibles próximamente.</p></div>
  `,

  /* ======= ADMIN ======= */

  'admin:dashboard': () => `
    <div class="welcome-banner admin">
      <div>
        <p class="welcome__tag">Panel de Administración</p>
        <h1 class="welcome__name">Hola, ${userData?.nombre || 'Admin'} 👋</h1>
        <p class="welcome__sub">Gestión del sistema de vinculación FIEE</p>
      </div>
      <div class="welcome__actions">
        <button class="btn-white" onclick="showPage('pendientes')"><i class="fa-solid fa-clock"></i> Pendientes</button>
        <button class="btn-red" onclick="showPage('admins')"><i class="fa-solid fa-user-shield"></i> Admins</button>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-card__icon blue"><i class="fa-solid fa-graduation-cap"></i></div><div><div class="stat-card__num" id="admin-estudiantes">-</div><div class="stat-card__label">Estudiantes</div></div></div>
      <div class="stat-card"><div class="stat-card__icon gold"><i class="fa-solid fa-building"></i></div><div><div class="stat-card__num" id="admin-empresas">-</div><div class="stat-card__label">Empresas</div></div></div>
      <div class="stat-card"><div class="stat-card__icon green"><i class="fa-solid fa-briefcase"></i></div><div><div class="stat-card__num" id="admin-vacantes">-</div><div class="stat-card__label">Vacantes activas</div></div></div>
      <div class="stat-card"><div class="stat-card__icon red"><i class="fa-solid fa-triangle-exclamation"></i></div><div><div class="stat-card__num" id="admin-pendientes">-</div><div class="stat-card__label">Pendientes revisión</div></div></div>
    </div>
    <div class="section-row"><h2>Registros pendientes de aprobación</h2><button onclick="showPage('pendientes')">Ver todos <i class="fa-solid fa-arrow-right"></i></button></div>
    <div class="data-list" id="admin-pendientes-preview"></div>
  `,

  'admin:estudiantes': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Estudiantes Registrados</h2>
      <div style="display:flex;gap:.5rem">
        <input type="text" placeholder="Buscar por nombre o matrícula..." class="search-input" id="search-estudiantes" oninput="buscarEstudiantes(this.value)">
      </div>
    </div>
    <div class="filters">
      <button class="filter-chip active" onclick="filterEstudiantes('all',this)">Todos</button>
      <button class="filter-chip" onclick="filterEstudiantes('aprobado',this)">Aprobados</button>
      <button class="filter-chip" onclick="filterEstudiantes('pendiente',this)">Pendientes</button>
      <button class="filter-chip" onclick="filterEstudiantes('rechazado',this)">Rechazados</button>
    </div>
    <div class="data-list" id="admin-estudiantes-list"></div>
  `,

  'admin:empresas': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Empresas Registradas</h2>
      <input type="text" placeholder="Buscar empresa..." class="search-input" id="search-empresas" oninput="buscarEmpresas(this.value)">
    </div>
    <div class="filters">
      <button class="filter-chip active" onclick="filterEmpresas('all',this)">Todas</button>
      <button class="filter-chip" onclick="filterEmpresas('aprobado',this)">Aprobadas</button>
      <button class="filter-chip" onclick="filterEmpresas('pendiente',this)">Pendientes</button>
      <button class="filter-chip" onclick="filterEmpresas('rechazado',this)">Rechazadas</button>
    </div>
    <div class="data-list" id="admin-empresas-list"></div>
  `,

  'admin:pendientes': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Registros Pendientes</h2><span style="font-size:12px;color:var(--gray-400)">Revisa y aprueba nuevos registros</span></div>
    <div class="filters">
      <button class="filter-chip active" onclick="filterPendientes('all',this)">Todos</button>
      <button class="filter-chip" onclick="filterPendientes('estudiantes',this)">Estudiantes</button>
      <button class="filter-chip" onclick="filterPendientes('empresas',this)">Empresas</button>
    </div>
    <div class="data-list" id="pendientes-list"></div>
  `,

  'admin:vacantes-admin': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Gestión de Vacantes</h2></div>
    <div class="filters">
      <button class="filter-chip active" onclick="filterVacantesAdmin('all',this)">Todas</button>
      <button class="filter-chip" onclick="filterVacantesAdmin('activa',this)">Activas</button>
      <button class="filter-chip" onclick="filterVacantesAdmin('pendiente',this)">Pendientes</button>
      <button class="filter-chip" onclick="filterVacantesAdmin('cerrada',this)">Cerradas</button>
    </div>
    <div class="data-list" id="admin-vacantes-list"></div>
  `,

  'admin:admins': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Administradores del Sistema</h2>
      <button class="btn-primary-sm" onclick="crearAdmin()"><i class="fa-solid fa-user-plus"></i> Crear admin</button>
    </div>
    <div class="data-list" id="admins-list"></div>
  `,

  'admin:configuracion': () => `
    <div class="section-row"><h2 style="font-size:1.2rem">Configuración del Sistema</h2></div>
    <div class="form-card">
      <h3 style="margin-bottom:1rem;font-size:1rem">Información institucional</h3>
      <div class="form-grid">
        <div class="form-group span2">
          <label>Nombre de la institución</label>
          <input type="text" value="FIEE - Facultad de Ingeniería Eléctrica y Electrónica">
        </div>
        <div class="form-group">
          <label>Correo de vinculación</label>
          <input type="text" value="vinculacion@fiee.edu.mx">
        </div>
        <div class="form-group">
          <label>Periodo escolar activo</label>
          <input type="text" placeholder="Ej: 2024-A">
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-gold" onclick="toast('Configuración guardada','success')"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
      </div>
    </div>
  `
};

/* =============================================
   INICIALIZACIÓN
   ============================================= */
async function initDashboard() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = '../auth/login.html';
      return;
    }
    currentUser = user;

    try {
      let snap = await getDoc(doc(db, 'estudiantes', user.uid));
      if (snap.exists()) {
        userRole = 'estudiante';
        userData = { rol: 'estudiante', ...snap.data() };
      } else {
        snap = await getDoc(doc(db, 'empresas', user.uid));
        if (snap.exists()) {
          userRole = 'empresa';
          userData = { rol: 'empresa', ...snap.data() };
        } else {
          snap = await getDoc(doc(db, 'admins', user.uid));
          if (snap.exists()) {
            userRole = 'admin';
            userData = { rol: 'admin', ...snap.data() };
          } else {
            throw new Error('Usuario no encontrado en ninguna colección');
          }
        }
      }

      setupUI();
      showPage(userRole === 'admin' ? 'dashboard' : 'inicio');
      loadDynamicData();

    } catch (error) {
      console.error('Error:', error);
      document.getElementById('contentArea').innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation" style="color:var(--red)"></i>
          <p>Error al cargar tu panel: ${error.message}</p>
          <button class="btn-gold" onclick="window.location.reload()">Reintentar</button>
        </div>`;
    } finally {
      document.getElementById('loadingOverlay').classList.add('hidden');
    }
  });
}

function setupUI() {
  const badge = document.getElementById('roleBadge');
  badge.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
  badge.className = `sidebar__role-badge ${userRole}`;

  document.getElementById('sidebarAvatar').textContent =
    (userData?.nombre?.[0] || userData?.nombreEmpresa?.[0] || 'U').toUpperCase();
  document.getElementById('sidebarName').textContent =
    userData?.nombre || userData?.nombreEmpresa || userData?.email?.split('@')[0] || 'Usuario';
  document.getElementById('sidebarDetail').textContent =
    userRole === 'estudiante' ? `${userData?.matricula || ''} · ${userData?.carrera || ''}`.trim() :
    userRole === 'empresa' ? `${userData?.sector || ''} · ${userData?.ciudad || ''}`.trim() :
    'Administrador del sistema';

  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = menus[userRole].map(section => `
    <div class="sidebar__section-label">${section.section}</div>
    ${section.items.map(item => `
      <button class="sidebar__link" data-page="${item.page}" onclick="showPage('${item.page}')">
        <i class="fa-solid ${item.icon}"></i> ${item.label}
      </button>
    `).join('')}
  `).join('');

  document.getElementById('profileBtn').onclick = () =>
    showPage(userRole === 'admin' ? 'dashboard' : userRole === 'empresa' ? 'perfil-empresa' : 'perfil');
  document.getElementById('logoutBtn').onclick = doLogout;
  document.getElementById('notifBtn').onclick = () => showPage('notificaciones');
}

window.showPage = function(pageId) {
  document.querySelectorAll('.sidebar__link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === pageId));

  const content = pages[`${userRole}:${pageId}`];
  if (content) {
    document.getElementById('contentArea').innerHTML = content();
    document.querySelector('.content')?.scrollTo(0, 0);
    afterPageRender(pageId);
  } else {
    document.getElementById('contentArea').innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-wrench"></i>
        <p>Página en desarrollo.</p>
        <button class="btn-gold" onclick="showPage('inicio')">Volver al inicio</button>
      </div>`;
  }
};

function afterPageRender(pageId) {
  if (userRole === 'estudiante') {
    if (pageId === 'inicio') { loadOfertasGrid('ofertas-grid', 6); loadStatsEstudiante(); }
    if (pageId === 'ofertas') loadOfertasGrid('ofertas-grid');
    if (pageId === 'postulaciones') loadMisPostulaciones();
    if (pageId === 'perfil') calcularPerfilPct();
    if (pageId === 'notificaciones') loadNotificaciones();
  }
  if (userRole === 'empresa') {
    if (pageId === 'inicio') { loadVacantesHomeEmpresa(); loadStatsEmpresa(); }
    if (pageId === 'vacantes') loadVacantesEmpresa();
    if (pageId === 'candidatos') loadCandidatosEmpresa('all');
    if (pageId === 'notificaciones') loadNotificaciones();
  }
  if (userRole === 'admin') {
    if (pageId === 'dashboard') { loadStatsAdmin(); loadPendientesPreview(); }
    if (pageId === 'estudiantes') loadAdminEstudiantes('all');
    if (pageId === 'empresas') loadAdminEmpresas('all');
    if (pageId === 'pendientes') loadPendientes('all');
    if (pageId === 'vacantes-admin') loadAdminVacantes('all');
    if (pageId === 'admins') loadAdmins();
  }
}

async function loadDynamicData() {
  // inicial
}

async function doLogout() {
  try { await signOut(auth); window.location.href = 'FIEEPruebabeta/index.html'; }
  catch (e) { console.error(e); }
}
window.doLogout = doLogout;

/* =============================================
   ===== MÓDULO: ESTUDIANTE =====
   ============================================= */

// ---------- Ofertas ----------
let _todasOfertas = [];

async function loadOfertasGrid(containerId, lim = 20) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  loading(grid, 'Cargando ofertas...');

  try {
    const q = query(collection(db, 'vacantes'), where('estado', '==', 'activa'), limit(lim));
    const snap = await getDocs(q);
    _todasOfertas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderOfertas(_todasOfertas, containerId);

    const countEl = document.getElementById('stat-ofertas');
    if (countEl) countEl.textContent = snap.size;
  } catch (e) {
    console.error(e);
    grid.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`;
  }
}
window.loadOfertasGrid = loadOfertasGrid;

function renderOfertas(list, containerId = 'ofertas-grid') {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-briefcase"></i><p>No hay ofertas disponibles.</p></div>`;
    return;
  }
  grid.innerHTML = list.map(v => `
    <div class="offer-card">
      <div class="offer-card__top">
        <div class="offer-card__logo">🏢</div>
        <div class="offer-card__badges">
          ${v.tipoPrograma === 'ss' ? '<span class="badge-pill ss">Serv. Social</span>' : ''}
          ${v.tipoPrograma === 'pp' ? '<span class="badge-pill pp">Prácticas</span>' : ''}
          ${v.tipoPrograma === 'ambos' ? '<span class="badge-pill pp">PP / SS</span>' : ''}
        </div>
      </div>
      <div>
        <div class="offer-card__title">${v.titulo || 'Vacante'}</div>
        <div class="offer-card__company">${v.empresaNombre || 'Empresa'}</div>
      </div>
      <div class="offer-card__meta">
        <span class="offer-card__meta-item"><i class="fa-solid fa-location-dot"></i> ${v.modalidad || 'Presencial'}</span>
        <span class="offer-card__meta-item"><i class="fa-solid fa-clock"></i> ${v.horasSemanales || '?'} hrs/sem</span>
        <span class="offer-card__meta-item"><i class="fa-solid fa-coins"></i> ${v.becaOfrecida || 'Sin beca'}</span>
      </div>
      <p style="font-size:12px;color:var(--gray-400);margin:.5rem 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${v.descripcion || ''}</p>
      <div class="offer-card__footer">
        <span class="offer-card__fecha">${fmt(v.fechaPublicacion)}</span>
        <button class="btn-apply" onclick="verOferta('${v.id}')">Ver más <i class="fa-solid fa-arrow-right"></i></button>
      </div>
    </div>
  `).join('');
}

window.filterOffers = function(tipo, btn) {
  document.querySelectorAll('#filterBtns .filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  if (tipo === 'all') return renderOfertas(_todasOfertas);
  const filtradas = _todasOfertas.filter(v =>
    tipo === 'remoto' ? v.modalidad === 'remoto' : v.tipoPrograma === tipo
  );
  renderOfertas(filtradas);
};

window.verOferta = async function(vacId) {
  const snap = await getDoc(doc(db, 'vacantes', vacId));
  if (!snap.exists()) return toast('Oferta no encontrada', 'error');
  const v = snap.data();
  showModal(`
    <h2 style="margin-bottom:.25rem">${v.titulo}</h2>
    <p style="color:var(--gray-400);font-size:13px;margin-bottom:1.25rem">${v.empresaNombre} · ${v.modalidad}</p>
    <div class="modal-info-grid">
      <div><strong>Tipo</strong><br>${v.tipoPrograma === 'pp' ? 'Prácticas Profesionales' : v.tipoPrograma === 'ss' ? 'Servicio Social' : 'PP y SS'}</div>
      <div><strong>Horas/semana</strong><br>${v.horasSemanales || 'N/A'}</div>
      <div><strong>Beca</strong><br>${v.becaOfrecida || 'Sin beca'}</div>
      <div><strong>Plazas</strong><br>${v.plazas || 'N/A'}</div>
      <div><strong>Área</strong><br>${v.area || 'N/A'}</div>
      <div><strong>Carreras</strong><br>${v.carrerasAceptadas || 'Todas'}</div>
    </div>
    <div style="margin:1rem 0">
      <strong>Descripción:</strong>
      <p style="font-size:13px;color:var(--gray-600);margin-top:.5rem;line-height:1.6">${v.descripcion || 'Sin descripción'}</p>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cerrar</button>
      <button class="btn-gold" onclick="postularme('${vacId}','${v.titulo}','${v.empresaNombre || ''}','${snap.id}')">
        <i class="fa-solid fa-paper-plane"></i> Postularme
      </button>
    </div>
  `);
};

window.postularme = async function(vacId, titulo, empresa) {
  if (!userData?.cvUrl) {
    toast('Debes subir tu CV antes de postularte', 'error');
    closeModal();
    showPage('documentos');
    return;
  }

  // verificar si ya se postuló
  const q = query(collection(db, 'postulaciones'),
    where('estudianteId', '==', currentUser.uid),
    where('vacanteId', '==', vacId));
  const existe = await getDocs(q);
  if (!existe.empty) {
    toast('Ya te postulaste a esta vacante', 'info');
    closeModal();
    return;
  }

  // Obtener empresaId de la vacante
  const vacSnap = await getDoc(doc(db, 'vacantes', vacId));
  if (!vacSnap.exists()) return toast('Vacante no encontrada', 'error');
  const vacData = vacSnap.data();

  try {
    await addDoc(collection(db, 'postulaciones'), {
      estudianteId: currentUser.uid,
      estudianteNombre: userData.nombre,
      estudianteEmail: userData.email || currentUser.email,
      estudianteMatricula: userData.matricula || '',
      estudianteCarrera: userData.carrera || '',
      cvUrl: userData.cvUrl,
      cartaUrl: userData.cartaUrl || null,
      vacanteId: vacId,
      vacanteTitulo: titulo,
      empresaNombre: empresa,
      empresaId: vacData.empresaId,
      estado: 'pendiente',
      etapa: 1,
      fechaPostulacion: serverTimestamp()
    });
    toast('¡Postulación enviada con éxito!');
    closeModal();
  } catch (e) {
    console.error(e);
    toast('Error al postularse: ' + e.message, 'error');
  }
};

// ---------- Mis postulaciones ----------
let _misPostulaciones = [];

async function loadMisPostulaciones() {
  const list = document.getElementById('postulaciones-list');
  if (!list) return;
  loading(list, 'Cargando postulaciones...');

  try {
    const q = query(collection(db, 'postulaciones'),
      where('estudianteId', '==', currentUser.uid),
      orderBy('fechaPostulacion', 'desc'));
    const snap = await getDocs(q);
    _misPostulaciones = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderMisPostulaciones(_misPostulaciones);

    const cnt = document.getElementById('postulaciones-count');
    if (cnt) cnt.textContent = `${snap.size} postulación${snap.size !== 1 ? 'es' : ''}`;
  } catch (e) {
    console.error(e);
    list.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`;
  }
}

function renderMisPostulaciones(list) {
  const el = document.getElementById('postulaciones-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-paper-plane"></i><p>No tienes postulaciones aún.<br><button class="btn-gold" onclick="showPage('ofertas')">Ver ofertas</button></p></div>`;
    return;
  }
  const etiquetaEtapa = { 1: 'Enviada', 2: 'En revisión', 3: 'Entrevista', 4: 'Oferta recibida' };
  el.innerHTML = list.map(p => `
    <div class="data-row">
      <div class="row-logo">💼</div>
      <div style="flex:1">
        <div class="row-title">${p.vacanteTitulo}</div>
        <div class="row-subtitle">${p.empresaNombre} · Etapa: ${etiquetaEtapa[p.etapa] || p.etapa}</div>
      </div>
      <div class="row-date">${fmt(p.fechaPostulacion)}</div>
      <span class="status-pill ${p.estado}">${p.estado}</span>
    </div>
  `).join('');
}

window.filterPostulaciones = function(estado, btn) {
  document.querySelectorAll('.filters .filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  const filtradas = estado === 'all' ? _misPostulaciones : _misPostulaciones.filter(p => p.estado === estado);
  renderMisPostulaciones(filtradas);
};

// ---------- Stats estudiante ----------
async function loadStatsEstudiante() {
  try {
    const [ofertas, postulaciones, revision] = await Promise.all([
      getDocs(query(collection(db, 'vacantes'), where('estado', '==', 'activa'))),
      getDocs(query(collection(db, 'postulaciones'), where('estudianteId', '==', currentUser.uid))),
      getDocs(query(collection(db, 'postulaciones'),
        where('estudianteId', '==', currentUser.uid),
        where('estado', '==', 'revision')))
    ]);
    const ofEl = document.getElementById('stat-ofertas');
    const posEl = document.getElementById('stat-postulaciones');
    const revEl = document.getElementById('stat-matches');
    if (ofEl) ofEl.textContent = ofertas.size;
    if (posEl) posEl.textContent = postulaciones.size;
    if (revEl) revEl.textContent = revision.size;
  } catch (e) { console.error(e); }
}

// ---------- Perfil completitud ----------
function calcularPerfilPct() {
  const campos = ['nombre', 'carrera', 'matricula', 'semestre', 'telefono', 'curp', 'nss', 'nivelIngles', 'disponibilidad', 'horasSemanales'];
  const arrays = ['habilidades', 'areasInteres'];
  const docs = ['cvUrl', 'cartaUrl'];
  
  let llenos = campos.filter(c => userData?.[c]).length;
  arrays.forEach(a => {
    if (Array.isArray(userData?.[a]) && userData[a].length > 0) llenos++;
  });
  const docsLlenos = docs.filter(d => userData?.[d]).length;
  const total = campos.length + arrays.length + docs.length;
  const pct = Math.round(((llenos + docsLlenos) / total) * 100);

  const bar = document.getElementById('pct-bar');
  const lbl = document.getElementById('pct-label');
  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = pct + '%';

  const pEl = document.getElementById('stat-perfil');
  if (pEl) pEl.textContent = pct + '%';
}

// ---------- Editar perfil estudiante ----------
window.editarPerfil = function() {
  const h = Array.isArray(userData?.habilidades) ? userData.habilidades.join(', ') : '';
  const ai = Array.isArray(userData?.areasInteres) ? userData.areasInteres.join(', ') : '';
  const te = Array.isArray(userData?.tipoEmpresa) ? userData.tipoEmpresa.join(', ') : '';
  
  showModal(`
    <h2 style="margin-bottom:1.25rem">Editar Perfil Completo</h2>
    <div class="form-grid">
      <div class="form-group"><label>Semestre</label><input type="number" id="ep-semestre" value="${userData?.semestre || ''}" min="1" max="14"></div>
      <div class="form-group"><label>Promedio</label><input type="number" id="ep-promedio" value="${userData?.promedio || ''}" min="0" max="100" step="0.1"></div>
      <div class="form-group"><label>Programa</label>
        <select id="ep-interes">
          <option value="">Seleccionar...</option>
          <option value="Servicio social" ${userData?.interes==='Servicio social'?'selected':''}>Servicio Social</option>
          <option value="Prácticas profesionales" ${userData?.interes==='Prácticas profesionales'?'selected':''}>Prácticas Profesionales</option>
        </select>
      </div>
      <div class="form-group"><label>Teléfono</label><input type="text" id="ep-telefono" value="${userData?.telefono || ''}"></div>
      <div class="form-group"><label>Ciudad</label><input type="text" id="ep-ciudad" value="${userData?.ciudad || ''}"></div>
      <div class="form-group span2"><label>Dirección</label><input type="text" id="ep-direccion" value="${userData?.direccion || ''}"></div>
      <div class="form-group"><label>NSS</label><input type="text" id="ep-nss" value="${userData?.nss || ''}" maxlength="11"></div>
      <div class="form-group span2"><label>Habilidades (coma)</label><textarea id="ep-habilidades" rows="2">${h}</textarea></div>
      <div class="form-group span2"><label>Otras habilidades</label><input type="text" id="ep-otrasHabilidades" value="${userData?.otrasHabilidades || ''}"></div>
      <div class="form-group"><label>Nivel de inglés</label>
        <select id="ep-nivelIngles"><option value="">Seleccionar...</option>${['Básico','Intermedio','Avanzado','Nativo'].map(n=>`<option value="${n}" ${userData?.nivelIngles===n?'selected':''}>${n}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Experiencia</label>
        <select id="ep-experienciaPrevia"><option value="">Seleccionar...</option>${['Sin experiencia','Freelance / proyectos','Empleo formal'].map(e=>`<option value="${e}" ${userData?.experienciaPrevia===e?'selected':''}>${e}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Modalidad</label>
        <select id="ep-modalidad">${['Presencial','Remoto','Híbrido'].map(m=>`<option value="${m}" ${userData?.modalidad===m?'selected':''}>${m}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Turno</label>
        <select id="ep-turno">${['Matutino','Vespertino','Ambos'].map(t=>`<option value="${t}" ${userData?.turno===t?'selected':''}>${t}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Horas/semana</label><input type="number" id="ep-horasSemanales" value="${userData?.horasSemanales || 20}" min="10" max="48" step="2"></div>
      <div class="form-group"><label>¿Reubicación?</label>
        <select id="ep-reubicacion">${['Sí','No','Depende'].map(r=>`<option value="${r}" ${userData?.dispuestoReubicarse===r?'selected':''}>${r}</option>`).join('')}</select>
      </div>
      <div class="form-group span2"><label>Áreas de interés (coma)</label><textarea id="ep-areasInteres" rows="2">${ai}</textarea></div>
      <div class="form-group span2"><label>Tipo de empresa (coma)</label><textarea id="ep-tipoEmpresa" rows="2">${te}</textarea></div>
      <div class="form-group"><label>Expectativa beca</label>
        <select id="ep-beca"><option value="">Seleccionar...</option>${['Sin beca','$1,000 – $2,500','$2,500 – $5,000','$5,000+'].map(b=>`<option value="${b}" ${userData?.expectativaBeca===b?'selected':''}>${b}</option>`).join('')}</select>
      </div>
      <div class="form-group span2"><label>LinkedIn</label><input type="url" id="ep-linkedin" value="${userData?.linkedin || ''}"></div>
      <div class="form-group span2"><label>Descripción personal</label><textarea id="ep-descripcion" rows="3">${userData?.descripcion || ''}</textarea></div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-gold" onclick="guardarPerfil()"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
    </div>
  `);
};

window.guardarPerfil = async function() {
  const campos = {
    semestre: document.getElementById('ep-semestre')?.value || '',
    promedio: parseFloat(document.getElementById('ep-promedio')?.value) || null,
    interes: document.getElementById('ep-interes')?.value || '',
    telefono: document.getElementById('ep-telefono')?.value.trim(),
    ciudad: document.getElementById('ep-ciudad')?.value.trim(),
    direccion: document.getElementById('ep-direccion')?.value.trim(),
    nss: document.getElementById('ep-nss')?.value.trim(),
    habilidades: document.getElementById('ep-habilidades')?.value.split(',').map(s=>s.trim()).filter(Boolean),
    otrasHabilidades: document.getElementById('ep-otrasHabilidades')?.value.trim(),
    nivelIngles: document.getElementById('ep-nivelIngles')?.value,
    experienciaPrevia: document.getElementById('ep-experienciaPrevia')?.value,
    modalidad: document.getElementById('ep-modalidad')?.value,
    turno: document.getElementById('ep-turno')?.value,
    horasSemanales: parseInt(document.getElementById('ep-horasSemanales')?.value) || 20,
    dispuestoReubicarse: document.getElementById('ep-reubicacion')?.value,
    areasInteres: document.getElementById('ep-areasInteres')?.value.split(',').map(s=>s.trim()).filter(Boolean),
    tipoEmpresa: document.getElementById('ep-tipoEmpresa')?.value.split(',').map(s=>s.trim()).filter(Boolean),
    expectativaBeca: document.getElementById('ep-beca')?.value,
    linkedin: document.getElementById('ep-linkedin')?.value.trim(),
    descripcion: document.getElementById('ep-descripcion')?.value.trim()
  };
  
  // Unificar disponibilidad para compatibilidad con filtros
  campos.disponibilidad = [campos.modalidad, campos.turno].filter(Boolean).join(' - ');

  try {
    await updateDoc(doc(db, 'estudiantes', currentUser.uid), campos);
    Object.assign(userData, campos);
    closeModal();
    toast('Perfil actualizado correctamente');
    showPage('perfil');
    // Actualizar sidebar si cambió el nombre
    document.getElementById('sidebarName').textContent = userData.nombre || document.getElementById('sidebarName').textContent;
  } catch (e) {
    toast('Error guardando perfil: ' + e.message, 'error');
  }
};

// ---------- Subir documentos ----------

window.subirCV = async function (event) {
  try {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      return toast('Solo se permiten archivos PDF', 'error');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast('El archivo no debe superar los 5 MB', 'error');
    }

    const user = auth.currentUser;
    if (!user) return toast('Debes iniciar sesión', 'error');

    toast('Subiendo CV...', 'info');

    // ✅ Ruta con {fileName} — coincide con reglas: cv/{userId}/{fileName}
    const fileName = `cv_${Date.now()}.pdf`;
    const storageRef = ref(storage, `cv/${user.uid}/${fileName}`);

    await uploadBytes(storageRef, file, { contentType: 'application/pdf' });
    const downloadURL = await getDownloadURL(storageRef);

    // ✅ Guardar URL en Firestore (faltaba esto)
    await updateDoc(doc(db, 'estudiantes', user.uid), {
      cvUrl: downloadURL,
      cvNombre: file.name
    });

    // Actualizar userData local para reflejar cambio sin recargar
    userData.cvUrl = downloadURL;
    userData.cvNombre = file.name;

    toast('CV subido correctamente');
    event.target.value = '';

    // Refrescar vista de documentos si está activa
    const statusEl = document.getElementById('cv-status');
    if (statusEl) statusEl.textContent = file.name;

  } catch (error) {
    console.error('Error subiendo CV:', error);
    if (error.code === 'storage/unauthorized') {
      toast('Sin permisos. Verifica que tu cuenta esté aprobada', 'error');
    } else {
      toast('Error: ' + error.message, 'error');
    }
  }
};

window.subirCarta = async function (input) {
  const file = input.files[0];
  if (!file) return;

  if (file.type !== 'application/pdf') {
    return toast('Solo se permiten archivos PDF', 'error');
  }
  if (file.size > 5 * 1024 * 1024) {
    return toast('El archivo no debe superar los 5 MB', 'error');
  }

  try {
    toast('Subiendo carta...', 'info');

    // ✅ Ruta con {fileName} — coincide con reglas: cartas/{userId}/{fileName}
    const fileName = `carta_${Date.now()}.pdf`;
    const storageRef = ref(storage, `cartas/${currentUser.uid}/${fileName}`);

    await uploadBytes(storageRef, file, { contentType: 'application/pdf' });
    const url = await getDownloadURL(storageRef);

    await updateDoc(doc(db, 'estudiantes', currentUser.uid), {
      cartaUrl: url,
      cartaNombre: file.name,
      tieneCarta: true
    });

    // Actualizar userData local
    userData.cartaUrl = url;
    userData.cartaNombre = file.name;
    userData.tieneCarta = true;

    toast('Carta subida correctamente');
    input.value = '';

    // Refrescar vista
    const statusEl = document.getElementById('carta-status');
    if (statusEl) statusEl.textContent = file.name;

  } catch (error) {
    console.error('Error subiendo carta:', error);
    if (error.code === 'storage/unauthorized') {
      toast('Sin permisos para subir este archivo', 'error');
    } else {
      toast('Error: ' + error.message, 'error');
    }
  }
};

// ---------- Notificaciones ----------
async function loadNotificaciones() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  try {
    const q = query(collection(db, 'notificaciones'),
      where('userId', '==', currentUser.uid),
      orderBy('fecha', 'desc'), limit(20));
    const snap = await getDocs(q);
    if (snap.empty) {
      list.innerHTML = `<div class="notif-item"><p style="color:var(--gray-400)">No tienes notificaciones.</p></div>`;
      return;
    }
    list.innerHTML = snap.docs.map(d => {
      const n = d.data();
      return `<div class="notif-item ${n.leida ? '' : 'unread'}">
        <div class="notif-icon ${n.tipo || 'blue'}"><i class="fa-solid fa-bell"></i></div>
        <div class="notif-body"><p>${n.mensaje}</p><span class="notif-time">${fmt(n.fecha)}</span></div>
      </div>`;
    }).join('');
  } catch (e) {
    list.innerHTML = `<p style="color:var(--gray-400)">Sin notificaciones.</p>`;
  }
}

/* =============================================
   ===== MÓDULO: EMPRESA =====
   ============================================= */

// ---------- Vacantes empresa ----------
let _vacantesEmpresa = [];

async function loadVacantesEmpresa() {
  const list = document.getElementById('vacantes-list');
  if (!list) return;
  loading(list, 'Cargando vacantes...');
  try {
    const q = query(collection(db, 'vacantes'), where('empresaId', '==', currentUser.uid));
    const snap = await getDocs(q);
    _vacantesEmpresa = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderVacantesEmpresa(_vacantesEmpresa);
  } catch (e) {
    list.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`;
  }
}

function renderVacantesEmpresa(list) {
  const el = document.getElementById('vacantes-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-briefcase"></i><p>No tienes vacantes publicadas.<br><button class="btn-gold" onclick="showPage('crear-vacante')">Crear primera vacante</button></p></div>`;
    return;
  }
  el.innerHTML = list.map(v => `
    <div class="data-row">
      <div class="row-logo">💼</div>
      <div style="flex:1">
        <div class="row-title">${v.titulo}</div>
        <div class="row-subtitle">${v.area || ''} · ${v.modalidad || ''} · ${v.horasSemanales || '?'} hrs/sem</div>
      </div>
      <div class="row-date">${fmt(v.fechaPublicacion)}</div>
      <span class="status-pill ${v.estado === 'activa' ? 'aprobado' : v.estado === 'cerrada' ? 'rechazado' : 'pendiente'}">${v.estado || 'borrador'}</span>
      <div class="row-actions">
        <button class="action-btn view" onclick="verVacanteEmpresa('${v.id}')" title="Ver candidatos"><i class="fa-solid fa-users"></i></button>
        <button class="action-btn reject" onclick="cerrarVacante('${v.id}')" title="Cerrar"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>
  `).join('');
}

window.verVacanteEmpresa = function(vacId) {
  showPage('candidatos');
  setTimeout(() => loadCandidatosEmpresa('all', vacId), 300);
};

window.cerrarVacante = async function(vacId) {
  if (!confirm('¿Cerrar esta vacante? Ya no recibirá postulaciones.')) return;
  try {
    await updateDoc(doc(db, 'vacantes', vacId), { estado: 'cerrada' });
    toast('Vacante cerrada');
    loadVacantesEmpresa();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
};

async function loadVacantesHomeEmpresa() {
  const grid = document.getElementById('vacantes-home-grid');
  if (!grid) return;
  try {
    const q = query(collection(db, 'vacantes'), where('empresaId', '==', currentUser.uid), limit(4));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-briefcase"></i><p>No hay vacantes.</p></div>`;
      return;
    }
    grid.innerHTML = list.map(v => `
      <div class="offer-card">
        <div class="offer-card__title">${v.titulo}</div>
        <div class="offer-card__company">${v.area || 'Área'}</div>
        <div class="offer-card__meta">
          <span class="offer-card__meta-item"><i class="fa-solid fa-location-dot"></i> ${v.modalidad}</span>
          <span class="offer-card__meta-item"><i class="fa-solid fa-clock"></i> ${v.horasSemanales} hrs</span>
        </div>
        <span class="status-pill ${v.estado === 'activa' ? 'aprobado' : 'pendiente'}">${v.estado}</span>
      </div>`).join('');

    document.getElementById('stat-vacantes').textContent = snap.size;
  } catch (e) { console.error(e); }
}

// ---------- Crear vacante ----------
window.crearVacante = async function() {
  // ===== 1. OBTENER VALORES DEL FORMULARIO =====
  const titulo = document.getElementById('v-titulo')?.value.trim();
  const area = document.getElementById('v-area')?.value.trim();
  const tipo = document.getElementById('v-tipo')?.value;
  const modalidad = document.getElementById('v-modalidad')?.value;
  const horas = document.getElementById('v-horas')?.value;
  const beca = document.getElementById('v-beca')?.value.trim();
  const carrerasRaw = document.getElementById('v-carreras')?.value.trim();
  const semestreMin = document.getElementById('v-semestreMin')?.value;
  const promedioMin = document.getElementById('v-promedioMin')?.value;
  const habilidadesRaw = document.getElementById('v-habilidades')?.value.trim();
  const ingles = document.getElementById('v-ingles')?.value;
  const exp = document.getElementById('v-exp')?.value;
  const descripcion = document.getElementById('v-descripcion')?.value.trim();
  const fechaLimite = document.getElementById('v-fecha-limite')?.value;
  const plazas = document.getElementById('v-plazas')?.value;
  const beneficiosRaw = document.getElementById('v-beneficios')?.value.trim();
  
  // ===== 2. VALIDACIONES OBLIGATORIAS =====
  if (!titulo || !area || !tipo || !descripcion) {
    return toast('❌ Completa los campos obligatorios (*)', 'error');
  }
  
  // ===== 3. CONVERTIR STRINGS A ARRAYS =====
  const carrerasAceptadas = carrerasRaw ? carrerasRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const habilidadesReq = habilidadesRaw ? habilidadesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const beneficios = beneficiosRaw ? beneficiosRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  
  try {
    // ===== 4. 🔍 VERIFICAR QUE LA EMPRESA EXISTA Y ESTÉ APROBADA =====
    // Esto es CRÍTICO para que las reglas de seguridad permitan la creación
    const empresaRef = doc(db, 'empresas', currentUser.uid);
    const empresaSnap = await getDoc(empresaRef);
    
    if (!empresaSnap.exists()) {
      throw new Error('⚠️ No encontré el registro de tu empresa. Completa el registro primero.');
    }
    
    const empresaData = empresaSnap.data();
    
    // Verificar estado de aprobación
    if (empresaData.estado !== 'aprobado') {
      throw new Error(`⏳ Tu empresa está "${empresaData.estado}". Un administrador debe aprobarla antes de publicar vacantes.`);
    }
    
    // ===== 5. CREAR LA VACANTE EN FIRESTORE =====
    await addDoc(collection(db, 'vacantes'), {
      // Datos básicos
      titulo,
      area,
      tipoPrograma: tipo,
      modalidad: modalidad || 'presencial',
      horasSemanales: parseInt(horas) || 20,
      becaOfrecida: beca || 'Sin beca',
      descripcion,
      
      // Filtros de matching (para usar en dashboard)
      carrerasAceptadas,
      semestreMin: semestreMin || null,
      promedioMin: promedioMin ? parseFloat(promedioMin) : null,
      habilidadesReq,
      otrasHabilidades: habilidadesRaw || '',
      inglesReq: ingles || null,
      expReq: exp || null,
      
      // Condiciones
      fechaLimite: fechaLimite || null,
      plazas: parseInt(plazas) || 1,
      beneficios,
      
      // ✅ Metadata de empresa (CRÍTICO para las reglas de seguridad)
      empresaId: currentUser.uid,              // ← DEBE coincidir con request.auth.uid
      empresaNombre: empresaData.nombreEmpresa || userData?.nombreEmpresa || 'Empresa',
      empresaSector: empresaData.sector || userData?.sector || '',
      empresaCiudad: empresaData.ciudad || userData?.ciudad || '',
      
      // ✅ Estado (CRÍTICO para las reglas de seguridad)
      estado: 'activa',                        // ← Exactamente 'activa' en minúsculas
      
      // Timestamps
      fechaPublicacion: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // ===== 6. ÉXITO =====
    toast('✅ ¡Vacante publicada exitosamente!');
    showPage('vacantes');
    
  } catch (error) {
    console.error('❌ Error en crearVacante:', error);
    
    // Mensajes amigables según el tipo de error
    let mensaje = error.message;
    
    if (error.code === 'permission-denied') {
      mensaje = '🔐 Permiso denegado. Verifica que tu empresa esté aprobada por un administrador.';
    } else if (error.code === 'failed-precondition') {
      mensaje = '⚠️ La base de datos requiere un índice. Contacta al administrador.';
    }
    
    toast('❌ ' + mensaje, 'error');
  }
};

// ---------- Candidatos empresa ----------
let _candidatos = [];

async function loadCandidatosEmpresa(filtro = 'all', vacId = null) {
  const list = document.getElementById('candidatos-list');
  if (!list) return;
  loading(list, 'Cargando candidatos...');

  try {
    let q;
    if (vacId) {
      q = query(collection(db, 'postulaciones'), where('vacanteId', '==', vacId));
    } else {
      // Obtener todas las vacantes de la empresa primero
      const vacSnap = await getDocs(query(collection(db, 'vacantes'), where('empresaId', '==', currentUser.uid)));
      const vacIds = vacSnap.docs.map(d => d.id);
      if (!vacIds.length) {
        list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-users"></i><p>No tienes vacantes aún.</p></div>`;
        return;
      }
      // Firestore 'in' soporta max 10 elementos
      q = query(collection(db, 'postulaciones'), where('vacanteId', 'in', vacIds.slice(0, 10)));
    }

    const snap = await getDocs(q);
    _candidatos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const filtrados = filtro === 'all' ? _candidatos : _candidatos.filter(c => c.estado === filtro);
    renderCandidatos(filtrados);

    const cntEl = document.getElementById('stat-candidatos');
    if (cntEl) cntEl.textContent = snap.size;
  } catch (e) {
    list.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`;
  }
}

function renderCandidatos(list) {
  const el = document.getElementById('candidatos-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-users"></i><p>No hay candidatos con este filtro.</p></div>`;
    return;
  }
  const etiquetaEtapa = { 1: 'Enviada', 2: 'En revisión', 3: 'Entrevista', 4: 'Oferta enviada' };
  el.innerHTML = list.map(c => `
    <div class="data-row">
      <div class="row-logo" style="background:var(--blue-pale);border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--blue-mid)">
        ${(c.estudianteNombre?.[0] || 'E').toUpperCase()}
      </div>
      <div style="flex:1">
        <div class="row-title">${c.estudianteNombre || 'Estudiante'}</div>
        <div class="row-subtitle">${c.estudianteCarrera || ''} · ${c.vacanteTitulo || ''} · Etapa: ${etiquetaEtapa[c.etapa] || c.etapa}</div>
      </div>
      <div class="row-date">${fmt(c.fechaPostulacion)}</div>
      <span class="status-pill ${c.estado}">${c.estado}</span>
      <div class="row-actions">
        ${c.cvUrl ? `<a href="${c.cvUrl}" target="_blank" class="action-btn view" title="Ver CV"><i class="fa-solid fa-file-lines"></i></a>` : ''}
        <button class="action-btn approve" onclick="avanzarCandidato('${c.id}',${c.etapa})" title="Avanzar etapa"><i class="fa-solid fa-arrow-right"></i></button>
        <button class="action-btn approve" onclick="cambiarEstadoCandidato('${c.id}','aceptado')" title="Aceptar"><i class="fa-solid fa-check"></i></button>
        <button class="action-btn reject" onclick="cambiarEstadoCandidato('${c.id}','rechazado')" title="Rechazar"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>
  `).join('');
}

window.filterCandidatos = function(filtro, btn) {
  document.querySelectorAll('#cand-filters .filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  const filtrados = filtro === 'all' ? _candidatos : _candidatos.filter(c => c.estado === filtro);
  renderCandidatos(filtrados);
};

window.cambiarEstadoCandidato = async function(postId, estado) {
  try {
    await updateDoc(doc(db, 'postulaciones', postId), { estado, fechaActualizacion: serverTimestamp() });
    // Notificar al estudiante
    const postSnap = await getDoc(doc(db, 'postulaciones', postId));
    if (postSnap.exists()) {
      const p = postSnap.data();
      await addDoc(collection(db, 'notificaciones'), {
        userId: p.estudianteId,
        mensaje: `Tu postulación a "${p.vacanteTitulo}" ha sido ${estado === 'aceptado' ? 'aceptada ✓' : 'rechazada ✗'}.`,
        tipo: estado === 'aceptado' ? 'green' : 'red',
        leida: false,
        fecha: serverTimestamp()
      });
    }
    toast(`Candidato ${estado}`);
    loadCandidatosEmpresa('all');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
};

window.avanzarCandidato = async function(postId, etapaActual) {
  const nuevaEtapa = Math.min((etapaActual || 1) + 1, 4);
  const etapas = { 1: 'Enviada', 2: 'En revisión', 3: 'Entrevista', 4: 'Oferta enviada' };
  try {
    await updateDoc(doc(db, 'postulaciones', postId), {
      etapa: nuevaEtapa, estado: 'revision', fechaActualizacion: serverTimestamp()
    });
    const pSnap = await getDoc(doc(db, 'postulaciones', postId));
    if (pSnap.exists()) {
      await addDoc(collection(db, 'notificaciones'), {
        userId: pSnap.data().estudianteId,
        mensaje: `Tu postulación a "${pSnap.data().vacanteTitulo}" avanzó a la etapa: ${etapas[nuevaEtapa]}.`,
        tipo: 'blue', leida: false, fecha: serverTimestamp()
      });
    }
    toast(`Candidato avanzado a etapa: ${etapas[nuevaEtapa]}`);
    loadCandidatosEmpresa('all');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
};

// ---------- Stats empresa ----------
async function loadStatsEmpresa() {
  try {
    const vacSnap = await getDocs(query(collection(db, 'vacantes'),
      where('empresaId', '==', currentUser.uid), where('estado', '==', 'activa')));
    const el = document.getElementById('stat-vacantes');
    if (el) el.textContent = vacSnap.size;
  } catch (e) { console.error(e); }
}

// ---------- Editar perfil empresa ----------
window.editarPerfilEmpresa = function() {
  // Helper para convertir arrays a strings para inputs
  const arrToStr = (arr) => Array.isArray(arr) ? arr.join(', ') : '';
  
  showModal(`
    <h2 style="margin-bottom:1.25rem">Editar Perfil de Empresa</h2>
    
    <!-- Datos generales -->
    <h4 style="margin:1rem 0 .5rem;font-size:.95rem;color:var(--gray-600)">📋 Datos generales</h4>
    <div class="form-grid">
      <div class="form-group span2"><label>Nombre de la empresa</label>
        <input type="text" id="ee-nombre" value="${userData?.nombreEmpresa || ''}"></div>
      <div class="form-group"><label>RFC</label>
        <input type="text" id="ee-rfc" value="${userData?.rfc || ''}" maxlength="13"></div>
      <div class="form-group"><label>Sector</label>
        <select id="ee-sector">
          <option value="">Seleccionar...</option>
          ${['tecnologia','manufactura','automotriz','salud','educacion','gobierno','energia','logistica','finanzas','otro']
            .map(s => `<option value="${s}" ${userData?.sector===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
        </select></div>
      <div class="form-group"><label>Tamaño</label>
        <select id="ee-tamano">
          <option value="">Seleccionar...</option>
          ${['1-10','11-50','51-200','201-500','500+'].map(t => `<option value="${t}" ${userData?.tamaño===t?'selected':''}>${t} empleados</option>`).join('')}
        </select></div>
      <div class="form-group"><label>Año de fundación</label>
        <input type="number" id="ee-fundacion" value="${userData?.fundacion || ''}" min="1900" max="2025"></div>
      <div class="form-group"><label>Ciudad</label>
        <input type="text" id="ee-ciudad" value="${userData?.ciudad || ''}"></div>
      <div class="form-group"><label>Sitio web</label>
        <input type="url" id="ee-web" value="${userData?.sitioWeb || ''}"></div>
      <div class="form-group span2"><label>Descripción</label>
        <textarea id="ee-desc" rows="3">${userData?.descripcionEmpresa || ''}</textarea></div>
    </div>
    
    <!-- Contacto -->
    <h4 style="margin:1rem 0 .5rem;font-size:.95rem;color:var(--gray-600)">👤 Contacto</h4>
    <div class="form-grid">
      <div class="form-group"><label>Responsable</label>
        <input type="text" id="ee-contactoNombre" value="${userData?.contactoNombre || ''}"></div>
      <div class="form-group"><label>Puesto</label>
        <input type="text" id="ee-contactoPuesto" value="${userData?.contactoPuesto || ''}"></div>
      <div class="form-group"><label>Teléfono</label>
        <input type="tel" id="ee-telefono" value="${userData?.telefono || userData?.contactoTel || ''}"></div>
      <div class="form-group"><label>Correo de contacto</label>
        <input type="email" id="ee-contactoEmail" value="${userData?.contactoEmail || ''}"></div>
    </div>
    
    <!-- Perfil de vacante -->
    <h4 style="margin:1rem 0 .5rem;font-size:.95rem;color:var(--gray-600)">💼 Perfil de vacante (pre-configuración)</h4>
    <div class="form-grid">
      <div class="form-group"><label>Programa</label>
        <select id="ee-tipoPrograma">
          <option value="">Seleccionar...</option>
          ${['Servicio social','Prácticas profesionales','Ambos'].map(p => `<option value="${p}" ${userData?.tipoPrograma===p?'selected':''}>${p}</option>`).join('')}
        </select></div>
      <div class="form-group"><label>Título base</label>
        <input type="text" id="ee-vacanteTitulo" value="${userData?.vacanteTitulo || ''}"></div>
      <div class="form-group"><label>Área</label>
        <input type="text" id="ee-vacanteArea" value="${userData?.vacanteArea || ''}"></div>
      <div class="form-group span2"><label>Carreras aceptadas (coma)</label>
        <input type="text" id="ee-carreras" value="${arrToStr(userData?.carrerasAceptadas)}" placeholder="Ej: Ing. Informatica, Ing. Mecatronica"></div>
      <div class="form-group"><label>Semestre mínimo</label>
        <select id="ee-semestreMin">
          <option value="">Sin requisito</option>
          ${['6','7','8','9','10'].map(s => `<option value="${s}" ${userData?.semestreMin===s?'selected':''}>${s}°</option>`).join('')}
        </select></div>
      <div class="form-group"><label>Promedio mínimo</label>
        <input type="number" id="ee-promedioMin" value="${userData?.promedioMin || ''}" min="0" max="100" step="0.5"></div>
      <div class="form-group span2"><label>Habilidades por carrera (JSON)</label>
        <textarea id="ee-habilidadesReq" rows="3" placeholder='{"Ing. Informatica": ["Python", "React"]}'>${userData?.habilidadesReq ? JSON.stringify(userData.habilidadesReq, null, 2) : ''}</textarea>
        <p style="font-size:11px;color:var(--gray-400);margin-top:.25rem">Formato JSON: {"Carrera": ["hab1", "hab2"]}</p></div>
      <div class="form-group"><label>Inglés requerido</label>
        <select id="ee-inglesReq">
          <option value="">Seleccionar...</option>
          ${['No requerido','Básico','Intermedio','Avanzado'].map(n => `<option value="${n}" ${userData?.inglesReq===n?'selected':''}>${n}</option>`).join('')}
        </select></div>
      <div class="form-group"><label>Experiencia</label>
        <select id="ee-expReq">
          <option value="">Seleccionar...</option>
          ${['No requerida','Deseable','Obligatoria'].map(e => `<option value="${e}" ${userData?.expReq===e?'selected':''}>${e}</option>`).join('')}
        </select></div>
      <div class="form-group span2"><label>Descripción base</label>
        <textarea id="ee-descVacante" rows="3">${userData?.descripcionVacante || ''}</textarea></div>
    </div>
    
    <!-- Condiciones -->
    <h4 style="margin:1rem 0 .5rem;font-size:.95rem;color:var(--gray-600)">⚙️ Condiciones</h4>
    <div class="form-grid">
      <div class="form-group"><label>Modalidad</label>
        <select id="ee-modalidad">${['Presencial','Remoto','Híbrido'].map(m => `<option value="${m}" ${userData?.modalidad===m?'selected':''}>${m}</option>`).join('')}</select></div>
      <div class="form-group"><label>Turno</label>
        <select id="ee-turno">${['Matutino','Vespertino','Ambos'].map(t => `<option value="${t}" ${userData?.turno===t?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="form-group"><label>Duración</label>
        <select id="ee-duracion">${['3 meses','6 meses','1 año','Flexible'].map(d => `<option value="${d}" ${userData?.duracion===d?'selected':''}>${d}</option>`).join('')}</select></div>
      <div class="form-group"><label>Horas/semana</label>
        <input type="number" id="ee-horas" value="${userData?.horasSemanales || 20}" min="10" max="48" step="2"></div>
      <div class="form-group"><label>Beca ofrecida</label>
        <select id="ee-beca">
          <option value="">Seleccionar...</option>
          ${['Sin beca','$1,000 – $2,500','$2,500 – $5,000','$5,000+'].map(b => `<option value="${b}" ${userData?.becaOfrecida===b?'selected':''}>${b}</option>`).join('')}
        </select></div>
      <div class="form-group"><label>Plazas típicas</label>
        <input type="number" id="ee-plazas" value="${userData?.plazas || 1}" min="1" max="50"></div>
      <div class="form-group span2"><label>Beneficios (coma)</label>
        <input type="text" id="ee-beneficios" value="${arrToStr(userData?.beneficios)}" placeholder="Ej: Transporte, Seguro médico, Capacitación"></div>
    </div>
    
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-gold" onclick="guardarPerfilEmpresa()"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
    </div>
  `);
};

window.guardarPerfilEmpresa = async function() {
  // Helper para convertir string a array (separado por comas)
  const strToArr = (str) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
  
  // Parsear habilidadesReq (JSON)
  let habilidadesReq = {};
  try {
    const raw = document.getElementById('ee-habilidadesReq')?.value.trim();
    habilidadesReq = raw ? JSON.parse(raw) : {};
  } catch (e) {
    toast('⚠️ Habilidades: Formato JSON inválido. Usando valor anterior.', 'warning');
    habilidadesReq = userData?.habilidadesReq || {};
  }
  
  const campos = {
    // Generales
    nombreEmpresa: document.getElementById('ee-nombre')?.value.trim(),
    rfc: document.getElementById('ee-rfc')?.value.trim().toUpperCase(),
    sector: document.getElementById('ee-sector')?.value,
    tamaño: document.getElementById('ee-tamano')?.value,
    fundacion: document.getElementById('ee-fundacion')?.value,
    ciudad: document.getElementById('ee-ciudad')?.value.trim(),
    sitioWeb: document.getElementById('ee-web')?.value.trim(),
    descripcionEmpresa: document.getElementById('ee-desc')?.value.trim(),
    
    // Contacto
    contactoNombre: document.getElementById('ee-contactoNombre')?.value.trim(),
    contactoPuesto: document.getElementById('ee-contactoPuesto')?.value.trim(),
    telefono: document.getElementById('ee-telefono')?.value.trim().replace(/\s/g, ''),
    contactoEmail: document.getElementById('ee-contactoEmail')?.value.trim(),
    
    // Perfil de vacante
    tipoPrograma: document.getElementById('ee-tipoPrograma')?.value,
    vacanteTitulo: document.getElementById('ee-vacanteTitulo')?.value.trim(),
    vacanteArea: document.getElementById('ee-vacanteArea')?.value.trim(),
    carrerasAceptadas: strToArr(document.getElementById('ee-carreras')?.value),
    semestreMin: document.getElementById('ee-semestreMin')?.value,
    promedioMin: parseFloat(document.getElementById('ee-promedioMin')?.value) || null,
    habilidadesReq,
    inglesReq: document.getElementById('ee-inglesReq')?.value,
    expReq: document.getElementById('ee-expReq')?.value,
    descripcionVacante: document.getElementById('ee-descVacante')?.value.trim(),
    
    // Condiciones
    modalidad: document.getElementById('ee-modalidad')?.value,
    turno: document.getElementById('ee-turno')?.value,
    duracion: document.getElementById('ee-duracion')?.value,
    horasSemanales: parseInt(document.getElementById('ee-horas')?.value) || 20,
    becaOfrecida: document.getElementById('ee-beca')?.value,
    plazas: document.getElementById('ee-plazas')?.value || "1",
    beneficios: strToArr(document.getElementById('ee-beneficios')?.value),
    
    // Metadata
    updatedAt: serverTimestamp()
  };

  try {
    await updateDoc(doc(db, 'empresas', currentUser.uid), campos);
    Object.assign(userData, campos);
    closeModal();
    toast('✅ Perfil actualizado correctamente');
    showPage('perfil-empresa');
    // Actualizar sidebar
    document.getElementById('sidebarName').textContent = campos.nombreEmpresa || userData.nombreEmpresa;
  } catch (e) {
    console.error(e);
    toast('❌ Error guardando perfil: ' + e.message, 'error');
  }
};
/* =============================================
   ===== MÓDULO: ADMIN =====
   ============================================= */

// ---------- Stats admin ----------
async function loadStatsAdmin() {
  try {
    const [est, emp, vac] = await Promise.all([
      getDocs(collection(db, 'estudiantes')),
      getDocs(collection(db, 'empresas')),
      getDocs(query(collection(db, 'vacantes'), where('estado', '==', 'activa')))
    ]);
    const [pendEst, pendEmp] = await Promise.all([
      getDocs(query(collection(db, 'estudiantes'), where('estado', '==', 'pendiente'))),
      getDocs(query(collection(db, 'empresas'), where('estado', '==', 'pendiente')))
    ]);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('admin-estudiantes', est.size);
    set('admin-empresas', emp.size);
    set('admin-vacantes', vac.size);
    set('admin-pendientes', pendEst.size + pendEmp.size);
  } catch (e) { console.error(e); }
}

// ---------- Preview pendientes en dashboard ----------
async function loadPendientesPreview() {
  const el = document.getElementById('admin-pendientes-preview');
  if (!el) return;
  loading(el);
  try {
    const [estSnap, empSnap] = await Promise.all([
      getDocs(query(collection(db, 'estudiantes'), where('estado', '==', 'pendiente'), limit(3))),
      getDocs(query(collection(db, 'empresas'), where('estado', '==', 'pendiente'), limit(3)))
    ]);
    const pendientes = [
      ...estSnap.docs.map(d => ({ tipo: 'estudiante', id: d.id, ...d.data() })),
      ...empSnap.docs.map(d => ({ tipo: 'empresa', id: d.id, ...d.data() }))
    ].slice(0, 5);

    if (!pendientes.length) {
      el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-check"></i><p>¡No hay registros pendientes!</p></div>`;
      return;
    }
    el.innerHTML = pendientes.map(p => `
      <div class="data-row">
        <span class="badge-pill ${p.tipo === 'estudiante' ? 'pp' : 'gold'}">${p.tipo === 'estudiante' ? '🎓' : '🏢'} ${p.tipo}</span>
        <div style="flex:1"><div class="row-title">${p.nombre || p.nombreEmpresa}</div>
          <div class="row-subtitle">${p.email || ''}</div></div>
        <div class="row-date">${fmt(p.createdAt)}</div>
        <div class="row-actions">
          <button class="action-btn approve" onclick="aprobarRegistro('${p.tipo}','${p.id}')"><i class="fa-solid fa-check"></i></button>
          <button class="action-btn reject" onclick="rechazarRegistro('${p.tipo}','${p.id}')"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>`).join('');
  } catch (e) { el.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`; }
}

// ---------- Pendientes completos ----------
let _pendientesData = [];

async function loadPendientes(filtro = 'all') {
  const list = document.getElementById('pendientes-list');
  if (!list) return;
  loading(list);
  try {
    const [estSnap, empSnap] = await Promise.all([
      getDocs(query(collection(db, 'estudiantes'), where('estado', '==', 'pendiente'))),
      getDocs(query(collection(db, 'empresas'), where('estado', '==', 'pendiente')))
    ]);
    _pendientesData = [
      ...estSnap.docs.map(d => ({ tipo: 'estudiante', id: d.id, ...d.data() })),
      ...empSnap.docs.map(d => ({ tipo: 'empresa', id: d.id, ...d.data() }))
    ];
    renderPendientes(_pendientesData, filtro);
  } catch (e) { list.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`; }
}

function renderPendientes(list, filtro = 'all') {
  const el = document.getElementById('pendientes-list');
  if (!el) return;
  const filtrados = filtro === 'all' ? list :
    filtro === 'estudiantes' ? list.filter(p => p.tipo === 'estudiante') :
    list.filter(p => p.tipo === 'empresa');

  if (!filtrados.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-check"></i><p>No hay registros pendientes.</p></div>`;
    return;
  }
  el.innerHTML = filtrados.map(p => `
    <div class="data-row" id="pend-${p.id}">
      <span class="badge-pill ${p.tipo === 'estudiante' ? 'pp' : 'gold'}">${p.tipo === 'estudiante' ? '🎓 Est' : '🏢 Emp'}</span>
      <div style="flex:1">
        <div class="row-title">${p.nombre || p.nombreEmpresa}</div>
        <div class="row-subtitle">${p.email} · ${p.tipo === 'estudiante' ? (p.carrera || '') : (p.sector || '')}</div>
      </div>
      <div class="row-date">${fmt(p.createdAt)}</div>
      ${p.cvUrl ? `<a href="${p.cvUrl}" target="_blank" class="action-btn view" title="CV"><i class="fa-solid fa-file-lines"></i></a>` : ''}
      ${p.convenioUrl ? `<a href="${p.convenioUrl}" target="_blank" class="action-btn view" title="Convenio"><i class="fa-solid fa-file-contract"></i></a>` : ''}
      <button class="action-btn view" onclick="verDetalleRegistro('${p.tipo}','${p.id}')" title="Ver detalles"><i class="fa-solid fa-eye"></i></button>
      <button class="action-btn approve" onclick="aprobarRegistro('${p.tipo}','${p.id}')" title="Aprobar"><i class="fa-solid fa-check"></i></button>
      <button class="action-btn reject" onclick="rechazarRegistro('${p.tipo}','${p.id}')" title="Rechazar"><i class="fa-solid fa-xmark"></i></button>
    </div>`).join('');
}

window.filterPendientes = function(filtro, btn) {
  document.querySelectorAll('.filters .filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderPendientes(_pendientesData, filtro);
};

window.aprobarRegistro = async function(tipo, id) {
  if (!confirm(`¿Aprobar este registro de ${tipo}?`)) return;
  try {
    const colRef = tipo === 'estudiante' ? 'estudiantes' : 'empresas';
    await updateDoc(doc(db, colRef, id), { estado: 'aprobado', fechaAprobacion: serverTimestamp() });
    // Notificación al usuario
    await addDoc(collection(db, 'notificaciones'), {
      userId: id,
      mensaje: `¡Tu registro en la Plataforma FIEE ha sido aprobado! Ya puedes acceder a todas las funciones.`,
      tipo: 'green', leida: false, fecha: serverTimestamp()
    });
    toast(`✓ ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} aprobado`);
    // Remover del DOM
    document.getElementById(`pend-${id}`)?.remove();
    // Actualizar stats
    const cnt = document.getElementById('admin-pendientes');
    if (cnt) cnt.textContent = Math.max(0, parseInt(cnt.textContent) - 1);
    loadPendientes();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
};
window.aprobarRegistro = window.aprobarRegistro; // asegurar scope global

window.rechazarRegistro = async function(tipo, id) {
  const motivo = prompt('Motivo del rechazo (se enviará al usuario):');
  if (motivo === null) return; // canceló
  try {
    const colRef = tipo === 'estudiante' ? 'estudiantes' : 'empresas';
    await updateDoc(doc(db, colRef, id), { estado: 'rechazado', motivoRechazo: motivo, fechaRechazo: serverTimestamp() });
    await addDoc(collection(db, 'notificaciones'), {
      userId: id,
      mensaje: `Tu registro fue rechazado.${motivo ? ' Motivo: ' + motivo : ''} Contacta a vinculacion@fiee.edu.mx para más información.`,
      tipo: 'red', leida: false, fecha: serverTimestamp()
    });
    toast(`✗ ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} rechazado`);
    loadPendientes();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
};

window.verDetalleRegistro = async function(tipo, id) {
  const colRef = tipo === 'estudiante' ? 'estudiantes' : 'empresas';
  const snap = await getDoc(doc(db, colRef, id));
  if (!snap.exists()) return;
  const d = snap.data();

  const campos = tipo === 'estudiante' ? `
    <div class="modal-info-grid">
      <div><strong>Nombre</strong><br>${d.nombre || '-'}</div>
      <div><strong>Matrícula</strong><br>${d.matricula || '-'}</div>
      <div><strong>Carrera</strong><br>${d.carrera || '-'}</div>
      <div><strong>Semestre</strong><br>${d.semestre || '-'}</div>
      <div><strong>Email</strong><br>${d.email || '-'}</div>
      <div><strong>Teléfono</strong><br>${d.telefono || '-'}</div>
      <div><strong>CURP</strong><br>${d.curp || '-'}</div>
      <div><strong>NSS</strong><br>${d.nss || '-'}</div>
    </div>
    ${d.cvUrl ? `<a href="${d.cvUrl}" target="_blank" class="btn-secondary-sm" style="margin-top:1rem;display:inline-block"><i class="fa-solid fa-file-lines"></i> Ver CV</a>` : '<p style="color:var(--gray-400);font-size:13px;margin-top:.5rem">Sin CV subido</p>'}
  ` : `
    <div class="modal-info-grid">
      <div><strong>Empresa</strong><br>${d.nombreEmpresa || '-'}</div>
      <div><strong>RFC</strong><br>${d.rfc || '-'}</div>
      <div><strong>Sector</strong><br>${d.sector || '-'}</div>
      <div><strong>Ciudad</strong><br>${d.ciudad || '-'}</div>
      <div><strong>Email</strong><br>${d.email || '-'}</div>
      <div><strong>Teléfono</strong><br>${d.telefono || '-'}</div>
    </div>
    <p style="font-size:13px;margin-top:.75rem;color:var(--gray-600)">${d.descripcionEmpresa || ''}</p>
    ${d.convenioUrl ? `<a href="${d.convenioUrl}" target="_blank" class="btn-secondary-sm" style="margin-top:1rem;display:inline-block"><i class="fa-solid fa-file-contract"></i> Ver Convenio</a>` : '<p style="color:var(--gray-400);font-size:13px">Sin convenio subido</p>'}
  `;

  showModal(`
    <h2 style="margin-bottom:.25rem">Detalles: ${tipo === 'estudiante' ? d.nombre : d.nombreEmpresa}</h2>
    <p style="color:var(--gray-400);font-size:13px;margin-bottom:1rem">Registro ${tipo} · ${fmt(d.createdAt)}</p>
    ${campos}
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cerrar</button>
      <button class="btn-gold" onclick="closeModal();aprobarRegistro('${tipo}','${id}')"><i class="fa-solid fa-check"></i> Aprobar</button>
      <button class="btn-danger" onclick="closeModal();rechazarRegistro('${tipo}','${id}')"><i class="fa-solid fa-xmark"></i> Rechazar</button>
    </div>
  `);
};

// ---------- Estudiantes admin ----------
let _adminEstudiantes = [];

async function loadAdminEstudiantes(filtro = 'all') {
  const list = document.getElementById('admin-estudiantes-list');
  if (!list) return;
  loading(list);
  try {
    const snap = await getDocs(collection(db, 'estudiantes'));
    _adminEstudiantes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAdminEstudiantes(_adminEstudiantes, filtro);
  } catch (e) { list.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`; }
}

function renderAdminEstudiantes(list, filtro = 'all') {
  const el = document.getElementById('admin-estudiantes-list');
  if (!el) return;
  const filtrados = filtro === 'all' ? list : list.filter(e => e.estado === filtro);
  if (!filtrados.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-graduation-cap"></i><p>No hay estudiantes con este filtro.</p></div>`;
    return;
  }
  el.innerHTML = filtrados.map(e => `
    <div class="data-row">
      <div class="row-logo" style="background:var(--blue-pale);border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--blue-mid)">
        ${(e.nombre?.[0] || 'E').toUpperCase()}
      </div>
      <div style="flex:1">
        <div class="row-title">${e.nombre || 'Sin nombre'}</div>
        <div class="row-subtitle">${e.matricula || ''} · ${e.carrera || ''} · ${e.semestre || '?'}° sem</div>
      </div>
      <div class="row-date">${e.email}</div>
      <span class="status-pill ${e.estado || 'pendiente'}">${e.estado || 'pendiente'}</span>
      <div class="row-actions">
        <button class="action-btn view" onclick="verDetalleRegistro('estudiante','${e.id}')" title="Ver"><i class="fa-solid fa-eye"></i></button>
        ${e.cvUrl ? `<a href="${e.cvUrl}" target="_blank" class="action-btn view" title="CV"><i class="fa-solid fa-file-lines"></i></a>` : ''}
        ${e.estado === 'pendiente' ? `
          <button class="action-btn approve" onclick="aprobarRegistro('estudiante','${e.id}')" title="Aprobar"><i class="fa-solid fa-check"></i></button>
          <button class="action-btn reject" onclick="rechazarRegistro('estudiante','${e.id}')" title="Rechazar"><i class="fa-solid fa-xmark"></i></button>
        ` : ''}
      </div>
    </div>`).join('');
}

window.filterEstudiantes = function(filtro, btn) {
  document.querySelectorAll('.filters .filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderAdminEstudiantes(_adminEstudiantes, filtro);
};

window.buscarEstudiantes = function(q) {
  const term = q.toLowerCase();
  const filtrados = _adminEstudiantes.filter(e =>
    (e.nombre || '').toLowerCase().includes(term) ||
    (e.matricula || '').toLowerCase().includes(term)
  );
  renderAdminEstudiantes(filtrados);
};

// ---------- Empresas admin ----------
let _adminEmpresas = [];

async function loadAdminEmpresas(filtro = 'all') {
  const list = document.getElementById('admin-empresas-list');
  if (!list) return;
  loading(list);
  try {
    const snap = await getDocs(collection(db, 'empresas'));
    _adminEmpresas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAdminEmpresas(_adminEmpresas, filtro);
  } catch (e) { list.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`; }
}

function renderAdminEmpresas(list, filtro = 'all') {
  const el = document.getElementById('admin-empresas-list');
  if (!el) return;
  const filtrados = filtro === 'all' ? list : list.filter(e => e.estado === filtro);
  if (!filtrados.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-building"></i><p>No hay empresas con este filtro.</p></div>`;
    return;
  }
  el.innerHTML = filtrados.map(e => `
    <div class="data-row">
      <div class="row-logo" style="background:#fff8e7;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--gold)">
        ${(e.nombreEmpresa?.[0] || 'E').toUpperCase()}
      </div>
      <div style="flex:1">
        <div class="row-title">${e.nombreEmpresa || 'Sin nombre'}</div>
        <div class="row-subtitle">${e.sector || ''} · ${e.ciudad || ''} · RFC: ${e.rfc || '-'}</div>
      </div>
      <div class="row-date">${e.email}</div>
      <span class="status-pill ${e.estado || 'pendiente'}">${e.estado || 'pendiente'}</span>
      <div class="row-actions">
        <button class="action-btn view" onclick="verDetalleRegistro('empresa','${e.id}')" title="Ver"><i class="fa-solid fa-eye"></i></button>
        ${e.convenioUrl ? `<a href="${e.convenioUrl}" target="_blank" class="action-btn view" title="Convenio"><i class="fa-solid fa-file-contract"></i></a>` : ''}
        ${e.estado === 'pendiente' ? `
          <button class="action-btn approve" onclick="aprobarRegistro('empresa','${e.id}')" title="Aprobar"><i class="fa-solid fa-check"></i></button>
          <button class="action-btn reject" onclick="rechazarRegistro('empresa','${e.id}')" title="Rechazar"><i class="fa-solid fa-xmark"></i></button>
        ` : ''}
      </div>
    </div>`).join('');
}

window.filterEmpresas = function(filtro, btn) {
  document.querySelectorAll('.filters .filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderAdminEmpresas(_adminEmpresas, filtro);
};

window.buscarEmpresas = function(q) {
  const term = q.toLowerCase();
  const filtrados = _adminEmpresas.filter(e =>
    (e.nombreEmpresa || '').toLowerCase().includes(term) ||
    (e.rfc || '').toLowerCase().includes(term)
  );
  renderAdminEmpresas(filtrados);
};

// ---------- Vacantes admin ----------
let _adminVacantes = [];

async function loadAdminVacantes(filtro = 'all') {
  const list = document.getElementById('admin-vacantes-list');
  if (!list) return;
  loading(list);
  try {
    const snap = await getDocs(collection(db, 'vacantes'));
    _adminVacantes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAdminVacantes(_adminVacantes, filtro);
  } catch (e) { list.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`; }
}

function renderAdminVacantes(list, filtro = 'all') {
  const el = document.getElementById('admin-vacantes-list');
  if (!el) return;
  const filtrados = filtro === 'all' ? list : list.filter(v => v.estado === filtro);
  if (!filtrados.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-briefcase"></i><p>No hay vacantes con este filtro.</p></div>`;
    return;
  }
  el.innerHTML = filtrados.map(v => `
    <div class="data-row">
      <div class="row-logo">💼</div>
      <div style="flex:1">
        <div class="row-title">${v.titulo}</div>
        <div class="row-subtitle">${v.empresaNombre || ''} · ${v.area || ''} · ${v.modalidad || ''}</div>
      </div>
      <div class="row-date">${fmt(v.fechaPublicacion)}</div>
      <span class="status-pill ${v.estado === 'activa' ? 'aprobado' : v.estado === 'cerrada' ? 'rechazado' : 'pendiente'}">${v.estado || '-'}</span>
      <div class="row-actions">
        <button class="action-btn ${v.estado === 'activa' ? 'reject' : 'approve'}"
          onclick="toggleVacante('${v.id}','${v.estado}')"
          title="${v.estado === 'activa' ? 'Desactivar' : 'Activar'}">
          <i class="fa-solid ${v.estado === 'activa' ? 'fa-pause' : 'fa-play'}"></i>
        </button>
        <button class="action-btn reject" onclick="eliminarVacante('${v.id}')" title="Eliminar">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`).join('');
}

window.filterVacantesAdmin = function(filtro, btn) {
  document.querySelectorAll('.filters .filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderAdminVacantes(_adminVacantes, filtro);
};

window.toggleVacante = async function(vacId, estadoActual) {
  const nuevoEstado = estadoActual === 'activa' ? 'cerrada' : 'activa';
  try {
    await updateDoc(doc(db, 'vacantes', vacId), { estado: nuevoEstado });
    toast(`Vacante ${nuevoEstado}`);
    loadAdminVacantes('all');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
};

window.eliminarVacante = async function(vacId) {
  if (!confirm('¿Eliminar esta vacante permanentemente?')) return;
  try {
    await deleteDoc(doc(db, 'vacantes', vacId));
    toast('Vacante eliminada');
    loadAdminVacantes('all');
  } catch (e) { toast('Error: ' + e.message, 'error'); }
};

// ---------- Admins ----------
async function loadAdmins() {
  const list = document.getElementById('admins-list');
  if (!list) return;
  loading(list);
  try {
    const snap = await getDocs(collection(db, 'admins'));
    const admins = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!admins.length) {
      list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-user-shield"></i><p>No hay administradores registrados.</p></div>`;
      return;
    }
    list.innerHTML = admins.map(a => `
      <div class="data-row">
        <div class="row-logo" style="background:#f0f0f0;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:700">
          ${(a.nombre?.[0] || 'A').toUpperCase()}
        </div>
        <div style="flex:1">
          <div class="row-title">${a.nombre || 'Sin nombre'}</div>
          <div class="row-subtitle">${a.email || ''}</div>
        </div>
        <span class="badge-pill pp">Admin</span>
        ${a.id !== currentUser.uid ? `
          <button class="action-btn reject" onclick="eliminarAdmin('${a.id}')" title="Eliminar admin">
            <i class="fa-solid fa-trash"></i>
          </button>` : '<span style="font-size:11px;color:var(--gray-400)">(tú)</span>'}
      </div>`).join('');
  } catch (e) { list.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`; }
}

window.crearAdmin = function() {
  showModal(`
    <h2 style="margin-bottom:1.25rem">Crear Nuevo Administrador</h2>
    <div class="form-grid">
      <div class="form-group span2"><label>Nombre completo *</label>
        <input type="text" id="na-nombre" placeholder="Nombre del administrador"></div>
      <div class="form-group span2"><label>Correo electrónico *</label>
        <input type="email" id="na-email" placeholder="correo@fiee.edu.mx"></div>
      <div class="form-group span2"><label>Contraseña temporal *</label>
        <input type="password" id="na-pass" placeholder="Mínimo 6 caracteres"></div>
    </div>
    <p style="font-size:12px;color:var(--gray-400);margin-top:.5rem">El administrador deberá cambiar su contraseña al iniciar sesión por primera vez.</p>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-gold" onclick="voAdmin()"><i class="fa-solid fa-user-plus"></i> Crear admin</button>
    </div>
  `);
};

window.voAdmin = async function() {
  const nombre = document.getElementById('na-nombre')?.value.trim();
  const email = document.getElementById('na-email')?.value.trim();
  const pass = document.getElementById('na-pass')?.value;

  if (!nombre || !email || !pass) return toast('Completa todos los campos', 'error');
  if (pass.length < 6) return toast('La contraseña debe tener al menos 6 caracteres', 'error');

  try {
    // Crear usuario en Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    // Guardar en colección admins
    await setDoc(doc(db, 'admins', cred.user.uid), {
      nombre, email,
      rol: 'admin',
      creadoPor: currentUser.uid,
      createdAt: serverTimestamp()
    });
    toast(`Admin "${nombre}" creado exitosamente`);
    closeModal();
    loadAdmins();

    // Nota: crear otro usuario hace signIn automático, necesitamos re-autenticar
    // Esto es una limitación de Firebase Auth del lado cliente.
    // En producción se recomienda usar Firebase Admin SDK (Cloud Functions).
    toast('Nota: Se recomienda usar Firebase Admin SDK para crear admins en producción.', 'info');
  } catch (e) {
    toast('Error creando admin: ' + e.message, 'error');
  }
};

window.eliminarAdmin = async function(adminId) {
  if (!confirm('¿Eliminar este administrador? Solo se elimina el registro, no el usuario de Auth.')) return;
  try {
    await deleteDoc(doc(db, 'admins', adminId));
    toast('Administrador eliminado del sistema');
    loadAdmins();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
};

/* =============================================
   BÚSQUEDA GLOBAL
   ============================================= */
document.getElementById('searchInput')?.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) return;

  if (userRole === 'estudiante') {
    showPage('ofertas');
    setTimeout(() => {
      const filtradas = _todasOfertas.filter(v =>
        (v.titulo || '').toLowerCase().includes(q) ||
        (v.empresaNombre || '').toLowerCase().includes(q) ||
        (v.descripcion || '').toLowerCase().includes(q)
      );
      renderOfertas(filtradas);
    }, 400);
  } else if (userRole === 'admin') {
    showPage('estudiantes');
    setTimeout(() => window.buscarEstudiantes(q), 400);
  }
});

/* =============================================
   INICIALIZACIÓN
   ============================================= */
document.addEventListener('DOMContentLoaded', initDashboard);
