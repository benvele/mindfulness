/* ─── State ──────────────────────────────────────────────── */
let prompts = [];
let lastPromptIndex = null;
let currentCategory = 'random';

/* ─── Elements ───────────────────────────────────────────── */
const select      = document.getElementById('category-select');
const getBtn      = document.getElementById('get-prompt-btn');
const anotherBtn  = document.getElementById('another-btn');
const card        = document.getElementById('prompt-card');
const promptText  = document.getElementById('prompt-text');
const promptCat   = document.getElementById('prompt-category');

/* ─── Load prompts ───────────────────────────────────────── */
async function loadPrompts() {
  try {
    const res = await fetch('prompts.json');
    if (!res.ok) throw new Error('Could not load prompts.json');
    prompts = await res.json();
    populateCategories();
  } catch (err) {
    console.error(err);
    promptText.textContent = 'Prompts could not be loaded. Please try again later.';
    card.classList.add('visible');
  }
}

/* ─── Populate dropdown ──────────────────────────────────── */
function populateCategories() {
  const categories = [...new Set(prompts.map(p => p.category))].sort();
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

/* ─── Pick a prompt ──────────────────────────────────────── */
function getPrompt() {
  currentCategory = select.value;
  const pool = currentCategory === 'random'
    ? prompts
    : prompts.filter(p => p.category === currentCategory);

  if (!pool.length) return;

  // Avoid repeating the same prompt immediately
  let index;
  if (pool.length === 1) {
    index = 0;
  } else {
    do {
      index = Math.floor(Math.random() * pool.length);
    } while (index === lastPromptIndex && pool.length > 1);
  }

  lastPromptIndex = index;
  showPrompt(pool[index]);
}

/* ─── Display prompt ─────────────────────────────────────── */
function showPrompt(item) {
  // Reset animation by removing and re-adding class
  card.classList.remove('visible');
  void card.offsetWidth; // reflow trigger
  card.classList.add('visible');

  promptCat.textContent = item.category;
  promptText.textContent = item.prompt;
  anotherBtn.style.display = 'inline-block';
}

/* ─── Events ─────────────────────────────────────────────── */
getBtn.addEventListener('click', getPrompt);
anotherBtn.addEventListener('click', getPrompt);

select.addEventListener('change', () => {
  // Reset last index when category changes
  lastPromptIndex = null;
});

/* ─── Init ───────────────────────────────────────────────── */
loadPrompts();
