import {
  Activity,
  ArrowUpRight,
  DollarSign,
  MessageSquare,
  Zap,
} from "lucide-react";

const stats = [
  {
    title: "AI Requests",
    value: "12,842",
    change: "+12.5%",
    icon: MessageSquare,
  },
  {
    title: "Tokens Used",
    value: "284.6K",
    change: "+8.2%",
    icon: Zap,
  },
  {
    title: "Monthly Cost",
    value: "$42.80",
    change: "-4.3%",
    icon: DollarSign,
  },
  {
    title: "Avg. Response",
    value: "1.42s",
    change: "-11.2%",
    icon: Activity,
  },
];

const activity = [
  {
    title: "AI Chat",
    detail: "2,420 tokens",
    time: "2 min ago",
  },
  {
    title: "Document Analysis",
    detail: "4,821 tokens",
    time: "18 min ago",
  },
  {
    title: "AI Summary",
    detail: "1,284 tokens",
    time: "42 min ago",
  },
  {
    title: "Code Generation",
    detail: "3,102 tokens",
    time: "1 hr ago",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <p className="text-sm font-medium text-slate-500">
          AI Workspace
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          Good morning, Pranav 👋
        </h1>

        <p className="mt-2 text-slate-500">
          Here's what's happening with your AI workspace.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-slate-100 p-3">
                  <Icon size={20} />
                </div>

                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                  {stat.change}
                  <ArrowUpRight size={13} />
                </span>
              </div>

              <p className="mt-5 text-sm text-slate-500">
                {stat.title}
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts + Activity */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* Usage Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                AI Usage
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Requests over the last 7 days
              </p>
            </div>

            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>

          <div className="mt-8 flex h-64 items-end gap-3">

            {[45, 65, 52, 82, 61, 92, 74].map(
              (height, index) => (
                <div
                  key={index}
                  className="flex h-full flex-1 flex-col items-center gap-3"
                >
                  <div className="flex h-full w-full items-end">
                    <div
                      className="w-full rounded-t-lg bg-slate-950 transition hover:bg-slate-700"
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  </div>

                  <span className="text-xs text-slate-400">
                    {
                      [
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                        "Sun",
                      ][index]
                    }
                  </span>
                </div>
              )
            )}

          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-950">
            Recent Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your latest AI activity
          </p>

          <div className="mt-6 divide-y divide-slate-100">

            {activity.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <p className="text-sm font-medium text-slate-950">
                    {item.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.detail}
                  </p>
                </div>

                <span className="text-xs text-slate-400">
                  {item.time}
                </span>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* Plan Usage */}
      <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

          <div>
            <p className="text-lg font-semibold">
              Free plan usage
            </p>

            <p className="mt-1 text-sm text-slate-400">
              You've used 68% of your monthly AI credits.
            </p>
          </div>

          <button className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-200">
            Upgrade Plan
          </button>

        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-[68%] rounded-full bg-white" />
        </div>

      </div>

    </div>
  );
}