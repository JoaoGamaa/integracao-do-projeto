'use strict';

const slides = Array.from(document.querySelectorAll('.slide'));
const byId = (id) => document.getElementById(id);
let currentSlide = 0;
let toastTimer;

function showSlide(index, updateHash = true) {
  currentSlide = Math.min(Math.max(index, 0), slides.length - 1);
  slides.forEach((slide, i) => {
    slide.hidden = i !== currentSlide;
    slide.classList.toggle('is-active', i === currentSlide);
  });
  byId('slide-number').textContent = String(currentSlide + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
  byId('slide-topic').textContent = slides[currentSlide].dataset.topic;
  byId('previous-slide').disabled = currentSlide === 0;
  byId('next-slide').disabled = currentSlide === slides.length - 1;
  byId('progress-bar').style.width = ((currentSlide + 1) / slides.length * 100) + '%';
  document.querySelectorAll('[data-slide-index]').forEach((button) => {
    if (Number(button.dataset.slideIndex) === currentSlide) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  byId('slide-announcement').textContent = 'Slide ' + (currentSlide + 1) + ' de ' + slides.length + ': ' + slides[currentSlide].dataset.title;
  document.title = slides[currentSlide].dataset.title + ' · PMBOK Integração';
  if (updateHash) {
    try { window.history.replaceState(null, '', '#slide-' + (currentSlide + 1)); }
    catch { window.location.hash = 'slide-' + (currentSlide + 1); }
  }
  if (window.innerWidth < 900) window.scrollTo({top: 0, behavior: 'auto'});
}

function fromHash() {
  const match = window.location.hash.match(/^#slide-(\d+)$/);
  showSlide(match ? Number(match[1]) - 1 : 0, false);
}

function fitStage() {
  if (window.innerWidth < 900) {
    document.documentElement.style.setProperty('--scale', '1');
    return;
  }
  const viewport = document.querySelector('.viewport');
  const scale = Math.min((viewport.clientWidth - 56) / 1600, (viewport.clientHeight - 16) / 900);
  document.documentElement.style.setProperty('--scale', String(Math.max(scale, .1)));
}

function openDialog(id) {
  const dialog = byId(id);
  if (dialog.open) dialog.close();
  else dialog.showModal();
}

function toast(message) {
  clearTimeout(toastTimer);
  byId('toast').textContent = message;
  byId('toast').hidden = false;
  toastTimer = setTimeout(() => { byId('toast').hidden = true; }, 2400);
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else toast('Use a opção de tela cheia do navegador.');
  } catch { toast('Use F11 ou a opção de tela cheia do navegador.'); }
}

slides.forEach((slide, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.className = 'dot';
  dot.dataset.slideIndex = String(i);
  dot.setAttribute('aria-label', 'Slide ' + (i + 1) + ': ' + slide.dataset.title);
  dot.title = slide.dataset.title;
  dot.addEventListener('click', () => showSlide(i));
  byId('slide-dots').append(dot);

  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'overview-item';
  item.dataset.slideIndex = String(i);
  const number = document.createElement('span');
  number.textContent = String(i + 1).padStart(2, '0');
  item.append(number, document.createTextNode(slide.dataset.title));
  item.addEventListener('click', () => { byId('overview-dialog').close(); showSlide(i); });
  byId('overview-list').append(item);
});

byId('previous-slide').addEventListener('click', () => showSlide(currentSlide - 1));
byId('next-slide').addEventListener('click', () => showSlide(currentSlide + 1));
byId('overview-button').addEventListener('click', () => openDialog('overview-dialog'));
byId('sources-button').addEventListener('click', () => openDialog('sources-dialog'));
byId('closing-source-button').addEventListener('click', () => openDialog('sources-dialog'));
byId('fullscreen-button').addEventListener('click', toggleFullscreen);
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.altKey || event.metaKey) return;
  if (document.querySelector('dialog[open]')) return;
  if (event.target.closest('input,select,textarea,pre')) return;
  if (event.key === ' ' && event.target.closest('button,a')) return;
  const key = event.key.toLowerCase();
  if (['arrowright', 'arrowdown', 'pagedown', ' '].includes(key)) { event.preventDefault(); showSlide(currentSlide + 1); }
  else if (['arrowleft', 'arrowup', 'pageup'].includes(key)) { event.preventDefault(); showSlide(currentSlide - 1); }
  else if (key === 'home') { event.preventDefault(); showSlide(0); }
  else if (key === 'end') { event.preventDefault(); showSlide(slides.length - 1); }
  else if (key === 'f') { event.preventDefault(); toggleFullscreen(); }
  else if (key === 'o') { event.preventDefault(); openDialog('overview-dialog'); }
  else if (/^(?:[1-9]|1[0-3])$/.test(key)) showSlide(Number(key) - 1);
});

let touchStart = null;
const viewport = document.querySelector('.viewport');
viewport.addEventListener('touchstart', (event) => {
  if (event.target.closest('button,a,select,pre')) { touchStart = null; return; }
  touchStart = {x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY};
}, {passive: true});
viewport.addEventListener('touchend', (event) => {
  if (!touchStart) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > 75 && Math.abs(dx) > Math.abs(dy) * 1.5) showSlide(currentSlide + (dx < 0 ? 1 : -1));
  touchStart = null;
}, {passive: true});

window.addEventListener('hashchange', fromHash);
window.addEventListener('resize', fitStage);
document.addEventListener('fullscreenchange', () => {
  byId('fullscreen-button').setAttribute('aria-label', document.fullscreenElement ? 'Sair da tela cheia' : 'Ativar tela cheia');
  fitStage();
});

fromHash();
fitStage();
