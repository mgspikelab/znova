// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => observer.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('show'));
}

// Insights carousel (Netflix-style: shift by ~3 cards per click)
const insightsTrack = document.getElementById('insightsTrack');
const insightsPrev = document.getElementById('insightsPrev');
const insightsNext = document.getElementById('insightsNext');

if (insightsTrack && insightsPrev && insightsNext) {
  const getStep = () => {
    const card = insightsTrack.querySelector('.insight-card');
    if (!card) return insightsTrack.clientWidth;
    const style = getComputedStyle(insightsTrack);
    const gap = parseFloat(style.columnGap || style.gap || '24');
    const cardWidth = card.getBoundingClientRect().width + gap;
    const visible = Math.max(1, Math.floor(insightsTrack.clientWidth / cardWidth));
    return cardWidth * visible;
  };

  const updateArrows = () => {
    const maxScroll = insightsTrack.scrollWidth - insightsTrack.clientWidth - 2;
    insightsPrev.disabled = insightsTrack.scrollLeft <= 0;
    insightsNext.disabled = insightsTrack.scrollLeft >= maxScroll;
  };

  insightsNext.addEventListener('click', () => {
    insightsTrack.scrollBy({ left: getStep(), behavior: 'smooth' });
  });
  insightsPrev.addEventListener('click', () => {
    insightsTrack.scrollBy({ left: -getStep(), behavior: 'smooth' });
  });
  insightsTrack.addEventListener('scroll', () => {
    window.requestAnimationFrame(updateArrows);
  });
  window.addEventListener('resize', updateArrows);
  updateArrows();
}

// Contact modal
const contactOverlay = document.getElementById('contactOverlay');
const contactClose = document.getElementById('contactClose');
const contactForm = document.getElementById('contactForm');
const contactError = document.getElementById('contactError');
const openTriggers = document.querySelectorAll('.js-open-contact');

let lastFocused = null;

function openContactModal(e) {
  if (e) e.preventDefault();
  if (!contactOverlay) return;
  lastFocused = document.activeElement;
  contactOverlay.classList.add('open');
  contactOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const nameField = document.getElementById('cf-name');
  if (nameField) nameField.focus();
}

function resetContactForm() {
  if (!contactForm) return;
  if (contactAbort) contactAbort.abort();
  contactForm.reset();
  contactForm.classList.remove('is-sent');
  if (contactError) {
    contactError.hidden = true;
    contactError.textContent = 'Please fill in your name, email, and message.';
  }
  if (contactSuccess) contactSuccess.hidden = true;
  if (contactSubmit) {
    contactSubmit.disabled = false;
    contactSubmit.textContent = 'Send Message';
  }
}

function closeContactModal() {
  if (!contactOverlay) return;
  contactOverlay.classList.remove('open');
  contactOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  resetContactForm();
  if (lastFocused) lastFocused.focus();
}

openTriggers.forEach(el => el.addEventListener('click', openContactModal));

if (contactClose) contactClose.addEventListener('click', closeContactModal);

if (contactOverlay) {
  contactOverlay.addEventListener('click', (e) => {
    if (e.target === contactOverlay) closeContactModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && contactOverlay && contactOverlay.classList.contains('open')) {
    closeContactModal();
  }
});

const CONTACT_ENDPOINT = 'https://lucidop-titan-api-dev-141049784790.us-central1.run.app/api/contact';

let contactSuccess = null;
let contactSubmit = null;
let contactAbort = null;

if (contactForm) {
  const trap = document.createElement('input');
  trap.type = 'text';
  trap.name = 'leaveBlank';
  trap.id = 'cf-website';
  trap.className = 'hp-field';
  trap.tabIndex = -1;
  trap.autocomplete = 'off';
  trap.setAttribute('aria-hidden', 'true');
  contactForm.appendChild(trap);

  contactSuccess = document.createElement('div');
  contactSuccess.id = 'contactSuccess';
  contactSuccess.className = 'modal-success';
  contactSuccess.hidden = true;
  contactSuccess.setAttribute('role', 'status');
  contactForm.appendChild(contactSuccess);

  contactSubmit = contactForm.querySelector('.modal-submit');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('cf-name').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    const phone = document.getElementById('cf-phone').value.trim();
    const message = document.getElementById('cf-message').value.trim();
    const leaveBlank = document.getElementById('cf-website').value;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !email || !message || !emailOk) {
      contactError.textContent = 'Please fill in your name, email, and message.';
      contactError.hidden = false;
      return;
    }
    contactError.hidden = true;

    if (contactSubmit) {
      contactSubmit.disabled = true;
      contactSubmit.textContent = 'Sending...';
    }

    if (contactAbort) contactAbort.abort();
    contactAbort = new AbortController();

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name, email, phone, message, leaveBlank }),
        signal: contactAbort.signal
      });
      if (!response.ok) {
        throw new Error('Contact request failed');
      }
      contactSuccess.textContent = `Thank you, ${name}. Your message is with the ZEDTEX team. We will reply to ${email}.`;
      contactSuccess.hidden = false;
      contactForm.classList.add('is-sent');
    } catch (err) {
      if (err.name === 'AbortError') return;
      contactError.textContent = "We couldn't send your message. Please email info@zedtex.us and we will take it from there.";
      contactError.hidden = false;
      if (contactSubmit) {
        contactSubmit.disabled = false;
        contactSubmit.textContent = 'Send Message';
      }
    }
  });
}

// Job responsibilities toggle (open-positions.html)
document.querySelectorAll('.job-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));

    const list = btn.nextElementSibling;
    if (list) list.classList.toggle('open');

    const label = btn.querySelector('.toggle-label');
    if (label) label.textContent = expanded ? 'View responsibilities' : 'Hide responsibilities';
  });
});
