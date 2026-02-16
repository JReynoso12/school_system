import "dotenv/config";
import { query, queryOne, pool } from "../lib/db";
import bcrypt from "bcrypt";

async function main() {
  let tenant = await queryOne<{ id: string }>(
    'SELECT id FROM "Tenant" WHERE slug = $1',
    ["demo-school"]
  );
  if (!tenant) {
    const r = await query<{ id: string }>(
      `INSERT INTO "Tenant" (name, slug, timezone, "planTier", "seatCount", "renewalAt")
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        "Demo School District",
        "demo-school",
        "America/New_York",
        "standard",
        500,
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      ]
    );
    tenant = r.rows[0];
  }

  let district = await queryOne<{ id: string }>(
    'SELECT id FROM "District" WHERE "tenantId" = $1 AND name = $2',
    [tenant!.id, "Demo District"]
  );
  if (!district) {
    const r = await query<{ id: string }>(
      'INSERT INTO "District" ("tenantId", name) VALUES ($1, $2) RETURNING id',
      [tenant!.id, "Demo District"]
    );
    district = r.rows[0];
  }

  let school = await queryOne<{ id: string }>(
    'SELECT id FROM "School" WHERE "districtId" = $1 AND name = $2',
    [district!.id, "Demo Academy"]
  );
  if (!school) {
    const r = await query<{ id: string }>(
      'INSERT INTO "School" ("districtId", name) VALUES ($1, $2) RETURNING id',
      [district!.id, "Demo Academy"]
    );
    school = r.rows[0];
  }

  const gradeLevelR = await query<{ id: string }>(
    'INSERT INTO "GradeLevel" ("schoolId", name, level) VALUES ($1, $2, $3) RETURNING id',
    [school!.id, "Grade 10", 10]
  );
  const gradeLevel = gradeLevelR.rows[0];

  const ayR = await query<{ id: string }>(
    `INSERT INTO "AcademicYear" ("schoolId", name, "startDate", "endDate")
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [school!.id, "2024-2025", "2024-09-01", "2025-06-30"]
  );
  const academicYear = ayR.rows[0];

  const termR = await query<{ id: string }>(
    `INSERT INTO "Term" ("academicYearId", name, "startDate", "endDate")
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [academicYear.id, "Semester 1", "2024-09-01", "2025-01-15"]
  );
  const term = termR.rows[0];

  const passwordHash = await bcrypt.hash("password123", 10);

  const insertUser = async (
    email: string,
    firstName: string,
    lastName: string,
    role: string
  ) => {
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM "User" WHERE email = $1',
      [email]
    );
    if (existing) return existing;
    const r = await query<{ id: string }>(
      `INSERT INTO "User" (email, "passwordHash", "firstName", "lastName", role, "tenantId", "schoolIds")
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [email, passwordHash, firstName, lastName, role, tenant!.id, [school!.id]]
    );
    const user = r.rows[0];
    await query(
      `INSERT INTO "UserSchoolAssignment" ("userId", "schoolId", role)
       VALUES ($1, $2, $3)
       ON CONFLICT ("userId", "schoolId") DO NOTHING`,
      [user.id, school!.id, role]
    );
    return user;
  };

  const admin = await insertUser("admin@demoschool.edu", "Admin", "User", "SCHOOL_ADMIN");
  const teacher = await insertUser("teacher@demoschool.edu", "Jane", "Teacher", "TEACHER");
  const student = await insertUser("student@demoschool.edu", "John", "Student", "STUDENT");

  const subjectR = await query<{ id: string }>(
    `INSERT INTO "Subject" ("schoolId", "gradeLevelId", name, code, "creditHours")
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [school!.id, gradeLevel.id, "Mathematics", "MATH101", 4]
  );
  const subject = subjectR.rows[0];

  await query(
    `INSERT INTO "GradeCategory" ("subjectId", name, weight, "order")
     VALUES ($1, 'Quiz', 20, 0), ($1, 'Midterm', 30, 1), ($1, 'Final', 50, 2)`,
    [subject.id]
  );

  const sectionR = await query<{ id: string }>(
    `INSERT INTO "Section" ("schoolId", "gradeLevelId", "subjectId", "teacherId", name, "termId")
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [school!.id, gradeLevel.id, subject.id, teacher.id, "Section A", term.id]
  );
  const section = sectionR.rows[0];

  await query(
    'INSERT INTO "Enrollment" ("sectionId", "studentId") VALUES ($1, $2) ON CONFLICT ("sectionId", "studentId") DO NOTHING',
    [section.id, student.id]
  );

  const insertQuestion = async (
    type: string,
    content: string,
    options: unknown,
    correctAnswer: string | null,
    tags: string[]
  ) => {
    const r = await query<{ id: string }>(
      `INSERT INTO "Question" ("subjectId", "tenantId", type, content, options, "correctAnswer", points, tags)
       VALUES ($1, $2, $3, $4, $5, $6, 5, $7) RETURNING id`,
      [subject.id, tenant!.id, type, content, JSON.stringify(options || null), correctAnswer, tags]
    );
    return r.rows[0];
  };

  const q1 = await insertQuestion(
    "MULTIPLE_CHOICE",
    "What is 2 + 2?",
    [
      { id: "a", text: "3", correct: false },
      { id: "b", text: "4", correct: true },
      { id: "c", text: "5", correct: false },
    ],
    null,
    ["arithmetic", "easy"]
  );
  const q2 = await insertQuestion(
    "TRUE_FALSE",
    "The sum of angles in a triangle is 180 degrees.",
    [
      { id: "true", text: "True", correct: true },
      { id: "false", text: "False", correct: false },
    ],
    null,
    ["geometry", "easy"]
  );
  const q3 = await insertQuestion(
    "IDENTIFICATION",
    "What is the square root of 16?",
    null,
    "4",
    ["arithmetic", "easy"]
  );

  const examR = await query<{ id: string }>(
    `INSERT INTO "Exam" ("subjectId", "tenantId", title, description, "timeLimit", "shuffleQuestions", "shuffleOptions")
     VALUES ($1, $2, $3, $4, 15, true, true) RETURNING id`,
    [subject.id, tenant!.id, "Math Quiz 1", "Basic arithmetic and geometry"]
  );
  const exam = examR.rows[0];

  await query(
    `INSERT INTO "ExamItem" ("examId", "questionId", "order", points)
     VALUES ($1, $2, 0, 5), ($1, $3, 1, 5), ($1, $4, 2, 5)`,
    [exam.id, q1.id, q2.id, q3.id]
  );

  const now = new Date();
  const endAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO "ExamSection" ("examId", "sectionId", "startAt", "endAt")
     VALUES ($1, $2, $3, $4) ON CONFLICT ("examId", "sectionId") DO NOTHING`,
    [exam.id, section.id, now, endAt]
  );

  console.log("Seed completed successfully!");
  console.log("Login credentials:");
  console.log("  Admin:   admin@demoschool.edu / password123");
  console.log("  Teacher: teacher@demoschool.edu / password123");
  console.log("  Student: student@demoschool.edu / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
