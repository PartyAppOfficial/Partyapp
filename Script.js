<script>
        // Elements
        const menuBtn = document.getElementById('menuBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');
        const contactForm = document.getElementById('contactForm');
        const submitBtn = document.getElementById('submitBtn');
        const successMessage = document.getElementById('successMessage');
        const errorMessage = document.getElementById('errorMessage');

        // Toggle sidebar
        menuBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        });

        // Close sidebar when clicking overlay
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });

        // Navigation
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Hide all pages
                pages.forEach(page => page.classList.remove('active'));
                
                // Show selected page
                const pageId = link.getAttribute('data-page');
                document.getElementById(pageId).classList.add('active');
                
                // Close sidebar
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });

        // Contact form submission
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Hide previous messages
            successMessage.style.display = 'none';
            errorMessage.style.display = 'none';
            
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // Create mailto link
            const mailtoLink = `mailto:support@partyapp.online?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
                `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`
            )}`;
            
            // Open email client
            window.location.href = mailtoLink;
            
            // Show success message
            setTimeout(() => {
                successMessage.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Mensaje';
                contactForm.reset();
                
                // Scroll to success message
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 500);
        });
    </script>