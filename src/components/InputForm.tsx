import React, { useState } from "react";
import { Sparkles, Loader2, HelpCircle } from "lucide-react";

interface InputFormProps {
  onGenerate: (data: {
    subject: string;
    yearGroup: string;
    topic: string;
    subTopic: string;
    objectives: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export default function InputForm({ onGenerate, isLoading }: InputFormProps) {
  const [subject, setSubject] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [topic, setTopic] = useState("");
  const [subTopic, setSubTopic] = useState("");
  const [objectives, setObjectives] = useState("");

  const [loadingStep, setLoadingStep] = useState(0);

  // Progressive updates on generation steps
  React.useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }
    const steps = [
      "Analyzing subject parameters...",
      "Drafting action-oriented objectives...",
      "Creating engaging classroom activities...",
      "Structuring assessments and differentiation criteria...",
      "Polishing structure and success markers..."
    ];
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setLoadingStep(currentStep);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isLoading]);

  const loadingMessages = [
    "Analyzing subject parameters...",
    "Drafting action-oriented learning objectives...",
    "Structuring engaging class activities...",
    "Creating assessment and differentiation criteria...",
    "Polishing the final layout..."
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !yearGroup || !topic || !subTopic) return;
    onGenerate({ subject, yearGroup, topic, subTopic, objectives });
  };

  const handleApplyPreset = (preset: {
    subject: string;
    yearGroup: string;
    topic: string;
    subTopic: string;
    objectives: string;
  }) => {
    setSubject(preset.subject);
    setYearGroup(preset.yearGroup);
    setTopic(preset.topic);
    setSubTopic(preset.subTopic);
    setObjectives(preset.objectives);
  };

  const presets = [
    {
      label: "Maths - Fractions",
      subject: "Mathematics",
      yearGroup: "Year 7",
      topic: "Fractions",
      subTopic: "Adding and subtracting fractions with different denominators",
      objectives: "Aligned to Key Stage 3. Focus on finding common denominators and converting mixed numbers."
    },
    {
      label: "English - Metaphors",
      subject: "English Literature",
      yearGroup: "Year 9",
      topic: "Creative Writing",
      subTopic: "Using metaphors and similes for sensory descriptions",
      objectives: "Develop sensory imagery in creative narrative pieces. Focus on avoiding clichés."
    },
    {
      label: "Physics - Electricity",
      subject: "Physics",
      yearGroup: "Year 11",
      topic: "Electricity",
      subTopic: "Ohm's Law, voltage, current and resistance in series circuits",
      objectives: "Understand proportional V=IR relationship. Practical measurement using GCSE lab kit."
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 tracking-tight flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-500" />
          Plan Parameters
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Specify your school criteria to draft a custom lesson plan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Subject <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. History"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Year Group <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Year 8"
              value={yearGroup}
              onChange={(e) => setYearGroup(e.target.value)}
              className="w-full text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Topic <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. World War I"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Sub-topic <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Causes of the conflict and Alliance Systems"
            value={subTopic}
            onChange={(e) => setSubTopic(e.target.value)}
            className="w-full text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition"
            disabled={isLoading}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-slate-600">
              Optional Elements <span className="text-slate-400 font-normal">(Objectives / Spec guidelines)</span>
            </label>
            <div className="group relative">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-slate-600 transition" />
              <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-64 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg pointer-events-none z-20 leading-relaxed font-normal">
                Paste specific national curriculum standards, exam codes, or custom themes you want integrated.
              </div>
            </div>
          </div>
          <textarea
            rows={3}
            placeholder="e.g. Must include references to alliances, Triple Entente, and specific curriculum codes..."
            value={objectives}
            onChange={(e) => setObjectives(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition resize-none leading-relaxed"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !subject || !yearGroup || !topic || !subTopic}
          className={`w-full text-sm font-medium py-2.5 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 border ${
            isLoading
              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              : "bg-slate-800 text-white border-transparent hover:bg-slate-750 active:bg-slate-900 cursor-pointer shadow-sm shadow-slate-100"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              <span>Generating Plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-350" />
              <span>Generate Lesson Plan</span>
            </>
          )}
        </button>
      </form>

      {/* Loading Steps feedback when actively waiting */}
      {isLoading && (
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-150 animate-pulse">
          <p className="text-xs font-medium text-slate-700 flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
            </span>
            Active task:
          </p>
          <p className="text-xs text-slate-500 italic mt-1 font-mono">
            {loadingMessages[loadingStep]}
          </p>
        </div>
      )}

      {/* Quick templates presets to auto fill */}
      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-xs font-semibold text-slate-500 tracking-tight mb-2">
          Quick Subject Presets
        </h3>
        <div className="flex flex-col gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              disabled={isLoading}
              className="text-left text-xs p-2.5 rounded-md border border-slate-150 hover:bg-slate-50 transition font-medium text-slate-700 active:bg-slate-100 flex justify-between items-center disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>{preset.label}</span>
              <span className="text-[10px] text-slate-400 font-normal">Apply Preset</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
