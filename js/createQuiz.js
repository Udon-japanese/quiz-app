"use strict";
import { createElement } from "../utils/createElement.js";
import { storage } from "../utils/storage.js";
import { cloneFromTemplate, navigateToPage } from "./index.js";
import { showToast } from "../utils/showToast.js";
import { replaceAttrVals } from "../utils/replaceAttrVals.js";
import { displayQuizList } from "./quizList.js";

const crtQPage = document.getElementById("crt-quiz-page");
const qListPage = document.getElementById("quiz-list-page");
const counterInitialState = 2;
const isSelectAllInitialState = null;
const answerTypeInitialState = null;
let createQuizObj = {
  createChoiceCallLimit: 4,
  createQuestionCallLimit: 10,
  selectCounter: {},
  selectAllCounter: {},
  questionCounter: counterInitialState,
  isSelectAll: {},
  answerType: {},
};
const crtQPageClone = cloneFromTemplate("crt-q-page-tem");
crtQPage.appendChild(crtQPageClone);
let addQBtn = document.querySelector(".add-question");
let questionsCont = document.getElementById("questions");
initQuizObject(createQuizObj);
createQuestion(true);
toggleAnswerType(1);
checkQuestionsState();

crtQPage.addEventListener("click", (e) => {
  const els = e.composedPath();
  if (!els) return;

  Array.from(els).forEach((el) => {
    const classList = el.classList;
    if (!el.className) return;

    if (classList.contains("toggle-label")) {
      const input = el.parentNode.querySelector(
        "input[type='checkbox'], input[type='radio']"
      );
      input.click();
    } else if (classList.contains("del-choice")) {
      const delChoice = el.parentNode; // 選択肢
      const strQN = delChoice.parentNode.parentNode.id.match(/q(\d+)/)[1];
      const questionN = parseInt(strQN);
      const isSelectAll = createQuizObj.isSelectAll[strQN];
      const counterKey = isSelectAll ? "selectAllCounter" : "selectCounter";

      const prevChoices = getChoices(questionN, isSelectAll);
      if (prevChoices.length === 1) return;
      delChoice.remove();

      const currentChoices = getChoices(questionN, isSelectAll);
      createQuizObj[counterKey][questionN] = currentChoices.length + 1;
      currentChoices.forEach((c, i) => {
        const choiceN = i + 1;
        c.querySelector(".type-choice").setAttribute(
          "placeholder",
          `${choiceN}つ目の選択肢`
        );
        const cNRegExp = /c(\d+)/;
        const elsHasAttrCN = Array.from(
          c.querySelectorAll("[placeholder*='c'], [id*='c'], [for*='c']")
        ).filter(
          (e) =>
            cNRegExp.test(e.id) ||
            cNRegExp.test(e.getAttribute("for")) ||
            cNRegExp.test(e.getAttribute("placeholder"))
        );
        elsHasAttrCN.forEach((e) => {
          const id = e.id;
          const forAttr = e.getAttribute("for");
          const phAttr = e.getAttribute("placeholder");
          if (forAttr) {
            e.setAttribute("for", changeStrN(forAttr, `c${choiceN}`, cNRegExp));
          } else if (phAttr) {
            e.setAttribute(
              "placeholder",
              changeStrN(phAttr, `c${choiceN}`, cNRegExp)
            );
          } else if (id) {
            e.id = changeStrN(id, `c${choiceN}`, cNRegExp);
          }
        });
      });

      const btn = document
        .getElementById(`q${questionN}`)
        .querySelector(".crt-choice");
      checkChoicesState(questionN, btn, btn.parentNode, isSelectAll);
    } else if (classList.contains("add-question")) {
      createQuestion();
      checkQuestionsState();
    } else if (classList.contains("crt-quiz")) {
      createQuiz();
    } else if (classList.contains("crt-choice")) {
      const choicesContCont = el.parentNode.parentNode;
      const strQN = choicesContCont.id.match(/q(\d+)/)[1];
      const isSelectAll = createQuizObj.isSelectAll[strQN];
      const choicesCont = choicesContCont.querySelector(
        `.${isSelectAll ? "select-alls" : "selects"}`
      );
      createChoice(choicesCont);
    } else if (classList.contains("del-q")) {
      const prevQuestions = getQuestions();
      if (prevQuestions.length === 1) return;

      const delQ = el.parentNode.parentNode.parentNode; // 問題
      delQ.remove();

      const currentQuestions = getQuestions();
      const newQuestionN = currentQuestions.length + 1;
      createQuizObj.questionCounter = newQuestionN;

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

        createQuizObj.answerType[strQN] =
          question.querySelector(".answer-type").value;
        setIsSelectAll(createQuizObj.answerType[strQN], strQN);

        const isSelectAll = createQuizObj.isSelectAll[strQN];
        const counterKey = isSelectAll ? "selectAllCounter" : "selectCounter";

        const choices = getChoices(strQN, isSelectAll);
        createQuizObj[counterKey][strQN] = choices.length + 1;
      });

      const addQBtnTxt = addQBtn.innerText;
      addQBtn.innerText = addQBtnTxt.replace(/\d+/, newQuestionN);

      checkQuestionsState();

      for (
        let i = currentQuestions.length + 1;
        i <= createQuizObj.createQuestionCallLimit;
        i++
      ) {
        const strI = i.toString();
        const counterKey = createQuizObj.isSelectAll[strI]
          ? "selectAllCounter"
          : "selectCounter";
        createQuizObj[counterKey][strI] = counterInitialState;
        createQuizObj.isSelectAll[strI] = isSelectAllInitialState;
        createQuizObj.answerType[strI] = answerTypeInitialState;
      }
    }
  });
});
crtQPage.addEventListener("change", (e) => {
  const els = e.composedPath();
  if (!els) return;
  Array.from(els).forEach((el) => {
    const classList = el.classList;

    if (!el.className) return;
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
});
crtQPage.addEventListener("input", (e) => {
  const els = e.composedPath();
  if (!els) return;
  Array.from(els).forEach((el) => {
    const classList = el.classList;
    if (!el.className) return;

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
 * @returns {void} なし
 */
function createQuiz() {
  let invalidForm = null;
  const id = crypto.randomUUID();
  const titleEl = document.getElementById("title");
  const title = titleEl.value;
  if (!title) {
    addValidatedClass(titleEl);
    invalidForm = titleEl;
  }
  const descriptionEl = document.getElementById("description");
  const description = descriptionEl.value || "説明なし";

  const quiz = {
    id,
    title,
    description,
    options: {},
    questions: {},
  };

  const timerOption = document.querySelector("#option-timer");
  const timerCheckbox = timerOption.querySelector(".timer-toggle");
  if (timerCheckbox.checked) {
    const timerVal = timerOption.querySelector("#timer").value;
    if (timerVal) quiz.options.timer = timerVal;
  }

  const questions = getQuestions();
  questions.forEach((question) => {
    const questionN = question.id.split("q")[1];
    const questionKey = `q${questionN}`;

    const statementEl = question.querySelector(`#q${questionN}-statement`);
    const statement = statementEl.value;
    if (!statement) {
      addValidatedClass(statementEl);
      if (!invalidForm) invalidForm = statementEl;
    }
    quiz.questions[questionKey] = {};
    quiz.questions[questionKey].options = {};
    quiz.questions[questionKey].statement = statement;

    const answerType = createQuizObj.answerType[questionN];
    quiz.questions[questionKey].answerType = answerType;

    switch (answerType) {
      case "type-text":
        const correctAnswerEl = question.querySelector(
          `#q${questionN}-type-txt-correct`
        );
        const correctAnswer = correctAnswerEl.value;
        if (!correctAnswer) {
          addValidatedClass(correctAnswerEl);
          if (!invalidForm) invalidForm = correctAnswerEl;
        }
        quiz.questions[questionKey].correctAnswer = correctAnswer;
        break;
      case "select":
        quiz.questions[questionKey].choices = [];
        const selectChoices = getChoices(questionN, false);
        let noneSelChecked = true;
        const setCorrects = [];
        selectChoices.forEach((choice, i) => {
          const cEl = choice.querySelector(".type-choice");
          const c = cEl.value;
          if (!c) {
            addValidatedClass(cEl);
            if (!invalidForm) invalidForm = cEl;
          }
          quiz.questions[questionKey].choices = [
            ...quiz.questions[questionKey].choices,
            c,
          ];
          const correctAnswerEl = choice.querySelector(".set-correct");
          setCorrects.push(correctAnswerEl);
          const isCorrectAnswer = correctAnswerEl.checked;
          if (isCorrectAnswer) {
            noneSelChecked = false;
            quiz.questions[questionKey].correctAnswer = c;
          }
          if (i + 1 === selectChoices.length && noneSelChecked) {
            if (!invalidForm) invalidForm = choice;
            setCorrects.forEach((c) => {
              addValidatedClass(c.parentNode);
            });
          }
        });
        break;
      case "select-all":
        quiz.questions[questionKey].choices = [];
        quiz.questions[questionKey].correctAnswers = [];
        const selectAllChoices = getChoices(questionN, true);
        let noneSelAllChecked = true;
        const setCorrectAlls = [];
        selectAllChoices.forEach((choice, i) => {
          const cEl = choice.querySelector(".type-choice");
          const c = cEl.value;
          if (!c) {
            addValidatedClass(cEl);
            if (!invalidForm) invalidForm = cEl;
          }
          quiz.questions[questionKey].choices = [
            ...quiz.questions[questionKey].choices,
            c,
          ];
          const correctAnswerEl = choice.querySelector(".set-correct");
          setCorrectAlls.push(correctAnswerEl);
          const isCorrectAnswer = correctAnswerEl.checked;
          if (isCorrectAnswer) {
            noneSelAllChecked = false;
            quiz.questions[questionKey].correctAnswers = [
              ...quiz.questions[questionKey].correctAnswers,
              c,
            ];
          }
          if (i + 1 === selectAllChoices.length && noneSelAllChecked) {
            if (!invalidForm) invalidForm = choice;
            setCorrectAlls.forEach((c) => {
              addValidatedClass(c.parentNode);
              c.required = true;
              c.classList.add("validated-checkbox");
            });
          }
        });
        break;
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

  storage.setItem(id, JSON.stringify(quiz));

  createQuizObj = {
    createChoiceCallLimit: 4,
    createQuestionCallLimit: 10,
    selectCounter: {},
    selectAllCounter: {},
    questionCounter: counterInitialState,
    isSelectAll: {},
    answerType: {},
  };
  crtQPage.innerHTML = "";
  const crtQPageClone = cloneFromTemplate("crt-q-page-tem");
  crtQPage.appendChild(crtQPageClone);
  addQBtn = document.querySelector(".add-question");
  questionsCont = document.getElementById("questions");
  initQuizObject(createQuizObj);
  createQuestion(true);
  toggleAnswerType(1);
  checkQuestionsState();

  navigateToPage("quizList");
  showToast("green", "クイズが作成されました");
  displayQuizList();

  /**
   * @description 指定した要素の親要素のclassにwas-validatedを追加する関数
   * @param {HTMLElement} e HTML要素
   * @returns {void} なし
   */
  function addValidatedClass(e) {
    e.parentNode.classList.add("was-validated");
  }
}

/**
 * @description 選択肢を作成する
 * @param {HTMLElement} choicesCont 選択肢の親要素
 * @param {{ isInit: boolean; isSelectAll: boolean | undefined; }} options オプション(isInit: 初期化時かどうか, isSelectAll: 複数回答形式かどうかを初期化時に設定)
 * @returns {void} なし
 */
function createChoice(
  choicesCont,
  options = { isInit: false, isSelectAll: undefined }
) {
  const strQN = choicesCont.parentNode.id.match(/q(\d+)/)[1];
  const questionN = parseInt(strQN);
  const isSelectAll =
    options.isSelectAll !== undefined
      ? options.isSelectAll
      : createQuizObj.isSelectAll[strQN];

  let counterKey, counter;
  if (!options.isInit) {
    counterKey = isSelectAll ? "selectAllCounter" : "selectCounter";
    counter = createQuizObj[counterKey][strQN];
    if (counter > createQuizObj.createChoiceCallLimit) return;
  }

  const choice = cloneFromTemplate(
    isSelectAll ? "select-all-tem" : "select-tem"
  );
  const elsHasAttrCN = choice.querySelectorAll(
    "[placeholder*='{c-num}'], [id*='{c-num}'], [for*='{c-num}'], [name*='{c-num}']"
  );
  const elsHasAttrQN = choice.querySelectorAll(
    "[id*='{q-num}'], [for*='{q-num}'], [name*='{q-num}']"
  );
  replaceAttrVals(elsHasAttrCN, "{c-num}", options.isInit ? 1 : counter);
  replaceAttrVals(elsHasAttrQN, "{q-num}", questionN);

  choicesCont.appendChild(choice);
  if (options.isInit) return;
  createQuizObj[counterKey][strQN]++;

  const btn = document
    .getElementById(`q${questionN}`)
    .querySelector(`#q${questionN}-select-${isSelectAll ? "all-" : ""}cont`)
    .querySelector(".crt-choice");
  checkChoicesState(questionN, btn, btn.parentNode, isSelectAll);
}

/**
 * @description 追加上限に達していなければ問題を作成する
 * @param {boolean} [isInit=false] 初期設定時かどうか
 * @returns {void} なし
 */
function createQuestion(isInit = false) {
  const counter = createQuizObj.questionCounter;
  if (counter > createQuizObj.createQuestionCallLimit) return;

  const question = cloneFromTemplate("question-tem");
  const elsHasAttrQN = question.querySelectorAll(
    "[id*='{num}'], [for*='{num}']"
  );
  replaceAttrVals(elsHasAttrQN, "{num}", isInit ? 1 : counter)
  question.querySelector(".q-header").innerText = `${isInit ? 1 : counter}問目`;

  const selectAlls = question.querySelector(".select-alls");
  const selects = question.querySelector(".selects");
  const selectAllCont = selectAlls.parentNode;
  const selectCont = selects.parentNode;
  createChoice(selectAlls, { isInit: true, isSelectAll: true });
  createChoice(selects, { isInit: true, isSelectAll: false });

  const selCrtChoiceBtn = cloneFromTemplate("crt-choice-tem");
  const selAllCrtChoiceBtn = cloneFromTemplate("crt-choice-tem");
  selectAllCont.appendChild(selAllCrtChoiceBtn);
  selectCont.appendChild(selCrtChoiceBtn);
  questionsCont.appendChild(question);

  const questions = getQuestions();
  const addQBtnTxt = addQBtn.innerText;
  addQBtn.innerHTML = addQBtnTxt.replace(isInit ? "{q-n}" : /\d+/, questions.length + 1);

  questionsCont.appendChild(question);

  if (isInit) return;
  questionsCont
    .querySelector(`#q${counter}`)
    .scrollIntoView({ behavior: "smooth", block: "start" });
  createQuizObj.questionCounter++;

  toggleAnswerType(counter);
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
  createQuizObj.answerType[strQN] = value;
  const answerTypeObjVal = createQuizObj.answerType[strQN];

  setIsSelectAll(answerTypeObjVal, strQN);

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

  const isSelectAll = createQuizObj.isSelectAll[strQN];

  const btn = question
    .querySelector(`#q${questionN}-select-${isSelectAll ? "all-" : ""}cont`)
    .querySelector(".crt-choice");

  checkChoicesState(strQN, btn, btn.parentNode, isSelectAll);
}

/**
 * @description 回答形式の文字列を受け取り、複数回答形式可動かを確認し、それを元にそれぞれの問題番号のcreateQuizObj.isSelectAllの値を設定する
 * @param {string} val 回答形式の文字列(オブジェクトの値またはselect要素の値)
 * @param {string} strQN 問題の番号
 * @returns {void} なし
 */
function setIsSelectAll(val, strQN) {
  if (val === "select-all") {
    createQuizObj.isSelectAll[strQN] = true;
  } else {
    createQuizObj.isSelectAll[strQN] = false;
  }
}

/**
 * @description 問題ごとの選択肢の状態を確認し、選択肢の数に応じて処理を行う
 * @param {string} strQN 問題の番号
 * @param {HTMLElement} btn 選択肢追加ボタン
 * @param {ParentNode} parent 選択肢追加ボタンの親ノード
 * @param {boolean} isSelectAll 複数回答形式かどうか
 * @returns {void} なし
 */
function checkChoicesState(strQN, btn, parent, isSelectAll) {
  const choices = getChoices(strQN, isSelectAll);

  choices.forEach((c) => {
    const hasOnlyChoice = choices.length === 1;

    const delCBtn = c.querySelector(".del-choice");
    delCBtn.classList.toggle("d-none", hasOnlyChoice);

    const typeInput = c.querySelector(".type-choice");
    typeInput.classList.toggle("rounded-end", hasOnlyChoice);
  });

  const isReachedLimit = choices.length === createQuizObj.createChoiceCallLimit;

  btn.classList.toggle("d-none", isReachedLimit);

  if (isReachedLimit) {
    const infoText = createElement(
      "p",
      { class: "choices-info-txt" },
      "選択肢は最大4つまで設定できます"
    );
    parent.appendChild(infoText);
  } else {
    const infoText = document
      .getElementById(`q${strQN}`)
      .querySelector(".choices-info-txt");
    if (!infoText) return;
    infoText.remove();
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
    questions.length === createQuizObj.createQuestionCallLimit;

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
 * @param {string} strQN 問題の番号
 * @param {boolean} isSelectAll 複数回答形式かどうか
 * @returns {NodeListOf<Element>} 選択肢の要素のノードリスト
 */
function getChoices(strQN, isSelectAll) {
  const question = document.getElementById(`q${strQN}`);
  const choicesCont = question.querySelector(
    `.${isSelectAll ? "select-alls" : "selects"}`
  );
  const choices = choicesCont.querySelectorAll(".choice");

  return choices;
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
 * @description createQuizObjを初期化する関数
 * @param {object} quizObj クイズ作成に必要なオブジェクト
 * @returns {void} なし
 */
function initQuizObject(quizObj) {
  for (let i = 1; i <= quizObj.createQuestionCallLimit; i++) {
    const strI = i.toString();
    quizObj.selectCounter[strI] = counterInitialState;
    quizObj.selectAllCounter[strI] = counterInitialState;
    quizObj.isSelectAll[strI] = isSelectAllInitialState;
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
