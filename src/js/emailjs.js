const CONFIG = {
    publicKey: 'F5_BIaaoWP4wzfAoT',      // Tu Public Key de EmailJS
    serviceId: 'service_llq1nbq',      // Tu Service ID
    templateId: 'template_gldya4j'     // Tu Template ID
};

// Inicializar EmailJS
emailjs.init(CONFIG.publicKey);

// Elementos del DOM
const form = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const emailInput = document.getElementById('email');

// Función para mostrar mensajes
function showMessage(element, duration = 5000) {
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, duration);
}

// Función para ocultar todos los mensajes
function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Función para cambiar estado del botón
function setButtonState(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
        btnText.innerHTML = '<span class="loading"></span>Enviando...';
    } else {
        btnText.textContent = 'Enviar mensaje';
    }
}

// Manejador del envío del formulario
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Ocultar mensajes previos
    hideMessages();
    
    // Activar estado de carga
    setButtonState(true);
    
    try {
        // Enviar email usando EmailJS
        const response = await emailjs.sendForm(
            CONFIG.serviceId,
            CONFIG.templateId,
            form
        );
        
        console.log('SUCCESS!', response.status, response.text);
        
        // Mostrar mensaje de éxito
        showMessage(successMessage);
        
        // Limpiar formulario
        form.reset();
        
    } catch (error) {
        console.error('ERROR:', error);
        
        // Personalizar mensaje de error
        if (error.text) {
            errorMessage.textContent = `Error: ${error.text}`;
        } else {
            errorMessage.textContent = 'Error al enviar el mensaje. Por favor intenta de nuevo.';
        }
        
        // Mostrar mensaje de error
        showMessage(errorMessage);
        
    } finally {
        // Desactivar estado de carga
        setButtonState(false);
    }
});

// Validación en tiempo real (opcional)
emailInput.addEventListener('blur', function() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.value && !emailRegex.test(this.value)) {
        this.style.borderColor = '#dc3545';
    } else {
        this.style.borderColor = '#e0e0e0';
    }
});