export interface LessonActivity {
  activity: string;
  strategy: string;
  duration: number;
}

export interface AssessmentInfo {
  formative: string[];
  summative: string[];
}

export interface HomeworkExtension {
  homework: string[];
  extension: string[];
}

export interface ReflectionQuestions {
  whatWentWell: string[];
  challenges: string[];
  nextTime: string[];
}

export interface ThinkingRoutine {
  title: string;
  phase: "starter" | "plenary" | "exit_ticket";
  description: string;
  prompts: string[];
}

export interface LessonPlan {
  subject: string;
  yearGroup: string;
  topic: string;
  subTopic: string;
  duration: string;
  date?: string; // Standard editable lesson plan run date
  learningObjectives: string[];
  successCriteria: string[];
  resourcesAndMaterials: string[];
  lessonActivities: LessonActivity[];
  assessment: AssessmentInfo;
  differentiationInclusion: string[];
  crossCurricularLinks: string[];
  homeworkExtension: HomeworkExtension;
  reflectionQuestions: ReflectionQuestions;
  thinkingRoutine?: ThinkingRoutine;
}

