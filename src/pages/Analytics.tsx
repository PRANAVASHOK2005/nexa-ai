import {
  useEffect,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  Bot,
  FileText,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";


const API_URL = "https://nexa-ai-1-rel1.onrender.com";


type AnalyticsData = {
  total_conversations: number;
  total_messages: number;
  user_messages: number;
  assistant_messages: number;
  total_documents: number;
  input_characters: number;
  output_characters: number;
  document_characters: number;
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  estimated_total_tokens: number;
  estimated_document_tokens: number;
};


const emptyAnalytics: AnalyticsData = {
  total_conversations: 0,
  total_messages: 0,
  user_messages: 0,
  assistant_messages: 0,
  total_documents: 0,
  input_characters: 0,
  output_characters: 0,
  document_characters: 0,
  estimated_input_tokens: 0,
  estimated_output_tokens: 0,
  estimated_total_tokens: 0,
  estimated_document_tokens: 0,
};


function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}


function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {formatNumber(value)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}


export default function Analytics() {
  const { token } = useAuth();

  const [analytics, setAnalytics] =
    useState<AnalyticsData>(emptyAnalytics);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadAnalytics = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/analytics/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        throw new Error(
          `Analytics API error: ${response.status}`
        );
      }

      const data: AnalyticsData =
        await response.json();

      setAnalytics(data);
    } catch (requestError) {
      console.error(
        "Failed to load analytics:",
        requestError
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load analytics."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void loadAnalytics();
  }, [token]);


  const totalMessageBase =
    analytics.user_messages +
    analytics.assistant_messages;


  const userPercentage =
    totalMessageBase > 0
      ? Math.round(
          (analytics.user_messages /
            totalMessageBase) *
            100
        )
      : 0;


  const assistantPercentage =
    totalMessageBase > 0
      ? 100 - userPercentage
      : 0;


  const maxTokenValue = Math.max(
    analytics.estimated_input_tokens,
    analytics.estimated_output_tokens,
    1
  );


  const inputWidth =
    (analytics.estimated_input_tokens /
      maxTokenValue) *
    100;


  const outputWidth =
    (analytics.estimated_output_tokens /
      maxTokenValue) *
    100;


  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
              <BarChart3 size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                Analytics
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor your NexaAI usage and AI activity.
              </p>
            </div>

          </div>
        </div>


        <button
          type="button"
          onClick={() => void loadAnalytics()}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              loading ? "animate-spin" : ""
            }
          />

          Refresh
        </button>

      </div>


      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* Main stats */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Conversations"
          value={analytics.total_conversations}
          description="Total AI conversations"
          icon={MessageSquare}
        />

        <StatCard
          title="Messages"
          value={analytics.total_messages}
          description="User + AI messages"
          icon={Activity}
        />

        <StatCard
          title="Documents"
          value={analytics.total_documents}
          description="Uploaded documents"
          icon={FileText}
        />

        <StatCard
          title="Estimated Tokens"
          value={analytics.estimated_total_tokens}
          description="Chat input + output"
          icon={TrendingUp}
        />

      </div>


      {/* Token usage + message breakdown */}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Token usage */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Token Usage
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Estimated chat token consumption.
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <TrendingUp
                size={18}
                className="text-slate-700"
              />
            </div>

          </div>


          <div className="mt-7 space-y-6">

            <div>

              <div className="mb-2 flex items-center justify-between text-sm">

                <span className="font-medium text-slate-600">
                  Input tokens
                </span>

                <span className="font-semibold text-slate-950">
                  {formatNumber(
                    analytics.estimated_input_tokens
                  )}
                </span>

              </div>


              <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-slate-700 transition-all"
                  style={{
                    width: `${Math.max(
                      inputWidth,
                      analytics.estimated_input_tokens
                        ? 4
                        : 0
                    )}%`,
                  }}
                />

              </div>

            </div>


            <div>

              <div className="mb-2 flex items-center justify-between text-sm">

                <span className="font-medium text-slate-600">
                  Output tokens
                </span>

                <span className="font-semibold text-slate-950">
                  {formatNumber(
                    analytics.estimated_output_tokens
                  )}
                </span>

              </div>


              <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-slate-950 transition-all"
                  style={{
                    width: `${Math.max(
                      outputWidth,
                      analytics.estimated_output_tokens
                        ? 4
                        : 0
                    )}%`,
                  }}
                />

              </div>

            </div>

          </div>


          <div className="mt-7 rounded-xl bg-slate-50 p-4">

            <div className="flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Total estimated tokens
              </span>

              <span className="text-lg font-bold text-slate-950">
                {formatNumber(
                  analytics.estimated_total_tokens
                )}
              </span>

            </div>

          </div>

        </section>


        {/* Message breakdown */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Message Breakdown
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                User messages compared with AI responses.
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Bot
                size={18}
                className="text-slate-700"
              />
            </div>

          </div>


          <div className="mt-7">

            <div className="flex h-5 overflow-hidden rounded-full bg-slate-100">

              {userPercentage > 0 && (
                <div
                  className="h-full bg-slate-500 transition-all"
                  style={{
                    width: `${userPercentage}%`,
                  }}
                />
              )}

              {assistantPercentage > 0 && (
                <div
                  className="h-full bg-slate-950 transition-all"
                  style={{
                    width: `${assistantPercentage}%`,
                  }}
                />
              )}

            </div>


            <div className="mt-6 grid grid-cols-2 gap-4">

              <div className="rounded-xl border border-slate-200 p-4">

                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />

                  <span className="text-sm font-medium text-slate-500">
                    You
                  </span>

                </div>


                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {formatNumber(
                    analytics.user_messages
                  )}
                </p>


                <p className="mt-1 text-xs text-slate-400">
                  {userPercentage}% of messages
                </p>

              </div>


              <div className="rounded-xl border border-slate-200 p-4">

                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 rounded-full bg-slate-950" />

                  <span className="text-sm font-medium text-slate-500">
                    NexaAI
                  </span>

                </div>


                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {formatNumber(
                    analytics.assistant_messages
                  )}
                </p>


                <p className="mt-1 text-xs text-slate-400">
                  {assistantPercentage}% of messages
                </p>

              </div>

            </div>

          </div>

        </section>

      </div>


      {/* Document usage */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Document Usage
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Document processing activity in the current session.
            </p>
          </div>


          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">

            <FileText
              size={18}
              className="text-slate-700"
            />

          </div>

        </div>


        <div className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-xl bg-slate-50 p-5">

            <p className="text-sm text-slate-500">
              Uploaded documents
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatNumber(
                analytics.total_documents
              )}
            </p>

          </div>


          <div className="rounded-xl bg-slate-50 p-5">

            <p className="text-sm text-slate-500">
              Document characters
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatNumber(
                analytics.document_characters
              )}
            </p>

          </div>


          <div className="rounded-xl bg-slate-50 p-5">

            <p className="text-sm text-slate-500">
              Estimated document tokens
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatNumber(
                analytics.estimated_document_tokens
              )}
            </p>

          </div>

        </div>

      </section>


      {/* Activity summary */}

      <section className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">

        <div className="flex items-start gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Users size={20} />
          </div>


          <div>

            <h2 className="font-semibold">
              NexaAI Usage Summary
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-300">

              Your current session contains{" "}

              <span className="font-semibold text-white">
                {formatNumber(
                  analytics.total_conversations
                )}
              </span>{" "}

              conversation
              {analytics.total_conversations === 1
                ? ""
                : "s"}{" "}

              with{" "}

              <span className="font-semibold text-white">
                {formatNumber(
                  analytics.total_messages
                )}
              </span>{" "}

              total message
              {analytics.total_messages === 1
                ? ""
                : "s"}{" "}

              and{" "}

              <span className="font-semibold text-white">
                {formatNumber(
                  analytics.total_documents
                )}
              </span>{" "}

              uploaded document
              {analytics.total_documents === 1
                ? ""
                : "s"}.

            </p>

          </div>

        </div>

      </section>


      {/* Footer note */}

      <p className="text-center text-xs text-slate-400">
        Token counts are estimates for local AI usage and may not
        exactly match model tokenizer counts.
      </p>

    </div>
  );
}