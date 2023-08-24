"use strict";
import { isNumNotNaN } from "./isNumNotNaN.js";
import { isUUID } from "./isUUID.js";
/**
 * @description 有効なクイズデータであればtrue,そうでなければfalseを返す
 * @param {object} obj 判別するオブジェクト
 * @returns {boolean} 有効なクイズデータかどうか
 */
export function isValidQuizObj(obj) {
  if (!obj || !isUUID(obj.id)) {console.log("f");return false;}

  const requiredKeys = ["id", "title", "description", "length", "questions"];
  const { questions } = obj;

  if (typeof questions !== "object") {console.log("f");return false;}

  const optionTimer = obj?.options?.timer;
  if (optionTimer && !isNumNotNaN(optionTimer)) {console.log("f");return false;}

  const optionTF = obj?.options?.tf;
  if (
    optionTF &&
    !(
      Array.isArray(optionTF) &&
      optionTF.every((choice) => typeof choice === "string")
    )
  )
    {console.log("f");return false;}

  const validateQuestion = (question) => isValidQuestionObj(question);

  if (
    !requiredKeys.every(
      (key) =>
        key === "questions" ||
        (key === "length" && key in obj && typeof obj[key] === "number") ||
        (key in obj && typeof obj[key] === "string")
    )
  )
    {console.log("f");return false;}

  if (!Object.values(questions).every((question) => validateQuestion(question)))
    {console.log("f");return false;}

  return true;
}

function isValidQuestionObj(question) {
  const requiredKeys = ["answerType", "statement"];

  const optionExplanation = question?.options?.explanation;
  if (optionExplanation && typeof optionExplanation !== "string") {console.log("f");return false;}

  const validAnswerTypes = ["select", "select-all", "type-text"];
  if (!validAnswerTypes.includes(question.answerType)) {console.log("f");return false;}

  const validateChoices = () =>
    Array.isArray(question.choices) &&
    question.choices.length > 0 &&
    question.choices.every((choice) => typeof choice === "string");

  if (
    !requiredKeys.every(
      (key) => key in question && typeof question[key] === "string"
    )
  )
    {console.log("f");return false;}

  // それぞれの回答形式に必要なプロパティが正しい値で存在するか調べる
  if (
    question.answerType === "select" ||
    question.answerType === "select-all"
  ) {
    if (
      !(
        "choices" in question &&
        (question.answerType === "select-all"
          ? "correctAnswers" in question
          : "correctAnswer" in question)
      )
    )
      {console.log("f");return false;}

    if (
      (question.answerType === "select" ||
        question.answerType === "select-all") &&
      !validateChoices()
    )
      {console.log("f");return false;}
  } else if (question.answerType === "type-text") {
    if (typeof question.correctAnswer !== "string") {console.log("f");return false;}
  }

  return true;
}
