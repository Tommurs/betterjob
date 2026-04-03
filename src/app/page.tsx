import Link from "next/link";

const JOB_CATEGORIES = [
  { label: "Engineering", icon: "💻", count: 142 },
  { label: "Design", icon: "🎨", count: 58 },
  { label: "Marketing", icon: "📣", count: 74 },
  { label: "Sales", icon: "📈", count: 91 },
  { label: "Finance", icon: "💰", count: 43 },
  { label: "Operations", icon: "⚙️", count: 37 },
];

const RECENT_JOBS = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "Acme Corp",
    location: "Remote",
    type: "Full-time",
    salary: "$120k – $160k",
    posted: "2d ago",
  },
  {
    id: "2",
    title: "Product Designer",
    company: "Bright Labs",
    location: "New York, NY",
    type: "Full-time",
    salary: "$100k – $130k",
    posted: "3d ago",
  },
  {
    id: "3",
    title: "Growth Marketer",
    company: "Launchpad",
    location: "Remote",
    type: "Contract",
    salary: "$80k – $100k",
    posted: "5d ago",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Find a job that's actually{" "}
            <span className="text-blue-600">better</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10">
            Thousands of roles at companies that care about their people.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white border border-gray-200 rounded-xl p-2 shadow-sm max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Job title, skill, or company"
              className="flex-1 px-4 py-2 text-sm outline-none text-gray-700 placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Location or Remote"
              className="flex-1 px-4 py-2 text-sm outline-none text-gray-700 placeholder-gray-400 sm:border-l border-gray-200"
            />
            <button className="bg-blue-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Browse by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {JOB_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={`/jobs?category=${cat.label.toLowerCase()}`}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                {cat.label}
              </span>
              <span className="text-xs text-gray-400">{cat.count} jobs</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent jobs */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Recent listings</h2>
          <Link href="/jobs" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {RECENT_JOBS.map((job) => (
            <div
              key={job.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
            >
              {/* Left */}
              <div>
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {job.company} · {job.location}
                </p>
              </div>

              {/* Right */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {job.type}
                </span>
                <span className="text-sm font-medium text-gray-700">{job.salary}</span>
                <span className="text-xs text-gray-400">{job.posted}</span>
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
