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