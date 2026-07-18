export const LESSON_TYPE = {
  PRACTICAL: {
    id: "001",
    code: "04212",
    label: "実車",
  },
  SET: {
    id: "002",
    code: "06200",
    label: "セット",
  },
  MULTIPLE: {
    id: "003",
    code: "10201",
    label: "複数",
  },
  HIGHWAY: {
    id: "004",
    code: "09200",
    label: "高速",
  },
  FIRST_AID: {
    id: "005",
    code: "64200",
    label: "学応急",
  },
};

export const LESSON_TYPE_CHOICES = Object.entries(LESSON_TYPE).map(
  ([key, lessonType]) => ({
    name: lessonType.label,
    value: key,
  }),
);

export function getLessonTypeByKey(key) {
  const lessonType = LESSON_TYPE[key];

  if (!lessonType) {
    throw new Error(`Unknown lesson type: ${key}`);
  }

  return lessonType;
}
