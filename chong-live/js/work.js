import { projects } from './projects.js';

const grid = document.querySelector('[data-work-grid]');
const filters = [...document.querySelectorAll('[data-filter]')];

function card(project) {
  return `<article class="work-grid-card ${project.tone}" data-work-card data-categories="${project.categories.join(' ')}">
    <div class="work-grid-art" aria-hidden="true"><span>${project.index}</span></div>
    <p class="eyebrow">${project.kind} / ${project.year}</p>
    <h2>${project.title}</h2>
    <p>${project.summary}</p>
    <ul>${project.techniques.map((item) => `<li>${item}</li>`).join('')}</ul>
  </article>`;
}

grid.innerHTML = projects.map(card).join('');

filters.forEach((button) => button.addEventListener('click', () => {
  filters.forEach((item) => item.classList.toggle('is-active', item === button));
  const filter = button.dataset.filter;
  document.querySelectorAll('[data-work-card]').forEach((item) => {
    item.hidden = filter !== 'all' && !item.dataset.categories.split(' ').includes(filter);
  });
}));
