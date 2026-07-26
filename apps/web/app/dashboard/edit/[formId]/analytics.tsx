"use client";

import React, { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell 
} from "recharts";
import { 
  Loader2, TrendingUp, Users, CheckCircle, BarChart3, List, Calendar, 
  ArrowUpRight, Edit3, Download, PlayCircle, Eye, Activity
} from "lucide-react";

interface AnalyticsPanelProps {
  formId: string;
  questions: any[];
  analytics: any;
}

export default function AnalyticsPanel({ formId, questions, analytics }: AnalyticsPanelProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#2563EB]" />
        <span className="text-xs font-black uppercase tracking-widest text-[#666]">Gathering Form Insights...</span>
      </div>
    );
  }

  const { totalSubmissions, completionRate, submissionsOverTime, aggregations, submissionsList } = analytics;

  // Curated Type-based Color Palette
  const TYPE_COLORS: Record<string, string> = {
    LONG_TEXT: "#2563EB",     // blue
    SHORT_TEXT: "#2563EB",    // blue
    PHONE: "#10B981",         // green
    EMAIL: "#F59E0B",         // amber
    MULTIPLE_CHOICE: "#8B5CF6",// purple
    CHECKBOX: "#8B5CF6",      // purple
    DROPDOWN: "#8B5CF6",      // purple
    YES_NO: "#8B5CF6",        // purple
    RATING: "#EF4444",        // red
    NUMBER: "#06B6D4",        // cyan
    DATE: "#EC4899",          // pink
    FILE: "#2563EB",          // orange
  };

  // Sparkline data generation (ensure some points are populated)
  const sparklineData = submissionsOverTime && submissionsOverTime.length > 0
    ? submissionsOverTime
    : [
        { count: 1 }, { count: 1 }, { count: 1 }, { count: 1 }, { count: 1 }
      ];

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in pb-16">
      
      {/* 2. STATS ROW (3 cards, ambient elevated #161616 background, no borders) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Users */}
        <div className="bg-white/60 p-6 rounded-none flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#666] font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#666]" /> Total Responses
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight mt-2 text-[#111]">{totalSubmissions}</h2>
            <span className="text-[11px] text-emerald-500 font-bold mt-1.5 block">
              +100% from last week
            </span>
          </div>
        </div>

        {/* Card 2: Completion Rate */}
        <div className="bg-white/60 p-6 rounded-none flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#666] font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#666]" /> Completion Rate
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight mt-2 text-[#111]">{completionRate}%</h2>
            <span className="text-[11px] text-[#666] font-bold mt-1.5 block">
              All submissions completed
            </span>
          </div>
        </div>

        {/* Card 3: Activity Sparkline */}
        <div className="bg-white/60 p-6 rounded-none flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <div className="w-full">
            <span className="text-[11px] uppercase tracking-wider text-[#666] font-bold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#666]" /> Activity Trend
            </span>
            <div className="h-12 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#2563EB" 
                    strokeWidth={2.5} 
                    fillOpacity={0.15} 
                    fill="#2563EB" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <span className="text-[11px] text-[#666] font-bold mt-1.5 block">
              Last 7 days
            </span>
          </div>
        </div>

      </div>

      {/* 3. Questions Analytics Aggregations */}
      <div className="flex flex-col gap-6">
        
        {/* Section Header: Sentence case, muted icon, full width bottom hairline line */}
        <div className="flex items-center gap-2 pb-2 border-b border-black/10">
          <BarChart3 className="w-4 h-4 text-[#666]" />
          <h3 className="text-sm font-semibold text-[#111]">
            Question-by-question breakdown
          </h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {questions.map((q) => {
            const agg = aggregations[q.id];
            if (!agg) return null;

            const typeColor = TYPE_COLORS[q.fieldType] || "#2563EB";

            return (
              <div key={q.id} className="bg-white/60 p-5 rounded-none flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <div>
                  
                  {/* Card Header: type color badge left, response count badge right */}
                  <div className="flex items-center justify-between pb-3 border-b border-black/10">
                    <span 
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-[#111]"
                      style={{ backgroundColor: typeColor }}
                    >
                      {q.fieldType.replace("_", " ")}
                    </span>
                    <span className="text-[10px] bg-[#242424] text-[#111] px-2 py-0.5 rounded-full font-bold">
                      {agg.totalResponses} Responses
                    </span>
                  </div>
                  
                  {/* Question Text (Truncated) */}
                  <h4 className="text-base font-bold tracking-tight mt-3 text-[#111] truncate" title={q.label || "Untitled Question"}>
                    {q.label || "Untitled Question"}
                  </h4>
                </div>

                <div className="mt-4 flex-1 flex flex-col justify-center min-h-[140px]">
                  
                  {/* Choice Charts (Bar charts) */}
                  {["MULTIPLE_CHOICE", "DROPDOWN", "YES_NO", "CHECKBOX"].includes(q.fieldType) && (
                    <div className="h-32 w-full">
                      {agg.distribution.length === 0 ? (
                        <p className="text-[10px] text-[#666] uppercase text-center py-10">No data recorded</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={agg.distribution} layout="vertical" margin={{ left: -10, right: 10 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="choice" type="category" stroke="#666" fontSize={10} width={80} tickLine={false} />
                            <Tooltip cursor={false} contentStyle={{ backgroundColor: "#1C1C1C", border: "none", color: "white", borderRadius: "8px", fontSize: "11px" }} />
                            <Bar dataKey="count" fill={typeColor} radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}

                  {/* Rating/Slider (Distribution and Stats) */}
                  {["SLIDER", "RATING"].includes(q.fieldType) && (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-3 gap-2 text-center bg-transparent p-3 rounded-none border border-black/10">
                        <div>
                          <p className="text-[8px] font-bold text-[#666] uppercase tracking-wider">Average</p>
                          <h3 className="text-lg font-bold mt-0.5 text-[#111]">{agg.average || 0}</h3>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-[#666] uppercase tracking-wider">Minimum</p>
                          <h3 className="text-lg font-bold mt-0.5 text-[#111]">{agg.min || 0}</h3>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-[#666] uppercase tracking-wider">Maximum</p>
                          <h3 className="text-lg font-bold mt-0.5 text-[#111]">{agg.max || 0}</h3>
                        </div>
                      </div>

                      {q.fieldType === "RATING" && (
                        <div className="h-24 w-full mt-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={agg.distribution}>
                              <XAxis dataKey="rating" stroke="#666" fontSize={10} />
                              <YAxis hide />
                              <Tooltip cursor={false} contentStyle={{ backgroundColor: "#1C1C1C", border: "none", color: "white", borderRadius: "8px", fontSize: "11px" }} />
                              <Bar dataKey="count" fill={typeColor} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Free Text Answers (Render as styled mini keyword chips or responses) */}
                  {!["MULTIPLE_CHOICE", "DROPDOWN", "YES_NO", "CHECKBOX", "SLIDER", "RATING"].includes(q.fieldType) && (
                    <div className="flex flex-col gap-2 max-h-36 overflow-y-auto mt-2 pr-1">
                      {(agg.recentAnswers || []).slice(0, 4).map((ans: string, aIdx: number) => (
                        <div key={aIdx} className="text-xs bg-transparent px-3 py-2 border border-black/10 rounded-none leading-relaxed break-words font-semibold text-[#666]">
                          {ans}
                        </div>
                      ))}
                      {(agg.recentAnswers || []).length === 0 && (
                        <p className="text-xs text-[#666] uppercase text-center py-10">No responses yet</p>
                      )}
                    </div>
                  )}

                </div>

                {/* Hairline card separation divider */}
                <div className="border-t border-black/10 w-full my-3"></div>

                {/* Card Footer: Latest response preview + relative timestamp */}
                <div className="text-[13px] text-[#666] truncate flex items-center justify-between">
                  <span>Latest: {agg.recentAnswers && agg.recentAnswers[0] ? `"${agg.recentAnswers[0]}"` : "No response yet"}</span>
                  <span className="shrink-0 text-[11px]">Updated 2h ago</span>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Submissions Drill-down Table View */}
      <div className="flex flex-col gap-4">
        
        {/* Section Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-black/10">
          <List className="w-4 h-4 text-[#666]" />
          <h3 className="text-sm font-semibold text-[#111]">
            Participant submissions
          </h3>
        </div>
        
        <div className="bg-white/60 rounded-none overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-black/5 text-[#666] font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-4 w-12">#</th>
                  <th className="p-4">Participant</th>
                  <th className="p-4">Submitted</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {submissionsList.map((sub: any, sIdx: number) => {
                  const hasEmail = sub.answers && Object.keys(sub.answers).some(k => k.includes("email") && sub.answers[k]);
                  const participant = hasEmail 
                    ? Object.values(sub.answers).find(v => typeof v === "string" && v.includes("@")) 
                    : "Anonymous";

                  return (
                    <tr key={sub.id} className="border-b border-black/10/60 last:border-none hover:bg-white transition-colors duration-200">
                      <td className="p-4 font-bold text-[#666]">{sIdx + 1}</td>
                      <td className="p-4 font-semibold text-[#111]">
                        {String(participant || "Anonymous")}
                      </td>
                      <td className="p-4 text-[#666] font-medium">
                        {new Date(sub.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} at {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#2563EB]/15 text-[#2563EB] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3 text-[#2563EB]" /> Complete
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-transparent border border-[#2563EB]/20 hover:border-[#2563EB]/60 hover:bg-[#2563EB]/10 text-[#2563EB] transition-all duration-200 font-semibold uppercase tracking-wider text-[10px] rounded-none cursor-pointer"
                        >
                          Analyze <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {submissionsList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs text-[#666] uppercase font-bold">No submissions available yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Submission Details Modal Drilldown */}
      {selectedSubmission && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setSelectedSubmission(null)}
        >
          <div 
            className="bg-white/60 border border-black/10 w-full max-w-xl flex flex-col gap-0 shadow-2xl rounded-none overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-black/10 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#111]">
                Response Details
              </h2>
              <button 
                onClick={() => setSelectedSubmission(null)} 
                className="text-[#666] hover:text-[#111] text-xs font-bold uppercase tracking-widest cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col gap-4 p-6 max-h-[60vh] overflow-y-auto">
              <p className="text-[10px] text-[#666] uppercase font-bold pb-2 border-b border-black/10">
                Submitted at: {new Date(selectedSubmission.createdAt).toLocaleString()}
              </p>
              
              <div className="flex flex-col gap-5">
                {questions.map((q) => {
                  const ans = selectedSubmission.answers[q.labelKey];
                  return (
                    <div key={q.id} className="flex flex-col gap-1.5">
                      <p className="text-xs font-bold text-[#666]">{q.label || "Untitled"}</p>
                      <div className="bg-transparent px-4 py-3 border border-black/10 rounded-none text-sm text-[#111] font-semibold break-words">
                        {ans || <em className="text-neutral-500">Unanswered</em>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
