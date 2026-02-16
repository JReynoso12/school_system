import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-slate-900">404 - Page Not Found</h1>
        <p className="text-slate-600 max-w-lg mx-auto">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
