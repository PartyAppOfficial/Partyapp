import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import { getFirestore, doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';

// Importar la app inicializada (asegúrate de exportarla en firebase-config.js)
// Si no exportas 'app', Firebase Auth lo detectará automáticamente
const auth = getAuth();
const db = getFirestore();

let currentUser = null;

// Referencias a elementos del DOM
const authButton = document.getElementById('authButton');
const authModal = document.getElementById('authModal');
const closeAuthModalBtn = document.getElementById('closeAuthModal');
const authTabs = document.querySelectorAll('.auth-tab');
const loginFormContainer = document.getElementById('loginForm');
const signupFormContainer = document.getElementById('signupForm');
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');
const authError = document.getElementById('authError');
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');
const showLoginFromWarning = document.getElementById('showLoginFromWarning');

// Elementos del formulario de negocios
const businessForm = document.getElementById('businessRegistrationForm');
const authWarning = document.getElementById('authWarning');

/**
 * Inicializar listeners de autenticación
 */
function initAuth() {
  console.log('Initializing auth...');

  // Listener para cambios en el estado de autenticación
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateUI(user);
    console.log('Auth state changed:', user ? user.email : 'Not logged in');
  });

  // Botón de auth en el header
  authButton?.addEventListener('click', () => {
    if (currentUser) {
      showUserMenu();
    } else {
      openAuthModal('login');
    }
  });

  // Cerrar modal
  closeAuthModalBtn?.addEventListener('click', closeModal);
  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeModal();
  });

  // Tabs de login/signup
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabType = tab.getAttribute('data-tab');
      switchTab(tabType);
    });
  });

  // Switch entre formularios
  switchToSignup?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('signup');
  });

  switchToLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('login');
  });

  // Mostrar login desde warning
  showLoginFromWarning?.addEventListener('click', () => {
    openAuthModal('login');
  });

  // Submit de formularios
  loginFormElement?.addEventListener('submit', handleLogin);
  signupFormElement?.addEventListener('submit', handleSignup);
}

/**
 * Abrir modal de autenticación
 * @param {string} tab - 'login' o 'signup'
 */
function openAuthModal(tab = 'login') {
  if (!authModal) return;
  
  authModal.style.display = 'flex';
  switchTab(tab);
  clearAuthError();
  document.body.style.overflow = 'hidden';
}

/**
 * Cerrar modal de autenticación
 */
function closeModal() {
  if (!authModal) return;
  
  authModal.style.display = 'none';
  clearAuthError();
  loginFormElement?.reset();
  signupFormElement?.reset();
  document.body.style.overflow = 'auto';
}

/**
 * Cambiar entre tabs de login/signup
 * @param {string} tabType - 'login' o 'signup'
 */
function switchTab(tabType) {
  // Actualizar tabs activos
  authTabs.forEach(tab => {
    if (tab.getAttribute('data-tab') === tabType) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Actualizar formularios activos
  if (tabType === 'login') {
    loginFormContainer?.classList.add('active');
    signupFormContainer?.classList.remove('active');
  } else {
    signupFormContainer?.classList.add('active');
    loginFormContainer?.classList.remove('active');
  }

  clearAuthError();
}

/**
 * Manejar login
 * @param {Event} e - Evento de submit
 */
async function handleLogin(e) {
  e.preventDefault();
  clearAuthError();

  const email = document.getElementById('loginEmail')?.value;
  const password = document.getElementById('loginPassword')?.value;

  if (!email || !password) {
    showAuthError('Please enter email and password');
    return;
  }

  const submitBtn = loginFormElement.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  try {
    await signInWithEmailAndPassword(auth, email, password);
    closeModal();
    showNotification('Welcome back!', 'success');
  } catch (error) {
    console.error('Login error:', error);
    showAuthError(getErrorMessage(error.code));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Manejar registro
 * @param {Event} e - Evento de submit
 */
async function handleSignup(e) {
  e.preventDefault();
  clearAuthError();

  const name = document.getElementById('signupName')?.value;
  const email = document.getElementById('signupEmail')?.value;
  const password = document.getElementById('signupPassword')?.value;
  const passwordConfirm = document.getElementById('signupPasswordConfirm')?.value;

  // Validaciones
  if (!name || !email || !password || !passwordConfirm) {
    showAuthError('Please fill all fields');
    return;
  }

  if (password !== passwordConfirm) {
    showAuthError('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showAuthError('Password should be at least 6 characters');
    return;
  }

  const submitBtn = signupFormElement.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  try {
    // Crear usuario
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Actualizar perfil con el nombre
    await updateProfile(userCredential.user, {
      displayName: name
    });

    // Guardar información adicional en Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: name,
      email: email,
      createdAt: serverTimestamp(),
      role: 'user'
    });

    closeModal();
    showNotification('Account created successfully!', 'success');
  } catch (error) {
    console.error('Signup error:', error);
    showAuthError(getErrorMessage(error.code));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Actualizar UI según el estado de autenticación
 * @param {Object|null} user - Usuario de Firebase o null
 */
function updateUI(user) {
  const authButtonText = authButton?.querySelector('.auth-text');
  const authButtonIcon = authButton?.querySelector('.auth-icon');

  if (user) {
    // Usuario autenticado
    console.log('User logged in:', user.email);
    
    if (authButton) {
      authButton.classList.add('logged-in');
      if (authButtonText) {
        authButtonText.textContent = user.displayName || user.email.split('@')[0];
      }
    }

    // Mostrar formulario de negocios, ocultar warning
    if (businessForm) businessForm.style.display = 'block';
    if (authWarning) authWarning.style.display = 'none';

  } else {
    // Usuario no autenticado
    console.log('User logged out');
    
    if (authButton) {
      authButton.classList.remove('logged-in');
      if (authButtonText) {
        authButtonText.textContent = 'Login';
      }
    }

    // Ocultar formulario de negocios, mostrar warning
    if (businessForm) businessForm.style.display = 'none';
    if (authWarning) authWarning.style.display = 'block';
  }
}

/**
 * Mostrar menú de usuario (cuando ya está logueado)
 */
function showUserMenu() {
  if (!currentUser) return;

  const userName = currentUser.displayName || currentUser.email.split('@')[0];
  
  const userMenuHTML = `
    <div class="user-menu" style="padding: 1rem;">
      <p style="margin-bottom: 0.5rem;"><strong>${userName}</strong></p>
      <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 1.5rem;">${currentUser.email}</p>
      <button id="logoutButton" class="button" style="width: 100%;">Logout</button>
    </div>
  `;

  // Crear modal temporal para el menú
  const menuModal = document.createElement('div');
  menuModal.className = 'auth-modal';
  menuModal.style.display = 'flex';
  menuModal.innerHTML = `
    <div class="auth-modal-content" style="max-width: 350px; text-align: center;">
      <button class="auth-modal-close">&times;</button>
      ${userMenuHTML}
    </div>
  `;

  document.body.appendChild(menuModal);
  document.body.style.overflow = 'hidden';

  // Cerrar modal al hacer click en X
  const closeBtn = menuModal.querySelector('.auth-modal-close');
  closeBtn.addEventListener('click', () => {
    menuModal.remove();
    document.body.style.overflow = 'auto';
  });

  // Cerrar modal al hacer click fuera
  menuModal.addEventListener('click', (e) => {
    if (e.target === menuModal) {
      menuModal.remove();
      document.body.style.overflow = 'auto';
    }
  });

  // Manejar logout
  const logoutBtn = menuModal.querySelector('#logoutButton');
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      menuModal.remove();
      document.body.style.overflow = 'auto';
      showNotification('Logged out successfully', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('Error logging out', 'error');
    }
  });
}

/**
 * Mostrar error de autenticación
 * @param {string} message - Mensaje de error
 */
function showAuthError(message) {
  if (authError) {
    authError.textContent = message;
    authError.style.display = 'block';
  }
}

/**
 * Limpiar error de autenticación
 */
function clearAuthError() {
  if (authError) {
    authError.textContent = '';
    authError.style.display = 'none';
  }
}

/**
 * Obtener mensaje de error amigable
 * @param {string} errorCode - Código de error de Firebase
 * @returns {string} Mensaje amigable
 */
function getErrorMessage(errorCode) {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered',
    'auth/invalid-email': 'Invalid email address',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/network-request-failed': 'Network error. Check your connection',
    'auth/operation-not-allowed': 'Email/password authentication is not enabled',
    'auth/invalid-credential': 'Invalid credentials. Please try again',
    'auth/missing-password': 'Please enter a password'
  };

  return errorMessages[errorCode] || 'An error occurred. Please try again';
}

/**
 * Mostrar notificación temporal
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success' o 'error'
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  const bgColors = {
    success: '#4CAF50',
    error: '#f44336',
    info: '#2196F3'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColors[type] || bgColors.success};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10001;
    animation: slideIn 0.3s ease;
    max-width: 350px;
    font-weight: 500;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

/**
 * Obtener usuario actual
 * @returns {Object|null} Usuario actual o null
 */
function getCurrentUser() {
  return currentUser;
}

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean} true si está autenticado
 */
function isAuthenticated() {
  return currentUser !== null;
}

// ============================================
// INICIALIZACIÓN
// ============================================
// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}

// Agregar estilos de animación si no existen
if (!document.getElementById('auth-animations')) {
  const style = document.createElement('style');
  style.id = 'auth-animations';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
// Hacer disponibles para otros scripts
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.openAuthModal = openAuthModal;

// Exportar para otros módulos
export { auth, db, getCurrentUser, isAuthenticated, openAuthModal };