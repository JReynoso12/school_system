import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-slate-900">School Exam & Grading System</h1>
        <p className="text-slate-600 max-w-lg mx-auto">
          K-12 and College exam administration, grading, and transcript management
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
