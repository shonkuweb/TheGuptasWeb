'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
function closeMenu() {
  mobileNav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  menuToggle.textContent = '☰';
}
menuToggle.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menuToggle.textContent = open ? '×' : '☰';
});
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeMenu(); });
document.addEventListener('click', e => { if(!e.target.closest('.site-header')) closeMenu(); });
window.matchMedia('(min-width: 761px)').addEventListener('change', e => { if(e.matches) closeMenu(); });
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    });
  }, {threshold: .08});
  document.querySelectorAll('[data-reveal]').forEach((el, i) => {
    el.classList.add('will-reveal');
    el.style.setProperty('--reveal-delay', `${Math.min(i % 2 * 70, 70)}ms`);
    observer.observe(el);
  });
  // A failsafe keeps content visible if the observer is suspended by the browser.
  window.setTimeout(() => document.querySelectorAll('.will-reveal').forEach(el => el.classList.add('is-visible')), 14000);
}
const accordion = document.querySelector('.service-accordion');
if(accordion) accordion.querySelectorAll('details').forEach(detail => {
  detail.addEventListener('toggle', () => {
    if(detail.open) accordion.querySelectorAll('details').forEach(other => {if(other !== detail) other.open = false;});
  });
});
const filters = [...document.querySelectorAll('.filter')];
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(other => {other.classList.toggle('active', other === button);other.setAttribute('aria-pressed', String(other === button));});
  let count = 0;
  document.querySelectorAll('.story-card').forEach(card => {
    const visible = button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter;
    card.hidden = !visible;
    if(visible) {count++;card.classList.add('is-visible'); if(!reducedMotion.matches)card.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'ease-out'});}
  });
  document.getElementById('gallery-count').textContent = `${count} ${count === 1 ? 'collection' : 'collections'} · Explore the details within.`;
}));
const lightbox = document.querySelector('.lightbox');
if(lightbox) {
  const cards = [...document.querySelectorAll('.project-card')];
  let current = null;
  function show(card) {
    current = card;
    const image = card.querySelector('img');
    document.getElementById('gallery-image').src = image.src;
    document.getElementById('gallery-image').alt = image.alt;
    document.getElementById('gallery-title').textContent = card.querySelector('h3').textContent;
    document.getElementById('gallery-description').textContent = image.alt;
    if(!lightbox.open) {lightbox.showModal();document.body.style.overflow = 'hidden';}
  }
  function move(direction) {const visible = cards.filter(c => !c.hidden);show(visible[(visible.indexOf(current)+direction+visible.length)%visible.length]);}
  cards.forEach(card => card.addEventListener('click', () => show(card)));
  lightbox.querySelector('.modal-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('close', () => {document.body.style.overflow = '';if(current)current.focus({preventScroll:true});});
  lightbox.addEventListener('click', e => {if(e.target === lightbox) {const rect = lightbox.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)lightbox.close();}});
  document.getElementById('gallery-prev').addEventListener('click', () => move(-1));
  document.getElementById('gallery-next').addEventListener('click', () => move(1));
  lightbox.addEventListener('keydown', e => {if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}if(e.key==='ArrowRight'){e.preventDefault();move(1);}});
}
const form = document.getElementById('enquiry-form');
if(form) {
  let brief = '';
  const requested = new URLSearchParams(location.search).get('service');
  form.querySelectorAll('[data-service]').forEach(input => { if(input.dataset.service === requested) input.checked = true; });
  form.addEventListener('change', () => {document.getElementById('form-result').hidden = true;document.getElementById('service-error').textContent = '';});
  form.addEventListener('input', () => {document.getElementById('form-result').hidden = true;});
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    if(!data.getAll('services').length) {document.getElementById('service-error').textContent='Please select at least one service.';form.querySelector('[name=services]').focus();return;}
    document.getElementById('service-error').textContent = '';
    brief = `PROJECT BRIEF — THE GUPTA’S LANDSCAPE\n\nName: ${data.get('name').trim()}\nLocation: ${data.get('location').trim()}\nProperty: ${data.get('property')}\nApproximate area: ${data.get('area').trim() || 'To be discussed'}\n\nServices: ${data.getAll('services').join(', ')}\nBudget: ${data.get('budget')}\nTimeline: ${data.get('timeline')}\n\nMy vision:\n${data.get('vision').trim()}`;
    document.getElementById('brief-preview').textContent = brief;
    const result = document.getElementById('form-result');result.hidden = false;
    document.getElementById('copy-status').textContent = '';
    result.focus({preventScroll:true});result.scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'center'});
  });
  document.getElementById('copy-brief').addEventListener('click', async () => {
    try {await navigator.clipboard.writeText(brief);document.getElementById('copy-status').textContent = 'Copied. Your project brief is ready to share.';}
    catch {document.getElementById('copy-status').textContent='Copy is unavailable in this browser. Use Download brief or select the text above.';}
  });
  document.getElementById('download-brief').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([brief],{type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');link.href=url;link.download='Guptas-Landscape-Project-Brief.txt';link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    document.getElementById('copy-status').textContent='Your project brief download has started.';
  });
}
