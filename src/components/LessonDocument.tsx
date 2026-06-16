import React from "react";
import { LessonPlan, LessonActivity } from "../types";
import { 
  Trash2, 
  Plus, 
  Printer, 
  Clipboard, 
  Download, 
  Eye, 
  FileEdit,
  Sparkles,
  X,
  Check,
  FileText,
  ExternalLink
} from "lucide-react";

interface LessonDocumentProps {
  plan: LessonPlan;
  onUpdate: (updatedPlan: LessonPlan) => void;
  onReset: () => void;
  isLoading: boolean;
}

export default function LessonDocument({ 
  plan, 
  onUpdate, 
  onReset,
  isLoading
}: LessonDocumentProps) {

  // State managers for active LLM rewrite action
  const [activeRewrite, setActiveRewrite] = React.useState<{
    text: string;
    title: string;
    onApply: (newText: string) => void;
  } | null>(null);

  const [rewriteInstruction, setRewriteInstruction] = React.useState("");
  const [rewritePreview, setRewritePreview] = React.useState("");
  const [isRewriting, setIsRewriting] = React.useState(false);
  const [rewriteError, setRewriteError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Update text metadata fields (Subject, Year Group, etc.)
  const handleMetaChange = (field: keyof LessonPlan, value: string) => {
    onUpdate({
      ...plan,
      [field]: value
    });
  };

  // Reconcile/Rescale all individual timeline activities to match the new duration
  const handleDurationReconcile = (durationStr: string) => {
    const match = durationStr.match(/\d+/);
    if (!match) return;
    const targetTotal = parseInt(match[0], 10);
    if (isNaN(targetTotal) || targetTotal <= 0) return;

    const activities = plan.lessonActivities;
    if (activities.length === 0) return;

    const currentTotal = activities.reduce((acc, act) => acc + act.duration, 0);
    if (currentTotal === targetTotal) {
      // Just format if it was entered as raw digits (e.g., "50")
      const trimmed = durationStr.trim();
      if (/^\d+$/.test(trimmed)) {
        onUpdate({
          ...plan,
          duration: `${trimmed} minutes`
        });
      }
      return;
    }

    let updatedActivities;
    if (currentTotal === 0) {
      const share = Math.floor(targetTotal / activities.length);
      const remainder = targetTotal % activities.length;
      updatedActivities = activities.map((act, idx) => ({
        ...act,
        duration: share + (idx === activities.length - 1 ? remainder : 0)
      }));
    } else {
      let runningSum = 0;
      updatedActivities = activities.map((act, idx) => {
        if (idx === activities.length - 1) {
          return {
            ...act,
            duration: Math.max(1, targetTotal - runningSum)
          };
        }
        const scaled = Math.round((act.duration / currentTotal) * targetTotal);
        const duration = Math.max(1, scaled);
        runningSum += duration;
        return {
          ...act,
          duration
        };
      });

      // Recalculate sum and fix any rounding error in the last element
      const finalSum = updatedActivities.reduce((acc, act) => acc + act.duration, 0);
      if (finalSum !== targetTotal && updatedActivities.length > 0) {
        const diff = targetTotal - finalSum;
        const lastIndex = updatedActivities.length - 1;
        updatedActivities[lastIndex].duration = Math.max(1, updatedActivities[lastIndex].duration + diff);
      }
    }

    const trimmed = durationStr.trim();
    const finalDuration = /^\d+$/.test(trimmed) ? `${trimmed} minutes` : durationStr;

    onUpdate({
      ...plan,
      duration: finalDuration,
      lessonActivities: updatedActivities
    });
  };

  // Update lists
  const handleUpdateList = (
    field: "learningObjectives" | "successCriteria" | "resourcesAndMaterials" | "differentiationInclusion" | "crossCurricularLinks",
    index: number,
    value: string
  ) => {
    const updated = [...plan[field]];
    updated[index] = value;
    onUpdate({
      ...plan,
      [field]: updated
    });
  };

  const handleAddList = (
    field: "learningObjectives" | "successCriteria" | "resourcesAndMaterials" | "differentiationInclusion" | "crossCurricularLinks"
  ) => {
    onUpdate({
      ...plan,
      [field]: [...plan[field], ""]
    });
  };

  const handleDeleteList = (
    field: "learningObjectives" | "successCriteria" | "resourcesAndMaterials" | "differentiationInclusion" | "crossCurricularLinks",
    index: number
  ) => {
    const updated = plan[field].filter((_, idx) => idx !== index);
    onUpdate({
      ...plan,
      [field]: updated
    });
  };

  // Update assessments
  const handleUpdateAssessment = (
    subField: "formative" | "summative",
    index: number,
    value: string
  ) => {
    const updatedList = [...plan.assessment[subField]];
    updatedList[index] = value;
    onUpdate({
      ...plan,
      assessment: {
        ...plan.assessment,
        [subField]: updatedList
      }
    });
  };

  const handleAddAssessment = (subField: "formative" | "summative") => {
    onUpdate({
      ...plan,
      assessment: {
        ...plan.assessment,
        [subField]: [...plan.assessment[subField], ""]
      }
    });
  };

  const handleDeleteAssessment = (subField: "formative" | "summative", index: number) => {
    const updatedList = plan.assessment[subField].filter((_, idx) => idx !== index);
    onUpdate({
      ...plan,
      assessment: {
        ...plan.assessment,
        [subField]: updatedList
      }
    });
  };

  // Update homework and extension
  const handleUpdateHomework = (
    subField: "homework" | "extension",
    index: number,
    value: string
  ) => {
    const updatedList = [...plan.homeworkExtension[subField]];
    updatedList[index] = value;
    onUpdate({
      ...plan,
      homeworkExtension: {
        ...plan.homeworkExtension,
        [subField]: updatedList
      }
    });
  };

  const handleAddHomework = (subField: "homework" | "extension") => {
    onUpdate({
      ...plan,
      homeworkExtension: {
        ...plan.homeworkExtension,
        [subField]: [...plan.homeworkExtension[subField], ""]
      }
    });
  };

  const handleDeleteHomework = (subField: "homework" | "extension", index: number) => {
    const updatedList = plan.homeworkExtension[subField].filter((_, idx) => idx !== index);
    onUpdate({
      ...plan,
      homeworkExtension: {
        ...plan.homeworkExtension,
        [subField]: updatedList
      }
    });
  };

  // Update reflections
  const handleUpdateReflection = (
    subField: "whatWentWell" | "challenges" | "nextTime",
    index: number,
    value: string
  ) => {
    const updatedList = [...plan.reflectionQuestions[subField]];
    updatedList[index] = value;
    onUpdate({
      ...plan,
      reflectionQuestions: {
        ...plan.reflectionQuestions,
        [subField]: updatedList
      }
    });
  };

  const handleAddReflection = (subField: "whatWentWell" | "challenges" | "nextTime") => {
    onUpdate({
      ...plan,
      reflectionQuestions: {
        ...plan.reflectionQuestions,
        [subField]: [...plan.reflectionQuestions[subField], ""]
      }
    });
  };

  const handleDeleteReflection = (subField: "whatWentWell" | "challenges" | "nextTime", index: number) => {
    const updatedList = plan.reflectionQuestions[subField].filter((_, idx) => idx !== index);
    onUpdate({
      ...plan,
      reflectionQuestions: {
        ...plan.reflectionQuestions,
        [subField]: updatedList
      }
    });
  };

  // Update Activities Table
  const handleUpdateActivity = (index: number, field: keyof LessonActivity, value: string | number) => {
    let finalValue = value;
    if (field === "duration") {
      const durationVal = typeof value === 'number' ? value : parseInt(value) || 0;
      const otherActivitiesSum = plan.lessonActivities.reduce((acc, act, idx) => {
        if (idx === index) return acc;
        return acc + act.duration;
      }, 0);
      const estimatedMinutes = parseInt(plan.duration?.match(/\d+/)?.[0] || "0", 10);
      
      if (estimatedMinutes > 0 && (otherActivitiesSum + durationVal) > estimatedMinutes) {
        const maxAllowed = Math.max(0, estimatedMinutes - otherActivitiesSum);
        alert(`Cannot set duration to ${durationVal} mins. The total lesson activities duration would exceed the estimated lesson span of ${estimatedMinutes} minutes.\n\nMaximum available duration left for this activity is ${maxAllowed} mins.`);
        finalValue = maxAllowed;
      } else {
        finalValue = durationVal;
      }
    }

    const updated = plan.lessonActivities.map((act, idx) => {
      if (idx === index) {
        return {
          ...act,
          [field]: finalValue
        };
      }
      return act;
    });

    onUpdate({
      ...plan,
      lessonActivities: updated
    });
  };

  const handleAddActivity = () => {
    const estimatedMinutes = parseInt(plan.duration?.match(/\d+/)?.[0] || "0", 10);
    const currentSum = plan.lessonActivities.reduce((acc, act) => acc + act.duration, 0);
    const remainingTime = Math.max(0, estimatedMinutes - currentSum);

    if (estimatedMinutes > 0 && remainingTime <= 0) {
      alert(`Cannot add a new activity block. The timeline activities already consume the total estimated lesson span of ${estimatedMinutes} minutes.`);
      return;
    }

    const newActivityDuration = estimatedMinutes > 0 ? Math.min(10, remainingTime) : 10;

    const newActivity: LessonActivity = {
      activity: "New Active Segment",
      strategy: "E.g. Student discussion/quiz",
      duration: newActivityDuration
    };
    onUpdate({
      ...plan,
      lessonActivities: [...plan.lessonActivities, newActivity]
    });
  };

  const handleDeleteActivity = (index: number) => {
    const updated = plan.lessonActivities.filter((_, idx) => idx !== index);
    onUpdate({
      ...plan,
      lessonActivities: updated
    });
  };

  // Visible Thinking Routine actions
  const handleEnableThinkingRoutine = () => {
    onUpdate({
      ...plan,
      thinkingRoutine: {
        title: "See, Think, Wonder",
        phase: "starter",
        description: "Analyze an image, object, or live demonstration to trigger observant predictions and critical curiosity about this topic.",
        prompts: [
          "What do you observe or notice about this topic?",
          "What did you think was happening or going on?",
          "What questions or wonders do you now have?"
        ]
      }
    });
  };

  const handleDisableThinkingRoutine = () => {
    const updatedPlan = { ...plan };
    delete updatedPlan.thinkingRoutine;
    onUpdate(updatedPlan);
  };

  const handleUpdateRoutine = (field: "title" | "description" | "phase", value: string) => {
    if (!plan.thinkingRoutine) return;
    onUpdate({
      ...plan,
      thinkingRoutine: {
        ...plan.thinkingRoutine,
        [field]: value
      }
    });
  };

  const handleUpdateRoutinePrompt = (index: number, value: string) => {
    if (!plan.thinkingRoutine) return;
    const updatedPrompts = [...plan.thinkingRoutine.prompts];
    updatedPrompts[index] = value;
    onUpdate({
      ...plan,
      thinkingRoutine: {
        ...plan.thinkingRoutine,
        prompts: updatedPrompts
      }
    });
  };

  const handleAddRoutinePrompt = () => {
    if (!plan.thinkingRoutine) return;
    onUpdate({
      ...plan,
      thinkingRoutine: {
        ...plan.thinkingRoutine,
        prompts: [...plan.thinkingRoutine.prompts, ""]
      }
    });
  };

  const handleDeleteRoutinePrompt = (index: number) => {
    if (!plan.thinkingRoutine) return;
    const updatedPrompts = plan.thinkingRoutine.prompts.filter((_, idx) => idx !== index);
    onUpdate({
      ...plan,
      thinkingRoutine: {
        ...plan.thinkingRoutine,
        prompts: updatedPrompts
      }
    });
  };

  // Switch between presets
  const handleApplyRoutinePreset = (presetKey: string) => {
    if (!plan.thinkingRoutine) return;
    
    let title = "See, Think, Wonder";
    let phase: "starter" | "plenary" | "exit_ticket" = "starter";
    let description = "Analyze an image, object, or live demonstration to trigger observant predictions and critical curiosity about this topic.";
    let prompts = [
      "What do you observe or notice about this topic?",
      "What did you think was happening or going on?",
      "What questions or wonders do you now have?"
    ];

    switch(presetKey) {
      case "321_bridge":
        title = "3-2-1 Bridge";
        phase = "plenary";
        description = "Bridge initial understanding to new learning by organizing thoughts, creating questions, and drawing analogies.";
        prompts = [
          "3 Thoughts/Words: Write three initial or new ideas about this topic.",
          "2 Questions: Draft two deeper questions you still want to answer.",
          "1 Analogy/Metaphor: Formulate one comparison or analogy that captures the essence."
        ];
        break;
      case "used_to_think":
        title = "I Used to Think... Now I Think...";
        phase = "exit_ticket";
        description = "Reflect on how your thinking has evolved or changed over this lesson block.";
        prompts = [
          "I used to think this about the topic...",
          "But now, after studying this, I think...",
          "What specific fact or reasoning caused my understanding to shift?"
        ];
        break;
      case "think_puzzle_explore":
        title = "Think, Puzzle, Explore";
        phase = "starter";
        description = "Assess prior assumptions and map out pathways of inquiry before starting deep study on this topic.";
        prompts = [
          "What do you think you know about this topic already?",
          "What puzzles, questions, or mysteries remain in your mind?",
          "How could we investigate or explore to solve those puzzles?"
        ];
        break;
      case "connect_extend_challenge":
        title = "Connect, Extend, Challenge";
        phase = "plenary";
        description = "Connect new content to existing knowledge, extend thoughts further, and call out areas of struggle.";
        prompts = [
          "How did today's lesson connect to what you already knew?",
          "How did it extend, expand, or push your understanding in new directions?",
          "What remains a challenge or continues to pose a difficulty to you?"
        ];
        break;
      case "custom":
        title = "My Custom Routine";
        phase = plan.thinkingRoutine.phase;
        description = "Type your own custom pedagogical thinking cues for students to answer.";
        prompts = ["Question or prompt step 1", "Question or prompt step 2", "Question or prompt step 3"];
        break;
    }

    onUpdate({
      ...plan,
      thinkingRoutine: {
        title,
        //@ts-ignore - allow dynamic casting for safe handling
        phase,
        description,
        prompts
      }
    });
  };

  // Dynamic calculations
  const totalActivityDuration = plan.lessonActivities.reduce((acc, act) => acc + act.duration, 0);
  const estimatedMinutes = parseInt(plan.duration?.match(/\d+/)?.[0] || "0", 10);
  const isOverDuration = estimatedMinutes > 0 && totalActivityDuration > estimatedMinutes;
  const overMinutes = totalActivityDuration - estimatedMinutes;

  // Printing & exporting utils
  const handlePrint = () => {
    window.print();
  };

  const generateMarkdownString = () => {
    let md = `
# Lesson Plan: ${plan.topic} - ${plan.subTopic}
${plan.date ? `**Date:** ${plan.date}\n` : ""}**Subject:** ${plan.subject}
**Year Group:** ${plan.yearGroup}
**Duration:** ${plan.duration}

---

## 1. Learning Objectives
${plan.learningObjectives.map(o => `- ${o}`).join("\n")}

## 2. Success Criteria
${plan.successCriteria.map(s => `- ${s}`).join("\n")}

## 3. Resources & Materials
${plan.resourcesAndMaterials.map(r => `- ${r}`).join("\n")}

## 4. Activities Timeline (Total: ${totalActivityDuration} mins)
${plan.lessonActivities.map(a => `| ${a.duration} mins | ${a.activity} | ${a.strategy} |`).join("\n")}
`;

    if (plan.thinkingRoutine) {
      md += `
## 5. Harvard Visible Thinking Routine: ${plan.thinkingRoutine.title}
*Phase: ${plan.thinkingRoutine.phase.toUpperCase().replace("_", " ")}*
*Guidance: ${plan.thinkingRoutine.description}*

${plan.thinkingRoutine.prompts.map((p, idx) => `**Prompt ${idx + 1}:** ${p}`).join("\n\n")}
`;
    }

    md += `
## 6. Assessment of Learning
### Formative:
${plan.assessment.formative.map(f => `- ${f}`).join("\n")}
### Summative:
${plan.assessment.summative.map(s => `- ${s}`).join("\n")}

## 7. Differentiation & Inclusion
${plan.differentiationInclusion.map(d => `- ${d}`).join("\n")}

## 8. Cross-Curricular Links
${plan.crossCurricularLinks.map(c => `- ${c}`).join("\n")}

## 9. Homework & Extension
### Homework:
${plan.homeworkExtension.homework.map(h => `- ${h}`).join("\n")}
### Extension:
${plan.homeworkExtension.extension.map(e => `- ${e}`).join("\n")}

## 10. Reflection Guidance
### What Went Well:
${plan.reflectionQuestions.whatWentWell.map(w => `- ${w}`).join("\n")}
### Challenges:
${plan.reflectionQuestions.challenges.map(c => `- ${c}`).join("\n")}
### Next Time:
${plan.reflectionQuestions.nextTime.map(n => `- ${n}`).join("\n")}
    `.trim();

    return md;
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownString();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownString();
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Lesson_Plan_${plan.subject.replace(/\s+/g, '_')}_${plan.topic.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSaveJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Lesson_Plan_${plan.subject.replace(/\s+/g, '_')}_${plan.topic.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleOpenInNewTab = () => {
    try {
      const jsonStr = JSON.stringify(plan);
      const utf8Bytes = unescape(encodeURIComponent(jsonStr));
      const base64 = btoa(utf8Bytes);
      const url = new URL(window.location.href);
      url.hash = `plan=${base64}`;
      window.open(url.toString(), "_blank");
    } catch (e) {
      console.error("Failed to generate shareable URL for new tab:", e);
      window.open(window.location.href, "_blank");
    }
  };

  return (
    <div className="space-y-4">
      {/* Action header bar (Hidden during printing) */}
      <div className="flex flex-wrap justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-lg gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-700 font-mono">Workspace Ready</span>
          <span className="text-[10px] text-slate-400 font-normal">| Feel free to click text to edit inline</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenInNewTab}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-md cursor-pointer transition shadow-md"
            title="Open app in a new browser tab to bypass iframe limitations for a perfect print/PDF action"
          >
            <ExternalLink className="w-3.5 h-3.5 animate-pulse" />
            <span>Open in New Tab to Print/PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-semibold text-sky-700 py-1.5 px-3 rounded-md cursor-pointer transition shadow-2xs"
            title="Loads the browser print wizard to save as PDF or Print on paper"
          >
            <Printer className="w-3.5 h-3.5 text-sky-600" />
            <span>Print / PDF (A4)</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-xs font-semibold text-emerald-700 py-1.5 px-3 rounded-md cursor-pointer transition shadow-2xs"
            title="Download the whole lesson plan as a compatible .md file for MS Word, Google Docs or Obsidian"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download Markdown (.md)</span>
          </button>
          
          <button
            onClick={handleCopyMarkdown}
            className={`flex items-center gap-1.5 border text-xs font-medium py-1.5 px-3 rounded-md cursor-pointer transition ${
              copied 
                ? "bg-slate-100 border-slate-350 text-slate-800" 
                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
            title="Copy whole plan to clipboard as Markdown text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
                <span className="font-semibold text-emerald-700">Copied text!</span>
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5" />
                <span>Copy Clipboard</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveJson}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 py-1.5 px-3 rounded-md cursor-pointer transition"
            title="Download Plan file as raw JSON data"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onReset}
            className="bg-slate-150 hover:bg-slate-200 text-xs font-medium text-slate-600 py-1.5 px-2.5 rounded-md cursor-pointer transition border border-transparent"
          >
            Clear Sheet
          </button>
        </div>
      </div>

      {/* Helpful print/download tip for iframe preview */}
      <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-lg flex items-start gap-3 text-xs text-slate-700 print:hidden shadow-3xs leading-relaxed animate-in fade-in duration-300">
        <span className="text-amber-500 font-bold select-none text-base leading-none">💡</span>
        <div className="flex-1">
          <span className="font-semibold text-slate-805">How to Print or Download your Lesson Plan:</span>
          <ul className="list-disc ml-4 mt-1.5 space-y-1 text-[11px] text-slate-600">
            <li>
              <strong>Direct File Download:</strong> Click the green <strong className="text-emerald-750">"Download Markdown (.md)"</strong> button to save the entire lesson plan instantly as a rich text document. You can open and edit it in Word, Google Docs, or Obsidian anytime!
            </li>
            <li>
              <strong>Save as PDF or Print:</strong> Inside parent websites/previews, browsers block iframe print dialogues. Click the blue <strong className="text-sky-700">"Open in New Tab to Print/PDF"</strong> button above, then click <strong className="text-sky-700">"Print / PDF (A4)"</strong> to print or select "Save as PDF"!
            </li>
          </ul>
        </div>
      </div>

      {/* Structured Document Workspace (The core A4 physical sheet) */}
      <main id="printed-plan" className="bg-white border border-slate-200 shadow-lg rounded-xl p-8 md:p-12 print:p-6 print:py-4 max-w-4xl mx-auto space-y-8 print:space-y-4 relative overflow-hidden text-slate-800 transition duration-300">
        
        {/* Document Frame Corner Watermarks for high polish, disappears on printing */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none print:hidden"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-50 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none print:hidden"></div>

        {/* 1. Header Information (Mahmoud-inspired elegant details, simple & subtle) */}
        <header className="border-b border-slate-200 pb-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest leading-none">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{plan.subject ? `${plan.subject} Lesson Plan` : "Subject Lesson Plan"}</span>
              </div>
              
              <div className="group/topic relative">
                <input
                  type="text"
                  value={plan.topic}
                  onChange={(e) => handleMetaChange("topic", e.target.value)}
                  className="w-full text-2xl md:text-3xl font-bold tracking-tight text-slate-800 outline-none focus:bg-slate-50 rounded py-1 px-1 border border-transparent focus:border-slate-200 mt-1 leading-tight pr-10"
                  title="Click to edit Topic"
                />
                <button
                  onClick={() => {
                    setActiveRewrite({
                      text: plan.topic,
                      title: "Lesson Topic",
                      onApply: (newText) => handleMetaChange("topic", newText)
                    });
                    setRewriteInstruction("");
                    setRewritePreview("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/topic:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition"
                  title="Rewrite Topic"
                >
                  <Sparkles className="w-3.5 h-3.5 hover:text-yellow-500" />
                </button>
              </div>

              <div className="group/subtopic relative mt-1">
                <input
                  type="text"
                  value={plan.subTopic}
                  onChange={(e) => handleMetaChange("subTopic", e.target.value)}
                  className="w-full text-base text-slate-550 outline-none focus:bg-slate-50 rounded py-0.5 px-1 border border-transparent focus:border-slate-150 pr-10"
                  title="Click to edit Sub-Topic"
                />
                <button
                  onClick={() => {
                    setActiveRewrite({
                      text: plan.subTopic,
                      title: "Lesson Sub-Topic",
                      onApply: (newText) => handleMetaChange("subTopic", newText)
                    });
                    setRewriteInstruction("");
                    setRewritePreview("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/subtopic:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition"
                  title="Rewrite Sub-topic"
                >
                  <Sparkles className="w-3.5 h-3.5 hover:text-yellow-500" />
                </button>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end print:items-end">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Estimated Span</span>
              <input
                type="text"
                value={plan.duration}
                onChange={(e) => handleMetaChange("duration", e.target.value)}
                onBlur={() => handleDurationReconcile(plan.duration)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDurationReconcile(plan.duration);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className={`text-right text-base font-semibold outline-none focus:bg-slate-50 focus:text-left rounded py-0.5 px-1 border border-transparent focus:border-slate-150 w-44 ${isOverDuration ? "text-rose-600 bg-rose-50/50" : "text-slate-700"}`}
                title="Click to edit school period duration (e.g. 50 minutes). Activities will scale instantly!"
                placeholder="60 minutes"
              />
              {isOverDuration && (
                <span className="text-[10px] text-rose-500 font-bold font-mono whitespace-nowrap mt-0.5 animate-pulse">
                  ⚠️ Over by {overMinutes}m!
                </span>
              )}
            </div>
          </div>

          {/* Quick-Stats subtle details bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono uppercase">Subject Area</span>
              <input
                type="text"
                value={plan.subject}
                onChange={(e) => handleMetaChange("subject", e.target.value)}
                className="font-semibold text-slate-700 bg-transparent border-b border-transparent focus:border-slate-200 outline-none py-0.5 w-full focus:bg-slate-50 rounded px-1"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-mono uppercase">Year Group</span>
              <input
                type="text"
                value={plan.yearGroup}
                onChange={(e) => handleMetaChange("yearGroup", e.target.value)}
                className="font-semibold text-slate-700 bg-transparent border-b border-transparent focus:border-slate-200 outline-none py-0.5 w-full focus:bg-slate-50 rounded px-1"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-mono uppercase font-bold text-slate-500">Planned Date</span>
              <input
                type="date"
                value={plan.date || ""}
                onChange={(e) => handleMetaChange("date", e.target.value)}
                className="font-semibold text-slate-700 bg-transparent border-b border-transparent focus:border-slate-200 outline-none py-0.5 w-full focus:bg-slate-50 rounded px-1 cursor-pointer"
                title="Click to select planned lesson delivery date"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-mono uppercase">Timeline Sum</span>
              <span className={`font-semibold py-0.5 px-1 block ${isOverDuration ? "text-rose-600 font-bold animate-pulse" : totalActivityDuration > 100 ? "text-amber-600" : "text-emerald-600"}`}>
                {totalActivityDuration} mins {isOverDuration && "⚠️"}
              </span>
            </div>
          </div>
        </header>

        {/* 2. Double Column: Learning Objectives & Success Criteria */}
        <section className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-4 pt-2 print:pt-1">
          {/* Learning Objectives box */}
          <div className="p-5 print:p-3.5 rounded-lg border border-slate-150 relative bg-slate-50/50">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 select-none flex justify-between items-center">
              <span>1. Learning Objectives</span>
              <span className="text-[10px] bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-mono font-normal">Objectives</span>
            </h3>
            
            <div className="space-y-2.5">
              {plan.learningObjectives.map((obj, idx) => (
                <div key={idx} className="flex items-start gap-2.5 group/item">
                  <span className="text-slate-400 select-none font-bold pt-1 text-sm">•</span>
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => handleUpdateList("learningObjectives", idx, e.target.value)}
                    className="w-full text-slate-700 bg-transparent focus:bg-white leading-relaxed text-xs focus:ring-1 focus:ring-slate-300 py-1 px-1.5 rounded outline-none transition"
                    placeholder="Enter learning objective"
                  />
                  <button
                    onClick={() => {
                      setActiveRewrite({
                        text: obj,
                        title: "Learning Objective",
                        onApply: (newText) => handleUpdateList("learningObjectives", idx, newText)
                      });
                      setRewriteInstruction("");
                      setRewritePreview("");
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition mr-0.5"
                    title="Rewrite Objective"
                  >
                    <Sparkles className="w-3.5 h-3.5 hover:text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteList("learningObjectives", idx)}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer print:hidden transition"
                    title="Delete bullet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleAddList("learningObjectives")}
              className="mt-4 text-[10px] text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 cursor-pointer print:hidden border border-dashed border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded bg-white"
            >
              <Plus className="w-3 h-3" /> Add Objective Row
            </button>
          </div>

          {/* Success Criteria box */}
          <div className="p-5 print:p-3.5 rounded-lg border border-slate-150 relative bg-slate-50/50">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 select-none flex justify-between items-center">
              <span>2. Success Criteria</span>
              <span className="text-[10px] bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-mono font-normal">I Can...</span>
            </h3>
            
            <div className="space-y-2.5">
              {plan.successCriteria.map((crit, idx) => (
                <div key={idx} className="flex items-start gap-2.5 group/item">
                  <span className="text-slate-400 select-none font-bold pt-1 text-sm">•</span>
                  <input
                    type="text"
                    value={crit}
                    onChange={(e) => handleUpdateList("successCriteria", idx, e.target.value)}
                    className="w-full text-slate-700 bg-transparent focus:bg-white leading-relaxed text-xs focus:ring-1 focus:ring-slate-300 py-1 px-1.5 rounded outline-none transition"
                    placeholder="E.g. I can describe speed formulas..."
                  />
                  <button
                    onClick={() => {
                      setActiveRewrite({
                        text: crit,
                        title: "Success Criterion",
                        onApply: (newText) => handleUpdateList("successCriteria", idx, newText)
                      });
                      setRewriteInstruction("");
                      setRewritePreview("");
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition mr-0.5"
                    title="Rewrite Benchmark"
                  >
                    <Sparkles className="w-3.5 h-3.5 hover:text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteList("successCriteria", idx)}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer print:hidden transition"
                    title="Delete bullet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleAddList("successCriteria")}
              className="mt-4 text-[10px] text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 cursor-pointer print:hidden border border-dashed border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded bg-white"
            >
              <Plus className="w-3 h-3" /> Add Benchmark
            </button>
          </div>
        </section>

        {/* 3. Resources and Materials */}
        <section className="p-5 print:p-3.5 rounded-lg border border-slate-150 bg-slate-50/50">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 select-none flex justify-between items-center">
            <span>3. Resources & Materials</span>
            <span className="text-[10px] bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-mono font-normal">Materials</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-6 print:gap-x-4 gap-y-1.5 print:gap-y-0.5">
            {plan.resourcesAndMaterials.map((res, idx) => (
              <div key={idx} className="flex items-center gap-2 group/item">
                <span className="text-slate-400 select-none font-bold text-sm">•</span>
                <input
                  type="text"
                  value={res}
                  onChange={(e) => handleUpdateList("resourcesAndMaterials", idx, e.target.value)}
                  className="w-full text-slate-700 bg-transparent focus:bg-white text-xs focus:ring-1 focus:ring-slate-200 py-1 px-1.5 rounded outline-none transition"
                  placeholder="Enter lab resource or slide package"
                />
                <button
                  onClick={() => {
                    setActiveRewrite({
                      text: res,
                      title: "Material/Resource",
                      onApply: (newText) => handleUpdateList("resourcesAndMaterials", idx, newText)
                    });
                    setRewriteInstruction("");
                    setRewritePreview("");
                  }}
                  className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition mr-0.5"
                  title="Rewrite Resource"
                >
                  <Sparkles className="w-3 h-3 hover:text-yellow-500" />
                </button>
                <button
                  onClick={() => handleDeleteList("resourcesAndMaterials", idx)}
                  className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer print:hidden transition"
                  title="Delete Resource"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleAddList("resourcesAndMaterials")}
            className="mt-4 text-[10px] text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 cursor-pointer print:hidden border border-dashed border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded bg-white"
          >
            <Plus className="w-3 h-3" /> Add Material Entry
          </button>
        </section>

        {/* 4. Lesson Activities / Teaching Strategies Timeline (Calculated Sums) */}
        <section className="space-y-3">
          <div className="flex justify-between items-baseline select-none">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              4. Activities Timeline & teaching strategies
            </h3>
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] text-slate-450 font-mono font-medium">
                Calculated Lesson Time: <span className={`font-bold underline ${isOverDuration ? "text-rose-600 bg-rose-50 px-1 rounded animate-pulse" : ""}`}>{totalActivityDuration} mins</span>
              </span>
              {isOverDuration && (
                <span className="text-[10px] text-rose-600 font-bold animate-pulse mt-0.5">
                  ⚠️ Limit of {estimatedMinutes} mins exceeded!
                </span>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-2.5 font-medium border-r border-slate-200 w-1/4">Timeblock Name</th>
                  <th className="p-2.5 font-medium border-r border-slate-200 w-1/2">Teaching Strategy / Active Task</th>
                  <th className="p-2.5 font-medium border-r border-slate-200 text-center w-24">Duration</th>
                  <th className="p-2.5 font-medium text-center w-12 print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {plan.lessonActivities.map((act, idx) => (
                  <tr key={idx} className="group/row hover:bg-slate-50/40 transition">
                    <td className="p-1 border-r border-slate-150">
                      <input
                        type="text"
                        value={act.activity}
                        onChange={(e) => handleUpdateActivity(idx, "activity", e.target.value)}
                        className="w-full bg-transparent font-medium text-slate-700 py-1.5 px-2 rounded outline-none focus:bg-white focus:ring-1 focus:ring-slate-300 text-xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-150">
                      <input
                        type="text"
                        value={act.strategy}
                        onChange={(e) => handleUpdateActivity(idx, "strategy", e.target.value)}
                        className="w-full bg-transparent text-slate-600 py-1.5 px-2 rounded outline-none focus:bg-white focus:ring-1 focus:ring-slate-300 text-xs"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-150 text-center">
                      <input
                        type="number"
                        min="0"
                        value={act.duration}
                        onChange={(e) => handleUpdateActivity(idx, "duration", parseInt(e.target.value) || 0)}
                        className="w-16 bg-transparent text-center font-mono py-1 px-1.5 rounded outline-none focus:bg-white focus:ring-1 focus:ring-slate-300 text-xs"
                      />
                      <span className="text-[10px] text-slate-400 ml-1">m</span>
                    </td>
                    <td className="p-1 text-center print:hidden">
                      <button
                        onClick={() => {
                          setActiveRewrite({
                            text: act.strategy,
                            title: `Strategy: ${act.activity}`,
                            onApply: (newText) => handleUpdateActivity(idx, "strategy", newText)
                          });
                          setRewriteInstruction("");
                          setRewritePreview("");
                        }}
                        className="opacity-0 group-hover/row:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer transition inline-flex items-center mr-0.5"
                        title="Rewrite Activity Strategy"
                      >
                        <Sparkles className="w-3.5 h-3.5 hover:text-yellow-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(idx)}
                        className="opacity-0 group-hover/row:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer transition inline-flex items-center"
                        title="Delete rows element"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleAddActivity}
            className="text-[10px] text-slate-450 hover:text-slate-650 font-semibold flex items-center gap-1 cursor-pointer print:hidden border border-dashed border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded bg-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Toggle Interactive Timeline Block
          </button>
        </section>

        {/* Harvard Visible Thinking Routine Section (Fully Optional) */}
        <section className="space-y-3 pt-2">
          {!plan.thinkingRoutine ? (
            // Prompt helper if disabled (print hidden)
            <div className="print:hidden p-5 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg bg-slate-50/40 flex flex-col items-center justify-center text-center space-y-2.5 transition duration-150">
              <div className="bg-amber-50 text-amber-600 p-2 rounded-full">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-700">Add a Harvard Visible Thinking Routine Activity</p>
                <p className="text-[10px] text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Visible Thinking Routines encourage student observation, explanation, and deep synthesis. Select a stage of your lesson (starter, plenary, or exit ticket) and draft active inquiry prompts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleEnableThinkingRoutine}
                className="text-xs font-semibold text-slate-705 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 py-1.5 px-4 rounded-md cursor-pointer transition shadow-2xs"
              >
                + Integrate Optional Thinking Routine
              </button>
            </div>
          ) : (
            // Beautiful active routine container
            <div className="p-5 print:p-3.5 rounded-lg border border-amber-200 bg-amber-50/10 relative shadow-sm">
              {/* Header with visual label and print action controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-amber-250 pb-3 mb-4 select-none">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>5. Harvard Visible Thinking Routine (Optional)</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">
                    Lesson Stage: <span className="font-semibold text-slate-600 uppercase font-mono">{plan.thinkingRoutine.phase.replace("_", " ")}</span>
                  </span>
                </div>

                {/* Print-Hidden controls */}
                <div className="flex flex-wrap items-center gap-1.5 print:hidden">
                  {/* Preset Selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-400">Preset:</span>
                    <select
                      value={
                        plan.thinkingRoutine.title.includes("3-2-1") ? "321_bridge" :
                        plan.thinkingRoutine.title.includes("used to think") || plan.thinkingRoutine.title.includes("Used to Think") ? "used_to_think" :
                        plan.thinkingRoutine.title.includes("Puzzle") || plan.thinkingRoutine.title.includes("puzzle") ? "think_puzzle_explore" :
                        plan.thinkingRoutine.title.includes("Connect") || plan.thinkingRoutine.title.includes("connect") ? "connect_extend_challenge" :
                        plan.thinkingRoutine.title.includes("Custom") || plan.thinkingRoutine.title.includes("custom") || plan.thinkingRoutine.title.includes("My Custom") || plan.thinkingRoutine.title.includes("Custom Routine") ? "custom" :
                        "see_think_wonder"
                      }
                      onChange={(e) => handleApplyRoutinePreset(e.target.value)}
                      className="text-[10px] font-medium p-1 border border-slate-200 rounded bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-350"
                    >
                      <option value="see_think_wonder">See, Think, Wonder (Observant Hook)</option>
                      <option value="321_bridge">3-2-1 Bridge (Mental Bridge)</option>
                      <option value="used_to_think">I used to think... Now I think... (Synthesis)</option>
                      <option value="think_puzzle_explore">Think, Puzzle, Explore (Inquiry Map)</option>
                      <option value="connect_extend_challenge">Connect, Extend, Challenge (Expansion)</option>
                      <option value="custom">★ Custom Routine</option>
                    </select>
                  </div>

                  {/* Phase Selector */}
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-400">Stage:</span>
                    <select
                      value={plan.thinkingRoutine.phase}
                      onChange={(e) => handleUpdateRoutine("phase", e.target.value)}
                      className="text-[10px] font-medium p-1 border border-slate-200 rounded bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-350"
                    >
                      <option value="starter">Starter Activity</option>
                      <option value="plenary">Plenary Activity</option>
                      <option value="exit_ticket">Exit Ticket</option>
                    </select>
                  </div>

                  {/* Disable Button */}
                  <button
                    type="button"
                    onClick={handleDisableThinkingRoutine}
                    className="text-[10px] font-semibold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 py-1 px-2.5 rounded transition cursor-pointer"
                    title="Remove Thinking Routine from Plan"
                  >
                    Omit Routine
                  </button>
                </div>
              </div>

              {/* Title Input (Click to edit) */}
              <div className="group/rtitle relative max-w-sm">
                <input
                  type="text"
                  value={plan.thinkingRoutine.title}
                  onChange={(e) => handleUpdateRoutine("title", e.target.value)}
                  className="w-full text-sm font-bold text-slate-800 bg-transparent py-1 px-1.5 focus:bg-white rounded border border-transparent focus:border-slate-200 outline-none pr-8"
                  title="Routine Title - Click to change"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveRewrite({
                      text: plan.thinkingRoutine!.title,
                      title: "Routine Name",
                      onApply: (newText) => handleUpdateRoutine("title", newText)
                    });
                    setRewriteInstruction("");
                    setRewritePreview("");
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/rtitle:opacity-100 p-0.5 text-slate-400 hover:text-slate-650 cursor-pointer mt-0.5 print:hidden transition"
                  title="Rewrite with AI"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 hover:text-yellow-500" />
                </button>
              </div>

              {/* Description Input (Click to edit) */}
              <div className="group/rdesc relative mt-1.5">
                <textarea
                  rows={2}
                  value={plan.thinkingRoutine.description}
                  onChange={(e) => handleUpdateRoutine("description", e.target.value)}
                  className="w-full text-xs text-slate-500 bg-transparent py-1 px-1.5 focus:bg-white rounded border border-transparent focus:border-slate-200 outline-none resize-none pr-8 italic leading-relaxed"
                  title="Teacher execution instructions - Click to edit"
                  placeholder="Analyze an image, object, or live demonstration to trigger observant predictions..."
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveRewrite({
                      text: plan.thinkingRoutine!.description,
                      title: "Routine Description",
                      onApply: (newText) => handleUpdateRoutine("description", newText)
                    });
                    setRewriteInstruction("");
                    setRewritePreview("");
                  }}
                  className="absolute right-1 top-1.5 opacity-0 group-hover/rdesc:opacity-100 p-0.5 text-slate-400 hover:text-slate-650 cursor-pointer print:hidden transition"
                  title="Rewrite with AI"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 hover:text-yellow-500" />
                </button>
              </div>

              {/* Prompt Steps Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4 print:gap-2.5 mt-3 print:mt-1">
                {plan.thinkingRoutine.prompts.map((p, pIdx) => (
                  <div key={pIdx} className="bg-white border border-slate-150 p-3.5 rounded-lg shadow-2xs relative group/pt flex flex-col space-y-1.5 hover:border-slate-250 transition duration-150">
                    <span className="text-[9px] font-mono font-semibold text-slate-400 uppercase tracking-wider block">Prompt Step {pIdx + 1}:</span>
                    <textarea
                      rows={3}
                      value={p}
                      onChange={(e) => handleUpdateRoutinePrompt(pIdx, e.target.value)}
                      className="w-full bg-transparent text-slate-700 focus:bg-slate-50/50 outline-none text-xs leading-relaxed font-semibold transition resize-none p-1 rounded"
                      placeholder={`Enter prompt ${pIdx + 1}`}
                    />
                    <div className="flex justify-between items-center print:hidden pt-2 border-t border-slate-100 mt-auto opacity-0 group-hover/pt:opacity-100 transition duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRewrite({
                            text: p,
                            title: `Thinking Prompt ${pIdx + 1}`,
                            onApply: (newText) => handleUpdateRoutinePrompt(pIdx, newText)
                          });
                          setRewriteInstruction("");
                          setRewritePreview("");
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer transition"
                        title="Rewrite Prompt"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>AI Rewrite</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoutinePrompt(pIdx)}
                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer transition"
                        title="Delete prompt step"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Print-hidden prompts control buttons */}
              <div className="flex justify-start gap-2 mt-4 print:hidden">
                <button
                  type="button"
                  onClick={handleAddRoutinePrompt}
                  className="text-[10px] text-slate-500 hover:text-slate-700 font-semibold flex items-center gap-1 border border-dashed border-slate-200 hover:border-slate-350 bg-white py-1.5 px-3 rounded shadow-3xs cursor-pointer transition"
                >
                  <Plus className="w-3 h-3" /> Add Prompt Step
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRoutinePreset("see_think_wonder")}
                  className="text-[10px] text-slate-500 hover:text-slate-700 font-semibold py-1.5 px-3 border border-slate-200 bg-white rounded shadow-3xs cursor-pointer transition"
                >
                  Reset prompts
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 5. Detailed Assessments and Differentiation Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-4 pt-2 print:pt-1">
          {/* Formative / Summative Assessments */}
          <div className="p-5 print:p-3.5 rounded-lg border border-slate-150 bg-slate-50/50 space-y-4 print:space-y-1.5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest select-none flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span>5. Assessment of Learning</span>
              <span className="text-[10px] bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-mono font-normal">Checks</span>
            </h3>

            {/* Formative checks */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-450 uppercase block tracking-wider">Formative Measures:</span>
              {plan.assessment.formative.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 group/item">
                  <span className="text-slate-400 select-none font-bold pt-1 text-sm">•</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateAssessment("formative", idx, e.target.value)}
                    className="w-full text-slate-700 bg-transparent focus:bg-white text-xs focus:ring-1 focus:ring-slate-300 py-1 px-1.5 rounded outline-none transition"
                  />
                  <button
                    onClick={() => {
                      setActiveRewrite({
                        text: item,
                        title: "Formative Assessment",
                        onApply: (newText) => handleUpdateAssessment("formative", idx, newText)
                      });
                      setRewriteInstruction("");
                      setRewritePreview("");
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition mr-0.5"
                    title="Rewrite Formulation"
                  >
                    <Sparkles className="w-3 h-3 hover:text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteAssessment("formative", idx)}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer print:hidden transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddAssessment("formative")}
                className="text-[9px] text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 cursor-pointer print:hidden"
              >
                <Plus className="w-2.5 h-2.5" /> Add Formative Assessment
              </button>
            </div>

            {/* Summative checks */}
            <div className="space-y-2 pt-2 border-t border-slate-150">
              <span className="text-[10px] font-mono text-slate-450 uppercase block tracking-wider">Summative Measures:</span>
              {plan.assessment.summative.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 group/item">
                  <span className="text-slate-400 select-none font-bold pt-1 text-sm">•</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateAssessment("summative", idx, e.target.value)}
                    className="w-full text-slate-700 bg-transparent focus:bg-white text-xs focus:ring-1 focus:ring-slate-300 py-1 px-1.5 rounded outline-none transition"
                  />
                  <button
                    onClick={() => {
                      setActiveRewrite({
                        text: item,
                        title: "Summative Assessment",
                        onApply: (newText) => handleUpdateAssessment("summative", idx, newText)
                      });
                      setRewriteInstruction("");
                      setRewritePreview("");
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition mr-0.5"
                    title="Rewrite Assessment"
                  >
                    <Sparkles className="w-3 h-3 hover:text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteAssessment("summative", idx)}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer print:hidden transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddAssessment("summative")}
                className="text-[9px] text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 cursor-pointer print:hidden"
              >
                <Plus className="w-2.5 h-2.5" /> Add Summative Assessment
              </button>
            </div>
          </div>

          {/* Differentiation / Inclusion */}
          <div className="p-5 print:p-3.5 rounded-lg border border-slate-150 bg-slate-50/50">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 select-none flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span>6. Differentiation & Inclusion</span>
              <span className="text-[10px] bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-mono font-normal">Support</span>
            </h3>

            <div className="space-y-2.5">
              {plan.differentiationInclusion.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 group/item">
                  <span className="text-slate-400 select-none font-bold pt-1 text-sm">•</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateList("differentiationInclusion", idx, e.target.value)}
                    className="w-full text-slate-700 bg-transparent focus:bg-white leading-relaxed text-xs focus:ring-1 focus:ring-slate-300 py-1 px-1.5 rounded outline-none transition"
                  />
                  <button
                    onClick={() => {
                      setActiveRewrite({
                        text: item,
                        title: "Differentiation Parameter",
                        onApply: (newText) => handleUpdateList("differentiationInclusion", idx, newText)
                      });
                      setRewriteInstruction("");
                      setRewritePreview("");
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition mr-0.5"
                    title="Rewrite Differentiation"
                  >
                    <Sparkles className="w-3.5 h-3.5 hover:text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteList("differentiationInclusion", idx)}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer print:hidden transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleAddList("differentiationInclusion")}
              className="mt-4 text-[10px] text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 cursor-pointer print:hidden border border-dashed border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded bg-white"
            >
              <Plus className="w-3 h-3" /> Add Support/Stretch Row
            </button>
          </div>
        </section>

        {/* 6. Cross-Curricular Links & Homework/Extensions Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-4 pt-2 print:pt-1">
          {/* Cross Curricular Links */}
          <div className="p-5 print:p-3.5 rounded-lg border border-slate-150 bg-slate-50/50">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 select-none flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span>7. Cross-Curricular Links</span>
              <span className="text-[10px] bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-mono font-normal">Links</span>
            </h3>

            <div className="space-y-2.5">
              {plan.crossCurricularLinks.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 group/item">
                  <span className="text-slate-400 select-none font-bold pt-1 text-sm">•</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateList("crossCurricularLinks", idx, e.target.value)}
                    className="w-full text-slate-700 bg-transparent focus:bg-white leading-relaxed text-xs focus:ring-1 focus:ring-slate-300 py-1 px-1.5 rounded outline-none transition"
                  />
                  <button
                    onClick={() => {
                      setActiveRewrite({
                        text: item,
                        title: "Cross-Curricular Area",
                        onApply: (newText) => handleUpdateList("crossCurricularLinks", idx, newText)
                      });
                      setRewriteInstruction("");
                      setRewritePreview("");
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition mr-0.5"
                    title="Rewrite Links"
                  >
                    <Sparkles className="w-3.5 h-3.5 hover:text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteList("crossCurricularLinks", idx)}
                    className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer print:hidden transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleAddList("crossCurricularLinks")}
              className="mt-4 text-[10px] text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 cursor-pointer print:hidden border border-dashed border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded bg-white"
            >
              <Plus className="w-3 h-3" /> Add Link Row
            </button>
          </div>

          {/* Homework and Extension block */}
          <div className="p-5 print:p-3.5 rounded-lg border border-slate-150 bg-slate-50/50 space-y-4 print:space-y-1.5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest select-none flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span>8. Homework / Extension</span>
              <span className="text-[10px] bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-mono font-normal">Next</span>
            </h3>

            {/* Homework listed */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-450 uppercase block tracking-wider">Assigned Homework:</span>
              {plan.homeworkExtension.homework.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 group/item">
                  <span className="text-slate-400 select-none font-bold pt-1 text-sm">•</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateHomework("homework", idx, e.target.value)}
                    className="w-full text-slate-700 bg-transparent focus:bg-white text-xs focus:ring-1 focus:ring-slate-300 py-1 px-1.5 rounded outline-none transition"
                  />
                  <button
                    onClick={() => {
                      setActiveRewrite({
                        text: item,
                        title: "Homework Task",
                        onApply: (newText) => handleUpdateHomework("homework", idx, newText)
                      });
                      setRewriteInstruction("");
                      setRewritePreview("");
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition mr-0.5"
                    title="Rewrite Homework"
                  >
                    <Sparkles className="w-3 h-3 hover:text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteHomework("homework", idx)}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer print:hidden transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddHomework("homework")}
                className="text-[9px] text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 cursor-pointer print:hidden"
              >
                <Plus className="w-2.5 h-2.5" /> Add Homework
              </button>
            </div>

            {/* Extension Tasks */}
            <div className="space-y-2 pt-2 border-t border-slate-150">
              <span className="text-[10px] font-mono text-slate-450 uppercase block tracking-wider">Independent Extension Tasks:</span>
              {plan.homeworkExtension.extension.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 group/item">
                  <span className="text-slate-400 select-none font-bold pt-1 text-sm">•</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleUpdateHomework("extension", idx, e.target.value)}
                    className="w-full text-slate-700 bg-transparent focus:bg-white text-xs focus:ring-1 focus:ring-slate-300 py-1 px-1.5 rounded outline-none transition"
                  />
                  <button
                    onClick={() => {
                      setActiveRewrite({
                        text: item,
                        title: "Extension Task",
                        onApply: (newText) => handleUpdateHomework("extension", idx, newText)
                      });
                      setRewriteInstruction("");
                      setRewritePreview("");
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition mr-0.5"
                    title="Rewrite Extension"
                  >
                    <Sparkles className="w-3 h-3 hover:text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteHomework("extension", idx)}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer print:hidden transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddHomework("extension")}
                className="text-[9px] text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 cursor-pointer print:hidden"
              >
                <Plus className="w-2.5 h-2.5" /> Add Extension Task
              </button>
            </div>
          </div>
        </section>

        {/* 7. Post-Lesson Reflection guidance cards (Teachers can fill details here after delivery!) */}
        <section className="p-5 print:p-3.5 rounded-lg border border-slate-150 bg-slate-50/50 space-y-4 print:space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest select-none flex justify-between items-center border-b border-slate-200/60 pb-2 mb-1 print:mb-0">
            <span>9. Reflection Log & Guidelines</span>
            <span className="text-[10px] bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-mono font-normal">After Lesson</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-6 print:gap-3.5">
            
            {/* What Went Well */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 font-mono uppercase block tracking-wider">What Went Well?</span>
              {plan.reflectionQuestions.whatWentWell.map((item, idx) => (
                <div key={idx} className="flex items-start gap-1 group/item">
                  <span className="text-slate-400 pt-1 select-none font-bold text-xs">•</span>
                  <textarea
                    rows={2}
                    value={item}
                    onChange={(e) => handleUpdateReflection("whatWentWell", idx, e.target.value)}
                    className="w-full leading-relaxed text-slate-700 bg-transparent focus:bg-white text-xs focus:ring-1 focus:ring-slate-300 p-1 rounded outline-none transition resize-none"
                  />
                  <button
                    onClick={() => {
                      setActiveRewrite({
                        text: item,
                        title: "Reflect: What Went Well",
                        onApply: (newText) => handleUpdateReflection("whatWentWell", idx, newText)
                      });
                      setRewriteInstruction("");
                      setRewritePreview("");
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition mr-0.5"
                    title="Rewrite Prompt"
                  >
                    <Sparkles className="w-3 h-3 hover:text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteReflection("whatWentWell", idx)}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer print:hidden transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddReflection("whatWentWell")}
                className="text-[9px] text-slate-450 hover:text-slate-650 font-semibold flex items-center gap-1 cursor-pointer print:hidden"
              >
                <Plus className="w-2.5 h-2.5" /> Log positive note
              </button>
            </div>

            {/* Challenges Encountered */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 font-mono uppercase block tracking-wider">Challenges faced?</span>
              {plan.reflectionQuestions.challenges.map((item, idx) => (
                <div key={idx} className="flex items-start gap-1 group/item">
                  <span className="text-slate-400 pt-1 select-none font-bold text-xs">•</span>
                  <textarea
                    rows={2}
                    value={item}
                    onChange={(e) => handleUpdateReflection("challenges", idx, e.target.value)}
                    className="w-full leading-relaxed text-slate-600 bg-transparent focus:bg-white text-xs focus:ring-1 focus:ring-slate-300 p-1 rounded outline-none transition resize-none"
                  />
                  <button
                    onClick={() => {
                      setActiveRewrite({
                        text: item,
                        title: "Reflect: Challenge",
                        onApply: (newText) => handleUpdateReflection("challenges", idx, newText)
                      });
                      setRewriteInstruction("");
                      setRewritePreview("");
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition mr-0.5"
                    title="Rewrite Challenge"
                  >
                    <Sparkles className="w-3 h-3 hover:text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteReflection("challenges", idx)}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer print:hidden transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddReflection("challenges")}
                className="text-[9px] text-slate-450 hover:text-slate-650 font-semibold flex items-center gap-1 cursor-pointer print:hidden"
              >
                <Plus className="w-2.5 h-2.5" /> Log difficulty
              </button>
            </div>

            {/* Next Time Adjustments */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 font-mono uppercase block tracking-wider">What to do differently?</span>
              {plan.reflectionQuestions.nextTime.map((item, idx) => (
                <div key={idx} className="flex items-start gap-1 group/item">
                  <span className="text-slate-400 pt-1 select-none font-bold text-xs">•</span>
                  <textarea
                    rows={2}
                    value={item}
                    onChange={(e) => handleUpdateReflection("nextTime", idx, e.target.value)}
                    className="w-full leading-relaxed text-slate-650 bg-transparent focus:bg-white text-xs focus:ring-1 focus:ring-slate-300 p-1 rounded outline-none transition resize-none"
                  />
                  <button
                    onClick={() => {
                      setActiveRewrite({
                        text: item,
                        title: "Reflect: Next Time Change",
                        onApply: (newText) => handleUpdateReflection("nextTime", idx, newText)
                      });
                      setRewriteInstruction("");
                      setRewritePreview("");
                    }}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 rounded cursor-pointer print:hidden transition mr-0.5"
                    title="Rewrite Strategy Improvement"
                  >
                    <Sparkles className="w-3 h-3 hover:text-yellow-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteReflection("nextTime", idx)}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer print:hidden transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddReflection("nextTime")}
                className="text-[9px] text-slate-450 hover:text-slate-650 font-semibold flex items-center gap-1 cursor-pointer print:hidden"
              >
                <Plus className="w-2.5 h-2.5" /> Log modification plan
              </button>
            </div>

          </div>
        </section>

        {/* Footer note matching the template concept slightly but very subtle */}
        <footer className="text-center pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-mono select-none">
          <span>EVERY CLASSROOM DELIVERS TOMORROW'S FUTURE — PLAN ACCURATELY, ENGAGE WELL, INSPIRE OFTEN.</span>
        </footer>

      </main>

      {/* 8. AI Rewrite Dialog Modal */}
      {activeRewrite && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 print:hidden">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-slate-800">Rewrite: {activeRewrite.title}</span>
              </h3>
              <button 
                onClick={() => {
                  setActiveRewrite(null);
                  setRewriteInstruction("");
                  setRewritePreview("");
                  setRewriteError(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Original Content */}
              <div>
                <span className="block font-mono text-[10px] uppercase text-slate-450 mb-1">Original Text:</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-600 leading-relaxed italic">
                  "{activeRewrite.text || "(empty)"}"
                </div>
              </div>

              {/* Suggestions Presets */}
              <div>
                <span className="block font-mono text-[10px] uppercase text-slate-450 mb-1.5">Preset Adjustments:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "🪄 Simple & Shorten", prompt: "Make it significantly shorter, simpler, and very easy to read" },
                    { label: "🎯 Measurable (Bloom's)", prompt: "Phrase using measurable learning actions (e.g. analyze, evaluate, model) following Bloom's taxonomy" },
                    { label: "🤝 Interactive element", prompt: "Incorporate active learning, student discussion, or high interactive participation" },
                    { label: "💡 Practical application", prompt: "Contextualize using a concrete, real-world practical example or experiment" },
                    { label: "🧠 Add Stretch Challenge", prompt: "Add additional depth, extensions, scaling difficulty, or stretch objectives for early-finishers" },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRewriteInstruction(preset.prompt)}
                      className="text-[10px] font-medium py-1 px-2 border border-slate-200 hover:bg-slate-50 rounded-md cursor-pointer text-slate-600 transition active:bg-slate-100"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action/Custom Instruction */}
              <div>
                <span className="block font-mono text-[10px] uppercase text-slate-450 mb-1">Custom instructions / Topic target:</span>
                <textarea
                  rows={2}
                  value={rewriteInstruction}
                  onChange={(e) => setRewriteInstruction(e.target.value)}
                  placeholder="e.g. Focus on collision particle speeds, make it punchy, add group safety elements..."
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-150 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition"
                />
              </div>

              {/* Error state */}
              {rewriteError && (
                <div className="p-2.5 bg-rose-50 border border-rose-150 text-rose-800 rounded text-[11px] leading-tight font-mono">
                  {rewriteError}
                </div>
              )}

              {/* Action Button to generate */}
              <button
                type="button"
                onClick={async () => {
                  setIsRewriting(true);
                  setRewriteError(null);
                  try {
                    const response = await fetch("/api/rewrite-section", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        text: activeRewrite.text,
                        instruction: rewriteInstruction
                      })
                    });
                    const data = await response.json();
                    if (!response.ok) {
                      throw new Error(data.error || "Server failed to rewrite.");
                    }
                    setRewritePreview(data.rewrittenText);
                  } catch (e: any) {
                    console.error(e);
                    setRewriteError(e.message || "Rewrite request connection timed out. Please try again.");
                  } finally {
                    setIsRewriting(false);
                  }
                }}
                disabled={isRewriting}
                className="w-full font-medium py-2 px-3 bg-slate-800 text-white rounded-md hover:bg-slate-750 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRewriting ? (
                  <>
                    <span className="animate-spin inline-block h-3 w-3 border-2 border-white/30 border-t-white rounded-full"></span>
                    <span>AI is formulating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generate AI Refinement</span>
                  </>
                )}
              </button>

              {/* Preview text */}
              {rewritePreview && (
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-1">
                  <span className="block font-mono text-[10px] uppercase text-slate-450">AI Proposed Version (Click text to fine-tune):</span>
                  <textarea
                    rows={3}
                    value={rewritePreview}
                    onChange={(e) => setRewritePreview(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 bg-slate-50 rounded-md focus:bg-white focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition text-slate-750 font-medium leading-relaxed"
                  />
                  
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRewritePreview("");
                        setRewriteError(null);
                      }}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 py-1 px-2.5 rounded hover:bg-slate-100 cursor-pointer transition border border-transparent"
                    >
                      Discard Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        activeRewrite.onApply(rewritePreview);
                        setActiveRewrite(null);
                        setRewriteInstruction("");
                        setRewritePreview("");
                        setRewriteError(null);
                      }}
                      className="text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-700 py-1 px-3.5 rounded shadow-sm cursor-pointer transition border border-transparent"
                    >
                      Apply & Replace Original
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
