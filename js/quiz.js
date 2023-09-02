"use strict";
import { getVolumeFromStorage, setVolumeToStorage } from "../utils/storage.js";
import { isNumNotNaN } from "../utils/isNumNotNaN.js";
import { hideElem, showElem, toggleElem } from "../utils/elemManipulation.js";

const answerGuide = document.getElementById("answer-guide");
const choiceChecks = document.querySelectorAll(".choice-check");
const choicesGroup = document.getElementById("choices-group");
const typeTextInput = document.getElementById("type-text-input");
const startQuizBtn = document.getElementById("start-quiz");
const decisionBtn = document.getElementById("decision-btn");
const nextQuestionBtn = document.getElementById("next-question-btn");
const correctOrWrongGroup = document.getElementById("correct-or-wrong-group");
const questionSection = document.getElementById("question-section");
const explSection = document.getElementById("explanation-section");
const audioVolumeInput = document.getElementById("audio-volume-input");
const toggleVolumeBtn = document.getElementById("toggle-volume");
const confettiCanvas = document.getElementById("confetti");
const resultMessageCont = document.getElementById("result-message-cont");
const screens = {
  title: document.getElementById("title-screen"),
  countdown: document.getElementById("countdown-screen"),
  quiz: document.getElementById("quiz-screen"),
  result: document.getElementById("result-screen"),
};
const quizObj = {
  /**@type {Quiz} */
  quiz: null,
  questionIndex: 1,
  timerInterval: null,
  countdownTimeout: null,
  waitTImeout: null,
  correctLength: 0,
  volume: getVolumeFromStorage() ?? parseInt(audioVolumeInput.value / 100),
  confettiFrameId: 0,
  confettiTimeout: null,
  audioCtx: null,
  gainNode: null,
};
const audioBuffers = {
  correct: null,
  wrong: null,
  timer: null,
  countdown: null,
  drumroll: null,
  cymbal: null,
};
const audioSources = [];

audioVolumeInput.value = quizObj.volume * 100;
changeVolumeIcon(quizObj.volume);

document.getElementById("quiz-page").addEventListener("click", (e) => {
  const elems = e.composedPath();
  if (!elems) return;

  Array.from(elems).forEach((elem) => {
    if (!elem.className) return;
    const classList = elem.classList;

    if (classList.contains("choice-check")) {
      // 選択肢が一つも選択されていない場合、回答を決定できないように
      let noneChecked = true;
      choiceChecks.forEach((choiceCheck) => {
        const selected = choiceCheck.checked;
        if (selected) {
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
typeTextInput.addEventListener("input", () => {
  // 何も入力されていないとき、回答を決定できないように
  if (!typeTextInput.value) {
    decisionBtn.disabled = true;
  } else {
    decisionBtn.disabled = false;
  }
});
startQuizBtn.addEventListener("click", async () => {
  startQuizBtn.disabled = true;
  handleChangeVolumeInput();
  startQuizBtn.innerHTML = `
  <div>
    <div class="spinner-border-sm spinner-border text-light" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <span class="ms-2">読み込み中...</span>
  </div>`;
  // 初回のみ読み込む
  audioBuffers.correct =
    audioBuffers.correct || (await loadAudioBuffer("audios/correct.mp3"));
  audioBuffers.wrong =
    audioBuffers.wrong || (await loadAudioBuffer("audios/wrong.mp3"));
  audioBuffers.timer =
    audioBuffers.timer || (await loadAudioBuffer("audios/timer.mp3"));
  audioBuffers.countdown =
    audioBuffers.countdown || (await loadAudioBuffer("audios/countdown.mp3"));
  audioBuffers.drumroll =
    audioBuffers.drumroll || (await loadAudioBuffer("audios/drumroll.mp3"));
  audioBuffers.cymbal =
    audioBuffers.cymbal || (await loadAudioBuffer("audios/cymbal.mp3"));
  startQuiz();
  startQuizBtn.innerHTML = "スタート";
  startQuizBtn.disabled = false;
});
document.getElementById("replay-quiz").addEventListener("click", () => {
  initQuizPage();
});
nextQuestionBtn.addEventListener("click", async () => {
  const quizLength = quizObj.quiz.length;

  if (quizObj.questionIndex === quizLength) {
    // リザルト画面表示
    const correctLength = quizObj.correctLength;
    const accuracy = getAccuracy(quizLength, correctLength);
    const resultMessage = getQuizResultMessage(accuracy);

    const isPerfect = accuracy === 100;

    if (!isPerfect) {
      document.getElementById("quiz-length").innerText = quizLength;
      document.getElementById("correct-length").innerText = correctLength;
    }

    toggleElem(document.getElementById("perfect-score"), !isPerfect);
    toggleElem(document.getElementById("normal-score-group"), isPerfect);

    document.getElementById("result-message").innerText = resultMessage;
    drawPieChart(0, accuracy);

    if (accuracy === 100) {
      quizObj.confettiTimeout = setTimeout(() => {
        drawConfetti();
      }, 2400); // 円グラフを描画し終わってから紙吹雪を表示
    }

    hideElem(nextQuestionBtn);
    showScreen("result");
    return;
  }
  quizObj.questionIndex++;
  showQuestion();
});
decisionBtn.addEventListener("click", async () => {
  decisionBtn.disabled = true;
  clearInterval(quizObj.timerInterval);
  pauseAllAudio();

  const q = getCurrentQuestion();
  // 回答形式ごとに設定されている回答と、ユーザの回答が一致しているかを調べ、その後の処理を行う
  switch (q.answerType) {
    case "select": {
      const { correctAnswer } = q;
      let userAnswer;
      choiceChecks.forEach((choiceCheck) => {
        choiceCheck.disabled = true;
        if (choiceCheck.checked) {
          userAnswer = document.querySelector(`[for="${choiceCheck.id}"]`).id; // 紐づいたinputのチェックが入っているボタンのid(ユーザが選んだ回答のUUID)を取得する
        }
      });
      const isAnswerCorrect = userAnswer === correctAnswer;
      const choices = q.choices;
      handleQuizAnswerAndShowExpl(
        q.options?.explanation,
        isAnswerCorrect,
        getAnswerTxtByKey(choices, userAnswer),
        getAnswerTxtByKey(choices, correctAnswer)
      );
      break;
    }
    case "select-all": {
      const { correctAnswers } = q;
      const userAnswers = [];
      choiceChecks.forEach((choiceCheck) => {
        choiceCheck.disabled = true;
        if (choiceCheck.checked) {
          userAnswers.push(
            document.querySelector(`[for="${choiceCheck.id}"]`).id
          );
        }
      });
      const isAnswerCorrect = areAnswersEqual(userAnswers, correctAnswers);
      const choices = q.choices;
      handleQuizAnswerAndShowExpl(
        q.options?.explanation,
        isAnswerCorrect,
        getJoinedAnswersByKey(choices, userAnswers), // 配列をカンマと空白でつなげて読みやすく
        getJoinedAnswersByKey(choices, correctAnswers) // 同上
      );
      break;
    }
    case "type-text": {
      typeTextInput.disabled = true;
      const { correctAnswer } = q;
      const userAnswer = typeTextInput.value;
      const isAnswerCorrect = userAnswer === correctAnswer;
      handleQuizAnswerAndShowExpl(
        q.options?.explanation,
        isAnswerCorrect,
        userAnswer,
        correctAnswer
      );
      break;
    }
  }
});
toggleVolumeBtn.addEventListener("click", () => {
  if (quizObj.audioCtx === null && quizObj.gainNode === null) {
    // ユーザのアクションがあってから初期化する
    quizObj.audioCtx = new window.AudioContext();
    quizObj.gainNode = quizObj.audioCtx.createGain();
  }

  if (parseInt(audioVolumeInput.value) > 0) {
    audioVolumeInput.value = 0;
    changeVolume(0);
    changeVolumeIcon(0);
  } else {
    const volume = quizObj.volume || 1; // 1 はローカルストレージにvolumeが0で保存されている(quizObj.volumeが0)時、1を代入することで、このボタンを押しても音量が0のまま変わらなくなるのを防ぐ
    audioVolumeInput.value = volume * 100;
    setVolumeToStorage(volume);
    changeVolume(volume);
    changeVolumeIcon(volume);
  }
});
audioVolumeInput.addEventListener("input", handleChangeVolumeInput);

/**
 * @description 選択肢のキーから、それに対応するテキストを取得する
 * @param {Array<Object<string, string>>} choices 選択肢のオブジェクトの配列
 * @param {string} keyToFind 選択肢を検索するキー(UUID)
 * @returns {string | null} 選択肢のテキスト(見つからなければnullを返す)
 */
function getAnswerTxtByKey(choices, keyToFind) {
  for (const choice of choices) {
    const keys = Object.keys(choice);
    if (keys.includes(keyToFind)) {
      return choice[keyToFind];
    }
  }
  return null;
}
/**
 * @description 複数のキーから複数の選択肢を取得し、", "で連結して返す
 * @param {Array<Object<string, string>>} choices 選択肢のオブジェクトの配列
 * @param {string[]} keys 選択肢のオブジェクトのキーの配列
 * @returns {string} 選択肢を", "でつなげた文字列
 */
function getJoinedAnswersByKey(choices, keys) {
  const valuesArray = [];

  choices.forEach((obj) => {
    keys.forEach((key) => {
      if (obj.hasOwnProperty(key)) {
        valuesArray.push(obj[key]);
      }
    });
  });

  return valuesArray.join(", ");
}
/**
 * @description audioVolumeInputの値が変化したときにハンドリングする
 * @returns {void} なし
 */
function handleChangeVolumeInput() {
  if (quizObj.audioCtx === null && quizObj.gainNode === null) {
    // ユーザのアクションがあってから初期化する
    quizObj.audioCtx = new window.AudioContext();
    quizObj.gainNode = quizObj.audioCtx.createGain();
  }

  const volume = parseInt(audioVolumeInput.value) / 100;
  if (volume * 100 !== 0) {
    quizObj.volume = volume;
  }

  changeVolume(volume);
  setVolumeToStorage(volume);
  changeVolumeIcon(volume);
}
/**
 * @description クイズ正誤判定後の処理と、解説の表示をする
 * @param {string} expl 解説の文
 * @param {boolean} isAnswerCorrect ユーザが問題に正解しているか(していればtrue,そうでなければfalse)
 * @param {string} userAnswer ユーザの回答
 * @param {string} correctAnswer 問題に設定されている回答
 * @returns {Promise<void>} プロミス
 */
async function handleQuizAnswerAndShowExpl(
  expl,
  isAnswerCorrect,
  userAnswer,
  correctAnswer
) {
  if (isAnswerCorrect) quizObj.correctLength++;
  await showCorrectOrWrong(isAnswerCorrect);

  hideElem(decisionBtn);
  hideElem(questionSection);

  document.getElementById("user-answer").innerHTML = `${
    userAnswer || "回答なし"
  } ${
    isAnswerCorrect
      ? '<i class="bi bi-circle text-success fs-3 ms-2"></i>'
      : '<i class="bi bi-x-lg text-danger fs-3 ms-2"></i>'
  }`;
  document.getElementById("correct-answer").innerHTML = correctAnswer;
  document.getElementById("explanation").innerText = expl || "解説なし";

  showElem(nextQuestionBtn);
  showElem(explSection);
}
/**
 * @description 音量変更ボタンのアイコンを、現在の音量に合わせて変更する
 * @param {number} volume 0~1までの音量の値
 * @returns {void} なし
 */
function changeVolumeIcon(volume) {
  toggleElem(document.getElementById("volume-mute-icon"), volume !== 0);
  toggleElem(
    document.getElementById("volume-off-icon"),
    volume >= 0.3 || volume === 0
  ); // 音量が30%未満の時見せる
  toggleElem(
    document.getElementById("volume-down-icon"),
    volume >= 0.8 || volume < 0.3 || volume === 0
  ); // 音量が80%未満の時見せる
  toggleElem(document.getElementById("volume-up-icon"), volume < 0.8);
}
/**
 * @description クイズを強制的に終了させる
 * @returns {void} なし
 */
export function endQuiz() {
  // アニメーション、timeout, interval, 音楽を停止する
  clearInterval(quizObj.timerInterval);
  clearTimeout(quizObj.countdownTimeout);
  clearTimeout(quizObj.waitTImeout);
  clearTimeout(quizObj.confettiTimeout);
  clearTimeout(quizObj.pieChartTimeout);

  stopAndClearConfetti();
  pauseAllAudio();
}
/**
 * @description 正解(丸)または不正解(バツ)をクイズ画面に表示する
 * @param {boolean} isAnswerCorrect ユーザが問題に正解したらtrue,そうでなければfalseが渡される
 * @returns {Promise<void>} なし
 */
async function showCorrectOrWrong(isAnswerCorrect) {
  const buf = isAnswerCorrect ? audioBuffers.correct : audioBuffers.wrong;
  playAudio(buf);
  showElem(correctOrWrongGroup);
  toggleElem(document.getElementById("correct"), !isAnswerCorrect);
  toggleElem(document.getElementById("wrong"), isAnswerCorrect);
  await wait(1000); // 1秒間マルまたはバツを表示する
  hideElem(correctOrWrongGroup);
}
/**
 * @description 現在の問題のデータを取得する
 * @returns {Question} 問題のデータ
 */
function getCurrentQuestion() {
  return quizObj.quiz.questions[`q${quizObj.questionIndex}`];
}
/**
 * @description クイズを開始する
 * @returns {void} なし
 */
async function startQuiz() {
  await countdown(); // デフォルトの3秒カウントダウンする
  showQuestion();
  showScreen("quiz");
}
/**
 * @description 問題を表示する
 * @returns {void} なし
 */
function showQuestion() {
  hideElem(correctOrWrongGroup);
  hideElem(nextQuestionBtn);
  hideElem(explSection);
  // クイズ画面の初期設定をし、表示する
  decisionBtn.disabled = true;
  const time = quizObj.quiz.options?.timer;
  const isNum = isNumNotNaN(time);

  if (isNum) {
    startTimer(time);
  }

  toggleElem(document.getElementById("timer-group"), !isNum);
  const q = getCurrentQuestion();
  const { answerType } = q;
  const questionIndex = quizObj.questionIndex;
  document.querySelectorAll(".question-index").forEach((qIndexElem) => {
    qIndexElem.innerText = `${questionIndex}問目`;
  });
  if (questionIndex === quizObj.quiz.length) {
    nextQuestionBtn.innerText = "結果を表示";
  }
  document.getElementById("question-statement").innerText = q.statement;

  switch (answerType) {
    case "select":
    case "select-all": {
      answerGuide.innerHTML =
        answerType === "select"
          ? "正しいと思う選択肢を一つ選んでください"
          : '正しいと思う選択肢を<span class="fw-bold">すべて(一つ以上)</span>選んでください';
      const choicesLength = q.choices.length;
      const choices = document.querySelectorAll(".choice-cont");
      choices.forEach((choice, i) => {
        if (i < choicesLength) {
          // 選択肢の数が4つ未満の時、不要な選択肢を隠す
          showElem(choice);
        } else {
          hideElem(choice);
        }
      });
      const inputType = answerType === "select" ? "radio" : "checkbox";
      choiceChecks.forEach((choiceCheck) => {
        choiceCheck.disabled = false;
        choiceCheck.checked = false;
        choiceCheck.setAttribute("type", inputType);
      });

      const shuffledChoices = shuffleChoices(q.choices);
      const choiceBtns = document.querySelectorAll(".choice-btn");
      choiceBtns.forEach((choiceBtn, i) => {
        if (i >= choicesLength) return;

        choiceBtn.id = Object.keys(shuffledChoices[i])[0];
        choiceBtn.innerText = Object.values(shuffledChoices[i])[0];
      });
      break;
    }
    case "type-text": {
      typeTextInput.value = "";
      answerGuide.innerText = "正しいと思う答えを入力してください";
      typeTextInput.disabled = false;
      break;
    }
  }

  toggleElem(choicesGroup, answerType === "type-text");
  toggleElem(typeTextInput, answerType !== "type-text");
  showElem(decisionBtn);
  showElem(questionSection);

  if (answerType === "type-text") {
    typeTextInput.focus();
  }
}
/**
 * @description 引数に指定された秒間、タイマーをカウントし、残り時間のバーの見た目を変える
 * @param {number} seconds タイマーの秒数
 * @returns {Promise<void>} なし
 */
function startTimer(seconds) {
  const source = playAudio(audioBuffers.timer, true);
  const timerBar = document.getElementById("timer-bar");
  const timerTxt = document.getElementById("timer-txt");
  const interval = 10;
  let startTime = null;
  let lastLoggedSeconds = seconds;
  timerTxt.innerText = `残り: ${seconds}秒`;

  /**
   * @description タイマーを更新し、残り時間のバーの長さを変える。また、時間切れになったときにクイズを進行する
   * @returns {void} なし
   */
  function updateTimer() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime;
    const remainingTime = Math.max(0, seconds * 1000 - elapsedTime);
    const remainingSeconds = Math.ceil(remainingTime / 1000);
    const widthPercentage = (remainingTime / (seconds * 1000)) * 100;

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
      pauseAudio(source);
      const q = getCurrentQuestion();

      if (q.answerType === "type-text") {
        typeTextInput.disabled = true;
      } else {
        choiceChecks.forEach((choiceCheck) => {
          choiceCheck.disabled = true;
        });
      }
      const { choices } = q;
      const { answerType } = q;
      const { correctAnswer: corrAns, correctAnswers: corrAnss } = q;
      const correctAnswerOrAnswers =
        answerType === "type-text"
          ? corrAns
          : getAnswerTxtByKey(choices, corrAns) ||
            getJoinedAnswersByKey(choices, corrAnss);
      handleQuizAnswerAndShowExpl(
        q.options?.explanation,
        false,
        "",
        correctAnswerOrAnswers
      );
    }
  }
  /**
   * @description パーセンテージによって、残り時間のバーの色を変える
   * @param {number} percentage 1~100までの残り時間のパーセンテージ
   * @returns {void} なし
   */
  function updateTimerStyle(percentage) {
    timerBar.classList.toggle("bg-primary", percentage > 40);
    timerBar.classList.toggle(
      "bg-warning",
      percentage <= 40 && percentage > 10
    );
    timerBar.classList.toggle("bg-danger", percentage <= 10);
  }
  /**
   * @description タイマーの間隔ごとにタイマーを更新するインターバルを開始する
   * @returns {void} なし
   */
  function startInterval() {
    startTime = Date.now();
    updateTimer();
    quizObj.timerInterval = setInterval(updateTimer, interval);
  }

  startInterval();
}
/**
 * @description 指定された秒数カウントダウンする関数
 * @param {number} seconds カウントダウンしたい秒数
 * @returns {Promise<void>} プロミス
 */
async function countdown(seconds = 3) {
  const source = playAudio(audioBuffers.countdown);

  showScreen("countdown");

  const countdownElem = document.getElementById("countdown");

  for (let i = seconds; i > 0; i--) {
    countdownElem.innerText = i;
    await new Promise((resolve) => {
      quizObj.countdownTimeout = setTimeout(resolve, 1000);
    });
  }

  pauseAudio(source);
}
/**
 * @description 引数に渡された名前のスクリーンのみを表示する
 * @param {"title" | "countdown" | "quiz" | "result"} screenName
 * @returns {void} なし
 */
function showScreen(screenName) {
  for (const screen of Object.values(screens)) {
    toggleElem(screen, screen !== screens[screenName]);
  }
}
/**
 * @description クイズページを初期化する
 * @param {Quiz | null} quizData クイズのデータ(もう一度遊ぶときは、一度保存したクイズのオブジェクトを再度使用するため、引数に何も渡さない)
 * @returns {void} なし
 */
export function initQuizPage(quizData = null) {
  if (quizData) {
    quizObj.quiz = quizData;
  }
  pauseAllAudio();
  // もう一度遊ぶときに、前回に出ていたアニメーションやtimeoutを解除する
  stopAndClearConfetti();
  clearInterval(quizObj.pieChartTimeout);
  clearInterval(quizObj.confettiTimeout);
  quizObj.questionIndex = 1;
  quizObj.timerInterval = null;
  quizObj.countdownTimeout = null;
  quizObj.waitTImeout = null;
  quizObj.correctLength = 0;
  quizObj.confettiFrameId = 0;
  quizObj.confettiTimeout = null;
  quizObj.pieChartTimeout = null;

  // タイトルのテキスト等を設定し、表示する
  const quiz = quizObj.quiz;
  document.querySelector(".has-quiz-id").id = `quiz-${quiz.id}`;
  document.getElementById("quiz-title").innerText = quiz.title;
  document.getElementById("quiz-description").innerText =
    quiz.description || "説明なし";
  nextQuestionBtn.innerText = "次の問題";
  showScreen("title");
  showElem(questionSection);
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
/**
 * @description 指定された秒数待つ
 * @param {number} seconds 待つ秒数
 * @returns {Promise<void>} プロミス
 */
function wait(seconds) {
  return new Promise((resolve) => {
    quizObj.waitTImeout = setTimeout(() => {
      resolve();
    }, seconds);
  });
}
/**
 * @description オーディオバッファを読み込む
 * @param {string} url オーディオのURL
 * @param {(buf: AudioBuffer) => void} callback オーディオバッファを読み込み終わった後に実行したい関数(引数にオーディオバッファが入る)
 * @returns {Promise<AudioBuffer | void>} オーディオバッファ(コールバック関数が渡されていない場合)
 */
async function loadAudioBuffer(url, callback = null) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await quizObj.audioCtx.decodeAudioData(arrayBuffer);

  if (typeof callback !== "function") {
    return audioBuffer;
  }

  callback(audioBuffer);
}
/**
 * @description オーディオを再生する関数
 * @param {AudioBuffer} audioBuffer
 * @param {boolean} [isLoop=false] ループさせるかどうか
 * @returns {AudioBufferSourceNode} オーディオのソース
 */
function playAudio(audioBuffer, isLoop = false) {
  const source = quizObj.audioCtx.createBufferSource();
  audioSources.push(source);
  source.buffer = audioBuffer;

  source.connect(quizObj.gainNode);
  quizObj.gainNode.connect(quizObj.audioCtx.destination);

  source.loop = isLoop;

  source.start(0);
  return source;
}
/**
 * @description 引数に渡されたオーディオを停止する
 * @param {AudioBufferSourceNode} audioSource オーディオのソース
 * @returns {void} なし
 */
function pauseAudio(audioSource) {
  audioSource.stop(0);
}
/**
 * @description オーディオをすべて停止する
 * @returns {void} なし
 */
function pauseAllAudio() {
  for (const source of audioSources) {
    pauseAudio(source);
  }
  audioSources.splice(0, audioSources.length); // すべて止めたら止めたオーディオのソースをすべて削除する
}
/**
 * @description オーディオのボリュームを変更する
 * @param {number} volume 0~1までの値
 * @returns {void} なし
 */
function changeVolume(volume) {
  quizObj.gainNode.gain.value = volume;
}
/**
 * @description 二つの複数回答の配列(ユーザが選んだ回答と、問題に設定されている回答)が等しければtrue,そうでなければfalseを返す
 * @param {string[]} answers1 1つ目の回答の配列
 * @param {string[]} answers2 2つ目の回答の配列
 * @returns {boolean} 二つの複数回答の配列が等しいかどうか
 */
function areAnswersEqual(answers1, answers2) {
  if (answers1.length !== answers2.length) return false;

  const sortedAnswers1 = answers1.slice().sort();
  const sortedAnswers2 = answers2.slice().sort();

  for (let i = 0; i < sortedAnswers1.length; i++) {
    if (sortedAnswers1[i] !== sortedAnswers2[i]) {
      return false;
    }
  }

  return true;
}
/**
 * @description 指定したパーセンテージの円グラフを描く
 * @param {number} startPercentage 描き始めのパーセンテージ(0~100)
 * @param {number} endPercentage 描き終わりのパーセンテージ(0~100)
 * @returns {void} なし
 */
function drawPieChart(startPercentage, endPercentage) {
  const canvas = document.getElementById("pieChart");
  const context = canvas.getContext("2d");
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2;

  hideElem(resultMessageCont);

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

  let drumrollSource;
  if (endPercentage !== 0) {
    // 正答率が0%の時は音を流さない
    drumrollSource = playAudio(audioBuffers.drumroll);
  }

  async function animate(startPercentage) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    let color = "";
    if (startPercentage <= 20) {
      color = "#ff3146"; // 赤色
    } else if (startPercentage <= 60) {
      color = "yellow"; // 黄色
    } else {
      color = "#4bd865"; // 緑色
    }

    drawBackgroundCircle("#c0c8d0");
    drawPieSlice(
      -Math.PI / 2,
      -Math.PI / 2 + (startPercentage / 100) * 2 * Math.PI,
      color
    );
    drawText(startPercentage);

    if (startPercentage < endPercentage) {
      quizObj.pieChartTimeout = setTimeout(() => {
        animate(startPercentage + 1);
      }, 25);
    } else {
      if (endPercentage !== 0) {
        // 正答率が0%の時は音を流さない
        pauseAudio(drumrollSource);
        playAudio(audioBuffers.cymbal);
      }
      showElem(resultMessageCont);
    }
  }

  animate(startPercentage);
}
/**
 * @description 正答率に合わせたメッセージを返す
 * @param {number} accuracy 正答率(0~100)
 * @returns {string} リザルト画面で表示するメッセージ
 */
function getQuizResultMessage(accuracy) {
  if (accuracy <= 20) {
    return "がんばりましょう！\uD83D\uDE15";
  } else if (accuracy <= 40) {
    return "まだまだこれからです！\uD83D\uDE10";
  } else if (accuracy <= 60) {
    return "いい調子です！\uD83D\uDE42";
  } else if (accuracy < 100) {
    return "すばらしいです！\uD83D\uDE03";
  } else {
    return "おめでとうございます！\uD83E\uDD73";
  }
}
/**
 * @description 正答率を返す
 * @param {number} totalQuestions 問題数の合計
 * @param {number} totalCorrects ユーザが正解した問題数の合計
 * @returns {number} 正答率
 */
function getAccuracy(totalQuestions, totalCorrects) {
  const accuracy = (totalCorrects / totalQuestions) * 100;
  return Math.round(accuracy);
}
/**
 * @description 紙吹雪のアニメーションを停止・クリアする
 * @returns {void} なし
 */
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
/**
 * @description 紙吹雪を描画する
 * @returns {void} なし
 */
function drawConfetti() {
  const ctx = confettiCanvas.getContext("2d");
  ctx.globalCompositeOperation = "source-over";
  const particles = [];

  const colors = [
    // 紙吹雪に適切な色30色
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
      this.size = Math.floor(getRandom(8, 15));
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
