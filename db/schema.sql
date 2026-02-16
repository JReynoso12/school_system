-- School Exam & Grading System - PostgreSQL Schema
-- Run: psql $DATABASE_URL -f db/schema.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE role_enum AS ENUM (
  'SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPARTMENT_HEAD',
  'TEACHER', 'STUDENT', 'PARENT'
);

CREATE TYPE question_type_enum AS ENUM (
  'MULTIPLE_CHOICE', 'TRUE_FALSE', 'IDENTIFICATION',
  'SHORT_ANSWER', 'ESSAY'
);

-- Tenant & Org
CREATE TABLE "Tenant" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  "logoUrl" TEXT,
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'USD',
  "planTier" TEXT DEFAULT 'basic',
  "seatCount" INT DEFAULT 100,
  "renewalAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "District" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "School" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "districtId" TEXT NOT NULL REFERENCES "District"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Academic Structure
CREATE TABLE "GradeLevel" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId" TEXT NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "AcademicYear" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId" TEXT NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Term" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "academicYearId" TEXT NOT NULL REFERENCES "AcademicYear"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  role role_enum NOT NULL,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "schoolIds" TEXT[] DEFAULT '{}',
  "mfaEnabled" BOOLEAN DEFAULT false,
  "mfaSecret" TEXT,
  "passwordExpiry" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "UserSchoolAssignment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "schoolId" TEXT NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
  role role_enum NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", "schoolId")
);

CREATE TABLE "ParentChild" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "parentId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "childId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  verified BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("parentId", "childId")
);

-- Subjects & Sections
CREATE TABLE "Subject" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId" TEXT NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
  "gradeLevelId" TEXT REFERENCES "GradeLevel"(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  "creditHours" DECIMAL(4,2),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Section" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId" TEXT NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
  "gradeLevelId" TEXT NOT NULL REFERENCES "GradeLevel"(id) ON DELETE CASCADE,
  "subjectId" TEXT NOT NULL REFERENCES "Subject"(id) ON DELETE CASCADE,
  "teacherId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "termId" TEXT REFERENCES "Term"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Enrollment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sectionId" TEXT NOT NULL REFERENCES "Section"(id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("sectionId", "studentId")
);

-- Questions & Exams
CREATE TABLE "Question" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "subjectId" TEXT NOT NULL REFERENCES "Subject"(id) ON DELETE CASCADE,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  type question_type_enum NOT NULL,
  content TEXT NOT NULL,
  options JSONB,
  "correctAnswer" TEXT,
  points DECIMAL(5,2) DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  "usageCount" INT DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Exam" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "subjectId" TEXT NOT NULL REFERENCES "Subject"(id) ON DELETE CASCADE,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "timeLimit" INT,
  "shuffleQuestions" BOOLEAN DEFAULT true,
  "shuffleOptions" BOOLEAN DEFAULT true,
  "showCorrectAnswers" BOOLEAN DEFAULT false,
  version INT DEFAULT 1,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "ExamItem" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "examId" TEXT NOT NULL REFERENCES "Exam"(id) ON DELETE CASCADE,
  "questionId" TEXT NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE,
  "order" INT NOT NULL,
  points DECIMAL(5,2) NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "ExamSection" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "examId" TEXT NOT NULL REFERENCES "Exam"(id) ON DELETE CASCADE,
  "sectionId" TEXT NOT NULL REFERENCES "Section"(id) ON DELETE CASCADE,
  "startAt" TIMESTAMPTZ NOT NULL,
  "endAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("examId", "sectionId")
);

CREATE TABLE "ExamAttempt" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "examId" TEXT NOT NULL REFERENCES "Exam"(id) ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "startedAt" TIMESTAMPTZ DEFAULT NOW(),
  "submittedAt" TIMESTAMPTZ,
  answers JSONB,
  score DECIMAL(5,2),
  "maxScore" DECIMAL(5,2),
  status TEXT DEFAULT 'in_progress',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "timeUsed" INT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "ExamAnswer" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "attemptId" TEXT NOT NULL REFERENCES "ExamAttempt"(id) ON DELETE CASCADE,
  "examItemId" TEXT NOT NULL REFERENCES "ExamItem"(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  score DECIMAL(5,2),
  feedback TEXT,
  "gradedAt" TIMESTAMPTZ,
  "gradedBy" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Grades
CREATE TABLE "GradeCategory" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "subjectId" TEXT NOT NULL REFERENCES "Subject"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  "order" INT DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Grade" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "studentId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "termId" TEXT NOT NULL REFERENCES "Term"(id) ON DELETE CASCADE,
  "subjectId" TEXT NOT NULL REFERENCES "Subject"(id) ON DELETE CASCADE,
  "categoryId" TEXT REFERENCES "GradeCategory"(id) ON DELETE SET NULL,
  "examAttemptId" TEXT UNIQUE REFERENCES "ExamAttempt"(id) ON DELETE SET NULL,
  score DECIMAL(5,2) NOT NULL,
  "maxScore" DECIMAL(5,2) NOT NULL,
  "letterGrade" TEXT,
  comments TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Audit
CREATE TABLE "AuditLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"(id) ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  "entityId" TEXT,
  "oldData" JSONB,
  "newData" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common lookups
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_tenant ON "User"("tenantId");
CREATE INDEX idx_exam_attempt_student ON "ExamAttempt"("studentId", "examId");
CREATE INDEX idx_grade_student ON "Grade"("studentId");
CREATE INDEX idx_audit_tenant ON "AuditLog"("tenantId");
