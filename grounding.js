/* ─── State ──────────────────────────────────────────────── */
let exercises   = [];
let current     = null;   // active exercise object
let stepIndex   = 0;
let timeLeft    = 0;
let ticker      = null;
let isPaused    = false;
let audioEnabled = false;
let audioCtx    = null;

const CIRCUMFERENCE = 175.9; // 2π × r(28)

/* ─── Elements ───────────────────────────────────────────── */
const selectionView   = document.getElementById('selection-view');
const exerciseView    = document.getElementById('exercise-view');
const completionView  = document.getElementById('completion-view');

const exerciseSelect  = document.getElementById('exercise-select');
const audioToggle     = document.getElementById('audio-toggle');
const beginBtn        = document.getElementById('begin-btn');

const exerciseCategory = document.getElementById('exercise-category');
const exerciseTitle    = document.getElementById('exercise-title');
const exerciseDesc     = document.getElementById('exercise-description');
const progressBar      = document.getElementById('progress-bar');
const stepCount        = document.getElementById('step-count');
const stepInstruction  = document.getElementById('step-instruction');
const timerNumber      = document.getElementById('timer-number');
const ringFill         = document.getElementById('ring-fill');
const pauseBtn         = document.getElementById('pause-btn');
const skipBtn          = document.getElementById('skip-btn');

const anotherBtn       = document.getElementById('another-exercise-btn');

/* ─── Load exercises ─────────────────────────────────────── */
async function loadExercises() {
  try {
    const res = await fetch('exercises.json');
    if (!res.ok) throw new Error('Could not load exercises.json');
    exercises = await res.json();
    populateSelect();
  } catch (err) {
    console.error(err);
  }
}

function populateSelect() {
  exercises.forEach(ex => {
    const opt = document.createElement('option');
    opt.value = ex.id;
    opt.textContent = `${ex.title} — ${ex.category}`;
    exerciseSelect.appendChild(opt);
  });
}

/* ─── Begin ──────────────────────────────────────────────── */
function beginExercise() {
  const val = exerciseSelect.value;
  current = val === 'random'
    ? exercises[Math.floor(Math.random() * exercises.length)]
    : exercises.find(e => e.id === val);

  if (!current) return;

  audioEnabled = audioToggle.checked;
  stepIndex    = 0;

  // Populate header
  exerciseCategory.textContent = current.category;
  exerciseTitle.textContent    = current.title;
  exerciseDesc.textContent     = current.description;

  showView(exerciseView);
  loadStep();
}

/* ─── Step logic ─────────────────────────────────────────── */
function loadStep() {
  if (stepIndex >= current.steps.length) {
    finishExercise();
    return;
  }

  const step = current.steps[stepIndex];

  // Update progress
  const pct = (stepIndex / current.steps.length) * 100;
  progressBar.style.width = pct + '%';
  stepCount.textContent   = `step ${stepIndex + 1} of ${current.steps.length}`;

  // Animate card
  const card = document.getElementById('step-card');
  card.classList.remove('visible');
  void card.offsetWidth;
  card.classList.add('visible');

  stepInstruction.textContent = step.instruction;
  timeLeft = step.duration;

  updateTimerDisplay(timeLeft, step.duration);
  clearInterval(ticker);

  if (audioEnabled) playTone();

  ticker = setInterval(() => {
    if (isPaused) return;
    timeLeft--;
    updateTimerDisplay(timeLeft, step.duration);
    if (timeLeft <= 0) {
      clearInterval(ticker);
      stepIndex++;
      setTimeout(loadStep, 600);
    }
  }, 1000);
}

function updateTimerDisplay(remaining, total) {
  timerNumber.textContent = remaining;
  const offset = CIRCUMFERENCE * (1 - remaining / total);
  ringFill.style.strokeDashoffset = offset;
}

/* ─── Pause / skip ───────────────────────────────────────── */
pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'resume' : 'pause';
});

skipBtn.addEventListener('click', () => {
  clearInterval(ticker);
  stepIndex++;
  loadStep();
});

/* ─── Finish ─────────────────────────────────────────────── */
function finishExercise() {
  clearInterval(ticker);
  progressBar.style.width = '100%';
  setTimeout(() => showView(completionView), 400);
}

/* ─── Another exercise ───────────────────────────────────── */
anotherBtn.addEventListener('click', () => {
  isPaused = false;
  pauseBtn.textContent = 'pause';
  showView(selectionView);
});

/* ─── View switcher ──────────────────────────────────────── */
function showView(view) {
  [selectionView, exerciseView, completionView].forEach(v => {
    v.style.display = 'none';
  });
  view.style.display = 'flex';
}

/* ─── Audio (Web Audio API) ──────────────────────────────── */
function playTone() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const osc   = audioCtx.createOscillator();
    const gain  = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type      = 'sine';
    osc.frequency.setValueAtTime(432, audioCtx.currentTime); // warm A

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.4);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 1.5);
  } catch (e) {
    console.warn('Audio not available:', e);
  }
}

/* ─── Events ─────────────────────────────────────────────── */
beginBtn.addEventListener('click', beginExercise);

/* ─── Init ───────────────────────────────────────────────── */
loadExercises();
