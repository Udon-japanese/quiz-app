"use strict";
import { isUUID } from "./isUUID.js";
/**
 *@description 有効なクイズデータかどうかを判別する
 * @param {object} obj 判別するオブジェクト
 * @param {boolean} [isDraft=false] 下書きのデータかどうか
 * @returns {boolean} 有効なクイズデータかどうか
 */
export function isValidQuizObj(obj, isDraft = false) {
  if (!obj) return false;
  if (!isUUID(obj.id)) return false;

  const requiredKeys = ["id", "title", "description", "length", "questions"];
  const { questions } = obj;

  if (typeof questions !== "object") return false;

  const optionTimer = obj?.options?.timer;
  if (optionTimer) {
    if (typeof optionTimer !== "number") return false;
  }

  const optionTF = obj?.options?.tf;
  if (optionTF) {
    if (!Array.isArray(optionTF)) return false;

    for (const choice of optionTF) {
      if (typeof choice !== "string") return false;
    }
  }

  if (isDraft) {
    const draftAllKeys = Object.keys(obj);
    if (
      requiredKeys.some((key) => {
        return !draftAllKeys.includes(key);
      })
    ) {
      return false;
    }
    if (
      draftAllKeys.every(
        (key) =>
          key === "questions" ||
          (key === "length" && key in obj && typeof obj[key] === "number") ||
          (key in obj && typeof obj[key] === "string")
      )
    ) {
      return false;
    }
    for (const question of Object.values(questions)) {
      if (!isValidQuestionObj(question, isDraft)) {
        return false;
      }
    }

    return true;
  } else {
    if (
      !requiredKeys.every(
        (key) =>
          key === "questions" ||
          (key === "length" && key in obj && typeof obj[key] === "number") ||
          (key in obj && typeof obj[key] === "string")
      )
    ) {
      return false;
    }

    for (const question of Object.values(questions)) {
      if (!isValidQuestionObj(question)) {
        return false;
      }
    }

    return true;
  }
}

function isValidQuestionObj(question, isDraft) {
  const requiredKeys = ["answerType", "statement"];

  const optionExplanation = question?.options?.explanation;
  if (optionExplanation) {
    if (typeof question?.options?.explanation !== "string") {
      return false;
    }
  }

  const validAnswerTypes = ["select", "select-all", "type-text"];
  if (!validAnswerTypes.includes(question.answerType)) {
    return false;
  }

  if (isDraft) {
    const draftAllKeys = Object.keys(question);
    if (
      requiredKeys.some((key) => {
        return !draftAllKeys.includes(key);
      })
    ) {
      return false;
    }

    if (
      !requiredKeys.every(
        (key) => key in question && typeof question[key] === "string"
      )
    ) {
      return false;
    }

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
      ) {
        return false;
      }
      if (
        Array.isArray(question.choices) &&
        question.choices.length > 0 &&
        question.choices.every((choice) => typeof choice === "string") &&
        ((question.answerType === "select" &&
          typeof question.correctAnswer === "string") ||
          (question.answerType === "select-all" &&
            Array.isArray(question.correctAnswers)))
      ) {
        if (
          question.answerType === "select-all" &&
          question.correctAnswers.length
        ) {
          if (
            question.correctAnswers.every(
              (answer) => typeof answer === "string"
            )
          ) {
            return true;
          }
        }
        return true;
      }
    } else if (question.answerType === "type-text") {
      if (question.correctAnswer) {
        if (typeof question.correctAnswer === "string") {
          return true;
        }
      }
    }
    return true;
  } else {
    if (
      !requiredKeys.every(
        (key) => key in question && typeof question[key] === "string"
      )
    ) {
      return false;
    }

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
      ) {
        return false;
      }
      if (
        Array.isArray(question.choices) &&
        question.choices.length > 0 &&
        question.choices.every((choice) => typeof choice === "string") &&
        ((question.answerType === "select" &&
          typeof question.correctAnswer === "string") ||
          (question.answerType === "select-all" &&
            Array.isArray(question.correctAnswers) &&
            question.correctAnswers.length > 0 &&
            question.correctAnswers.every(
              (answer) => typeof answer === "string"
            )))
      ) {
        return true;
      }
    } else if (question.answerType === "type-text") {
      if (typeof question.correctAnswer === "string") {
        return true;
      }
    }

    return false;
  }
}
