import React, { useState, useRef, useEffect } from "react";
import { LessonPlan } from "./types";
import { defaultLesson } from "./defaultLesson";
import InputForm from "./components/InputForm";
import LessonDocument from "./components/LessonDocument";
import { 
  School, 
  Sparkles, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Upload, 
  HelpCircle,
  BookOpen,
  ExternalLink
} from "lucide-react";

export default function App() {
  const [plan, setPlan] = useState<LessonPlan>(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#plan=")) {
        const base64 = hash.substring(6);
        const jsonStr = decodeURIComponent(escape(atob(base64)));
        const parsed = JSON.parse(jsonStr);
        if (parsed.subject && parsed.topic && Array.isArray(parsed.learningObjectives)) {
          // Clear hash/replace state silently for clean URL, but let it boot with this plan
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load saved lesson plan from URL hash:", e);
    }

    try {
      const saved = localStorage.getItem("lesson_planner_plan");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Quick structural type-safety check
        if (parsed.subject && parsed.topic && Array.isArray(parsed.learningObjectives)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load saved lesson plan from localStorage:", e);
    }
    return defaultLesson;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("lesson_planner_plan", JSON.stringify(plan));
    } catch (e) {
      console.error("Failed to save lesson plan to localStorage:", e);
    }
  }, [plan]);

  // Generate new lesson plan using server proxy API
  const handleGeneratePlan = async (criteria: {
    subject: string;
    yearGroup: string;
    topic: string;
    subTopic: string;
    objectives: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-lesson-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(criteria),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate lesson plan due to a server error.");
      }

      setPlan(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while generating the lesson plan. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset work space to empty parameters
  const handleResetWorkspace = () => {
    setPlan({
      subject: "Subject Name",
      yearGroup: "Year Group",
      topic: "Topic Title",
      subTopic: "Subtopic Focus Area",
      duration: "60 minutes",
      date: new Date().toISOString().split('T')[0],
      learningObjectives: [""],
      successCriteria: [""],
      resourcesAndMaterials: [""],
      lessonActivities: [
        {
          activity: "Intro / Engagement",
          strategy: "Classroom explanation or warm-up activity",
          duration: 10
        }
      ],
      assessment: {
        formative: [""],
        summative: [""]
      },
      differentiationInclusion: [""],
      crossCurricularLinks: [""],
      homeworkExtension: {
        homework: [""],
        extension: [""]
      },
      reflectionQuestions: {
        whatWentWell: [""],
        challenges: [""],
        nextTime: [""]
      }
    });
    setError(null);
  };

  // Import existing JSON lesson plan
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        // Quick structural type-safety check
        if (parsed.subject && parsed.topic && Array.isArray(parsed.learningObjectives)) {
          setPlan(parsed);
          setError(null);
        } else {
          throw new Error("Invalid lesson plan file structure.");
        }
      } catch (err) {
        setError("Could not parse file. Please ensure it is a valid Lesson Planner JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = "";
  };

  const handleLoadSample = () => {
    setPlan(defaultLesson);
    setError(null);
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased selection:bg-slate-200">
      
      {/* Page Header (Disappears on Print) */}
      <nav id="top-nav" className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 pr-6 sticky top-0 z-50 print:hidden shadow-sm shadow-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 text-white p-2 rounded-lg shadow-sm">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-md font-bold text-slate-800 tracking-tight flex items-center gap-1.5 leading-none">
                Lesson Planner
              </h1>
              <span className="text-[10px] text-slate-400 font-medium font-mono block mt-1">School Coordinator Suite</span>
            </div>
          </div>

          {/* Quick utility triggers */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenInNewTab}
              className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 py-1.5 px-3.5 rounded-md cursor-pointer transition flex items-center gap-1.5 border border-sky-200 shadow-2xs"
              title="Opens this app in a separate browser tab to bypass iframe sandbox restrictions and enable full print / PDF tools"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-600 shrink-0 animate-pulse" />
              <span>Open in New Tab (For PDF/Print)</span>
            </button>

            <button
              onClick={handleLoadSample}
              disabled={isLoading}
              className="text-xs font-semibold text-slate-650 bg-slate-100 hover:bg-slate-150 py-1.5 px-3.5 rounded-md cursor-pointer transition flex items-center gap-1.5 border border-transparent disabled:opacity-55"
              title="Restores default template sample"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Load Chemistry Example</span>
            </button>

            <button
              onClick={handleImportClick}
              disabled={isLoading}
              className="text-xs font-semibold text-slate-650 bg-slate-100 hover:bg-slate-150 py-1.5 px-3.5 rounded-md cursor-pointer transition flex items-center gap-1.5 border border-transparent disabled:opacity-55"
              title="Restore work from a downloaded .json plan"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Plan JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </nav>

      {/* Main Body */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        
        {/* API Error Notification banners */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-150 text-rose-800 rounded-lg flex items-start gap-3 relative shadow-sm max-w-4xl mx-auto print:hidden">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-xs font-semibold">Could not complete request</p>
              <p className="text-xs text-rose-700/90 leading-relaxed font-mono">{error}</p>
              <p className="text-[10px] text-slate-500 italic mt-1 font-sans">
                Tip: If you saw a Key missing error, you can add your custom key in the <strong>Settings &gt; Secrets</strong> tab of Google AI Studio.
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-600 transition p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Workspace Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: parameters setup form */}
          <aside className="lg:col-span-4 print:hidden sticky top-20 z-10 space-y-4">
            <InputForm 
              onGenerate={handleGeneratePlan} 
              isLoading={isLoading} 
            />

            {/* Quick Helper Tips */}
            <div className="bg-slate-100 rounded-lg border border-slate-200.5 p-4 text-xs space-y-2 text-slate-500.5 select-none leading-relaxed">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                Planning Instructions
              </p>
              <ol className="list-decimal pl-4.5 space-y-1.5 text-slate-550">
                <li>Load our loaded <strong>Chemistry template</strong> to preview immediate subtle styling.</li>
                <li>Write down your custom subject, topic guidelines, and specification objectives.</li>
                <li>Hit <strong>Generate Plan</strong> to draft curriculum models.</li>
                <li>Directly click any text box on the document sheet to update, append, or discard rows.</li>
                <li>Finally, export as <strong>Print / PDF</strong> to save structured school cards!</li>
              </ol>
            </div>
          </aside>

          {/* Right panel: Active editable sheet document */}
          <section className="lg:col-span-8 space-y-6">
            <LessonDocument 
              plan={plan} 
              onUpdate={setPlan} 
              onReset={handleResetWorkspace}
              isLoading={isLoading}
            />
          </section>

        </div>
      </div>
    </div>
  );
}
