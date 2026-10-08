import { projects } from './projects.js';
import './motion.js';

const body = document.body;
const menu = document.querySelector('[data-menu]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const menuClose = document.querySelector('[data-menu-close]');
const projectDialog = document.querySelector('#project-dialog');
const projectList = document.querySelector('[data-project-list]');
const copyButton = document.querySelector('[data-copy-brief]');
const copyStatus = document.querySelector('[data-copy-status]');

function setDialogState(dialog, open) {
  body.classList.toggle('dialog-open', open || Boolean(document.querySelector('dialog[open]')));
  if (dialog === menu) menuToggle?.setAttribute('aria-expanded', String(open));
}
function openMenu() { if (!menu?.open) menu?.showModal(); setDialogState(menu, true); menuClose?.focus(); }
function closeMenu() { if (menu?.open) menu.close(); setDialogState(menu, false); menuToggle?.focus(); }
menuToggle?.addEventListener('click', openMenu);
menuClose?.addEventListener('click', closeMenu);
menu?.addEventListener('click', (e) => { if (e.target === menu) closeMenu(); });
menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { if (menu.open) menu.close(); setDialogState(menu, false); }));
menu?.addEventListener('close', () => setDialogState(menu, false));

function projectMarkup(project) {
  return `<button class="project-card ${project.tone}" type="button" data-project="${project.slug}" aria-label="Open ${project.title} project details" data-reveal>
    <span class="project-number">${project.index}</span><span class="project-info"><h3>${project.title}</h3><p>${project.kind} В· ${project.year}</p></span><span class="work-art ${project.tone}" aria-hidden="true"></span></button>`;
}
if (projectList) projectList.innerHTML = projects.filter((project) => project.featured).slice(0, 4).map(projectMarkup).join('');

function openProject(slug) {
  const project = projects.find((item) => item.slug === slug); if (!project || !projectDialog) return;
  projectDialog.querySelector('[data-project-dialog-kind]').textContent = `${project.kind} / ${project.year}`;
  projectDialog.querySelector('[data-project-dialog-index]').textContent = project.index;
  projectDialog.querySelector('[data-project-dialog-title]').textContent = project.title;
  projectDialog.querySelector('[data-project-dialog-summary]').textContent = project.summary;
  projectDialog.querySelector('[data-project-dialog-disciplines]').innerHTML = project.disciplines.map((item) => `<li>${item}</li>`).join('');
  projectDialog.showModal(); setDialogState(projectDialog, true); projectDialog.querySelector('[data-project-close]')?.focus();
}
projectList?.addEventListener('click', (e) => { const trigger = e.target.closest('[data-project]'); if (trigger) openProject(trigger.dataset.project); });
projectDialog?.querySelector('[data-project-close]')?.addEventListener('click', () => projectDialog.close());
projectDialog?.addEventListener('click', (e) => { if (e.target === projectDialog) projectDialog.close(); });
projectDialog?.addEventListener('close', () => setDialogState(projectDialog, false));

const briefText = `Hi Tjong вЂ” IвЂ™d like to discuss a 3D project.\n\nProject / brand:\nWhat we need:\nKey deliverables:\nTiming / launch date:\nBudget range:\nVisual references:\nAnything else:`;
async function copyProjectBrief() {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(briefText);
    else { const area = document.createElement('textarea'); area.value = briefText; area.setAttribute('readonly',''); area.style.position='fixed'; area.style.opacity='0'; document.body.append(area); area.select(); document.execCommand('copy'); area.remove(); }
    if (copyStatus) copyStatus.textContent = 'PROJECT BRIEF COPIED вЂ” PASTE IT INTO YOUR PREFERRED CONTACT CHANNEL.';
    copyButton?.querySelector('span:first-child') && (copyButton.querySelector('span:first-child').textContent = 'Brief copied');
  } catch { if (copyStatus) copyStatus.textContent = 'COPY FAILED вЂ” SELECT AND COPY THE BRIEF FROM YOUR BROWSER.'; }
}
copyButton?.addEventListener('click', copyProjectBrief);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = [...document.querySelectorAll('[data-reveal]')];
if (reducedMotion || !('IntersectionObserver' in window)) reveals.forEach((el) => el.classList.add('is-visible'));
else { const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold:.12, rootMargin:'0px 0px -5% 0px' }); reveals.forEach((el) => observer.observe(el)); }

let destroySkull = () => {};
const skullElement = document.querySelectoЉ	ЦЩ]K\ЪЭ[\ШЩ[™WIКNВ\Ю[Иќ[Э[Ы€›ЫЭЪЭ[

HВ€Y€
\ЪЭ[[[Y[ќ
H™]\›ЋВ€Y€
™]ИT“ЩX\Ъ\[\КШШ][Ы‹њЩX\Ъ
K™Щ]
	Щ[XЪЙКHOOH	МIКHИЪЭ[[[Y[ќ™]\Щ]њЭ]OIЩ[XЪЙОИ™]\›ЋИB€ћHИЫЫњЭИ[љ]ЪЭ[ШЩ[™HHH]ШZ][\Ьќ
	Л‹ЬЪЭ[\ШЩ[™KљњЙКNИ\Э›ЮTЪЭ[H[љ]ЪЭ[ШЩ[™JЪЭ[[[Y[ќ
NИB€Ш]ЪИЪЭ[[[Y[ќ™]\Щ]њЭ]OIЩ[XЪЙОИBџB›ЫЭЪЭ[

NВ‚ЫЫњЭШЩ[™Q[[Y[ќHШЭ[Y[ќњ]Y\ћTЩ[XЭЬЉ	ЦЩ]K\ШЩ[™WIКNВ›]\Э›ЮTШЩ[™HH

HO€ЯNВ™ќ[Э[Ы€\ЩTШЩ[™Q[XЪКY\ЬШYЩJHВ€Y€
\ШЩ[™Q[[Y[ќ
H™]\›ЋИШЩ[™Q[[Y[ќ™]\Щ]њЭ]OIЩ[XЪЙОВ€ЫЫњЭШY[™П\ШЩ[™Q[[Y[ќњ]Y\ћTЩ[XЭЬЉ	ЦЩ]K\ШЩ[™K[ШY[™ЧIКNИЫЫњЭЭ]\П\ШЩ[™Q[[Y[ќњ]Y\ћTЩ[XЭЬЉ	ЦЩ]K\ШЩ[™K\Э]\ЧIКNВ€Y€
ШY[™КHШY[™Лќ^ЫЫќ[ќIМСФSУђSИУУ•S•‘PQIОИY€
Э]\КHЭ]\Лќ^ЫЫќ[ќ[Y\ЬШYЩNВџB\Ю[Иќ[Э[Ы€›ЫЭШЩ[™J
HВ€ЫЫњЭ›ЬЩY[XЪИH™]ИT“ЩX\Ъ\[\КШШ][Ы‹њЩX\Ъ
K™Щ]
	Щ[XЪЙКHOOH	МIОВ€Y€
›ЬЩY[XЪКHИ\ЩTШЩ[™Q[XЪК	ФЬЭ\€[ЩH0­И›ЬЩY[XЪЙКNИ™]\›ЋИB€ћHИЫЫњЭИ[љ]ШЩ[™HHH]ШZ][\Ьќ
	Л‹ЬШЩ[™KљњЙКNИ\Э›ЮTШЩ[™HH[љ]ШЩ[™JШЩ[™Q[[Y[ќ
NИB€Ш]ЪИ\ЩTШЩ[™Q[XЪК	МСќ[ќ[YH[]Z[X›H0­ИЬЭ\€[ЩHXЭ]™IКNИBџBљY€
ШЩ[™Q[[Y[ќ	‰€	Т[ќ\њЩXЭ[Ы“ШњЩ\ќ™\‰И[€Ъ[™ЭКHВ€ЫЫњЭШЩ[™SШњЩ\ќ™\€H™]И[ќ\њЩXЭ[Ы“ШњЩ\ќ™\Љ
[ќљY\КHO€ИY€
[ќљY\ЛњЫЫYJ
[ќћJHO€[ќћKљ\Т[ќ\њЩXЭ[™КJHИШЩ[™SШњЩ\ќ™\‹™\ШЫЫ›™XЭ

NИ›ЫЭШЩ[™J
NИHKИ›ЫЭX\™Ъ[Ћ‰НЊ	ИJNВ€ШЩ[™SШњЩ\ќ™\‹›ШњЩ\ќ™JШЩ[™Q[[Y[ќ
NВџH[ЩHY€
ШЩ[™Q[[Y[ќ
H›ЫЭШЩ[™J
NВќЪ[™ЭЛY]™[ќ\Э[™\Љ	ЬYЩZYIЛ

HO€И\Э›ЮTЪЭ[

NИ\Э›ЮTШЩ[™J
NИKИЫЩNќќYHJNВ