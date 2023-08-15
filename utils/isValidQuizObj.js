/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
export function isValidQuizObj(obj) {
  const requiredKeys = ["id", "title", "description", "questions"];
  if (
    !requiredKeys.every(
      (key) =>
        key === "questions" || (key in obj && typeof obj[key] === "string")
    )
  ) {
    return false;
  }

  const { questions } = obj;
  if (typeof questions !== "object") {
    return false;
  }

  for (const questionKey in questions) {
    const question = questions[questionKey];
    if (!isValidQuestionObj(question)) {
      return false;
    }
  }

  return true;
}

function isValidQuestionObj(question) {
  const requiredKeys = ["answerType", "statement"];
  if (
    !requiredKeys.every(
      (key) => key in question && typeof question[key] === "string"
    )
  ) {
    return false;
  }

  const validAnswerTypes = ["select", "select-all", "type-text"];
  if (!validAnswerTypes.includes(question.answerType)) {
    return false;
  }

  if (
    question.answerType === "select" ||
    question.answerType === "select-all"
  ) {
    if (
      !("choices" in question) ||
      !(question.answerType === "select-all"
        ? "correctAnswers" in question
        : "correctAnswer" in question)
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