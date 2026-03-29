-- CreateTable
CREATE TABLE "resume_variants" (
    "id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "job_title" TEXT,
    "company" TEXT,
    "job_url" TEXT,
    "job_description" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "density" TEXT NOT NULL,
    "latex" TEXT NOT NULL,
    "pdf_data" BYTEA,
    "page_count" INTEGER NOT NULL,
    "fits_on_one_page" BOOLEAN NOT NULL,
    "compiler" TEXT,
    "trim_passes" INTEGER NOT NULL DEFAULT 0,
    "estimated_line_budget" INTEGER,
    "estimated_lines_used" INTEGER,
    "include_sections" TEXT[],
    "selected_education_ids" TEXT[],
    "selected_skill_group_ids" TEXT[],
    "selected_experience_ids" TEXT[],
    "selected_project_ids" TEXT[],
    "selected_certification_ids" TEXT[],
    "selected_award_ids" TEXT[],
    "selected_leadership_ids" TEXT[],
    "plan" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_variants_user_id_idx" ON "resume_variants"("user_id");

-- AddForeignKey
ALTER TABLE "resume_variants" ADD CONSTRAINT "resume_variants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
