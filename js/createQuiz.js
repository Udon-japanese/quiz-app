"use strict";
import { createElement } from "../utils/createElement.js";
import {
  addQuizToStorage,
  getQuizDraftFromStorage,
  removeQuizDraftFromStorage,
  addQuizDraftToStorage,
  updateQuizToStorage,
  getQuizDraftsFromStorage,
  updateQuizDraftToStorage,
} from "../utils/storage.js";
import { cloneFromTemplate, navigateToPage } from "./index.js";
import { showToast } from "../utils/showToast.js";
import { replaceAttrVals } from "../utils/replaceAttrVals.js";
import { displayQuizList, searchQuizzes } from "./quizList.js";
import { isValidQuizObj } from "../utils/isValidQuizObj.js";
import { formatTime } from "../utils/formatTime.js";
import { initTooltips } from "../utils/initTooltips.js";
import { closeModal, openModal } from "../utils/modal.js";

const crtQPage = document.getElementById("crt-quiz-page");
let addQBtn, questionsCont, crtQuizBtn, searchQDInput, quizDraftSection, crtQuizSection;

const counterInitialState = 2;
const answerTypeInitialState = null;
const crtQuizObj = {};
let quizDraftListObj;
initCrtQuizPage();

crtQPage.addEventListener("click", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach((el) => {
    if (!el.className) return;
    const classList = el.classList;
    
    if (classList.contains("toggle-label")) {
      const input = el.parentNode.querySelector(
        "input[type='checkbox'], input[type='radio']"
      );
      input.click();
    } else if (classList.contains("del-choice")) {
      const delChoice = el.parentNode; // 選択肢
      const delChoiceId = delChoice.id;
      const questionN = parseInt(delChoiceId.match(/q(\d+)/)[1]);
      const delChoiceN = parseInt(delChoiceId.match(/c(\d+)/)[1]);
      const anotherDelCHoice = document.getElementById(
        `q${questionN}-select${
          delChoiceId.includes("all") ? "" : "-all"
        }-c${delChoiceN}`
      );
      const {
        selectChoices: prevSelectChoices, // selectAllの選択肢も数は同じなので片方のみ参照
      } = getChoices(questionN);
      if (prevSelectChoices.length === 1) return;

      delChoice.remove();
      anotherDelCHoice.remove();

      const {
        selectChoices: currentSelectChoices,
        selectAllChoices: currentSelectAllChoices,
      } = getChoices(questionN);
      crtQuizObj["choiceCounter"][questionN] = currentSelectChoices.length + 1;

      updateChoicesAttrs(currentSelectChoices);
      updateChoicesAttrs(currentSelectAllChoices);

      const btn = document
        .getElementById(`q${questionN}`)
        .querySelector(".crt-choice");
      checkChoicesState(questionN, btn);

      function updateChoicesAttrs(choices) {
        choices.forEach((choice, i) => {
          const choiceN = i + 1;
          const cNRegExp = /c(\d+)/;
          const qNRegExp = /q(\d+)/;
          choice.id = changeStrN(choice.id, `c${choiceN}`, cNRegExp);
          choice.id = changeStrN(choice.id, `q${questionN}`, qNRegExp);

          choice
            .querySelector(".type-choice")
            .setAttribute("placeholder", `${choiceN}つ目の選択肢`);

          const elsHasAttrCN = Array.from(
            choice.querySelectorAll("[id*='c'], [for*='c']")
          ).filter(
            (e) => cNRegExp.test(e.id) || cNRegExp.test(e.getAttribute("for"))
          );
          elsHasAttrCN.forEach((e) => {
            const id = e.id;
            const forAttr = e.getAttribute("for");
            if (forAttr) {
              e.setAttribute(
                "for",
                changeStrN(forAttr, `c${choiceN}`, cNRegExp)
              );
            }
            if (id) {
              e.id = changeStrN(id, `c${choiceN}`, cNRegExp);
            }
          });
        });
      }
    } else if (classList.contains("add-question")) {
      createQuestion();
      checkQuestionsState();
    } else if (classList.contains("crt-choice")) {
      const choicesContCont = el.parentNode.parentNode.parentNode; // 問題(#q{id}を持つ要素)
      const questionN = parseInt(choicesContCont.id.match(/q(\d+)/)[1]);
      createChoice(questionN);
    } else if (classList.contains("del-q")) {
      const prevQuestions = getQuestions();
      if (prevQuestions.length === 1) return;

      const delQ = el.parentNode.parentNode.parentNode; // 問題
      delQ.remove();

      const currentQuestions = getQuestions();
      const newQuestionN = currentQuestions.length + 1;
      crtQuizObj.questionCounter = newQuestionN;

      currentQuestions.forEach((question, i) => {
        const questionN = i + 1;
        const strQN = questionN.toString();
        const qNRegExp = /q(\d+)/;
        question.id = changeStrN(question.id, `q${questionN}`, qNRegExp);
        const elsHasQN = Array.from(
          question.querySelectorAll("[id^='q'], [for^='q'], [name^='q']")
        ).filter(
          (e) =>
            qNRegExp.test(e.id) ||
            qNRegExp.test(
              e.getAttribute("for") || qNRegExp.test(e.getAttribute("name"))
            )
        );
        elsHasQN.forEach((e) => {
          const forAttr = e.getAttribute("for");
          const nameAttr = e.getAttribute("name");
          const id = e.id;
          if (forAttr) {
            e.setAttribute(
              "for",
              changeStrN(forAttr, `q${questionN}`, qNRegExp)
            );
          } else if (nameAttr) {
            e.setAttribute(
              "for",
              changeStrN(nameAttr, `q${questionN}`, qNRegExp)
            );
          } else if (id) {
            e.id = changeStrN(id, `q${questionN}`, qNRegExp);
          }
        });
        question.querySelector(".q-header").innerText = `${questionN}問目`;

        crtQuizObj.answerType[strQN] =
          question.querySelector(".answer-type").value;

        const { selectChoices } = getChoices(strQN);
        crtQuizObj["choiceCounter"][strQN] = selectChoices.length + 1;
      });

      const addQBtnInner = addQBtn.innerHTML;
      addQBtn.innerHTML = addQBtnInner.replace(/\d+/, newQuestionN);

      checkQuestionsState();

      for (
        let i = currentQuestions.length + 1;
        i <= crtQuizObj.createQuestionCallLimit;
        i++
      ) {
        const strI = i.toString();
        crtQuizObj["choiceCounter"][strI] = counterInitialState;
        crtQuizObj.answerType[strI] = answerTypeInitialState;
      }
    } else if (classList.contains("continue-quiz-draft")) {
      const quizId = el.id.split("continue-quiz-draft-")[1];
      const quiz = getQuizDraftFromStorage(quizId);
      initCrtQuizPage(quiz, "draft");
    } else if (classList.contains("crt-new-quiz")) {
      initCrtQuizPage(null, "new");
    } else if (classList.contains("open-del-q-d-m")) {
      const delQDId = el.id.split("del-draft-")[1];
      const delQD = quizDraftListObj[delQDId];
      const optionTimer = delQD?.options?.timer;
      const optionExpls = Object.values(delQD.questions)
        .map((qD) => qD?.options?.explanation)
        .filter((expl) => expl);
      openModal({
        title: "下書きを削除",
        body: `この下書きを削除します。よろしいですか？
        <div class="card mt-3">
          <div class="card-body gap-3">
            <div class="d-flex flex-row">
              <div>
                <h5 class="card-title">${delQD.title || "タイトルなし"}</h5>
                <p class="card-text">${delQD.description || "説明なし"}</p>
                <span class="card-text text-primary">
                  問題数: ${delQD.length}問
                </span>
                <div class="card-text q-info text-secondary d-flex gap-2">
                ${
                  optionTimer ? `<i class="bi bi-stopwatch-fill fs-3"></i>` : ""
                }
                ${
                  optionExpls.length
                    ? `<i class="bi bi-book-fill fs-3"></i>`
                    : ""
                }
                </div>
              </div>
            </div>
          </div>
        </div>`,
        colorClass: "bg-light",
        modalCont: crtQPage,
        actionBtn: {
          text: "削除",
          color: "red",
          id: `del-quiz-draft-${delQDId}`,
          class: "del-quiz-draft",
        },
      });
    } else if (classList.contains("del-quiz-draft")) {
      const delQDId = el.id.split("del-quiz-draft-")[1];
      removeQuizDraftFromStorage(delQDId);
      closeModal();
      displayQuizDraftList();
    }
  });
});
crtQPage.addEventListener("change", (e) => {
  const els = e.composedPath();
  if (!els) return;
  Array.from(els).forEach((el) => {
    if (!el.className) return;
    const classList = el.classList;

    if (classList.contains("expl-toggle")) {
      toggleOnchange(el, ".type-expl-cont", ".expl-textarea");
    } else if (classList.contains("timer-toggle")) {
      toggleOnchange(el, ".type-timer-cont", ".timer-input");
    } else if (classList.contains("answer-type")) {
      const questionN = parseInt(el.id.match(/q(\d+)/)[1]);
      toggleAnswerType(questionN);
    } else if (classList.contains("validated-checkbox")) {
      const questionN = el.getAttribute("name").match(/q(\d+)/)[1];
      const setCorrects = document
        .getElementById(`q${questionN}`)
        .querySelector(".select-alls")
        .querySelectorAll(".set-correct");
      let noneChecked = false;
      setCorrects.forEach((s) => {
        if (s.checked) {
          noneChecked = true;
        }
      });
      setCorrects.forEach((s) => {
        s.required = !noneChecked;
      });
    }
  });
});
crtQPage.addEventListener("input", (e) => {
  const els = e.composedPath();
  if (!els) return;
  Array.from(els).forEach((el) => {
    if (!el.className) return;
    const classList = el.classList;

    if (classList.contains("timer-input")) {
      if (el.value < 1) {
        el.value = 1;
      } else if (el.value > 600) {
        el.value = 600;
      }
    }
  });
});

/**
 * @description 入力された内容をもとに、クイズを作成、ローカルストレージに保存する
 * @param {`${string}-${string}-${string}-${string}-${string}`} existsId 既に存在するid名(下書き、編集時)
 * @param {"new" | "edit" | "draft"} [quizType="new"] 
 * @returns {void} なし
 */
function createQuiz(existsId, quizType = "new") {
  let invalidForm = null;
  const crtQuizHeader = document.getElementById("crt-quiz-title");
  const id = existsId || crypto.randomUUID();
  const titleEl = document.getElementById("title");
  const title = titleEl.value;
  if (!title) {
    addValidatedClass(titleEl);
    invalidForm = crtQuizHeader;
  }
  const descriptionEl = document.getElementById("description");
  const description = descriptionEl.value || "説明なし";

  const questions = getQuestions();

  const quiz = {
    id,
    title,
    description,
    length: questions.length,
    options: {},
    questions: {},
  };

  const timerOption = document.querySelector("#option-timer");
  const timerCheckbox = timerOption.querySelector(".timer-toggle");
  if (timerCheckbox.checked) {
    const timerVal = timerOption.querySelector("#timer").value;
    if (timerVal) quiz.options.timer = parseFloat(timerVal);
  }

  questions.forEach((question) => {
    const questionN = question.id.split("q")[1];
    const questionKey = `q${questionN}`;

    const statementEl = question.querySelector(`#q${questionN}-statement`);
    const statement = statementEl.value;
    if (!statement) {
      addValidatedClass(statementEl);
      if (!invalidForm) invalidForm = question;
    }
    quiz.questions[questionKey] = {};
    quiz.questions[questionKey].options = {};
    quiz.questions[questionKey].statement = statement;

    const answerType = crtQuizObj.answerType[questionN];
    quiz.questions[questionKey].answerType = answerType;

    switch (answerType) {
      case "type-text": {
        const correctAnswerEl = question.querySelector(
          `#q${questionN}-type-txt-correct`
        );
        const correctAnswer = correctAnswerEl.value;
        if (!correctAnswer) {
          addValidatedClass(correctAnswerEl);
          if (!invalidForm) invalidForm = question;
        }
        quiz.questions[questionKey].correctAnswer = correctAnswer;
        break;
      }
      case "select": {
        quiz.questions[questionKey].choices = [];
        const { selectChoices: choices } = getChoices(questionN);
        let noneChecked = true;
        const setCorrects = [];
        choices.forEach((choice, i) => {
          const cEl = choice.querySelector(`.type-choice`);
          const c = cEl.value;
          if (!c) {
            addValidatedClass(cEl);
            if (!invalidForm) invalidForm = question;
          }
          quiz.questions[questionKey].choices = [
            ...quiz.questions[questionKey].choices,
            c,
          ];
          const correctAnswerEl = choice.querySelector(".set-correct");
          setCorrects.push(correctAnswerEl);
          const isCorrectAnswer = correctAnswerEl.checked;
          if (isCorrectAnswer) {
            noneChecked = false;
            quiz.questions[questionKey].correctAnswer = c;
          }
          if (i + 1 === choices.length && noneChecked) {
            if (!invalidForm) invalidForm = question;
            setCorrects.forEach((c) => {
              addValidatedClass(c.parentNode);
            });
          }
        });
        break;
      }
      case "select-all": {
        quiz.questions[questionKey].choices = [];
        quiz.questions[questionKey].correctAnswers = [];
        const { selectAllChoices: choices } = getChoices(questionN);
        let noneChecked = true;
        const setCorrects = [];
        choices.forEach((choice, i) => {
          const cEl = choice.querySelector(".type-choice");
          const c = cEl.value;
          if (!c) {
            addValidatedClass(cEl);
            if (!invalidForm) invalidForm = question;
          }
          quiz.questions[questionKey].choices = [
            ...quiz.questions[questionKey].choices,
            c,
          ];
          const correctAnswerEl = choice.querySelector(".set-correct");
          setCorrects.push(correctAnswerEl);
          const isCorrectAnswer = correctAnswerEl.checked;
          if (isCorrectAnswer) {
            noneChecked = false;
            quiz.questions[questionKey].correctAnswers = [
              ...quiz.questions[questionKey].correctAnswers,
              c,
            ];
          }
          if (i + 1 === choices.length && noneChecked) {
            if (!invalidForm) invalidForm = question;
            setCorrects.forEach((c) => {
              addValidatedClass(c.parentNode);
              c.required = true;
              c.classList.add("validated-checkbox");
            });
          }
        });
        break;
      }
    }
    const explOption = question.querySelector(`#q${questionN}-option-expl`);
    const explToggle = explOption.querySelector(".expl-toggle");
    if (explToggle.checked) {
      const explTextarea = explOption.querySelector(".expl-textarea");
      const expl = explTextarea.value;
      if (expl) quiz.questions[questionKey].options.explanation = expl;
    }
  });
  if (invalidForm) {
    showToast("red", "未入力のフォームがあります。入力してください");
    invalidForm.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  if (quizType === "edit") {
    updateQuizToStorage(id, quiz);
  } else if (quizType === "draft") {
    addQuizToStorage(id, quiz);
    removeQuizDraftFromStorage(id);
  } else if (quizType === "new") {
    addQuizToStorage(id, quiz);
  }

  initCrtQuizPage();
  navigateToPage("quizList");
  showToast(
    "green",
    existsId ? "クイズの変更が保存されました" : "クイズが作成されました"
  );
  displayQuizList();
}

/**
 * @description 選択肢を作成する
 * @param {number} questionN
 * @param {boolean} isInit
 * @returns {void} なし
 */
function createChoice(questionN, isInit) {
  const strQN = questionN.toString();
  const question = document.getElementById(`q${questionN}`);

  let counterKey, counter;
  if (!isInit) {
    counterKey = "choiceCounter";
    counter = crtQuizObj[counterKey][strQN];
    if (counter > crtQuizObj.createChoiceCallLimit) return;
  }

  const choiceN = isInit ? 1 : counter;

  const selectChoice = cloneFromTemplate("select-tem");
  const selectAllChoice = cloneFromTemplate("select-all-tem");

  const selectElsHasAttrCN = selectChoice.querySelectorAll(
    "[placeholder*='{c-num}'], [id*='{c-num}'], [for*='{c-num}'], [name*='{c-num}']"
  );
  const selectElsHasAttrQN = selectChoice.querySelectorAll(
    "[id*='{q-num}'], [for*='{q-num}'], [name*='{q-num}']"
  );
  const selectAllElsHasAttrCN = selectAllChoice.querySelectorAll(
    "[placeholder*='{c-num}'], [id*='{c-num}'], [for*='{c-num}'], [name*='{c-num}']"
  );
  const selectAllElsHasAttrQN = selectAllChoice.querySelectorAll(
    "[id*='{q-num}'], [for*='{q-num}'], [name*='{q-num}']"
  );
  replaceAttrVals(selectElsHasAttrCN, "{c-num}", choiceN);
  replaceAttrVals(selectElsHasAttrQN, "{q-num}", questionN);
  replaceAttrVals(selectAllElsHasAttrCN, "{c-num}", choiceN);
  replaceAttrVals(selectAllElsHasAttrQN, "{q-num}", questionN);

  const selectCont = question.querySelector(".selects");
  const selectAllCont = question.querySelector(".select-alls");
  selectCont.appendChild(selectChoice);
  selectAllCont.appendChild(selectAllChoice);

  if (isInit) return;
  crtQuizObj[counterKey][strQN]++;

  const btn = question.querySelector(".crt-choice");
  checkChoicesState(questionN, btn);
}

/**
 * @description 追加上限に達していなければ問題を作成する
 * @param {boolean} [isInit=false] 初期設定時かどうか
 * @param {boolean} isScroll スクロールさせるかどうか
 * @returns {void} なし
 */
function createQuestion(isInit = false, isScroll = true) {
  const counter = crtQuizObj.questionCounter;
  if (counter > crtQuizObj.createQuestionCallLimit) return;

  const question = cloneFromTemplate("question-tem");
  const elsHasAttrQN = question.querySelectorAll(
    "[id*='{num}'], [for*='{num}']"
  );
  const questionN = isInit ? 1 : counter;
  replaceAttrVals(elsHasAttrQN, "{num}", questionN);
  question.querySelector(".q-header").innerText = `${questionN}問目`;
  questionsCont.appendChild(question);

  const crtChoiceBtn = cloneFromTemplate("crt-choice-tem");
  document
    .getElementById(`q${questionN}-choices-cont`)
    .appendChild(crtChoiceBtn);

  createChoice(questionN, true);

  const questions = getQuestions();
  const addQBtnInner = addQBtn.innerHTML;
  addQBtn.innerHTML = addQBtnInner.replace(
    isInit ? "{q-n}" : /\d+/,
    questions.length + 1
  );

  questionsCont.appendChild(question);

  if (isInit) return;
  if (isScroll) {
    questionsCont
      .querySelector(`#q${counter}`)
      .scrollIntoView({ behavior: "smooth", block: "start" });
  }
  crtQuizObj.questionCounter++;

  toggleAnswerType(questionN);
}

/**
 * @description それぞれの問題の回答方式をオブジェクトに記録し、回答形式の要素を一つだけ表示する
 * @param {number} questionN 問題の番号
 * @returns {void} なし
 */
function toggleAnswerType(questionN) {
  const answerTypeEl = document.getElementById(`q${questionN}-answer-type`);
  const strQN = questionN.toString();
  const value = answerTypeEl.value;
  const select = "select";
  const selectAll = "select-all";
  const typeText = "type-text";
  const prevAnswerType = crtQuizObj.answerType[strQN] || select;

  crtQuizObj.answerType[strQN] = value;
  const answerTypeObjVal = crtQuizObj.answerType[strQN];

  const question = document.getElementById(`q${questionN}`);
  question
    .querySelector(`#q${questionN}-type-txt-cont`)
    .classList.toggle("d-none", answerTypeObjVal !== typeText);
  question
    .querySelector(`#q${questionN}-select-cont`)
    .classList.toggle("d-none", answerTypeObjVal !== select);
  question
    .querySelector(`#q${questionN}-select-all-cont`)
    .classList.toggle("d-none", answerTypeObjVal !== selectAll);

  const selectChoices = question
    .querySelector(".selects")
    .querySelectorAll(".choice");
  const selectAllChoices = question
    .querySelector(".select-alls")
    .querySelectorAll(".choice");
  const typeTextInput = question.querySelector(
    `#q${questionN}-type-txt-correct`
  );

  switch (prevAnswerType) {
    case "select": {
      Array.from(selectChoices).forEach((selectChoice, i) => {
        const selectVal = selectChoice.querySelector(".type-choice").value;
        if (i === 0) {
          typeTextInput.value = selectVal;
        }
        const selectAllEl = selectAllChoices
          .item(i)
          ?.querySelector(".type-choice");
        if (selectAllEl) {
          selectAllEl.value = selectVal;
        }
      });
      break;
    }
    case "select-all": {
      Array.from(selectAllChoices).forEach((selectAllChoice, i) => {
        const selectAllVal =
          selectAllChoice.querySelector(".type-choice").value;
        if (i === 0) {
          typeTextInput.value = selectAllVal;
        }
        const selectAllEl = selectChoices
          .item(i)
          ?.querySelector(".type-choice");
        if (selectAllEl) {
          selectAllEl.value = selectAllVal;
        }
      });
      break;
    }
    case "type-text": {
      const typeTextVal = typeTextInput.value;
      selectChoices[0].querySelector(".type-choice").value = typeTextVal;
      selectAllChoices[0].querySelector(".type-choice").value = typeTextVal;
      break;
    }
  }

  const btn = question.querySelector(".crt-choice");
  checkChoicesState(strQN, btn);
}

/**
 * @description 問題ごとの選択肢の状態を確認し、選択肢の数に応じて処理を行う
 * @param {string} strQN 問題の番号
 * @param {HTMLElement} btn 選択肢追加ボタン
 * @param {ParentNode} parent 選択肢追加ボタンの親ノード
 * @returns {void} なし
 */
function checkChoicesState(strQN, btn) {
  const { selectChoices, selectAllChoices } = getChoices(strQN);

  updateChoicesUI(selectChoices);
  updateChoicesUI(selectAllChoices);

  const isReachedLimit =
    selectChoices.length === crtQuizObj.createChoiceCallLimit;

  btn.classList.toggle("d-none", isReachedLimit);

  const existsInfoText = document
    .getElementById(`q${strQN}`)
    .querySelector(".choices-info-txt");
  if (isReachedLimit) {
    if (existsInfoText) return;
    const infoText = createElement(
      "p",
      { class: "choices-info-txt" },
      "選択肢は最大4つまで設定できます"
    );
    btn.parentNode.appendChild(infoText);
  } else {
    if (!existsInfoText) return;
    existsInfoText.remove();
  }

  function updateChoicesUI(choices) {
    choices.forEach((choice) => {
      const hasOnlyChoice = choices.length === 1;

      const delCBtn = choice.querySelector(".del-choice");
      delCBtn.classList.toggle("d-none", hasOnlyChoice);

      const typeInput = choice.querySelector(".type-choice");
      typeInput.classList.toggle("rounded-end", hasOnlyChoice);
    });
  }
}

/**
 * @description 問題の状態を確認し、選択肢の数に応じて処理を行う
 * @returns {void} なし
 */
function checkQuestionsState() {
  const questions = getQuestions();
  questions.forEach((q) => {
    const delBtn = q.querySelector(".del-q");
    delBtn.classList.toggle("d-none", questions.length === 1);
  });

  const isReachedLimit =
    questions.length === crtQuizObj.createQuestionCallLimit;

  addQBtn.classList.toggle("d-none", isReachedLimit);

  const infoTextId = "questions-info-text";
  if (isReachedLimit) {
    const infoText = createElement(
      "p",
      { id: infoTextId },
      "問題は最大で10個まで作成できます"
    );
    questionsCont.parentNode.insertBefore(
      infoText,
      addQBtn.parentNode.nextSibling
    );
  } else {
    const infoText = document.getElementById(infoTextId);
    if (!infoText) return;
    infoText.remove();
  }
}

/**
 * @description 問題ごとのすべての選択肢を取得し、返す
 * @param {number} questionN 問題の番号
 * @returns {{ selectChoices: NodeListOf<Element>; selectAllChoices: NodeListOf<Element> }} 選択肢の要素のノードリスト
 */
function getChoices(questionN) {
  const question = document.getElementById(`q${questionN}`);
  const selectChoicesCont = question.querySelector(".selects");
  const selectAllChoicesCont = question.querySelector(".select-alls");
  const selectChoices = selectChoicesCont.querySelectorAll(".choice");
  const selectAllChoices = selectAllChoicesCont.querySelectorAll(".choice");
  return { selectChoices, selectAllChoices };
}

/**
 * @description 問題をすべて取得し、返す
 * @returns {Element[]} 問題の要素の配列
 */
function getQuestions() {
  const elements = Array.from(document.querySelectorAll(`[id^="q"]`)).filter(
    (e) => /^q\d+$/.test(e.id)
  );

  return elements;
}

/**
 * @description crtQuizObjを初期化する関数
 * @param {object} quizObj クイズ作成に必要なオブジェクト
 * @returns {void} なし
 */
function initQuizObject(quizObj) {
  for (let i = 1; i <= quizObj.createQuestionCallLimit; i++) {
    const strI = i.toString();
    quizObj.selectCounter[strI] = counterInitialState;
    quizObj.selectAllCounter[strI] = counterInitialState;
    quizObj.choiceCounter[strI] = counterInitialState;
    quizObj.answerType[strI] = answerTypeInitialState;
  }
}

/**
 * @description 文字列の一部を正規表現により置き換える関数
 * @param {string} str 置き換えたい文字列
 * @param {string} replacement 一部の置き換え後に入る文字列
 * @param {RegExp} regExp 一部を置き換えるための正規表現
 * @returns {void} なし
 */
function changeStrN(str, replacement, regExp) {
  return str.replace(regExp, replacement);
}

/**
 * @description オプションのトグルボタンが変化したときにハンドリングする
 * @param {EventTarget} target 変化したイベントターゲット
 * @param {string} optContCl オプションのコンテナのクラスネーム
 * @param {string} optTextareaCl オプションの入力要素のクラスネーム
 * @returns {void} なし
 */
function toggleOnchange(target, optContCl, optTextareaCl) {
  const ToggleParent = target.parentNode;
  const checked = target.checked;
  const textareaCont = ToggleParent.parentNode.querySelector(optContCl);
  if (!checked) {
    textareaCont.querySelector(optTextareaCl).value = "";
  }
  textareaCont.classList.toggle("d-none", !checked);
}

/**
 * @description 指定した要素の親要素のclassにwas-validatedを追加する関数
 * @param {HTMLElement} e HTML要素
 * @returns {void} なし
 */
function addValidatedClass(e) {
  e.parentNode.classList.add("was-validated");
}

export function saveQuizDraft() {
  const crtQuizContId = document.querySelector(".crt-quiz-cont").id;
  let quizDraftId;
  if (crtQuizContId.startsWith("edit")) {
    initCrtQuizPage();
    return;
  } else if (crtQuizContId.startsWith("draft")) {
    quizDraftId = crtQuizContId.split("draft-")[1];
  }

  let isEmptyQuiz = true;
  const id = quizDraftId || crypto.randomUUID();
  const title = document.getElementById("title").value;
  const descriptionEl = document.getElementById("description");
  const description = descriptionEl.value;
  if (title) isEmptyQuiz = false;
  const questions = getQuestions();

  /**
   * @type {Quiz}
   */
  const quizDraft = {
    id,
    title,
    description,
    length: questions.length,
    options: {},
    questions: {},
  };

  const timerOption = document.querySelector("#option-timer");
  const timerCheckbox = timerOption.querySelector(".timer-toggle");
  if (timerCheckbox.checked) {
    const timerVal = timerOption.querySelector("#timer").value;
    if (timerVal) {
      quizDraft.options.timer = parseFloat(timerVal);
      isEmptyQuiz = false;
    }
  }

  questions.forEach((question) => {
    const questionN = question.id.split("q")[1];
    const questionKey = `q${questionN}`;

    const statement = question.querySelector(`#q${questionN}-statement`).value;

    quizDraft.questions[questionKey] = {};
    quizDraft.questions[questionKey].options = {};
    quizDraft.questions[questionKey].statement = statement;

    const answerType = crtQuizObj.answerType[questionN];
    quizDraft.questions[questionKey].answerType = answerType;
    if (statement) isEmptyQuiz = false;

    switch (answerType) {
      case "type-text": {
        quizDraft.questions[questionKey].correctAnswer = "";
        const correctAnswer = question.querySelector(
          `#q${questionN}-type-txt-correct`
        ).value;
        quizDraft.questions[questionKey].correctAnswer = correctAnswer;
        if (correctAnswer) isEmptyQuiz = false;
        break;
      }
      case "select": {
        quizDraft.questions[questionKey].correctAnswer = "";
        quizDraft.questions[questionKey].choices = [];
        const { selectChoices: choices } = getChoices(questionN);
        choices.forEach((choice) => {
          const c = choice.querySelector(".type-choice").value;
          quizDraft.questions[questionKey].choices = [
            ...quizDraft.questions[questionKey].choices,
            c,
          ];
          if (c) isEmptyQuiz = false;
          const isCorrectAnswer = choice.querySelector(".set-correct").checked;
          if (isCorrectAnswer) {
            quizDraft.questions[questionKey].correctAnswer = c;
            isEmptyQuiz = false;
          }
        });
        break;
      }
      case "select-all": {
        quizDraft.questions[questionKey].choices = [];
        quizDraft.questions[questionKey].correctAnswers = [];
        const { selectAllChoices: choices } = getChoices(questionN);
        choices.forEach((choice) => {
          const c = choice.querySelector(".type-choice").value;
          quizDraft.questions[questionKey].choices = [
            ...quizDraft.questions[questionKey].choices,
            c,
          ];
          if (c) isEmptyQuiz = false;
          const isCorrectAnswer = choice.querySelector(".set-correct").checked;
          if (isCorrectAnswer) {
            quizDraft.questions[questionKey].correctAnswers = [
              ...quizDraft.questions[questionKey].correctAnswers,
              c,
            ];
            isEmptyQuiz = false;
          }
        });
        break;
      }
    }
    const explOption = question.querySelector(`#q${questionN}-option-expl`);
    const explToggle = explOption.querySelector(".expl-toggle");
    if (explToggle.checked) {
      const explTextarea = explOption.querySelector(".expl-textarea");
      const expl = explTextarea.value;
      if (expl) {
        quizDraft.questions[questionKey].options.explanation = expl;
        isEmptyQuiz = false;
      }
    }
  });

  if (!isEmptyQuiz) {
    if (quizDraftId) {
      updateQuizDraftToStorage(id, quizDraft);
    } else {
      addQuizDraftToStorage(id, quizDraft);
    }
  } else {
    removeQuizDraftFromStorage(id);
  }

  initCrtQuizPage();
}

/**
 *
 * @param {Quiz} quiz
 * @param {"new" | "edit" | "draft"} [quizType=null]
 * @returns
 */
export function initCrtQuizPage(quiz = null, quizType = null) {
  crtQuizObj.createChoiceCallLimit = 4;
  crtQuizObj.createQuestionCallLimit = 10;
  crtQuizObj.selectCounter = {};
  crtQuizObj.selectAllCounter = {};
  crtQuizObj.choiceCounter = {};
  crtQuizObj.questionCounter = counterInitialState;
  crtQuizObj.answerType = {};

  crtQPage.innerHTML = "";
  const crtQPageClone = cloneFromTemplate("crt-q-page-tem");
  crtQPage.appendChild(crtQPageClone);
  addQBtn = document.querySelector(".add-question");
  questionsCont = document.getElementById("questions");
  crtQuizBtn = document.getElementById("crt-quiz");
  searchQDInput = document.getElementById("search-q-draft");
  quizDraftSection = document.getElementById("quiz-draft-section");
  crtQuizSection = document.getElementById("crt-quiz-section");
  initQuizObject(crtQuizObj);
  createQuestion(true);
  toggleAnswerType(1);
  checkQuestionsState();

  const crtQuizCont = document.querySelector(".crt-quiz-cont");
  const validQuizParam = quiz && isValidQuizObj(quiz);

  if (validQuizParam && quizType === "edit") {
    crtQuizCont.id = `edit-${quiz.id}`;
    crtQPage.querySelector("#crt-quiz-title").innerText = "クイズを編集する";
    crtQPage.querySelector("#crt-quiz-subtitle").innerHTML =
      "(編集を確定する前にこの画面を離れると、変更は取り消されます。)";
    crtQuizBtn.innerText = "変更を保存";
    crtQuizBtn.addEventListener("click", () => {
      createQuiz(quiz.id, quizType);
    });
    setQuizVals(quiz);
    quizDraftSection.classList.add("d-none");
    crtQuizSection.classList.remove("d-none");
    searchQDInput.removeEventListener("input", handleSearchInput);
    return;
  }

  if (validQuizParam && quizType === "draft") {
    crtQuizCont.id = `draft-${quiz.id}`;
    crtQPage.querySelector("#crt-quiz-subtitle").innerHTML =
      "フォームが一つでも入力されている場合、クイズは自動的に保存されます。また、フォームがすべて空になると、保存された下書きは削除されます";
    crtQuizBtn.addEventListener("click", () => {
      createQuiz(quiz.id, quizType);
    });
    setQuizVals(quiz);
    quizDraftSection.classList.add("d-none");
    crtQuizSection.classList.remove("d-none");
    searchQDInput.removeEventListener("input", handleSearchInput);
    return;
  }

  if (quizType === "new") {
    crtQuizCont.id = "crt-quiz";
    crtQuizBtn.addEventListener("click", () => {
      createQuiz();
    });
    quizDraftSection.classList.add("d-none");
    crtQuizSection.classList.remove("d-none");
    searchQDInput.removeEventListener("input", handleSearchInput);
    return;
  }

  const quizDrafts = getQuizDraftsFromStorage();
  const noneQuizDrafts = !Object.keys(quizDrafts).length;
  quizDraftSection.classList.toggle("d-none", noneQuizDrafts);
  crtQuizSection.classList.toggle("d-none", !noneQuizDrafts);

  if (noneQuizDrafts) {
    initCrtQuizPage(null, "new");
  } else {
    displayQuizDraftList();
  }

  searchQDInput.addEventListener("input", handleSearchInput);
}

/**
 *
 * @param {Quiz} quiz
 */
function setQuizVals(quiz) {
  const { title, description, length, questions } = quiz;
  crtQPage.querySelector("#title").value = title;
  crtQPage.querySelector("#description").value = description;

  if (quiz?.options?.timer) {
    const timerToggle = crtQPage.querySelector(".timer-toggle");
    timerToggle.checked = true;
    toggleOnchange(timerToggle, ".type-timer-cont", ".timer-input");
    crtQPage.querySelector("#timer").value = quiz.options.timer;
  }

  for (let i = 0; i < length; i++) {
    const questionN = i + 1;
    const question = questions[`q${questionN}`];
    const { answerType, statement } = question;
    let questionEl = crtQPage.querySelector(`#q${questionN}`);

    if (!questionEl) {
      createQuestion(false, false);
      questionEl = crtQPage.querySelector(`#q${questionN}`);
    }

    questionEl.querySelector(`#q${questionN}-statement`).value = statement;
    questionEl.querySelector(`#q${questionN}-answer-type`).value = answerType;
    toggleAnswerType(questionN);

    switch (answerType) {
      case "select":
      case "select-all": {
        const { choices } = question;
        const choicesCont =
          answerType === "select-all"
            ? questionEl.querySelector(".select-alls")
            : questionEl.querySelector(".selects");
        const correctArrayOrStr =
          answerType === "select-all"
            ? question.correctAnswers
            : question.correctAnswer;
        let choiceEls = choicesCont.querySelectorAll(".choice");
        for (let i = 0; i < choices.length; i++) {
          const choice = choices[i];
          let choiceEl = choiceEls[i];

          if (!choiceEl) {
            createChoice(questionN);
            choiceEls = choicesCont.querySelectorAll(".choice");
            choiceEl = choiceEls[i];
          }

          const typeChoice = choiceEl.querySelector(".type-choice");
          typeChoice.value = choice;

          if (
            ((Array.isArray(correctArrayOrStr) &&
              correctArrayOrStr.includes(choice)) ||
              (!Array.isArray(correctArrayOrStr) &&
                choice === correctArrayOrStr)) &&
            correctArrayOrStr
          ) {
            choiceEl.querySelector(".set-correct").checked = true;
          }
        }
        break;
      }
      case "type-text": {
        const { correctAnswer } = question;
        questionEl.querySelector(`#q${questionN}-type-txt-correct`).value =
          correctAnswer;
        break;
      }
    }

    if (question?.options?.explanation) {
      const explToggle = questionEl.querySelector(".expl-toggle");
      explToggle.checked = true;
      toggleOnchange(explToggle, ".type-expl-cont", ".expl-textarea");
      questionEl.querySelector(`#q${questionN}-explanation`).value =
        question.options.explanation;
    }
  }
}

export function displayQuizDraftList(obj = null, highlight = "") {
  const quizDraftsCont = document.getElementById("quiz-drafts-cont");
  quizDraftsCont.innerHTML = "";
  let highlightRegExp, highLightReplacement;

  if (highlight) {
    highlightRegExp = new RegExp(highlight, "g");
    highLightReplacement = `<span class="bg-warning">${highlight}</span>`;
  }

  if (!obj) {
    quizDraftListObj = getQuizDraftsFromStorage();
  }

  const qListObjToUse = obj ? obj : quizDraftListObj;
  const noneQuizDraft = !Object.keys(qListObjToUse).length;

  if (noneQuizDraft) {
    quizDraftSection.classList.add("d-none");
    crtQuizSection.classList.remove("d-none");
    searchQDInput.removeEventListener("input", handleSearchInput);
    return;
  }

  Object.values(qListObjToUse).forEach((quiz) => {
    const quizDraft = cloneFromTemplate("quiz-draft-tem");
    const elsHasAttrQId = quizDraft.querySelectorAll("[id*='{quiz-draft-id}']");
    replaceAttrVals(elsHasAttrQId, "{quiz-draft-id}", quiz.id);
    const quizTitleEl = quizDraft.querySelector(".q-title");
    quizTitleEl.innerText = quiz.title || "タイトルなし";
    if (highlight) {
      const quizTitleTxt = quizTitleEl.innerText;
      quizTitleEl.innerHTML = quizTitleTxt.replace(
        highlightRegExp,
        highLightReplacement
      );
    }
    const quizDescEl = quizDraft.querySelector(".q-desc");
    quizDescEl.innerText = quiz.description || "説明なし";
    if (highlight) {
      const quizDescTxt = quizDescEl.innerText;
      quizDescEl.innerHTML = quizDescTxt.replace(
        highlightRegExp,
        highLightReplacement
      );
    }
    const hasOptions = {
      quiz: {
        timer: false,
      },
      question: {
        explanation: false,
      },
    };
    Object.values(quiz.questions).forEach((question) => {
      if (hasOptions.question.explanation) return;
      if (question?.options?.explanation) {
        hasOptions.question.explanation = true;
      }
    });
    const optionTimer = quiz?.options?.timer;
    if (optionTimer) {
      hasOptions.quiz.timer = true;
    }

    const hasAnyOption =
      hasOptions.quiz.timer || hasOptions.question.explanation;
    if (hasAnyOption) {
      const quizInfoEl = quizDraft.querySelector(".q-info");
      quizInfoEl.classList.remove("d-none");
      if (hasOptions.quiz.timer) {
        const timerIcon = quizInfoEl.querySelector(".timer-icon");
        timerIcon.timer = replaceAttrVals(
          [timerIcon],
          "{option-timer}",
          formatTime(optionTimer)
        );
        timerIcon.classList.toggle("d-none", !hasOptions.quiz.timer);
      }
      if (hasOptions.question.explanation) {
        quizInfoEl
          .querySelector(".expl-icon")
          .classList.toggle("d-none", !hasOptions.question.explanation);
      }
    }

    const qLengthEl = quizDraft.querySelector(".q-length");
    qLengthEl.innerText = qLengthEl.innerText.replace(
      "{quiz-length}",
      quiz.length
    );
    if (highlight) {
      qLengthEl.innerHTML = qLengthEl.innerText.replace(
        highlightRegExp,
        highLightReplacement
      );
    }
    quizDraftsCont.appendChild(quizDraft);
    initTooltips();
  });
}

function handleSearchInput(e) {
  const query = e.target.value;
  const noneQuizDraftEl = document.getElementById("none-quiz-draft");
  
  if (!query) {
    noneQuizDraftEl.classList.add("d-none");
    displayQuizDraftList();
    return;
  }

  const qListObj = searchQuizzes(query, quizDraftListObj);
  const noneResult = !Object.keys(qListObj).length;
  noneQuizDraftEl.classList.toggle("d-none", !noneResult);
  noneQuizDraftEl.querySelector(
    "#none-quiz-draft-txt"
  ).innerText = `「${query}」に当てはまる下書きは見つかりませんでした`;
  if (noneResult) {
    document.getElementById("quiz-drafts-cont").innerHTML = "";
    return;
  }
  displayQuizDraftList(qListObj, query);
}
