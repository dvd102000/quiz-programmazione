let questions = [];
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let answered = {};
let wrongQuestions = [];

const questionText = document.getElementById("questionText");
const optionsEl = document.getElementById("options");
const currentIndexEl = document.getElementById("currentIndex");
const totalQEl = document.getElementById("totalQ");
const correctCountEl = document.getElementById("correctCount");
const wrongCountEl = document.getElementById("wrongCount");
const reviewWrongBtn = document.getElementById("reviewWrongBtn");

async function loadQuestions() {
  const resp = await fetch("questions.json");
  questions = await resp.json();
  totalQEl.textContent = questions.length;
  renderQuestion();
}

function renderQuestion() {
  const q = questions[currentIndex];
  currentIndexEl.textContent = currentIndex + 1;
  questionText.textContent = q.text;

  optionsEl.innerHTML = "";
  q.options.forEach(opt => {
    let letter = opt.trim()[0];
    const btn = document.createElement("button");
    btn.className = "optionBtn";
    btn.innerHTML = `<div class="optionLetter">${letter}</div><div>${opt.slice(2)}</div>`;
    btn.onclick = () => answer(q, letter, btn);
    
    if (answered[q.id]) btn.disabled = true;
    optionsEl.appendChild(btn);
  });

  updateButtons();
}

function answer(q, letter, btn) {
  if (answered[q.id]) return;
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
  
  [...optionsEl.children].forEach(b => b.disabled = true);
}

function updateCounters() {
  correctCountEl.textContent = `Giuste: ${correctCount}`;
  wrongCountEl.textContent = `Sbagliate: ${wrongCount}`;
  reviewWrongBtn.textContent = `Rivedi sbagliate (${wrongQuestions.length})`;
}

document.getElementById("prevBtn").onclick = () => {
  if (currentIndex > 0) currentIndex--;
  renderQuestion();
};

document.getElementById("nextBtn").onclick = () => {
  if (currentIndex < questions.length - 1) currentIndex++;
  renderQuestion();
};

function updateButtons() {
  document.getElementById("prevBtn").disabled = currentIndex === 0;
  document.getElementById("nextBtn").disabled = currentIndex === questions.length - 1;
}

reviewWrongBtn.onclick = () => {
  document.getElementById("quizArea").classList.add("hidden");
  document.getElementById("reviewArea").classList.remove("hidden");

  const list = document.getElementById("wrongList");
  list.innerHTML = "";

  if (wrongQuestions.length === 0) {
    list.innerHTML = "<p>Perfetto, nessun errore!</p>";
    return;
  }

  wrongQuestions.forEach(q => {
    const div = document.createElement("div");
    div.className = "wrongCard";
    div.innerHTML = `<strong>${q.text}</strong><br>${q.options.join("<br>")}<br><b>Corretta: ${q.correct}</b>`;
    list.appendChild(div);
  });
};

document.getElementById("backToQuiz").onclick = () => {
  document.getElementById("quizArea").classList.remove("hidden");
  document.getElementById("reviewArea").classList.add("hidden");
};

document.getElementById("restartBtn").onclick = () => {
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  answered = {};
  wrongQuestions = [];
  updateCounters();
  renderQuestion();
};

loadQuestions();
