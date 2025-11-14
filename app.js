let allQuestions = [];
let questions = [];
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let answered = {};
let wrongQuestions = [];
let currentUser = "";
let orderMode = "ordered"; // "ordered" | "random"
let questionLimit = "all"; // "all" or number
let testFinished = false;

const questionText = document.getElementById("questionText");
const optionsEl = document.getElementById("options");
const currentIndexEl = document.getElementById("currentIndex");
const totalQEl = document.getElementById("totalQ");
const correctCountEl = document.getElementById("correctCount");
const wrongCountEl = document.getElementById("wrongCount");
const skippedCountEl = document.getElementById("skippedCount");
const reviewWrongBtn = document.getElementById("reviewWrongBtn");
const summaryEl = document.getElementById("summary");

const quizArea = document.getElementById("quizArea");
const reviewArea = document.getElementById("reviewArea");
const recordsArea = document.getElementById("recordsArea");
const navQuizBtn = document.getElementById("navQuiz");
const navRecordsBtn = document.getElementById("navRecords");

const openConfigBtn = document.getElementById("openConfigBtn");
const configOverlay = document.getElementById("configOverlay");
const nameInput = document.getElementById("userName");
const orderInputs = document.querySelectorAll("input[name='orderMode']");
const countInputs = document.querySelectorAll("input[name='questionCount']");
const startBtn = document.getElementById("startBtn");
const cancelConfigBtn = document.getElementById("cancelConfigBtn");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const finishBtn = document.getElementById("finishBtn");
const restartBtn = document.getElementById("restartBtn");
const backToQuizBtn = document.getElementById("backToQuiz");
const wrongList = document.getElementById("wrongList");
const resultsList = document.getElementById("resultsList");

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function applyConfigToQuestions(source) {
  allQuestions = source;
  let ordered = orderMode === "random" ? shuffleArray(allQuestions) : [...allQuestions];

  let limit;
  if (questionLimit === "all") {
    limit = ordered.length;
  } else {
    limit = Math.min(parseInt(questionLimit, 10) || ordered.length, ordered.length);
  }

  questions = ordered.slice(0, limit);
  totalQEl.textContent = questions.length;
  currentIndex = 0;
}

async function loadQuestions() {
  try {
    if (!allQuestions.length) {
      const resp = await fetch("questions.json");
      if (!resp.ok) {
        throw new Error("HTTP " + resp.status);
      }
      const data = await resp.json();
      if (!Array.isArray(data) || data.length === 0) {
        questionText.textContent = "Nessuna domanda trovata (controlla questions.json).";
        optionsEl.innerHTML = "";
        return;
      }
      applyConfigToQuestions(data);
    } else {
      applyConfigToQuestions(allQuestions);
    }

    renderQuestion();
  } catch (err) {
    console.error(err);
    questionText.textContent = "Errore nel caricamento delle domande.";
    optionsEl.innerHTML = "";
  }
}

function renderQuestion() {
  if (!questions.length) {
    questionText.textContent = "Nessuna domanda disponibile.";
    optionsEl.innerHTML = "";
    return;
  }

  const q = questions[currentIndex];
  currentIndexEl.textContent = currentIndex + 1;
  questionText.textContent = q.text;

  optionsEl.innerHTML = "";
  q.options.forEach(opt => {
    const letter = opt.trim()[0];
    const btn = document.createElement("button");
    btn.className = "optionBtn";
    btn.innerHTML = `<div class="optionLetter">${letter}</div><div class="optionText">${opt.replace(/^[A-E]\s*[\.\)]\s*/i, "")}</div>`;
    btn.onclick = () => answer(q, letter, btn);

    if (answered[q.id]) btn.disabled = true;
    optionsEl.appendChild(btn);
  });

  updateButtons();
}

function answer(q, letter, btn) {
  if (testFinished || answered[q.id]) return;
  answered[q.id] = letter;

  if (letter === q.correct) {
    correctCount++;
    btn.style.borderColor = "green";
  } else {
    wrongCount++;
    btn.style.borderColor = "red";
    wrongQuestions.push(q);
  }

  updateCounters();

  [...optionsEl.children].forEach(b => (b.disabled = true));

  const answeredCount = Object.keys(answered).length;
  if (answeredCount === questions.length) {
    finishTest();
  } else if (currentIndex < questions.length - 1) {
    setTimeout(() => {
      if (!testFinished && currentIndex < questions.length - 1) {
        currentIndex++;
        renderQuestion();
      }
    }, 400);
  }
}

function updateCounters() {
  correctCountEl.textContent = `Giuste: ${correctCount}`;
  wrongCountEl.textContent = `Sbagliate: ${wrongCount}`;
  const total = questions.length || 0;
  const answeredCount = Object.keys(answered).length;
  const skipped = total - answeredCount;
  skippedCountEl.textContent = `Astenute: ${skipped}`;
  reviewWrongBtn.textContent = `Rivedi sbagliate (${wrongQuestions.length})`;
}

function updateButtons() {
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === questions.length - 1;
}

prevBtn.onclick = () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
};

nextBtn.onclick = () => {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderQuestion();
  }
};

finishBtn.onclick = () => {
  if (!questions.length) return;
  finishTest();
};

function finishTest() {
  if (testFinished) return;
  testFinished = true;

  const total = questions.length || 0;
  const answeredCount = Object.keys(answered).length;
  const skipped = total - answeredCount;
  const percent = total ? Math.round((correctCount / total) * 100) : 0;

  if (summaryEl) {
    summaryEl.textContent = `Hai risposto correttamente a ${correctCount} domande su ${total} (${percent}%). Astenute: ${skipped}.`;
    summaryEl.classList.remove("hidden");
  }

  updateCounters();
  saveResult(skipped);

  setTimeout(() => {
    resetState();
    showRecordsView();
    openConfig();
  }, 800);
}

reviewWrongBtn.onclick = () => {
  quizArea.classList.add("hidden");
  reviewArea.classList.remove("hidden");

  wrongList.innerHTML = "";

  if (wrongQuestions.length === 0) {
    wrongList.innerHTML = "<p>Perfetto, nessun errore!</p>";
    return;
  }

  wrongQuestions.forEach(q => {
    const div = document.createElement("div");
    div.className = "wrongCard";
    div.innerHTML = `<strong>${q.text}</strong><br>${q.options.join("<br>")}<br><b>Corretta: ${q.correct}</b>`;
    wrongList.appendChild(div);
  });
};

backToQuizBtn.onclick = () => {
  quizArea.classList.remove("hidden");
  reviewArea.classList.add("hidden");
};

function resetState() {
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  answered = {};
  wrongQuestions = [];
  testFinished = false;
  if (summaryEl) {
    summaryEl.classList.add("hidden");
    summaryEl.textContent = "";
  }
  updateCounters();
}

restartBtn.onclick = () => {
  resetState();
  quizArea.classList.add("hidden");
  reviewArea.classList.add("hidden");
  showRecordsView();
  openConfig();
};

function saveResult(skipped) {
  if (!currentUser) return;
  const total = questions.length || 0;
  const percent = total ? Math.round((correctCount / total) * 100) : 0;

  let results = [];
  try {
    const raw = localStorage.getItem("quizResults");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) results = parsed;
    }
  } catch (e) {
    console.error("Errore lettura risultati", e);
  }

  results.push({
    name: currentUser,
    correct: correctCount,
    wrong: wrongCount,
    skipped,
    total,
    percent,
    order: orderMode,
    date: new Date().toISOString()
  });

  try {
    localStorage.setItem("quizResults", JSON.stringify(results));
  } catch (e) {
    console.error("Errore salvataggio risultati", e);
  }

  renderResults(results);
}

function renderResults(results) {
  if (!resultsList) return;
  if (!results || results.length === 0) {
    resultsList.innerHTML = "<p>Nessun tentativo salvato.</p>";
    return;
  }

  let rows = "";
  let shown = 0;
  for (let idx = results.length - 1; idx >= 0 && shown < 10; idx--, shown++) {
    const r = results[idx];
    const dateStr = new Date(r.date).toLocaleDateString();
    const orderLabel = r.order === "random" ? "Casuale" : "Ordinato";
    const skipped = typeof r.skipped === "number" ? r.skipped : 0;
    rows += `<tr data-index="${idx}">
      <td>${r.name}</td>
      <td>${r.correct}</td>
      <td>${r.wrong}</td>
      <td>${skipped}</td>
      <td>${r.percent}%</td>
      <td>${orderLabel}</td>
      <td>${dateStr}</td>
      <td class="actionsCell">
        <button class="infoRecordBtn">Info</button>
        <button class="deleteRecordBtn">Elimina</button>
      </td>
    </tr>`;
  }

  resultsList.innerHTML = `
    <table class="resultsTable">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Giuste</th>
          <th>Sbagliate</th>
          <th>Astenute</th>
          <th>%</th>
          <th>Ordine</th>
          <th>Data</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function loadResults() {
  let results = [];
  try {
    const raw = localStorage.getItem("quizResults");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) results = parsed;
    }
  } catch (e) {
    console.error("Errore lettura risultati", e);
  }
  renderResults(results);
}

function openConfig() {
  configOverlay.classList.remove("hidden");
  if (currentUser) {
    nameInput.value = currentUser;
  }
  nameInput.focus();
}

function closeConfig() {
  configOverlay.classList.add("hidden");
}

startBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (!name) {
    alert("Inserisci il nome utente.");
    nameInput.focus();
    return;
  }
  currentUser = name;

  orderMode = "ordered";
  orderInputs.forEach(radio => {
    if (radio.checked) orderMode = radio.value;
  });

  let qValue = "all";
  countInputs.forEach(radio => {
    if (radio.checked) qValue = radio.value;
  });
  questionLimit = qValue === "all" ? "all" : parseInt(qValue, 10) || "all";

  resetState();
  closeConfig();
  showQuizView();
  loadQuestions();
};

cancelConfigBtn.onclick = () => {
  closeConfig();
};

function showQuizView() {
  quizArea.classList.remove("hidden");
  recordsArea.classList.add("hidden");
  reviewArea.classList.add("hidden");
  navQuizBtn.classList.add("active");
  navRecordsBtn.classList.remove("active");
}

function showRecordsView() {
  recordsArea.classList.remove("hidden");
  quizArea.classList.add("hidden");
  reviewArea.classList.add("hidden");
  navQuizBtn.classList.remove("active");
  navRecordsBtn.classList.add("active");
}

navQuizBtn.onclick = () => {
  showQuizView();
  if (!questions.length) {
    openConfig();
  }
};

navRecordsBtn.onclick = () => {
  showRecordsView();
};

openConfigBtn.onclick = () => {
  openConfig();
};

resultsList.addEventListener("click", e => {
  const infoBtn = e.target.closest(".infoRecordBtn");
  const deleteBtn = e.target.closest(".deleteRecordBtn");
  const row = e.target.closest("tr");
  if (!row) return;
  const idx = parseInt(row.getAttribute("data-index"), 10);
  if (Number.isNaN(idx)) return;

  let results = [];
  try {
    const raw = localStorage.getItem("quizResults");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) results = parsed;
    }
  } catch (e) {
    console.error("Errore lettura risultati", e);
  }

  if (idx < 0 || idx >= results.length) return;
  const rec = results[idx];

  if (infoBtn) {
    const skipped = typeof rec.skipped === "number" ? rec.skipped : 0;
    alert(
      `Nome: ${rec.name}\n` +
      `Giuste: ${rec.correct}\n` +
      `Sbagliate: ${rec.wrong}\n` +
      `Astenute: ${skipped}\n` +
      `Percentuale: ${rec.percent}%\n` +
      `Ordine: ${rec.order === "random" ? "Casuale" : "Ordinato"}\n` +
      `Data: ${new Date(rec.date).toLocaleString()}`
    );
    return;
  }

  if (deleteBtn) {
    if (!confirm("Vuoi davvero eliminare questo record?")) return;

    results.splice(idx, 1);
    try {
      localStorage.setItem("quizResults", JSON.stringify(results));
    } catch (e) {
      console.error("Errore salvataggio risultati", e);
    }
    renderResults(results);
  }
});

// Inizializza: mostra il quiz e apre il popup di configurazione
loadResults();
showQuizView();
openConfig();
