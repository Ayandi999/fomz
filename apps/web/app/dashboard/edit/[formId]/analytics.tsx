"use client";

import React, { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell 
} from "recharts";
import { Loader2, TrendingUp, Users, CheckCircle, BarChart3, List, Calendar, ArrowUpRight } from "lucide-react";

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
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gathering Form Insights...</span>
      </div>
    );
  }

  const { totalSubmissions, completionRate, submissionsOverTime, aggregations, submissionsList } = analytics;

  // Curated Retro-Vibrant Palette
  const COLORS = ["#fbbf24", "#3b82f6", "#10b981", "#ec4899", "#8b5cf6", "#f97316"];

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in pb-16">
      
      {/* 1. Header Aggregated Summary Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Responses */}
        <div className="border-2 border-neutral-900 dark:border-neutral-100 bg-background p-6 flex items-center justify-between shadow-[4px_4px_0px_0px_#171717] dark:shadow-[4px_4px_0px_0px_#fff]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Responses</p>
            <h2 className="text-4xl font-extrabold tracking-tight mt-2 text-neutral-900 dark:text-neutral-100">{totalSubmissions}</h2>
            <p className="text-[9px] text-muted-foreground uppercase mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> +100% submission volume
            </p>
          </div>
          <Users className="w-12 h-12 text-neutral-800 dark:text-neutral-200 opacity-60" />
        </div>

        {/* Completion Rate */}
        <div className="border-2 border-neutral-900 dark:border-neutral-100 bg-background p-6 flex items-center justify-between shadow-[4px_4px_0px_0px_#171717] dark:shadow-[4px_4px_0px_0px_#fff]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Completion Rate</p>
            <h2 className="text-4xl font-extrabold tracking-tight mt-2 text-neutral-900 dark:text-neutral-100">{completionRate}%</h2>
            <p className="text-[9px] text-muted-foreground uppercase mt-1">Direct Conversational Deck submissions</p>
          </div>
          <CheckCircle className="w-12 h-12 text-neutral-800 dark:text-neutral-200 opacity-60" />
        </div>

        {/* Submissions Trend */}
        <div className="border-2 border-neutral-900 dark:border-neutral-100 bg-background p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_#171717] dark:shadow-[4px_4px_0px_0px_#fff]">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Activity Trend</p>
          <div className="h-16 w-full mt-2">
            {submissionsOverTime.length === 0 ? (
              <p className="text-[9px] text-muted-foreground py-4 uppercase">No trend data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={submissionsOverTime}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#171717", border: "2px solid #fff", color: "#fff", fontSize: "10px", textTransform: "uppercase" }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 2. Questions Analytics Aggregations */}
      <div className="flex flex-col gap-6">
        <h3 className="text-sm font-black uppercase tracking-widest border-b-2 border-neutral-900 dark:border-neutral-100 pb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-500" /> Question-by-Question Breakdowns
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {questions.map((q) => {
            const agg = aggregations[q.id];
            if (!agg) return null;

            return (
              <div key={q.id} className="border-2 border-neutral-900 dark:border-neutral-100 bg-background p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5">
                      {q.fieldType.replace("_", " ")}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">
                      {agg.totalResponses} Responses
                    </span>
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-tight mt-3 text-neutral-900 dark:text-neutral-100">
                    {q.label || "Untitled Question"}
                  </h4>
                </div>

                <div className="mt-6 flex-1 flex flex-col justify-center min-h-[160px]">
                  {/* Choice Charts (Bar charts) */}
                  {["MULTIPLE_CHOICE", "DROPDOWN", "YES_NO", "CHECKBOX"].includes(q.fieldType) && (
                    <div className="h-40 w-full">
                      {agg.distribution.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground uppercase text-center py-12">No data recorded</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={agg.distribution} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="choice" type="category" stroke="#888" fontSize={9} width={80} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: "#171717", border: "2px solid #fff", color: "#fff", fontSize: "10px" }} />
                            <Bar dataKey="count" fill="#fbbf24" radius={[0, 4, 4, 0]}>
                              {agg.distribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}

                  {/* Rating/Slider (Distribution and Stats) */}
                  {["SLIDER", "RATING"].includes(q.fieldType) && (
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-3 gap-2 text-center bg-neutral-900/5 dark:bg-white/5 p-3 border border-neutral-200 dark:border-neutral-800">
                        <div>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Average</p>
                          <h3 className="text-xl font-extrabold mt-1">{agg.average || 0}</h3>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Minimum</p>
                          <h3 className="text-xl font-extrabold mt-1">{agg.min || 0}</h3>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Maximum</p>
                          <h3 className="text-xl font-extrabold mt-1">{agg.max || 0}</h3>
                        </div>
                      </div>

                      {q.fieldType === "RATING" && (
                        <div className="h-28 w-full mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={agg.distribution}>
                              <XAxis dataKey="rating" stroke="#888" fontSize={9} />
                              <YAxis hide />
                              <Tooltip contentStyle={{ backgroundColor: "#171717", border: "2px solid #fff", color: "#fff", fontSize: "10px" }} />
                              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Free Text Answers */}
                  {!["MULTIPLE_CHOICE", "DROPDOWN", "YES_NO", "CHECKBOX", "SLIDER", "RATING"].includes(q.fieldType) && (
                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto mt-2 pr-1">
                      {(agg.recentAnswers || []).map((ans: string, aIdx: number) => (
                        <div key={aIdx} className="text-[10px] bg-neutral-100 dark:bg-neutral-900 px-3 py-2 border border-neutral-200 dark:border-neutral-800 leading-relaxed break-words font-medium text-neutral-800 dark:text-neutral-200">
                          {ans}
                        </div>
                      ))}
                      {(agg.recentAnswers || []).length === 0 && (
                        <p className="text-[10px] text-muted-foreground uppercase text-center py-10">No responses yet</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Submissions Drill-down Table View */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-black uppercase tracking-widest border-b-2 border-neutral-900 dark:border-neutral-100 pb-2 flex items-center gap-2">
          <List className="w-4 h-4 text-amber-500" /> Participant Submissions Grid
        </h3>
        
        <div className="border-2 border-neutral-900 dark:border-neutral-100 bg-background overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-neutral-900 text-white dark:bg-white dark:text-black font-black text-[10px] uppercase tracking-wider">
                <th className="p-4 border-r border-neutral-800 dark:border-neutral-200">Timestamp</th>
                <th className="p-4 border-r border-neutral-800 dark:border-neutral-200">Submission ID</th>
                <th className="p-4">Inspect</th>
              </tr>
            </thead>
            <tbody className="text-[11px]">
              {submissionsList.map((sub: any) => (
                <tr key={sub.id} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900">
                  <td className="p-4 font-semibold text-muted-foreground border-r border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    {new Date(sub.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-4 font-mono font-bold text-neutral-800 dark:text-neutral-200 border-r border-neutral-200 dark:border-neutral-800">{sub.id}</td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-neutral-900 dark:border-neutral-100 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors font-extrabold uppercase tracking-widest text-[9px] bg-transparent cursor-pointer"
                    >
                      Analyze <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {submissionsList.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-xs text-muted-foreground uppercase font-bold">No submissions available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Submission Details Modal Drilldown */}
      {selectedSubmission && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setSelectedSubmission(null)}
        >
          <div 
            className="bg-background border-2 border-neutral-900 dark:border-neutral-100 w-full max-w-xl flex flex-col gap-0 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b-2 border-neutral-900 dark:border-neutral-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest">
                Response Details
              </h2>
              <button 
                onClick={() => setSelectedSubmission(null)} 
                className="text-muted-foreground hover:text-foreground text-xs font-bold uppercase tracking-widest cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col gap-4 p-6 max-h-[60vh] overflow-y-auto">
              <p className="text-[9px] text-muted-foreground uppercase font-bold pb-2 border-b border-neutral-100 dark:border-neutral-800">
                Submitted at: {new Date(selectedSubmission.createdAt).toLocaleString()}
              </p>
              
              <div className="flex flex-col gap-5">
                {questions.map((q) => {
                  const ans = selectedSubmission.answers[q.labelKey];
                  return (
                    <div key={q.id} className="flex flex-col gap-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">{q.label || "Untitled"}</p>
                      <div className="bg-neutral-100 dark:bg-neutral-900 px-4 py-3 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-800 dark:text-neutral-200 font-bold break-words">
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
