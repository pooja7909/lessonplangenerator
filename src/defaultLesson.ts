import { LessonPlan } from "./types";

export const defaultLesson: LessonPlan = {
  subject: "Chemistry",
  yearGroup: "Year 10",
  topic: "Chemical Kinetics",
  subTopic: "Factors Affecting Reaction Rates",
  duration: "60 minutes",
  date: "2026-06-16",
  learningObjectives: [
    "Describe how temperature, concentration, and surface area affect the rate of a chemical reaction.",
    "Explain reaction rate changes in terms of collision theory and particle speed.",
    "Outline how a catalyst can speed up reaction rates by lowering the activation energy barrier."
  ],
  successCriteria: [
    "I can identify and describe four primary factors that influence chemical reaction rates.",
    "I can model a reaction in terms of successful molecular collisions.",
    "I can draw and label a basic activation energy diagram with and without a catalyst."
  ],
  resourcesAndMaterials: [
    "Dilute Hydrochloric Acid (1M and 2M), Magnesium strips",
    "Stopwatches, test tubes, and measuring cylinders",
    "Safety glasses and laboratory coats",
    "Collision Theory slides and interactive simulation"
  ],
  lessonActivities: [
    {
      activity: "Hook / Lead-in",
      strategy: "Classroom challenge: Why does powder dissolve faster than sugar cubes?",
      duration: 10
    },
    {
      activity: "Direct Instruction",
      strategy: "Interactive lecture on Collision Theory and Activation Energy using slides",
      duration: 15
    },
    {
      activity: "Practical Work",
      strategy: "Micro-scale practical testing magnesium speed in varying acid concentrations",
      duration: 15
    },
    {
      activity: "Collaborative Analysis",
      strategy: "Think-Pair-Share: Graphing reaction speeds and describing the slopes",
      duration: 10
    },
    {
      activity: "Lesson Plenary",
      strategy: "Individual exit ticket questions on temperature changes",
      duration: 10
    }
  ],
  assessment: {
    formative: [
      "Circulating questioning during micro-scale experiments",
      "Teacher review of student graph predictions during data collection"
    ],
    summative: [
      "Exit Ticket: Draw a cartoon explaining how concentration changes molecular collision speed"
    ]
  },
  differentiationInclusion: [
    "Support: Structured data tables with pre-labeled axes for graphs",
    "Stretch: Calculate rate constant variables or draft reaction intermediate structures"
  ],
  crossCurricularLinks: [
    "Mathematics: Graphing variables, scale selections, calculating averages",
    "Language Literacy: Defining and using key terms like 'catalyst' and 'activation energy'"
  ],
  homeworkExtension: {
    homework: [
      "Reaction rates worksheet questions 1-6"
    ],
    extension: [
      "Investigation prep: Research how grain silo dust explosions relate to surface area"
    ]
  },
  reflectionQuestions: {
    whatWentWell: [
      "Magnesium practical kept students highly involved with measurable instant success",
      "Silo dust explosion hook successfully triggered solid initial student engagement"
    ],
    challenges: [
      "Transition between practical work setup and graphing required more minutes than allotted"
    ],
    nextTime: [
      "Distribute glassware and reactant bottles onto student desk trays prior to start"
    ]
  },
  thinkingRoutine: {
    title: "See, Think, Wonder",
    phase: "starter",
    description: "Use this Harvard Thinking Routine alongside the dissolving cube demo to stimulate initial scientific inquiry and observant questioning.",
    prompts: [
      "What do you observe when comparing the sugar cube vs. powder dissolving rates?",
      "What is going on at the molecular level to cause these different speeds?",
      "What questions do you now have about what controls reaction acceleration?"
    ]
  }
};
