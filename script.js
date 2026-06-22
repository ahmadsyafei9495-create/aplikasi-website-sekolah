const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    siteNav.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', siteNav.classList.contains('active'));
  });
}

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    alert('Terima kasih! Pesan Anda telah dikirim.');
    contactForm.reset();
  });
}
