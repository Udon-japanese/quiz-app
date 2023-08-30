"use strict";
import {
  createElement,
  hideElem,
  showElem,
  toggleElem,
} from "../utils/elemManipulation.js";
import {
  addQuizToStorage,
  getQuizDraftFromStorage,
  removeQuizDraftFromStorage,
  addQuizDraftToStorage,
  updateQuizToStorage,
  getQuizDraftsFromStorage,
  updateQuizDraftToStorage,
  removeQuizDraftsFromStorage,
  getQuizFromStorage,
} from "../utils/storage.js";
import {
  LAST_ACCESS_KEY_NAME,
  cloneFromTemplate,
  navigateToPage,
  toggleBtnsByScrollability,
} from "./index.js";
import { showToast } from "../utils/showToast.js";
import { replaceAttrVals } from "../utils/elemManipulation.js";
import { displayQuizList, highlightText, searchQuizzes } from "./quizList.js";
import { isValidQuizObj } from "../utils/isValidQuizObj.js";
import { formatTime } from "../utils/formatTime.js";
import { initTooltips } from "../utils/initTooltips.js";
import { closeModal, openModal } from "../utils/modal.js";
import { setCookie } from "../utils/cookie.js";

const crtQPage = document.getElementById("crt-quiz-page");
const counterInitialState = 2;
const answerTypeInitialState = null;
const createChoiceCallLimit = 4;
const createQuestionCallLimit = 10;
const crtQuizObj = {};

crtQPage.addEventListener("click", (e) => {
  const elems = e.composedPath();
  if (!elems) return;

  Array.from(elems).forEach(async (elem) => {
    if (!elem.className) return;
    const classList = elem.classList;

    if (classList.contains("del-choice")) {
      const cNRegExp = /c(\d+)/;
      const qNRegExp = /q(\d+)/;
      const delChoice = elem.closest(".choice");
      const delChoiceId = delChoice.id;
      const questionN = parseInt(delChoiceId.match(qNRegExp)[1]);
      const delChoiceN = parseInt(delChoiceId.match(cNRegExp)[1]);
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

      const addChoiceBtn = document
        .getElementById(`q${questionN}`)
        .querySelector(".crt-choice");

      checkChoicesState(questionN, addChoiceBtn);

      /**
       * @description 選択肢の連番になっている属性を修正する
       * @param {NodeListOf<Element>} choices 問題ごとのすべての選択肢
       * @returns {void} なし
       */
      function updateChoicesAttrs(choices) {
        choices.forEach((choice, i) => {
          const choiceN = i + 1;
          choice.id = changeStrN(choice.id, `c${choiceN}`, cNRegExp);

          choice
            .querySelector(".type-choice")
            .setAttribute("placeholder", `${choiceN}つ目の選択肢`);

          const elemsHasAttrCN = Array.from(
            choice.querySelectorAll("[id*='c'], [for*='c']")
          ).filter(
            (elemHasAttrC) =>
              cNRegExp.test(elemHasAttrC.id) ||
              cNRegExp.test(elemHasAttrC.getAttribute("for"))
          );
          elemsHasAttrCN.forEach((elemHasAttrCN) => {
            const id = elemHasAttrCN.id;
            const forAttr = elemHasAttrCN.getAttribute("for");
            if (forAttr) {
              elemHasAttrCN.setAttribute(
                "for",
                changeStrN(forAttr, `c${choiceN}`, cNRegExp)
              );
            }
            if (id) {
              elemHasAttrCN.id = changeStrN(id, `c${choiceN}`, cNRegExp);
            }
          });
        });
      }
    } else if (classList.contains("add-question")) {
      createQuestion();
      checkQuestionsState();
    } else if (classList.contains("crt-choice")) {
      const question = elem.closest(".question");
      const questionN = parseInt(question.id.match(/q(\d+)/)[1]);
      createChoice(questionN);
    } else if (classList.contains("del-q")) {
      const prevQuestions = getQuestions();
      if (prevQuestions.length === 1) return;

      const delQ = elem.closest(".question");
      delQ.remove();

      const currentQuestions = getQuestions();
      const newQuestionN = currentQuestions.length + 1;
      crtQuizObj.questionCounter = newQuestionN;

      // それぞれの問題番号を更新
      currentQuestions.forEach((question, i) => {
        const questionN = i + 1;
        const strQN = questionN.toString();
        const qNRegExp = /q(\d+)/;
        question.id = changeStrN(question.id, `q${questionN}`, qNRegExp);
        const elemsHasAttrQN = Array.from(
          question.querySelectorAll("[id^='q'], [for^='q'], [name^='q']")
        ).filter(
          (elemHasAttrQ) =>
            qNRegExp.test(elemHasAttrQ.id) ||
            qNRegExp.test(elemHasAttrQ.getAttribute("for")) ||
            qNRegExp.test(elemHasAttrQ.getAttribute("name"))
        );
        elemsHasAttrQN.forEach((elemHasAttrQN) => {
          const forAttr = elemHasAttrQN.getAttribute("for");
          const nameAttr = elemHasAttrQN.getAttribute("name");
          const id = elemHasAttrQN.id;
          if (forAttr) {
            elemHasAttrQN.setAttribute(
              "for",
              changeStrN(forAttr, `q${questionN}`, qNRegExp)
            );
          }
          if (nameAttr) {
            elemHasAttrQN.setAttribute(
              "name",
              changeStrN(nameAttr, `q${questionN}`, qNRegExp)
            );
          }
          if (id) {
            elemHasAttrQN.id = changeStrN(id, `q${questionN}`, qNRegExp);
          }
        });
        question.querySelector(".q-header").innerText = `${questionN}問目`;

        crtQuizObj.answerType[strQN] =
          question.querySelector(".answer-type").value;

        const { selectChoices } = getChoices(strQN);
        crtQuizObj["choiceCounter"][strQN] = selectChoices.length + 1;
      });

      // 削除後存在しない問題番号のプロパティの値を初期値にする
      for (
        let i = currentQuestions.length + 1;
        i <= createQuestionCallLimit;
        i++
      ) {
        const strI = i.toString();
        crtQuizObj["choiceCounter"][strI] = counterInitialState;
        crtQuizObj.answerType[strI] = answerTypeInitialState;
      }

      checkQuestionsState();
    } else if (classList.contains("continue-quiz-draft")) {
      const quizDraftId = elem.id.split("continue-quiz-draft-")[1];
      const quizDraft = getQuizDraftFromStorage(quizDraftId);
      if (!isValidQuizObj(quizDraft)) {
        showToast("red", "無効な下書きデータです");
        return;
      }
      initCrtQuizPage(quizDraft, "draft");
    } else if (classList.contains("crt-new-quiz")) {
      initCrtQuizPage(null, "new");
    } else if (classList.contains("open-del-q-d-m")) {
      const delQDId = elem.id.split("del-draft-")[1];
      const delQD = crtQuizObj.quizDraftListObj[delQDId];
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
          HTMLAttributes: {
            id: `del-quiz-draft-${delQDId}`,
            class: "del-quiz-draft",
          },
          color: "red",
        },
      });
    } else if (classList.contains("del-quiz-draft")) {
      const delQDId = elem.id.split("del-quiz-draft-")[1];
      removeQuizDraftFromStorage(delQDId);
      closeModal();
      displayQuizDraftList();
    } else if (classList.contains("open-del-all-qds-m")) {
      openModal({
        title: "下書きをすべて削除",
        body: "下書きをすべて削除します。よろしいですか？",
        modalCont: crtQPage,
        actionBtn: {
          text: "削除",
          color: "red",
          HTMLAttributes: {
            class: "open-del-all-qds-m-again",
          },
        },
      });
    } else if (classList.contains("open-del-all-qds-m-again")) {
      document.querySelector(".modal-body").innerHTML = `
      <div class="text-center fw-bold">
        <div class="text-bg-danger d-inline-block p-4 rounded-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
          </svg>
        </div>
        <div class="mt-4">この操作は取り消せません。本当に下書きをすべて削除しますか？</div>
      </div>
      `;
      const actionBtn = document.querySelector(".action-btn");
      actionBtn.innerText = "本当に削除する";
      actionBtn.classList.remove("open-del-all-qds-m-again");
      actionBtn.classList.add("del-all-quiz-drafts");
      actionBtn.disabled = true;
      await new Promise((resolve) => {
        crtQuizObj.delQDsWaitTImeout = setTimeout(() => {
          resolve();
        }, 3000);
      });
      actionBtn.disabled = false;
    } else if (classList.contains("del-all-quiz-drafts")) {
      removeQuizDraftsFromStorage();
      closeModal();
      initCrtQuizPage(null, "new");
    }
  });
});
crtQPage.addEventListener("change", (e) => {
  const elems = e.composedPath();
  if (!elems) return;
  Array.from(elems).forEach((elem) => {
    if (!elem.className) return;
    const classList = elem.classList;

    if (classList.contains("expl-toggle")) {
      toggleOnchange(elem, "type-expl-cont", "expl-textarea");
    } else if (classList.contains("timer-toggle")) {
      toggleOnchange(elem, "type-timer-cont", "timer-input");
    } else if (classList.contains("tf-toggle")) {
      toggleOnchange(elem, "type-tf-cont", "t-input f-input", "\u3007 \u2715");
      setTFChoiceVals();
      toggleQuizCont();
    } else if (classList.contains("answer-type")) {
      const questionN = parseInt(elem.id.match(/q(\d+)/)[1]);
      toggleAnswerType(questionN);
    } else if (classList.contains("validated-checkbox")) {
      const questionN = elem.getAttribute("name").match(/q(\d+)/)[1];
      const setCorrects = document
        .getElementById(`q${questionN}`)
        .querySelector(".select-alls")
        .querySelectorAll(".set-correct");
      let noneChecked = false;
      setCorrects.forEach((setCorrect) => {
        if (setCorrect.checked) {
          noneChecked = true;
        }
      });
      setCorrects.forEach((setCorrect) => {
        setCorrect.required = !noneChecked; // setCorrect.checkedを全て調べた後(noneCheckedの値が決まった後)に、required属性をつける
        // requiredは、バリデーションのカラーをつけるために使用しているため、一つでもチェックが入っていたらすべてrequiredを外し、そうでなければつける
      });
    }
  });
});
crtQPage.addEventListener("input", (e) => {
  const elems = e.composedPath();
  if (!elems) return;
  Array.from(elems).forEach((elem) => {
    if (!elem.className) return;
    const classList = elem.classList;

    if (classList.contains("timer-input")) {
      if (elem.value < 1) {
        elem.value = 1;
      } else if (elem.value > 600) {
        elem.value = 600;
      }
    } else if (classList.contains("t-input")) {
      setTFChoiceVals();
    } else if (classList.contains("f-input")) {
      setTFChoiceVals();
    }
  });
});

/**
 * @description マルバツクイズとそうでないデフォルトのクイズのコンテナの表示非表示を切り替える
 * @returns {void} なし
 */
function toggleQuizCont() {
  const isTFQuiz = document.getElementById("tf-toggle").checked;

  document.querySelectorAll(".normal-cont").forEach((normalCont) => {
    toggleElem(normalCont, isTFQuiz);
  });
  document.querySelectorAll(".tf-cont").forEach((tfCont) => {
    toggleElem(tfCont, !isTFQuiz);
  });
}
/**
 * @description マルバツクイズのそれぞれの選択肢の値を設定する
 * @returns {void} なし
 */
function setTFChoiceVals() {
  const trueVal = document.getElementById("true").value;
  const falseVal = document.getElementById("false").value;
  const tChoices = document.querySelectorAll("[id$='t-type-choice']");
  tChoices.forEach((tChoice) => {
    tChoice.value = trueVal;
  });
  const fChoices = document.querySelectorAll("[id$='f-type-choice']");
  fChoices.forEach((fChoice) => {
    fChoice.value = falseVal;
  });
}
/**
 * @description 入力された内容をもとに、クイズを作成、ローカルストレージに保存する
 * @param {string} existsId 既に存在するid名(下書き、編集時)
 * @param {"new" | "edit" | "draft"} [quizType="new"] 保存するクイズデータの種類
 * @returns {void} なし
 */
function createQuiz(existsId, quizType = "new") {
  // それぞれのフォームの値を取得し、オブジェクトに設定し、ローカルストレージに保存する
  // 必要な値が入っていなければ、トーストとフォームの色を変えて警告する
  let invalidForm = null;
  const crtQuizHeader = document.getElementById("crt-quiz-title");
  const id = existsId || randomUUID();
  const titleElem = document.getElementById("title");
  const title = titleElem.value;
  if (!title) {
    addValidatedClass(titleElem);
    invalidForm = crtQuizHeader;
  }
  const descriptionElem = document.getElementById("description");
  const description = descriptionElem.value;

  const questions = getQuestions();

  /**
   * @type {Quiz}
   */
  const quiz = {
    id,
    title,
    description,
    length: questions.length,
    options: {},
    questions: {},
  };

  const timerOption = document.getElementById("option-timer");
  const timerCheckbox = timerOption.querySelector("#timer-toggle");
  if (timerCheckbox.checked) {
    const timerVal = timerOption.querySelector("#timer").value;
    if (timerVal) quiz.options.timer = parseFloat(timerVal);
  }

  const tfQuizOption = document.getElementById("option-tf");
  const tfCheckbox = tfQuizOption.querySelector("#tf-toggle");
  const isTFQuiz = tfCheckbox.checked;
  if (isTFQuiz) {
    const trueInput = tfQuizOption.querySelector("#true");
    const trueVal = trueInput.value;
    const falseInput = tfQuizOption.querySelector("#false");
    const falseVal = falseInput.value;
    if (!(trueVal && falseVal)) {
      if (!trueVal) {
        addValidatedClass(trueInput);
      } else if (!falseVal) {
        addValidatedClass(falseInput);
      }
      if (!invalidForm) invalidForm = crtQuizHeader; // 2回目以降は最初に適切でない値が入っていたフォームが上書きされてしまうため、空だった場合のみ代入する
    } else {
      quiz.options.tf = [trueVal, falseVal];
    }
  }

  questions.forEach((question) => {
    const questionN = question.id.split("q")[1];
    const questionKey = `q${questionN}`;

    const statementElem = question.querySelector(`#q${questionN}-statement`);
    const statement = statementElem.value;
    if (!statement) {
      addValidatedClass(statementElem);
      if (!invalidForm) invalidForm = question;
    }

    const answerType = isTFQuiz ? "select" : crtQuizObj.answerType[questionN]; // マルバツクイズなら強制的にselectにする(マルバツクイズにする前にtype-textやselect-allになっている可能性があるため)
    quiz.questions[questionKey] = {};
    quiz.questions[questionKey].options = {};
    quiz.questions[questionKey].statement = statement;
    quiz.questions[questionKey].answerType = answerType;

    switch (answerType) {
      case "type-text": {
        const correctAnswerElem = question.querySelector(
          `#q${questionN}-type-txt-correct`
        );
        const correctAnswer = correctAnswerElem.value;
        if (!correctAnswer) {
          addValidatedClass(correctAnswerElem);
          if (!invalidForm) invalidForm = question;
        }
        quiz.questions[questionKey].correctAnswer = correctAnswer;
        break;
      }
      case "select": {
        quiz.questions[questionKey].choices = [];
        if (isTFQuiz) {
          quiz.questions[questionKey].choices = quiz.options?.tf;
          let noneChecked = true;
          const setCorrects = [];
          const choices = question.querySelectorAll(".tf-choice");
          choices.forEach((choice, i) => {
            const correctAnswerElem = choice.querySelector(".set-correct");
            setCorrects.push(correctAnswerElem);
            const isCorrectAnswer = correctAnswerElem.checked;
            if (isCorrectAnswer) {
              noneChecked = false;
              const choiceVal = choice.querySelector(".type-choice").value;
              quiz.questions[questionKey].correctAnswer = choiceVal;
            }
            if (i + 1 === choices.length && noneChecked) {
              if (!invalidForm) invalidForm = question;
              setCorrects.forEach((setCorrect) => {
                addValidatedClass(setCorrect.parentNode);
              });
            }
          });
        } else {
          const { selectChoices: choices } = getChoices(questionN);
          let noneChecked = true;
          const setCorrects = [];
          choices.forEach((choice, i) => {
            const choiceValElem = choice.querySelector(".type-choice");
            const choiceVal = choiceValElem.value;
            if (!choiceVal) {
              addValidatedClass(choiceValElem);
              if (!invalidForm) invalidForm = question;
            }
            quiz.questions[questionKey].choices.push(choiceVal);

            const correctAnswerElem = choice.querySelector(".set-correct");
            setCorrects.push(correctAnswerElem);
            const isCorrectAnswer = correctAnswerElem.checked;
            if (isCorrectAnswer) {
              noneChecked = false;
              quiz.questions[questionKey].correctAnswer = choiceVal;
            }
            if (i + 1 === choices.length && noneChecked) {
              if (!invalidForm) invalidForm = question;
              setCorrects.forEach((setCorrect) => {
                addValidatedClass(setCorrect.parentNode);
              });
            }
          });
        }
        break;
      }
      case "select-all": {
        quiz.questions[questionKey].choices = [];
        quiz.questions[questionKey].correctAnswers = [];
        const { selectAllChoices: choices } = getChoices(questionN);
        let noneChecked = true;
        const setCorrects = [];
        choices.forEach((choice, i) => {
          const choiceElem = choice.querySelector(".type-choice");
          const choiceVal = choiceElem.value;
          if (!choiceVal) {
            addValidatedClass(choiceElem);
            if (!invalidForm) invalidForm = question;
          }
          quiz.questions[questionKey].choices.push(choiceVal);
          const correctAnswerElem = choice.querySelector(".set-correct");
          setCorrects.push(correctAnswerElem);
          const isCorrectAnswer = correctAnswerElem.checked;
          if (isCorrectAnswer) {
            noneChecked = false;
            quiz.questions[questionKey].correctAnswers.push(choiceVal);
          }
          if (i + 1 === choices.length && noneChecked) {
            if (!invalidForm) invalidForm = question;
            setCorrects.forEach((setCorrect) => {
              addValidatedClass(setCorrect.parentNode);
              setCorrect.required = true;
              setCorrect.classList.add("validated-checkbox");
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
    const prevQuiz = getQuizFromStorage(id);
    if (areQuizzesEqual(prevQuiz, quiz)) {
      // 編集前と変化がないときは保存とトースト表示をしない
      initCrtQuizPage();
      navigateToPage("quizList");
      displayQuizList();
      return;
    }
    updateQuizToStorage(quiz);
  } else if (quizType === "draft") {
    addQuizToStorage(quiz);
    removeQuizDraftFromStorage(id);
  } else if (quizType === "new") {
    addQuizToStorage(quiz);
  }

  initCrtQuizPage();
  navigateToPage("quizList");
  showToast(
    "green",
    existsId && quizType !== "draft"
      ? "クイズの変更が保存されました"
      : "クイズが作成されました"
  );
  displayQuizList();
}
/**
 * @description 追加上限に達していなければ選択肢を作成する
 * @param {number} questionN 問題の番号
 * @param {boolean} [isInit=false] 初期追加時かどうか
 * @returns {void} なし
 */
function createChoice(questionN, isInit = false) {
  const strQN = questionN.toString();
  const question = document.getElementById(`q${questionN}`);

  let counterKey, counter;
  if (!isInit) {
    counterKey = "choiceCounter";
    counter = crtQuizObj[counterKey][strQN];
    if (counter > createChoiceCallLimit) return;
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
  replaceAttrVals(selectAllElsHasAttrCN, "{c-num}", choiceN);
  replaceAttrVals(selectElsHasAttrQN, "{q-num}", questionN);
  replaceAttrVals(selectAllElsHasAttrQN, "{q-num}", questionN);

  if (isInit) {
    const selectSetCorrect = selectChoice.querySelector(".set-correct");
    const selectAllSetCorrect = selectAllChoice.querySelector(".set-correct");
    selectSetCorrect.setAttribute("data-bs-toggle", "tooltip");
    selectSetCorrect.setAttribute(
      "title",
      "ここをクリックして、正解を設定します(1つまで)"
    );
    selectAllSetCorrect.setAttribute("data-bs-toggle", "tooltip");
    selectAllSetCorrect.setAttribute(
      "title",
      "ここをクリックして、正解を設定します(1つ以上)"
    );
  }

  const selectCont = question.querySelector(".selects");
  const selectAllCont = question.querySelector(".select-alls");
  selectCont.appendChild(selectChoice);
  selectAllCont.appendChild(selectAllChoice);

  if (isInit) return;
  crtQuizObj[counterKey][strQN]++;

  const addChoiceBtn = question.querySelector(".crt-choice");
  checkChoicesState(questionN, addChoiceBtn);
}
/**
 * @description 追加上限に達していなければ問題を作成する
 * @param {boolean} [isInit=false] 初期設定時かどうか
 * @param {boolean} isScroll 問題作成時、画面をスクロールさせるならtrue,させないならfalseを渡す
 * @returns {void} なし
 */
function createQuestion(isInit = false, isScroll = true) {
  const counter = crtQuizObj.questionCounter;
  if (counter > createQuestionCallLimit) return;

  const question = cloneFromTemplate("question-tem");
  const elsHasAttrQN = question.querySelectorAll(
    "[id*='{num}'], [for*='{num}'], [name*='{num}']"
  );
  const questionN = isInit ? 1 : counter;
  replaceAttrVals(elsHasAttrQN, "{num}", questionN);
  question.querySelector(".q-header").innerText = `${questionN}問目`;
  crtQuizObj.elem.questionsCont.appendChild(question);

  const crtChoiceBtn = cloneFromTemplate("crt-choice-tem");
  document
    .getElementById(`q${questionN}-choices-cont`)
    .appendChild(crtChoiceBtn);

  createChoice(questionN, true);

  const questions = getQuestions();

  if (isInit) {
    const addQBtnInner = crtQuizObj.elem.addQBtn.innerHTML;
    crtQuizObj.elem.addQBtn.innerHTML = addQBtnInner.replace(
      "{q-n}",
      questions.length + 1
    );
  }

  crtQuizObj.elem.questionsCont.appendChild(question);

  toggleAnswerType(questionN);
  checkQuestionsState();
  initTooltips();

  if (isInit) return;

  toggleQuizCont();
  setTFChoiceVals();

  if (isScroll) {
    crtQuizObj.elem.questionsCont
      .querySelector(`#q${counter}`)
      .scrollIntoView({ behavior: "smooth", block: "start" });
  }
  crtQuizObj.questionCounter++;
}
/**
 * @description それぞれの問題の回答方式をオブジェクトに記録し、回答形式の要素を一つだけ表示する
 * @param {number} questionN 問題の番号
 * @returns {void} なし
 */
function toggleAnswerType(questionN) {
  const answerTypeEl = document.getElementById(`q${questionN}-answer-type`);
  const question = document.getElementById(`q${questionN}`);
  const strQN = questionN.toString();
  const value = answerTypeEl.value;
  const select = "select";
  const selectAll = "select-all";
  const typeText = "type-text";
  const prevAnswerType = crtQuizObj.answerType[strQN] || select;
  const addChoiceBtn = question.querySelector(".crt-choice");

  crtQuizObj.answerType[strQN] = value;
  const answerTypeObjVal = crtQuizObj.answerType[strQN];

  toggleElem(
    question.querySelector(`#q${questionN}-type-txt-cont`),
    answerTypeObjVal !== typeText
  );
  toggleElem(
    question.querySelector(`#q${questionN}-select-cont`),
    answerTypeObjVal !== select
  );
  toggleElem(
    question.querySelector(`#q${questionN}-select-all-cont`),
    answerTypeObjVal !== selectAll
  );

  toggleElem(addChoiceBtn.parentNode, answerTypeObjVal === typeText);
  addChoiceBtn.parentNode.classList.toggle(
    "d-sm-inline-block",
    answerTypeObjVal !== typeText
  );

  const selectChoices = question
    .querySelector(".selects")
    .querySelectorAll(".choice");
  const selectAllChoices = question
    .querySelector(".select-alls")
    .querySelectorAll(".choice");
  const typeTextInput = question.querySelector(
    `#q${questionN}-type-txt-correct`
  );

  // それぞれの選択肢のテキストを共有する(入力形式のinputには、択一形式または複数回答形式の一番目の選択肢が入る)
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

  checkChoicesState(strQN, addChoiceBtn);
}
/**
 * @description 問題ごとの選択肢の状態を確認し、選択肢の数に応じて処理を行う
 * @param {string} strQN 問題の番号
 * @param {Element} addChoiceBtn 選択肢追加ボタン
 * @returns {void} なし
 */
function checkChoicesState(strQN, addChoiceBtn) {
  const { selectChoices, selectAllChoices } = getChoices(strQN);

  updateChoicesUI(selectChoices);
  updateChoicesUI(selectAllChoices);

  const isReachedLimit = selectChoices.length === createChoiceCallLimit;

  toggleElem(addChoiceBtn, isReachedLimit);

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
    addChoiceBtn.parentNode.appendChild(infoText);
  } else {
    if (!existsInfoText) return;
    existsInfoText.remove();
  }

  /**
   * @description 選択肢の見た目を更新する
   * @param {NodeListOf<Element>} choices 問題ごとのすべての選択肢
   * @returns {void} なし
   */
  function updateChoicesUI(choices) {
    choices.forEach((choice) => {
      const hasOnlyChoice = choices.length === 1;

      const delCBtn = choice.querySelector(".del-choice");
      toggleElem(delCBtn, hasOnlyChoice);

      const typeInput = choice.querySelector(".type-choice");
      typeInput.classList.toggle("rounded-end", hasOnlyChoice);
    });
  }
}
/**
 * @description 問題の状態を確認し、問題の数に応じて処理を行う
 * @returns {void} なし
 */
function checkQuestionsState() {
  const questions = getQuestions();
  const questionsLength = questions.length;
  questions.forEach((q) => {
    const delBtn = q.querySelector(".del-q");
    toggleElem(delBtn, questionsLength === 1);
  });

  const isReachedLimit = questionsLength === createQuestionCallLimit;

  toggleElem(crtQuizObj.elem.addQBtn, isReachedLimit);

  const addQBtnInner = crtQuizObj.elem.addQBtn.innerHTML;
  crtQuizObj.elem.addQBtn.innerHTML = addQBtnInner.replace(
    /\d+(?=\s*問目)/,
    questionsLength + 1
  );

  const infoTextId = "questions-info-txt";
  const existsInfoText = document.getElementById(infoTextId);

  if (isReachedLimit) {
    if (existsInfoText) return;
    const infoText = createElement(
      "p",
      { id: infoTextId },
      "問題は最大で10個まで作成できます"
    );
    crtQuizObj.elem.questionsCont.parentNode.insertBefore(
      infoText,
      crtQuizObj.elem.addQBtn.parentNode.nextSibling
    );
  } else {
    if (!existsInfoText) return;
    existsInfoText.remove();
  }
}
/**
 * @description 現在存在する問題ごとのすべての選択肢を取得し、返す
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
 * @description 現在存在する問題をすべて取得し、返す
 * @returns {Element[]} 問題の要素の配列
 */
function getQuestions() {
  const elements = Array.from(document.querySelectorAll(`[id^="q"]`)).filter(
    (e) => /^q\d+$/.test(e.id) /// idがq1 ~ q10で終わる要素のみに絞る
  );

  return elements;
}
/**
 * @description crtQuizObjを初期化する関数
 * @param {object} quizObj クイズ作成に必要なオブジェクト
 * @returns {void} なし
 */
function initQuizObject(quizObj) {
  // プロパティを初期化する
  crtQuizObj.choiceCounter = {};
  crtQuizObj.questionCounter = counterInitialState;
  crtQuizObj.answerType = {};
  crtQuizObj.delQDsWaitTImeout = null;
  crtQuizObj.quizDraftListObj = {};
  crtQuizObj.elem = {};
  crtQuizObj.elem.addQBtn = document.querySelector(".add-question");
  crtQuizObj.elem.questionsCont = document.getElementById("questions");
  crtQuizObj.elem.crtQuizBtn = document.getElementById("crt-quiz");
  crtQuizObj.elem.searchQDInput = document.getElementById("search-q-draft");
  crtQuizObj.elem.quizDraftSection =
    document.getElementById("quiz-draft-section");
  crtQuizObj.elem.crtQuizSection = document.getElementById("crt-quiz-section");

  for (let i = 1; i <= createQuestionCallLimit; i++) {
    const strI = i.toString();
    quizObj.choiceCounter[strI] = counterInitialState;
    quizObj.answerType[strI] = answerTypeInitialState;
  }
}
/**
 * @description 文字列の一部を正規表現により置き換える関数
 * @param {string} str 置き換えたい文字列
 * @param {string} replacement 一部の置き換え後に入る文字列
 * @param {RegExp} regExp 一部を置き換えるための正規表現
 * @returns {string} 置き換え後の文字列
 */
function changeStrN(str, replacement, regExp) {
  return str.replace(regExp, replacement);
}
/**
 * @description オプションのトグルボタンが変化したときにハンドリングする
 * @param {EventTarget | Element} target 変化したトグルボタンのinput要素
 * @param {string} optContCl オプションのコンテナのクラスネーム
 * @param {string} optInputCls 1つ以上のオプションの入力要素のクラスネーム
 * @param {string} [defaultInputVals=""] 1つ以上のinputにデフォルトで設定しておきたい値
 * @returns {void} なし
 */
function toggleOnchange(target, optContCl, optInputCls, defaultInputVals = "") {
  const ToggleParent = target.parentNode;
  const checked = target.checked;
  const optCont = ToggleParent.parentNode.querySelector(`.${optContCl}`);
  if (!checked) {
    const inputClasses = optInputCls.split(" ");
    inputClasses.forEach((inputClass, i) => {
      const input = optCont.querySelector(`.${inputClass}`);
      const defaultVals = defaultInputVals.split(" ");
      input.value = defaultVals[i];
    });
  }
  toggleElem(optCont, !checked);
}
/**
 * @description 指定した要素の親要素のclassにBootstrapのwas-validatedを追加する関数
 * @param {HTMLElement | Element | ParentNode} el HTML要素
 * @returns {void} なし
 */
function addValidatedClass(el) {
  el.parentNode.classList.add("was-validated");
}
/**
 * @description クイズの下書きを保存する(ユーザがサイトを去る時、クイズ作成ページから離れたときに実行)
 * @returns {void} なし
 */
export function saveQuizDraft() {
  const crtQuizContId = document.querySelector(".crt-quiz-cont").id;
  let quizDraftId;
  if (crtQuizContId.startsWith("edit")) {
    // 編集画面だった場合はそのクイズデータを下書きとして保存しない
    initCrtQuizPage();
    return;
  } else if (crtQuizContId.startsWith("draft")) {
    quizDraftId = crtQuizContId.split("draft-")[1];
  }

  // 一つもフォームが入力されていなかったら保存しない
  let isEmptyQuiz = true;
  // フォームに入力されている値をオブジェクトに保存し、ローカルストレージに保存する
  const id = quizDraftId || randomUUID();
  const title = document.getElementById("title").value;
  const descriptionElem = document.getElementById("description");
  const description = descriptionElem.value;
  if (title || description) isEmptyQuiz = false;
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

  const tfQuizOption = document.getElementById("option-tf");
  const tfCheckbox = tfQuizOption.querySelector("#tf-toggle");
  const isTFQuiz = tfCheckbox.checked;
  if (isTFQuiz) {
    const trueInput = tfQuizOption.querySelector("#true");
    const trueVal = trueInput.value;
    const falseInput = tfQuizOption.querySelector("#false");
    const falseVal = falseInput.value;
    if (trueVal && falseVal) {
      quizDraft.options.tf = [trueVal, falseVal];
      isEmptyQuiz = false;
    }
  }

  questions.forEach((question) => {
    const questionN = question.id.split("q")[1];
    const questionKey = `q${questionN}`;

    const statement = question.querySelector(`#q${questionN}-statement`).value;
    const answerType = isTFQuiz ? "select" : crtQuizObj.answerType[questionN];

    quizDraft.questions[questionKey] = {};
    quizDraft.questions[questionKey].options = {};
    quizDraft.questions[questionKey].statement = statement;
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
        if (isTFQuiz) {
          quizDraft.questions[questionKey].choices = quizDraft.options.tf;
          const choices = question.querySelectorAll(".tf-choice");
          choices.forEach((choice) => {
            const c = choice.querySelector(".type-choice").value;
            if (c) isEmptyQuiz = false;
            const isCorrectAnswer =
              choice.querySelector(".set-correct").checked;
            if (isCorrectAnswer) {
              quizDraft.questions[questionKey].correctAnswer = c;
              isEmptyQuiz = false;
            }
          });
        } else {
          const { selectChoices: choices } = getChoices(questionN);
          choices.forEach((choice) => {
            const c = choice.querySelector(".type-choice").value;
            quizDraft.questions[questionKey].choices.push(c);
            if (c) isEmptyQuiz = false;
            const isCorrectAnswer =
              choice.querySelector(".set-correct").checked;
            if (isCorrectAnswer) {
              quizDraft.questions[questionKey].correctAnswer = c;
              isEmptyQuiz = false;
            }
          });
        }
        break;
      }
      case "select-all": {
        quizDraft.questions[questionKey].choices = [];
        quizDraft.questions[questionKey].correctAnswers = [];
        const { selectAllChoices: choices } = getChoices(questionN);
        choices.forEach((choice) => {
          const c = choice.querySelector(".type-choice").value;
          quizDraft.questions[questionKey].choices.push(c);
          if (c) isEmptyQuiz = false;
          const isCorrectAnswer = choice.querySelector(".set-correct").checked;
          if (isCorrectAnswer) {
            quizDraft.questions[questionKey].correctAnswers.push(c);
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
      const prevQuizDraft = getQuizDraftFromStorage(quizDraftId);
      if (areQuizzesEqual(prevQuizDraft, quizDraft)) return; // 下書きに変化がないときは保存とトースト表示をしない

      updateQuizDraftToStorage(quizDraft);
    } else {
      addQuizDraftToStorage(quizDraft);
    }
    showToast("sky-blue", "下書きが保存されました");
  } else {
    if (quizDraftId) {
      removeQuizDraftFromStorage(id);
      showToast("sky-blue", "下書きが空になったため、自動的に削除されました");
    }
  }

  initCrtQuizPage();
}
/**
 * @description クイズ作成ページを初期化する
 * @param {Quiz} [quiz=null] クイズのオブジェクト(編集時、下書きから始めるときにquizTypeと併せて渡す)
 * @param {"new" | "edit" | "draft"} [quizType=null] 引数quizの種類(newの場合はquizはnullを渡す)
 * @returns {void} なし
 */
export function initCrtQuizPage(quiz = null, quizType = null) {
  crtQPage.innerHTML = "";
  const crtQPageClone = cloneFromTemplate("crt-q-page-tem");
  crtQPage.appendChild(crtQPageClone);
  initQuizObject(crtQuizObj);
  createQuestion(true);

  const crtQuizCont = document.querySelector(".crt-quiz-cont");
  const validQuizParam = quiz && isValidQuizObj(quiz);

  if (quizType === "edit") {
    if (validQuizParam) {
      crtQuizCont.id = `edit-${quiz.id}`;
      crtQPage.querySelector("#crt-quiz-title").innerText = "クイズを編集する";
      crtQPage.querySelector("#crt-quiz-subtitle").innerHTML =
        "(編集を確定する前にこの画面を離れると、変更は取り消されます。)";
      crtQuizObj.elem.crtQuizBtn.innerText = "変更を保存";
      crtQuizObj.elem.crtQuizBtn.addEventListener("click", () => {
        createQuiz(quiz.id, quizType);
      });
      setQuizVals(quiz);
      hideElem(crtQuizObj.elem.quizDraftSection);
      showElem(crtQuizObj.elem.crtQuizSection);
      crtQuizObj.elem.searchQDInput.removeEventListener(
        "input",
        handleSearchQuizDrafts
      );
      return;
    } else {
      showToast("red", "無効なクイズデータです");
      initCrtQuizPage();
      return;
    }
  } else if (quizType === "draft") {
    if (validQuizParam) {
      crtQuizCont.id = `draft-${quiz.id}`;
      crtQPage.querySelector("#crt-quiz-subtitle").innerText =
        "フォームが一つでも入力されている場合、クイズは自動的に保存されます。また、フォームがすべて空になると、保存された下書きは削除されます";
      crtQuizObj.elem.crtQuizBtn.addEventListener("click", () => {
        createQuiz(quiz.id, quizType);
      });
      setQuizVals(quiz);
      hideElem(crtQuizObj.elem.quizDraftSection);
      showElem(crtQuizObj.elem.crtQuizSection);
      crtQuizObj.elem.searchQDInput.removeEventListener(
        "input",
        handleSearchQuizDrafts
      );
      setCookie(LAST_ACCESS_KEY_NAME, `createQuiz?draftId=${quiz.id}`);
      return;
    } else {
      showToast("red", "無効な下書きデータです");
      initCrtQuizPage();
      return;
    }
  } else if (!quiz && quizType === "new") {
    crtQuizCont.id = "crt-quiz";
    crtQuizObj.elem.crtQuizBtn.addEventListener("click", () => {
      createQuiz();
    });
    hideElem(crtQuizObj.elem.quizDraftSection);
    showElem(crtQuizObj.elem.crtQuizSection);
    crtQuizObj.elem.searchQDInput.removeEventListener(
      "input",
      handleSearchQuizDrafts
    );
    return;
  }

  const quizDrafts = getQuizDraftsFromStorage();
  toggleElem(crtQuizObj.elem.quizDraftSection, !quizDrafts);
  toggleElem(crtQuizObj.elem.crtQuizSection, quizDrafts);

  if (!quizDrafts || !Object.keys(quizDrafts).length) {
    initCrtQuizPage(null, "new");
  } else {
    // この関数が実行されたのが新規作成のためでも編集のためでも下書きから作成するためでもなく、下書きが存在する場合は下書き一覧を表示
    displayQuizDraftList();
  }

  crtQuizObj.elem.searchQDInput.addEventListener(
    "input",
    handleSearchQuizDrafts
  );
}
/**
 * @description クイズ作成のフォームに、渡されたクイズの値をセットする
 * @param {Quiz} quiz クイズのデータ
 * @returns {void} なし
 */
function setQuizVals(quiz) {
  const { title, description, questions } = quiz;
  // クイズデータをそれぞれフォームにセットする
  crtQPage.querySelector("#title").value = title;
  crtQPage.querySelector("#description").value = description;

  if (quiz?.options?.timer) {
    const timerToggle = crtQPage.querySelector("#timer-toggle");
    timerToggle.checked = true;
    toggleOnchange(timerToggle, "type-timer-cont", "timer-input");
    crtQPage.querySelector("#timer").value = quiz.options.timer;
  }

  const optionTF = quiz?.options?.tf;
  if (optionTF) {
    const tfToggle = crtQPage.querySelector("#tf-toggle");
    tfToggle.checked = true;
    toggleOnchange(
      tfToggle,
      "type-tf-cont",
      "t-input f-input",
      "\u3007 \u2715"
    );
    const [trueVal, falseVal] = optionTF;
    crtQPage.querySelector("#true").value = trueVal;
    crtQPage.querySelector("#false").value = falseVal;
    setTFChoiceVals();
    toggleQuizCont();
  }

  for (let i = 0; i < quiz.length; i++) {
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
        if (optionTF) {
          const choices = questionEl.querySelectorAll(".tf-choice");
          choices.forEach((choice) => {
            const choiceVal = choice.querySelector(".type-choice").value;
            if (choiceVal === question.correctAnswer) {
              choice.querySelector(".set-correct").checked = true;
            }
          });
        } else {
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
      toggleOnchange(explToggle, "type-expl-cont", "expl-textarea");
      questionEl.querySelector(`#q${questionN}-explanation`).value =
        question.options.explanation;
    }
  }

  checkQuestionsState();
}
/**
 * @description クイズの下書きをすべて削除するボタンで、3秒待つタイムアウトを解除する
 * @returns {void} なし
 */
export function clearDelQDsWaitTimeout() {
  clearTimeout(crtQuizObj.delQDsWaitTImeout);
}
/**
 * @description クイズの下書きを一覧表示する
 * @param {Quiz | null} [obj=null] クイズのデータ(検索結果のクイズのオブジェクトがないときはnull)
 * @param {string} highlight クイズの情報にハイライトをつけるときに使用する文字列
 * @returns {void} なし
 */
function displayQuizDraftList(obj = null, highlight = "") {
  const quizDraftsCont = document.getElementById("quiz-drafts-cont");
  quizDraftsCont.innerHTML = "";

  if (!obj) {
    crtQuizObj.quizDraftListObj = getQuizDraftsFromStorage();
    if (!crtQuizObj.quizDraftListObj) return;
  }

  if (!Object.keys(crtQuizObj.quizDraftListObj).length) {
    // 残り1個の下書きが削除された後に、新規クイズ作成画面に切り替える
    initCrtQuizPage(null, "new");
  }

  const qListObjToUse = obj ? obj : crtQuizObj.quizDraftListObj;
  Object.values(qListObjToUse).forEach((quizD) => {
    if (!isValidQuizObj(quizD)) return;
    // 要素に下書きのデータを設定し、ハイライトがあればハイライトもつける
    const quizDraft = cloneFromTemplate("quiz-draft-tem");
    const elsHasAttrQId = quizDraft.querySelectorAll("[id*='{quiz-draft-id}']");
    replaceAttrVals(elsHasAttrQId, "{quiz-draft-id}", quizD.id);
    const quizTitleEl = quizDraft.querySelector(".q-title");
    quizTitleEl.innerText = quizD.title || "タイトルなし";
    highlightText(highlight, quizTitleEl);
    const quizDescEl = quizDraft.querySelector(".q-desc");
    quizDescEl.innerText = quizD.description || "説明なし";
    highlightText(highlight, quizDescEl);
    const hasOptions = {
      quiz: {
        timer: false,
      },
      question: {
        explanation: false,
      },
    };
    Object.values(quizD.questions).forEach((question) => {
      if (hasOptions.question.explanation) return;
      if (question?.options?.explanation) {
        hasOptions.question.explanation = true;
      }
    });
    const optionTimer = quizD?.options?.timer;
    if (optionTimer) {
      hasOptions.quiz.timer = true;
    }

    const hasAnyOption =
      hasOptions.quiz.timer || hasOptions.question.explanation;
    if (hasAnyOption) {
      const quizInfoEl = quizDraft.querySelector(".q-info");
      showElem(quizInfoEl);
      if (hasOptions.quiz.timer) {
        const timerIcon = quizInfoEl.querySelector(".timer-icon");
        replaceAttrVals([timerIcon], "{option-timer}", formatTime(optionTimer));
        toggleElem(timerIcon, !hasOptions.quiz.timer);
      }
      if (hasOptions.question.explanation) {
        toggleElem(
          quizInfoEl.querySelector(".expl-icon"),
          !hasOptions.question.explanation
        );
      }
    }

    const qLengthEl = quizDraft.querySelector(".q-length");
    qLengthEl.innerText = qLengthEl.innerText.replace(
      "{quiz-length}",
      quizD.length
    );
    highlightText(highlight, qLengthEl);
    quizDraftsCont.appendChild(quizDraft);
  });
  initTooltips();
  toggleBtnsByScrollability("createQuiz");
}
/**
 * @description 下書き一覧を検索するときに、イベントリスナーのコールバックとしてこの関数を登録する
 * @param {Event} e inputイベント
 * @returns {void} なし
 */
function handleSearchQuizDrafts(e) {
  const query = e.target.value;
  const noneQuizDraftEl = document.getElementById("none-quiz-draft");

  crtQPage
    .querySelector(".del-all-cont")
    .classList.toggle("hidden-del-all-cont", query); // 検索バーが空のときのみ下書き全削除ボタンを表示する

  if (!query) {
    hideElem(noneQuizDraftEl);
    displayQuizDraftList();
    return;
  }

  const qDListObj = searchQuizzes(query, crtQuizObj.quizDraftListObj);
  const noneResult = !Object.keys(qDListObj).length;
  toggleElem(noneQuizDraftEl, !noneResult);
  noneQuizDraftEl.querySelector(
    "#none-quiz-draft-txt"
  ).innerText = `「${query}」に当てはまる下書きは見つかりませんでした`;
  if (noneResult) {
    document.getElementById("quiz-drafts-cont").innerHTML = "";
    toggleBtnsByScrollability("createQuiz");
    return;
  }
  displayQuizDraftList(qDListObj, query);
}
/**
 * @description 二つのクイズのオブジェクトが一致していたらtrue,それ以外ならfalseを返す
 * @param {Quiz} quiz1 1つ目のクイズオブジェクト
 * @param {Quiz} quiz2 2つ目のクイズオブジェクト
 * @returns {boolean} 二つのクイズオブジェクトが一致しているかどうか
 */
function areQuizzesEqual(quiz1, quiz2) {
  // タイプが異なる場合は不一致
  if (typeof quiz1 !== typeof quiz2) {
    return false;
  }

  // オブジェクトがnullかundefinedの場合は不一致
  if (
    quiz1 === null ||
    quiz2 === null ||
    quiz1 === undefined ||
    quiz2 === undefined
  ) {
    return false;
  }

  // タイプがオブジェクトの場合
  if (typeof quiz1 === "object") {
    const keys1 = Object.keys(quiz1);
    const keys2 = Object.keys(quiz2);

    // キーの数が異なる場合は不一致
    if (keys1.length !== keys2.length) {
      return false;
    }

    // すべてのプロパティを比較
    for (const key of keys1) {
      if (!areQuizzesEqual(quiz1[key], quiz2[key])) {
        return false;
      }
    }

    // すべてのプロパティが一致した場合は一致
    return true;
  }

  // タイプがオブジェクト以外の場合は値を比較
  return quiz1 === quiz2;
}
/**
 * @description 環境に合わせてUUIDを生成する関数を実行する
 * @returns {string} UUIDv4の文字列
 */
export function randomUUID() {
  const existsCryptoRandomUUID =
    "crypto" in window && "randomUUID" in window.crypto;

  return existsCryptoRandomUUID ? crypto.randomUUID() : generateUUIDv4();
}
// https://github.com/googlearchive/chrome-platform-analytics/blob/master/src/internal/identifier.js
// Copyright 2013 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @description webkit系ブラウザで、crypto.randomUUID()が使用できないときに、代用で使用する
 * @returns {string} UUIDv4の文字列
 */
function generateUUIDv4() {// 元コード analytics.internal.Identifier.generateUuid = function() {
  let chars = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".split(""); // 元コード var chars = analytics.internal.Identifier.UUID_FMT_.split('');
  for (let i = 0, len = chars.length; i < len; i++) {
    // 元コード for (var i = 0, len = chars.length; i < len; i++) {
    switch (chars[i]) {
      case "x":
        chars[i] = Math.floor(Math.random() * 16).toString(16); // 元コード chars[i] = goog.math.randomInt(16).toString(16);
        break;
      case "y":
        chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16); // 元コード chars[i] = (goog.math.randomInt(4) + 8).toString(16);
        break;
    }
  }
  return chars.join("");
}
