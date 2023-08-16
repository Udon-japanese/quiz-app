"use strict";
import { navigateToPage } from "./index.js";
import { showToast } from "../utils/showToast.js";
import { isValidQuizObj } from "../utils/isValidQuizObj.js";

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
};
const quizObj = {
  /**@type {Quiz} */
  quiz: null,
  questionIndex: 1,
  timerInterval: null,
  countdownInterval: null,
  waitTImeout: null,
  correctLength: 0,
  volume: audioVolumeInput.value / 100,
};

Object.values(audio).forEach(a => {
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
    animatePieChart(0, getAccuracy(quizLength, correctLength));
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
    Object.values(audio).forEach(a => {
      a.volume = 0;
    });
    changeVolumeIcon(0);
  } else {
    const volume = quizObj.volume;
    audioVolumeInput.value = volume * 100;
    Object.values(audio).forEach(a => {
      a.volume = volume;
    });
    changeVolumeIcon(volume);
  }
});
audioVolumeInput.addEventListener("input", () => {
  const volume = parseInt(audioVolumeInput.value) / 100;
  if (volume !== 0) {
    quizObj.volume = volume;
  }
  Object.values(audio).forEach(a => {
    a.volume = volume;
  });
  changeVolumeIcon(volume);
});

function changeVolumeIcon(volume) {
  document.getElementById("volume-mute-icon").classList.toggle("d-none", volume !== 0);
  document.getElementById("volume-off-icon").classList.toggle("d-none", volume >= 0.3 || volume === 0);
  document.getElementById("volume-down-icon").classList.toggle("d-none",volume >= 0.8 || volume < 0.3 || volume === 0);
  document.getElementById("volume-up-icon").classList.toggle("d-none", volume < 0.8);
}

export function endQuiz() {
  clearInterval(quizObj.countdownInterval);
  clearInterval(quizObj.timerInterval);
  clearTimeout(quizObj.waitTImeout);
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
      const q = getCurrentQuestion();
      const { correctAnswer } = q;
      clearInterval(quizObj.timerInterval);
      pauseAudio(audio.timer);
      await showCorrectOrWrong(false);
      choiceChecks.forEach((c) => {
        c.disabled = true;
      });
      const expl = q?.options?.explanation;
      if (expl) {
        questionSection.classList.add("d-none");
        explSection.classList.remove("d-none");
        userAnswerEl.innerHTML = "あなたの回答: 回答なし";
        correctAnswerEl.innerHTML = `正解: ${correctAnswer}`;
        explanationEl.innerText = expl;
      }
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
  quizObj.questionIndex = 1;
  quizObj.timerInterval = null;
  quizObj.countdownInterval = null;
  quizObj.waitTImeout = null;
  quizObj.correctLength = 0;
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

function animatePieChart(startPercentage, endPercentage) {
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
