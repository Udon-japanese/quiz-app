"use strict";
import { isNumNotNaN } from "./isNumNotNaN.js";
/**
 * @description 有効なクイズデータであればtrue,そうでなければfalseを返す
 * @param {object} obj 判別するオブジェクト
 * @returns {boolean} 有効なクイズデータかどうか
 */
export function isValidQuizObj(obj) {
  if (!obj || !isUUID(obj.id)) return false;

  const requiredKeys = ["id", "title", "description", "length", "questions"];
  const { questions } = obj;

  if (typeof questions !== "object") return false;

  const optionTimer = obj.options?.timer;
  if (optionTimer && !isNumNotNaN(optionTimer)) return false;

  const optionTF = obj.options?.tf;
  if (
    optionTF &&
    !(
      Array.isArray(optionTF) &&
      optionTF.every((choice) => typeof choice === "string")
    )
  )
    return false;

  const validateQuestion = (question) => isValidQuestionObj(question);

  if (
    !requiredKeys.every(
      (key) =>
        key === "questions" ||
        (key === "length" && key in obj && typeof obj[key] === "number") ||
        (key in obj && typeof obj[key] === "string")
    )
  )
    return false;

  if (!Object.values(questions).every((question) => validateQuestion(question)))
    return false;

  return true;
}

function isValidQuestionObj(question) {
  const requiredKeys = ["answerType", "statement"];

  const optionExplanation = question.options?.explanation;
  if (optionExplanation && typeof optionExplanation !== "string") return false;

  const validAnswerTypes = ["select", "select-all", "type-text"];
  if (!validAnswerTypes.includes(question.answerType)) return false;

  const validateChoices = () =>
    Array.isArray(question.choices) &&
    question.choices.length > 0 &&
    question.choices.every(
      (choiceObj) =>
        typeof choiceObj === "object" &&
        Object.keys(choiceObj).every(
          (key) => isUUID(key) && typeof choiceObj[key] === "string"
        )
    );

  if (
    !requiredKeys.every(
      (key) => key in question && typeof question[key] === "string"
    )
  )
    return false;

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
      return false;

    if (
      (question.answerType === "select" ||
        question.answerType === "select-all") &&
      !validateChoices()
    )
      return false;
  } else if (question.answerType === "type-text") {
    if (typeof question.correctAnswer !== "string") return false;
  }

  return true;
}
/**
 * @description 与えられた文字列がUUIDならtrue,それ以外ならfalseを返す
 * @param {string} str 
 * @returns {boolean} UUIDかどうか
 */
function isUUID(str) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}