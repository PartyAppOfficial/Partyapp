// ============================================
// SIDEBAR TOGGLE FUNCTIONALITY
// ============================================
document.addEventListener('DOMContentLoaded', function () {
  const asideToggle = document.getElementById('asideToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  function openSidebar() {
    sidebar.classList.add('active');
    overlay.hidden = false;
    asideToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.hidden = true;
    asideToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  asideToggle.addEventListener('click', (e) => {
    if (!sidebar.classList.contains('active')) {
      openSidebar();
    } else {
      closeSidebar();
    }
  });

  overlay.addEventListener('click', (e) => {
    closeSidebar();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('active')) {
      closeSidebar();
    }
  });
});

// ==================================
// HEADER
// ==================================
let lastScrollTop = 0;
const header = document.querySelector('.header');
const scrollThreshold = 100; // Pixeles que debe bajar antes de ocultarse

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
  
  if (currentScroll > scrollThreshold) {
    if (currentScroll > lastScrollTop) {
      // Scrolling hacia abajo - ocultar header
      header.classList.add('hidden');
    } else {
      // Scrolling hacia arriba - mostrar header
      header.classList.remove('hidden');
    }
  } else {
    // Cerca del top - siempre mostrar
    header.classList.remove('hidden');
  }
  
  lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}, false);

//=============================================
//            DIAPOSITIVAS
//=============================================
document.addEventListener('DOMContentLoaded', function() {
  const slides = document.querySelector('.carousel-slides');
  const slideItems = document.querySelectorAll('.carousel-slide');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const indicatorsContainer = document.querySelector('.carousel-indicators');
  
  let currentIndex = 0;
  const totalSlides = slideItems.length;
  
  // Crear indicadores
  for (let i = 0; i < totalSlides; i++) {
      const indicator = document.createElement('div');
      indicator.classList.add('indicator');
      if (i === 0) indicator.classList.add('active');
      indicator.addEventListener('click', () => goToSlide(i));
      indicatorsContainer.appendChild(indicator);
  }
  
  const indicators = document.querySelectorAll('.indicator');
  
  // Función para actualizar el carrusel
  function updateCarousel() {
      slides.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      // Actualizar indicadores
      indicators.forEach((indicator, index) => {
          if (index === currentIndex) {
              indicator.classList.add('active');
          } else {
              indicator.classList.remove('active');
          }
      });
  }
  
  // Ir a una diapositiva específica
  function goToSlide(index) {
      currentIndex = index;
      if (currentIndex >= totalSlides) currentIndex = 0;
      if (currentIndex < 0) currentIndex = totalSlides - 1;
      updateCarousel();
  }
  
  // Event listeners para los botones
  nextBtn.addEventListener('click', () => {
      goToSlide(currentIndex + 1);
  });
  
  prevBtn.addEventListener('click', () => {
      goToSlide(currentIndex - 1);
  });
  
  // Prueba de funcionalidad automática
  console.log("Iniciando prueba de funcionalidad del carrusel...");
  
  // Prueba 1: Verificar que hay diapositivas
  console.assert(slideItems.length > 0, "Prueba fallida: No se encontraron diapositivas");
  
  // Prueba 2: Navegación con botones
  const initialIndex = currentIndex;
  nextBtn.click();
  console.assert(currentIndex === initialIndex + 1 || (initialIndex === totalSlides - 1 && currentIndex === 0), 
               "Prueba fallida: Botón siguiente no funciona correctamente");
  
  prevBtn.click();
  console.assert(currentIndex === initialIndex, 
               "Prueba fallida: Botón anterior no funciona correctamente");
  
  // Prueba 3: Indicadores
  indicators[2].click();
  console.assert(currentIndex === 2, "Prueba fallida: Indicadores no funcionan correctamente");
  
  console.log("Pruebas completadas. Revisa la consola para ver los resultados.");
  
  setInterval(() => { nextBtn.click(); }, 5000);
});


//=============================================
//                    FAQ
//=============================================
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');
  
  question.addEventListener('click', () => {
    const isActive = item.classList.contains('active');
    
    faqItems.forEach(otherItem => {
      otherItem.classList.remove('active');
    });
    
    if (!isActive) {
      item.classList.add('active');
    }
  });
});