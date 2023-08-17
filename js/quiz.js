"use strict";
import { navigateToPage } from "./index.js";
import { showToast } from "../utils/showToast.js";
import { isValidQuizObj } from "../utils/isValidQuizObj.js";
import { getVolumeFromStorage, setVolumeToStorage } from "../utils/storage.js";

const answerGuide = document.getElementById("answer-guide");
const choiceChecks = document.querySelectorAll(".choice-check");
const choicesGroup = document.getElementById("choices-group");
const typeTextInput = document.getElementById("type-text-input");
const startQuizBtn = document.getElementById("start-quiz");
const decisionBtn = document.getElementById("decision-btn");
const nextQuestionBtn = document.getElementById("next-question-btn");
const replayQuizBtn = document.getElementById("replay-quiz");
const correctOrWrongGroup = document.getElementById("correct-or-wrong-group");
const questionSection = document.getElementById("question-section");
const explSection = document.getElementById("explanation-section");
const userAnswerEl = document.getElementById("user-answer");
const correctAnswerEl = document.getElementById("correct-answer");
const explanationEl = document.getElementById("explanation");
const correctIcon = '<i class="bi bi-circle text-success"></i>';
const wrongIcon = '<i class="bi bi-x-lg text-danger"></i>';
const qPage = document.getElementById("quiz-page");
const toggleVolumeBtn = document.getElementById("toggle-volume");
const audioVolumeInput = document.getElementById("audio-volume-input");
const confettiCanvas = document.getElementById("confetti");

const screens = {
  title: document.getElementById("title-screen"),
  countdown: document.getElementById("countdown-screen"),
  quiz: document.getElementById("quiz-screen"),
  result: document.getElementById("result-screen"),
};
const audio = {
  correct: new Audio("audios/correct.mp3"),
  wrong: new Audio("audios/wrong.mp3"),
  timer: new Audio("audios/timer.mp3"),
  countdown: new Audio("audios/countdown.mp3"),
  drumroll: new Audio("audios/drumroll.mp3"),
  cymbal: new Audio("audios/cymbal.mp3"),
};
const quizObj = {
  /**@type {Quiz} */
  quiz: null,
  questionIndex: 1,
  timerInterval: null,
  countdownInterval: null,
  waitTImeout: null,
  correctLength: 0,
  volume: getVolumeFromStorage() ?? audioVolumeInput.value / 100,
  confettiFrameId: 0,
  confettiTimeout: null,
};
audioVolumeInput.value = quizObj.volume * 100;
Object.values(audio).forEach((a) => {
  a.volume = quizObj.volume;
});
changeVolumeIcon(quizObj.volume);

qPage.addEventListener("click", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach((el) => {
    const classList = el.classList;
    if (!el.className) return;

    if (classList.contains("choice-check")) {
      let noneChecked = true;
      choiceChecks.forEach((c) => {
        if (c.checked) {
          noneChecked = false;
        }
      });
      if (noneChecked) {
        decisionBtn.disabled = true;
      } else {
        decisionBtn.disabled = false;
      }
    }
  });
});
typeTextInput.addEventListener("input", (e) => {
  if (!typeTextInput.value) {
    decisionBtn.disabled = true;
  } else {
    decisionBtn.disabled = false;
  }
});
startQuizBtn.addEventListener("click", () => {
  startQuiz();
});
replayQuizBtn.addEventListener("click", (e) => {
  initQuizPage();
});
nextQuestionBtn.addEventListener("click", (e) => {
  const quizLength = quizObj.quiz.length;
  if (quizObj.questionIndex === quizLength) {
    document.getElementById("quiz-length").innerText = quizLength;
    const correctLength = quizObj.correctLength;
    document.getElementById("correct-length").innerText = correctLength;
    const resultMessage = getQuizResultMessage(quizLength, correctLength);
    document.getElementById("result-message").innerText = resultMessage;
    const accuracy = getAccuracy(quizLength, correctLength);
    drawPieChart(0, accuracy);
    if (accuracy === 100) {
      quizObj.confettiTimeout = setTimeout(() => {
        drawConfetti();
      }, 2400);
    }
    showScreen("result");
    nextQuestionBtn.classList.add("d-none");
    return;
  }
  quizObj.questionIndex++;
  showQuestion();
});
decisionBtn.addEventListener("click", async (e) => {
  decisionBtn.disabled = true;
  clearInterval(quizObj.timerInterval);
  pauseAudio(audio.timer);
  const q = getCurrentQuestion();
  switch (q.answerType) {
    case "select": {
      const { correctAnswer } = q;
      let userAnswer;
      choiceChecks.forEach((c) => {
        const choiceBtn = document.querySelector(`[for="${c.id}"]`);
        c.disabled = true;
        if (c.checked) {
          userAnswer = choiceBtn.innerText;
        }
      });
      const isAnswerCorrect = userAnswer === correctAnswer;
      if (isAnswerCorrect) quizObj.correctLength++;
      await showCorrectOrWrong(isAnswerCorrect);
      const expl = q?.options?.explanation;
      questionSection.classList.add("d-none");
      explSection.classList.remove("d-none");
      userAnswerEl.innerHTML = `${userAnswer} ${
        isAnswerCorrect ? correctIcon : wrongIcon
      }`;
      correctAnswerEl.innerHTML = correctAnswer;
      explanationEl.innerText = expl || "解説なし";
      break;
    }
    case "select-all": {
      const { correctAnswers } = q;
      let userAnswers = [];
      choiceChecks.forEach((c) => {
        const choiceBtn = document.querySelector(`[for="${c.id}"]`);
        const btnInnerTxt = choiceBtn.innerText;
        c.disabled = true;
        if (c.checked) {
          userAnswers.push(btnInnerTxt);
        }
      });
      const isAnswerCorrect = areArraysEqual(userAnswers, correctAnswers);
      if (isAnswerCorrect) quizObj.correctLength++;
      await showCorrectOrWrong(isAnswerCorrect);
      const expl = q?.options?.explanation;
      questionSection.classList.add("d-none");
      explSection.classList.remove("d-none");
      userAnswerEl.innerHTML = `${userAnswers.join(", ")} ${
        isAnswerCorrect ? correctIcon : wrongIcon
      }`;
      correctAnswerEl.innerHTML = correctAnswers.join(", ");
      explanationEl.innerText = expl || "解説なし";
      break;
    }
    case "type-text": {
      typeTextInput.disabled = true;
      const { correctAnswer } = q;
      const userAnswer = typeTextInput.value;
      const isAnswerCorrect = userAnswer === correctAnswer;
      if (isAnswerCorrect) quizObj.correctLength++;
      await showCorrectOrWrong(isAnswerCorrect);
      const expl = q?.options?.explanation;
      questionSection.classList.add("d-none");
      explSection.classList.remove("d-none");
      userAnswerEl.innerHTML = `${userAnswer} ${
        isAnswerCorrect ? correctIcon : wrongIcon
      }`;
      correctAnswerEl.innerHTML = correctAnswer;
      explanationEl.innerText = expl || "解説なし";
      break;
    }
  }
  decisionBtn.classList.add("d-none");
  nextQuestionBtn.classList.remove("d-none");
});
toggleVolumeBtn.addEventListener("click", () => {
  if (parseInt(audioVolumeInput.value) > 0) {
    audioVolumeInput.value = 0;
    Object.values(audio).forEach((a) => {
      a.volume = 0;
      setVolumeToStorage(0);
    });
    changeVolumeIcon(0);
  } else {
    const volume = quizObj.volume || 1;// 1 はローカルストレージにvolumeが0で保存されている時のため
    audioVolumeInput.value = volume * 100;
    Object.values(audio).forEach((a) => {
      a.volume = volume;
      setVolumeToStorage(volume);
    });
    changeVolumeIcon(volume);
  }
});
audioVolumeInput.addEventListener("input", () => {
  const volume = parseInt(audioVolumeInput.value) / 100;
  if (volume !== 0) {
    quizObj.volume = volume;
  }
  Object.values(audio).forEach((a) => {
    a.volume = volume;
    setVolumeToStorage(volume);
  });
  changeVolumeIcon(volume);
});

function changeVolumeIcon(volume) {
  document
    .getElementById("volume-mute-icon")
    .classList.toggle("d-none", volume !== 0);
  document
    .getElementById("volume-off-icon")
    .classList.toggle("d-none", volume >= 0.3 || volume === 0);
  document
    .getElementById("volume-down-icon")
    .classList.toggle("d-none", volume >= 0.8 || volume < 0.3 || volume === 0);
  document
    .getElementById("volume-up-icon")
    .classList.toggle("d-none", volume < 0.8);
}

export function endQuiz() {
  clearInterval(quizObj.countdownInterval);
  clearInterval(quizObj.timerInterval);
  clearTimeout(quizObj.waitTImeout);
  clearTimeout(quizObj.confettiTimeout);
  stopAndClearConfetti();
  Object.values(audio).forEach((a) => {
    pauseAudio(a);
  });
}

async function showCorrectOrWrong(isAnswerCorrect) {
  playAudio(isAnswerCorrect ? audio.correct : audio.wrong);
  correctOrWrongGroup.classList.remove("d-none");
  document
    .getElementById("correct")
    .classList.toggle("d-none", !isAnswerCorrect);
  document.getElementById("wrong").classList.toggle("d-none", isAnswerCorrect);
  await wait(1000);
  correctOrWrongGroup.classList.add("d-none");
}

/**
 *
 * @returns {Question}
 */
function getCurrentQuestion() {
  return quizObj.quiz.questions[`q${quizObj.questionIndex}`];
}

async function startQuiz() {
  showScreen("countdown");
  await countdown();
  showScreen("quiz");
  showQuestion();
}

function showQuestion() {
  correctOrWrongGroup.classList.add("d-none");
  nextQuestionBtn.classList.add("d-none");
  decisionBtn.classList.remove("d-none");
  decisionBtn.disabled = false;
  questionSection.classList.remove("d-none");
  explSection.classList.add("d-none");
  const time = quizObj.quiz?.options?.timer;
  const isNum = !isNaN(time);
  document.getElementById("timer-group").classList.toggle("d-none", !isNum);
  const q = getCurrentQuestion();
  const questionIndex = quizObj.questionIndex;
  document.querySelectorAll(".question-index").forEach((qI) => {
    qI.innerText = `${questionIndex}問目`;
  });
  if (questionIndex === quizObj.quiz.length) {
    nextQuestionBtn.innerText = "結果を表示";
  }
  document.getElementById("question-statement").innerText = q.statement;
  decisionBtn.disabled = true;
  const { answerType } = q;
  switch (answerType) {
    case "select":
    case "select-all": {
      answerGuide.innerHTML =
        answerType === "select"
          ? "正しいと思う選択肢を一つ選んでください"
          : '正しいと思う選択肢を<span class="fw-bolder">一つ以上</span>選んでください';
      choicesGroup.classList.remove("d-none");
      typeTextInput.classList.add("d-none");
      const choicesLength = q.choices.length;
      const choices = document.querySelectorAll(".choice-cont");
      choices.forEach((c, i) => {
        if (i < choicesLength) {
          c.classList.remove("d-none");
        } else {
          c.classList.add("d-none");
        }
      });
      const inputType = answerType === "select" ? "radio" : "checkbox";
      choiceChecks.forEach((c) => {
        c.disabled = false;
        c.checked = false;
        c.setAttribute("type", inputType);
      });
      const shuffledChoices = shuffleChoices(q.choices);
      const choiceBtns = document.querySelectorAll(".choice-btn");
      choiceBtns.forEach((b, i) => {
        b.innerText = shuffledChoices[i];
      });
      break;
    }
    case "type-text": {
      typeTextInput.value = "";
      answerGuide.innerText = "正しいと思う答えを入力してください";
      choicesGroup.classList.add("d-none");
      typeTextInput.classList.remove("d-none");
      typeTextInput.disabled = false;
      typeTextInput.focus();
      break;
    }
  }
  if (isNum) {
    startTimer(time);
  }
  questionSection.focus();
}

function startTimer(time) {
  if (!time) return;

  const timerBar = document.getElementById("timer-bar");
  const timerTxt = document.getElementById("timer-txt");
  const interval = 10;
  let startTime = null;
  let lastLoggedSeconds = time;
  timerTxt.innerText = `残り: ${time}秒`;
  playAudio(audio.timer, true);

  async function updateTimer() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    const remainingTime = Math.max(0, time * 1000 - elapsedTime);
    const remainingSeconds = Math.ceil(remainingTime / 1000);
    const widthPercentage = (remainingTime / (time * 1000)) * 100;

    timerBar.style.width = `${widthPercentage}%`;
    updateTimerStyle(widthPercentage);

    if (remainingSeconds < lastLoggedSeconds) {
      let innerText;
      if (remainingSeconds === 0) {
        innerText = "タイムアップ!";
      } else {
        innerText = `残り: ${remainingSeconds}秒`;
      }
      timerTxt.innerText = innerText;
      lastLoggedSeconds = remainingSeconds;
    }

    if (remainingTime <= 0) {
      clearInterval(quizObj.timerInterval);
      pauseAudio(audio.timer);
      await showCorrectOrWrong(false);
      const q = getCurrentQuestion();
      const { correctAnswer, correctAnswers } = q;
      const expl = q?.options?.explanation;
      questionSection.classList.add("d-none");
      explSection.classList.remove("d-none");
      userAnswerEl.innerHTML = `回答なし ${wrongIcon}`;
      correctAnswerEl.innerHTML = `${
        correctAnswer || correctAnswers.join(", ")
      }`;
      explanationEl.innerText = expl || "解説なし";
      decisionBtn.classList.add("d-none");
      nextQuestionBtn.classList.remove("d-none");
    }
  }

  function updateTimerStyle(percentage) {
    timerBar.classList.toggle("bg-primary", percentage > 40);
    timerBar.classList.toggle(
      "bg-warning",
      percentage <= 40 && percentage > 10
    );
    timerBar.classList.toggle("bg-danger", percentage <= 10);
  }

  function startInterval() {
    startTime = Date.now();
    updateTimer();
    quizObj.timerInterval = setInterval(updateTimer, interval);
  }

  startInterval();
}

function countdown(number = 3) {
  playAudio(audio.countdown);
  return new Promise((resolve) => {
    const countdownEl = document.getElementById("countdown");

    let currentNum = number;
    countdownEl.innerText = currentNum;

    quizObj.countdownInterval = setInterval(() => {
      currentNum--;
      if (currentNum > 0) {
        countdownEl.innerText = currentNum;
      } else {
        clearInterval(quizObj.countdownInterval);
        pauseAudio(audio.countdown);
        resolve();
      }
    }, 1000);
  });
}

/**
 * @description
 * @param {"title" | "countdown" | "quiz" | "result"} screenName
 */
function showScreen(screenName) {
  const screen = screens[screenName];

  screen.classList.remove("d-none");
  hideOtherScreen(screenName);
}

function hideOtherScreen(screenName) {
  for (const screen of Object.values(screens)) {
    screen.classList.toggle("d-none", screen !== screens[screenName]);
  }
}

export function initQuizPage(quizData = null) {
  if (quizData) {
    setQuiz(quizData);
  }
  const quiz = quizObj.quiz;
  let toastMessage = null;
  if (!quiz) {
    toastMessage = "クイズが見つかりませんでした";
  } else if (!isValidQuizObj(quiz)) {
    toastMessage = "無効なクイズデータです";
  }
  if (toastMessage) {
    showToast("red", toastMessage);
    navigateToPage("quizList");
    return;
  }
  stopAndClearConfetti();
  quizObj.questionIndex = 1;
  quizObj.timerInterval = null;
  quizObj.countdownInterval = null;
  quizObj.waitTImeout = null;
  quizObj.correctLength = 0;
  quizObj.confettiFrameId = 0;
  quizObj.confettiTimeout = null;
  document.querySelector(".has-quiz-id").id = `quiz-${quiz.id}`;
  document.getElementById("quiz-title").innerText = quiz.title;
  document.getElementById("quiz-description").innerText = quiz.description;
  nextQuestionBtn.innerText = "次の問題";
  showScreen("title");
  questionSection.classList.remove("d-none");
  navigateToPage("quiz");
}

/**
 * @description
 * @param {object} quizData
 */
function setQuiz(quizData) {
  if (quizData) {
    quizObj.quiz = quizData;
  }
}

/**
 * @description 選択肢の順番をランダムに並び替える
 * @param {string[]} choices 選択肢の配列
 * @returns {string[]} 選択肢をランダムに並び替えた配列
 */
function shuffleChoices(choices) {
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

function wait(time) {
  return new Promise((resolve) => {
    quizObj.waitTImeout = setTimeout(resolve, time);
  });
}

/**
 * @description
 * @param {HTMLAudioElement} audio
 * @param {boolean} [isLoop=false]
 */
function playAudio(audio, isLoop = false) {
  audio.currentTime = 0;
  audio.loop = isLoop;
  audio.play();
}

/**
 * @description
 * @param {HTMLAudioElement} audio
 */
function pauseAudio(audio) {
  audio.pause();
  audio.currentTime = 0;
}

function areArraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  const sortedArr1 = arr1.slice().sort();
  const sortedArr2 = arr2.slice().sort();

  for (let i = 0; i < sortedArr1.length; i++) {
    if (sortedArr1[i] !== sortedArr2[i]) {
      return false;
    }
  }

  return true;
}

function drawPieChart(startPercentage, endPercentage) {
  const canvas = document.getElementById("pieChart");
  const context = canvas.getContext("2d");
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2;

  function drawBackgroundCircle(color) {
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.closePath();
    context.fillStyle = color;
    context.fill();
  }

  function drawPieSlice(startAngle, endAngle, color) {
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, radius, startAngle, endAngle);
    context.closePath();
    context.fillStyle = color;
    context.fill();
  }

  function drawText(percentage) {
    context.fillStyle = "black";
    context.font = "bold 24px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(`${percentage}%`, centerX, centerY);
  }

  if (endPercentage !== 0) {// 正答率が0%の時は音を流さない
    playAudio(audio.drumroll);
  }

  function animate(startPercentage) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    let color = "";
    if (startPercentage <= 20) {
      color = "#ff3146"; // 赤色
    } else if (startPercentage <= 60) {
      color = "yellow"; // 黄色
    } else {
      color = "#4bd865"; // 緑色
    }

    drawBackgroundCircle("lightgray");
    drawPieSlice(
      -Math.PI / 2,
      -Math.PI / 2 + (startPercentage / 100) * 2 * Math.PI,
      color
    );
    drawText(startPercentage);

    if (startPercentage < endPercentage) {
      setTimeout(() => {
        animate(startPercentage + 1);
      }, 25);
    } else {
      if (endPercentage !== 0) {// 正答率が0%の時は音を流さない
        pauseAudio(audio.drumroll);
        playAudio(audio.cymbal);
      }
    }
  }

  animate(startPercentage);
}

function getQuizResultMessage(totalQuestions, totalCorrects) {
  const percentage = (totalCorrects / totalQuestions) * 100;

  if (percentage <= 20) {
    return "がんばりましょう！😕";
  } else if (percentage <= 40) {
    return "まだまだこれからです！😐";
  } else if (percentage <= 60) {
    return "いい調子です！🙂";
  } else if (percentage < 100) {
    return "すばらしいです！😃";
  } else {
    return "おめでとうございます！🥳";
  }
}

function getAccuracy(totalQuestions, totalCorrects) {
  var accuracy = (totalCorrects / totalQuestions) * 100;
  return Math.round(accuracy);
}

function stopAndClearConfetti() {
  window.cancelAnimationFrame(quizObj.confettiFrameId);
  const ctx = confettiCanvas.getContext("2d");
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); // Canvasをクリア
}

/**
 * Copyright (c) 2023 by masuwa (https://codepen.io/ma_suwa/pen/oNXxQxZ)
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
function drawConfetti() {
  const ctx = confettiCanvas.getContext("2d");
  ctx.globalCompositeOperation = "source-over";
  const particles = [];

  const colors = [
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FF8000",
    "#0080FF",
    "#80FF00",
    "#FF0080",
    "#00FF80",
    "#8000FF",
    "#FFC000",
    "#00C0FF",
    "#C0FF00",
    "#FF00C0",
    "#C000FF",
    "#FFB600",
    "#00B6FF",
    "#B6FF00",
    "#FF00B6",
    "#B600FF",
    "#FFD200",
    "#00D2FF",
    "#D2FF00",
    "#FF00D2",
    "#D200FF",
    "#FF6E00",
    "#006EFF",
    "#6EFF00",
  ];

  class Dot {
    constructor(x, y, vx, vy, color) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.life = 0;
      this.maxLife = 600;
      this.degree = getRandom(0, 360);
      this.size = Math.floor(getRandom(8, 10));
    }

    draw(ctx) {
      this.degree += 1;
      this.vx *= 0.99;
      this.vy *= 0.999;
      this.x += this.vx + Math.cos((this.degree * Math.PI) / 180);
      this.y += this.vy;
      this.width = this.size;
      this.height = Math.cos((this.degree * Math.PI) / 45) * this.size;

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x + this.x / 2, this.y + this.y / 2);
      ctx.lineTo(
        this.x + this.x / 2 + this.width / 2,
        this.y + this.y / 2 + this.height
      );
      ctx.lineTo(
        this.x + this.x / 2 + this.width + this.width / 2,
        this.y + this.y / 2 + this.height
      );
      ctx.lineTo(this.x + this.x / 2 + this.width, this.y + this.y / 2);
      ctx.closePath();
      ctx.fill();
      this.life++;

      return this.life >= this.maxLife;
    }
  }

  function createDot() {
    const x =
      confettiCanvas.width * Math.random() -
      confettiCanvas.width +
      (confettiCanvas.width / 2) * Math.random();
    const y = -confettiCanvas.height / 2;
    const vx = getRandom(1, 3);
    const vy = getRandom(2, 4);
    const color = colors[Math.floor(Math.random() * colors.length)];

    particles.push(new Dot(x, y, vx, vy, color));
  }

  function loop() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    if (quizObj.confettiFrameId % 3 === 0) {
      createDot();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].draw(ctx)) {
        particles.splice(i, 1);
      }
    }

    quizObj.confettiFrameId = requestAnimationFrame(loop);
  }

  function getRandom(min, max) {
    return Math.random() * (max - min) + min;
  }

  loop();
}
