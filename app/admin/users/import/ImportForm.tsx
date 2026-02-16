"use client";

import { useState } from "react";

interface School {
  id: string;
  name: string;
}

interface ImportFormProps {
  schools: School[];
}

export function ImportForm({ schools }: ImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    total: number;
    skipped: number;
  } | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !schoolId) {
      setError("File and school are required");
      return;
    }
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("schoolId", schoolId);
    formData.append("role", role);
    try {
      const res = await fetch("/api/import/users", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        setLoading(false);
        return;
      }
      setResult(data);
      setLoading(false);
    } catch {
      setError("Import failed");
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Import Users (CSV)</h1>
      <p className="text-muted-foreground mb-6">
        CSV must have columns: email, firstName, lastName
      </p>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">School</label>
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="w-full px-4 py-2 border border-input rounded-lg"
            required
          >
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            {schools.length === 0 && (
              <option value="">No schools available</option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2 border border-input rounded-lg"
          >
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="PARENT">Parent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full"
            required
          />
        </div>
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}
        {result && (
          <div className="text-sm bg-muted p-3 rounded-lg">
            Imported {result.imported} of {result.total}. Skipped {result.skipped} (already exist).
          </div>
        )}
        <button
          type="submit"
          disabled={loading || schools.length === 0}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Importing..." : "Import"}
        </button>
      </form>
    </>
  );
}
