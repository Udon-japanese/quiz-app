"use strict";
import { navigateToPage } from "./index.js";
import { showToast } from "../utils/showToast.js";

const qPage = document.getElementById("quiz-page");
const quizCard = document.querySelector(".quiz-card");
const titleScreen = document.getElementById("title-screen");
const countdownScreen = document.getElementById("countdown-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const screens = [titleScreen, countdownScreen, quizScreen, resultScreen];
const timerGroup = document.getElementById("timer-group");
const timerTxt = document.getElementById("timer-txt");
const choiceChecks = document.querySelectorAll(".choice-check");
const choiceBtns = document.querySelectorAll(".choice-btn");
const choicesGroup = document.getElementById("choices");
const typeTextInput = document.getElementById("type-text-input");
const questionStatement = document.getElementById("question-statement");
const questionIndexEls = document.querySelectorAll(".question-index");
const decisionBtn = document.getElementById("decision-btn");
const nextQuestionBtn = document.getElementById("next-question-btn");
const correctOrWrongGroup = document.getElementById("correct-or-wrong-group");
const correct = document.getElementById("correct");
const wrong = document.getElementById("wrong");
const questionSection = document.getElementById("question-section");
const explSection = document.getElementById("explanation-section");
const userAnswerEl = document.getElementById("user-answer");
const correctAnswerEl = document.getElementById("correct-answer");
const explanationEl = document.getElementById("explanation");
const correctIcon = '<i class="bi bi-circle text-success"></i>';
const wrongIcon = '<i class="bi bi-x-lg text-danger"></i>';

// Proxyオブジェクトを作成
const proxy = new Proxy(
  {},
  {
    set: (target, key, value) => {
      target[key] = value;
      return true;
    },
  }
);

const audio = {
  correct: new Audio("audios/correct.mp3"),
  wrong: new Audio("audios/wrong.mp3"),
  timer: new Audio("audios/timer.mp3"),
  countdown: new Audio("audios/countdown.mp3"),
};

let quizObj;
let questionIndex = 1;
let timerInterval = null;

qPage.addEventListener("click", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach((el) => {
    const classList = el.classList;
    if (!el.className) return;

    if (classList.contains("start-q")) {
      startQuiz();
    } else if (classList.contains("choice-check")) {
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
decisionBtn.addEventListener("click", async (e) => {
  clearInterval(timerInterval);
  stopAudio(audio.timer);
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
      quizCard.classList.add(isAnswerCorrect ? "border-success" : "border-danger");
      await showCorrectOrWrong(isAnswerCorrect);
      const expl = q?.options?.explanation;
      if (expl) {
        quizCard.classList.remove("border-success", "border-danger");
        questionSection.classList.add("d-none");
        explSection.classList.remove("d-none");
        userAnswerEl.innerHTML = `${userAnswer} ${
          isAnswerCorrect
            ? correctIcon
            : wrongIcon
        }`;
        correctAnswerEl.innerHTML = correctAnswer;
        explanationEl.innerText = expl;
      }
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
      quizCard.classList.add(isAnswerCorrect ? "border-success" : "border-danger");
      await showCorrectOrWrong(isAnswerCorrect);
      const expl = q?.options?.explanation;
      if (expl) {
        quizCard.classList.remove("border-success", "border-danger");
        questionSection.classList.add("d-none");
        explSection.classList.remove("d-none");
        userAnswerEl.innerHTML = `${userAnswers.join(", ")} ${
          isAnswerCorrect
            ? correctIcon
            : wrongIcon
        }`;
        correctAnswerEl.innerHTML = correctAnswers;
        explanationEl.innerText = expl;
      }
      break;
    }
  }
  decisionBtn.classList.add("d-none");
  nextQuestionBtn.classList.remove("d-none");
});

async function showCorrectOrWrong(isAnswerCorrect) {
  playAudio(isAnswerCorrect ? audio.correct : audio.wrong);
  correctOrWrongGroup.classList.remove("d-none");
  correct.classList.toggle("d-none", !isAnswerCorrect);
  wrong.classList.toggle("d-none", isAnswerCorrect);
  await wait(2000);
  correctOrWrongGroup.classList.add("d-none");
}

function getCurrentQuestion() {
  return quizObj.questions[`q${questionIndex}`];
}

async function startQuiz() {
  showScreen("countdown");
  await countdown();
  showScreen("quiz");
  showQuestion();
}

function showQuestion() {
  questionSection.classList.remove("d-none");
  explSection.classList.add("d-none");
  const time = parseInt(quizObj?.options?.timer);
  const isNum = !isNaN(time);
  timerGroup.classList.toggle("d-none", !isNum);
  const q = getCurrentQuestion();
  questionIndexEls.forEach((qI) => {
    qI.innerText = `${questionIndex}問目`;
  });
  questionStatement.innerText = q.statement;
  decisionBtn.disabled = true;
  const { answerType } = q;
  switch (answerType) {
    case "select":
    case "select-all": {
      choicesGroup.classList.remove("d-none");
      typeTextInput.classList.add("d-none");
      const inputType = answerType === "select" ? "radio" : "checkbox";
      choiceChecks.forEach((c) => {
        c.checked = false;
        c.setAttribute("type", inputType);
      });
      const shuffledChoices = shuffleChoices(q.choices);
      choiceBtns.forEach((b, i) => {
        b.innerText = shuffledChoices[i];
      });
      break;
    }
    case "type-text": {
      choicesGroup.classList.add("d-none");
      typeTextInput.classList.remove("d-none");
      break;
    }
  }
  if (isNum) {
    startTimer(time);
  }
}

function startTimer(time) {
  if (!time) return;

  const timerBar = document.getElementById("timer-bar");
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
      clearInterval(timerInterval);
      stopAudio(audio.timer);
      await showCorrectOrWrong(false);
      choiceChecks.forEach((c) => {
        const choiceBtn = document.querySelector(`[for="${c.id}"]`);
        c.disabled = true;
        if (choiceBtn.innerText === correctAnswer) {
          choiceBtn.classList.add("bg-success", "text-light");
        }
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
    timerInterval = setInterval(updateTimer, interval);
  }

  startInterval();
}

function countdown(number = 3) {
  playAudio(audio.countdown);
  return new Promise((resolve) => {
    const countdownEl = document.getElementById("countdown");

    let currentNum = number;
    countdownEl.innerText = currentNum;

    const countdownInterval = setInterval(() => {
      currentNum--;
      if (currentNum > 0) {
        countdownEl.innerText = currentNum;
      } else {
        clearInterval(countdownInterval);
        stopAudio(audio.countdown);
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
  const screenMap = {
    title: titleScreen,
    countdown: countdownScreen,
    quiz: quizScreen,
    result: resultScreen,
  };
  const screen = screenMap[screenName];

  screen.classList.remove("d-none");
  hideOtherScreen(screen);
}

function hideOtherScreen(showScreen) {
  screens.forEach((s) => {
    const isShowScreen = s === showScreen;
    s.classList.toggle("d-none", !isShowScreen);
  });
}

export function initQuizPage(quizData) {
  setQuiz(quizData);
  const { quiz } = proxy;
  if (!quiz) {
    showToast("red", "クイズが見つかりませんでした");
    navigateToPage("quizList");
    return;
  }
  quizObj = quiz;
  document.querySelector(".has-quiz-id").id = `quiz-${quiz.id}`;
  document.getElementById("quiz-title").innerText = quiz.title;
  document.getElementById("quiz-description").innerText = quiz.description;
  showScreen("title");
  navigateToPage("quiz");
}

/**
 * @description
 * @param {object} quizData
 */
function setQuiz(quizData) {
  proxy.quiz = quizData;
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
    setTimeout(resolve, time);
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
function stopAudio(audio) {
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
