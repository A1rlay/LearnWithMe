-- Baseline: the full schema as it stood in production on 2026-11-28 (after 20261129_subject_activity_types),
-- taken with pg_dump --schema-only so CHECK constraints and composite keys are kept.
-- It replaces the earlier migrations, which were applied with `db push` and drifted.
-- Existing databases mark it applied (`prisma migrate resolve --applied 0_baseline`); new ones run it.

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.12 (82f091e)
-- Dumped by pg_dump version 17.11

--
-- Name: ActivityType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ActivityType" AS ENUM (
    'VIDEO',
    'QUIZ',
    'SPELLING'
);

--
-- Name: BuddyStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BuddyStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'DECLINED'
);

--
-- Name: QMQuestionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QMQuestionType" AS ENUM (
    'MULTIPLE_OPTION',
    'OPEN_ANSWER',
    'MATCHER',
    'CLASSIFIER',
    'FILL_BLANK',
    'TRUE_FALSE',
    'SENTENCE_ORDER',
    'WORD_SCRAMBLE',
    'FLASHCARD'
);

--
-- Name: QMSessionMode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QMSessionMode" AS ENUM (
    'PRACTICE',
    'TEST',
    'GAME'
);

--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'TEACHER',
    'STUDENT'
);

--
-- Name: SpellRightMode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SpellRightMode" AS ENUM (
    'TERMINATION',
    'PRONUNCIATION'
);

--
-- Name: Block; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Block" (
    "blockerId" text NOT NULL,
    "blockedId" text NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "Block_not_self" CHECK (("blockerId" <> "blockedId"))
);

--
-- Name: BuddyConnection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BuddyConnection" (
    id text NOT NULL,
    "userAId" text NOT NULL,
    "userBId" text NOT NULL,
    "requesterId" text NOT NULL,
    status public."BuddyStatus" DEFAULT 'PENDING'::public."BuddyStatus" NOT NULL,
    "closedById" text,
    "acceptedAt" timestamp(3) with time zone,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "respondedAt" timestamp(3) with time zone,
    CONSTRAINT "BuddyConnection_canonical_pair" CHECK (("userAId" < "userBId")),
    CONSTRAINT "BuddyConnection_requester_in_pair" CHECK ((("requesterId" = "userAId") OR ("requesterId" = "userBId")))
);

--
-- Name: Class; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Class" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "teacherId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: ClassAssignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ClassAssignment" (
    id text NOT NULL,
    "classId" text NOT NULL,
    "topicId" text NOT NULL,
    note text,
    "dueAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: ClassStudent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ClassStudent" (
    "classId" text NOT NULL,
    "studentId" text NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: LearnerSubject; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LearnerSubject" (
    "userId" text NOT NULL,
    "subjectId" text NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "connectionId" text NOT NULL,
    "senderId" text NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readAt" timestamp(3) with time zone,
    CONSTRAINT "Message_body_length" CHECK (((char_length(body) >= 1) AND (char_length(body) <= 2000)))
);

--
-- Name: QMAnswer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QMAnswer" (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "questionId" text NOT NULL,
    answer jsonb NOT NULL,
    "isCorrect" boolean,
    "reviewedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: QMQuestion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QMQuestion" (
    id text NOT NULL,
    "topicId" text NOT NULL,
    "order" integer NOT NULL,
    type public."QMQuestionType" NOT NULL,
    prompt text NOT NULL,
    data jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: QMSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QMSession" (
    id text NOT NULL,
    "topicId" text NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    mode public."QMSessionMode" DEFAULT 'PRACTICE'::public."QMSessionMode" NOT NULL,
    "userId" text
);

--
-- Name: QMTopic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QMTopic" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "subjectId" text NOT NULL
);

--
-- Name: QMTopicSkill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QMTopicSkill" (
    "topicId" text NOT NULL,
    "skillId" text NOT NULL,
    "subjectId" text NOT NULL
);

--
-- Name: Question; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Question" (
    id text NOT NULL,
    "videoId" text NOT NULL,
    prompt text NOT NULL,
    "order" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "checkpointSeconds" integer DEFAULT 0 NOT NULL
);

--
-- Name: QuestionOption; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuestionOption" (
    id text NOT NULL,
    "questionId" text NOT NULL,
    text text NOT NULL,
    "isCorrect" boolean DEFAULT false NOT NULL,
    "order" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: RateEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RateEvent" (
    id text NOT NULL,
    key text NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: Report; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Report" (
    id text NOT NULL,
    "reporterId" text NOT NULL,
    "reportedId" text NOT NULL,
    "messageId" text,
    reason text NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) with time zone,
    CONSTRAINT "Report_not_self" CHECK (("reporterId" <> "reportedId")),
    CONSTRAINT "Report_reason_length" CHECK (((char_length(reason) >= 1) AND (char_length(reason) <= 1000)))
);

--
-- Name: Skill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Skill" (
    id text NOT NULL,
    "subjectId" text NOT NULL,
    name text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: SpellRightAnswer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SpellRightAnswer" (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "wordId" text NOT NULL,
    answer text NOT NULL,
    "isCorrect" boolean NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: SpellRightSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SpellRightSession" (
    id text NOT NULL,
    "setId" text NOT NULL,
    "userId" text,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: SpellRightSet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SpellRightSet" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    mode public."SpellRightMode" NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "subjectId" text NOT NULL
);

--
-- Name: SpellRightSetSkill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SpellRightSetSkill" (
    "setId" text NOT NULL,
    "skillId" text NOT NULL,
    "subjectId" text NOT NULL
);

--
-- Name: SpellRightWord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SpellRightWord" (
    id text NOT NULL,
    "setId" text NOT NULL,
    word text NOT NULL,
    "correctAnswer" text,
    explanation text,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

--
-- Name: Subject; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Subject" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) with time zone NOT NULL,
    "activityTypes" public."ActivityType"[] DEFAULT ARRAY['VIDEO'::public."ActivityType", 'QUIZ'::public."ActivityType"] NOT NULL
);

--
-- Name: SubjectExpert; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SubjectExpert" (
    "subjectId" text NOT NULL,
    "userId" text NOT NULL,
    "assignedAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: Topic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Topic" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    level text,
    tags text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "subjectId" text NOT NULL
);

--
-- Name: TopicSkill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TopicSkill" (
    "topicId" text NOT NULL,
    "skillId" text NOT NULL,
    "subjectId" text NOT NULL
);

--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text,
    "passwordHash" text NOT NULL,
    name text NOT NULL,
    role public."Role" DEFAULT 'STUDENT'::public."Role" NOT NULL,
    bio text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "discordHandle" text,
    interests text[] DEFAULT ARRAY[]::text[],
    "lookingForBuddies" boolean DEFAULT false NOT NULL,
    username text NOT NULL,
    CONSTRAINT "User_username_format" CHECK ((username ~ '^[a-z0-9_.]{3,20}$'::text))
);

--
-- Name: Video; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Video" (
    id text NOT NULL,
    "topicId" text NOT NULL,
    title text NOT NULL,
    description text,
    "videoUrl" text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "subtitlesEnabled" boolean DEFAULT false NOT NULL
);

--
-- Name: VideoAnswer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VideoAnswer" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "questionId" text NOT NULL,
    "optionId" text NOT NULL,
    "isCorrect" boolean NOT NULL,
    "createdAt" timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: VideoProgress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VideoProgress" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "videoId" text NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

--
-- Name: Block Block_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_pkey" PRIMARY KEY ("blockerId", "blockedId");

--
-- Name: BuddyConnection BuddyConnection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BuddyConnection"
    ADD CONSTRAINT "BuddyConnection_pkey" PRIMARY KEY (id);

--
-- Name: ClassAssignment ClassAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassAssignment"
    ADD CONSTRAINT "ClassAssignment_pkey" PRIMARY KEY (id);

--
-- Name: ClassStudent ClassStudent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassStudent"
    ADD CONSTRAINT "ClassStudent_pkey" PRIMARY KEY ("classId", "studentId");

--
-- Name: Class Class_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Class"
    ADD CONSTRAINT "Class_pkey" PRIMARY KEY (id);

--
-- Name: LearnerSubject LearnerSubject_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LearnerSubject"
    ADD CONSTRAINT "LearnerSubject_pkey" PRIMARY KEY ("userId", "subjectId");

--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);

--
-- Name: QMAnswer QMAnswer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMAnswer"
    ADD CONSTRAINT "QMAnswer_pkey" PRIMARY KEY (id);

--
-- Name: QMQuestion QMQuestion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMQuestion"
    ADD CONSTRAINT "QMQuestion_pkey" PRIMARY KEY (id);

--
-- Name: QMSession QMSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMSession"
    ADD CONSTRAINT "QMSession_pkey" PRIMARY KEY (id);

--
-- Name: QMTopicSkill QMTopicSkill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMTopicSkill"
    ADD CONSTRAINT "QMTopicSkill_pkey" PRIMARY KEY ("topicId", "skillId");

--
-- Name: QMTopic QMTopic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMTopic"
    ADD CONSTRAINT "QMTopic_pkey" PRIMARY KEY (id);

--
-- Name: QuestionOption QuestionOption_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuestionOption"
    ADD CONSTRAINT "QuestionOption_pkey" PRIMARY KEY (id);

--
-- Name: Question Question_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Question"
    ADD CONSTRAINT "Question_pkey" PRIMARY KEY (id);

--
-- Name: RateEvent RateEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RateEvent"
    ADD CONSTRAINT "RateEvent_pkey" PRIMARY KEY (id);

--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);

--
-- Name: Skill Skill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Skill"
    ADD CONSTRAINT "Skill_pkey" PRIMARY KEY (id);

--
-- Name: SpellRightAnswer SpellRightAnswer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightAnswer"
    ADD CONSTRAINT "SpellRightAnswer_pkey" PRIMARY KEY (id);

--
-- Name: SpellRightSession SpellRightSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightSession"
    ADD CONSTRAINT "SpellRightSession_pkey" PRIMARY KEY (id);

--
-- Name: SpellRightSetSkill SpellRightSetSkill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightSetSkill"
    ADD CONSTRAINT "SpellRightSetSkill_pkey" PRIMARY KEY ("setId", "skillId");

--
-- Name: SpellRightSet SpellRightSet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightSet"
    ADD CONSTRAINT "SpellRightSet_pkey" PRIMARY KEY (id);

--
-- Name: SpellRightWord SpellRightWord_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightWord"
    ADD CONSTRAINT "SpellRightWord_pkey" PRIMARY KEY (id);

--
-- Name: SubjectExpert SubjectExpert_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubjectExpert"
    ADD CONSTRAINT "SubjectExpert_pkey" PRIMARY KEY ("subjectId", "userId");

--
-- Name: Subject Subject_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subject"
    ADD CONSTRAINT "Subject_pkey" PRIMARY KEY (id);

--
-- Name: TopicSkill TopicSkill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicSkill"
    ADD CONSTRAINT "TopicSkill_pkey" PRIMARY KEY ("topicId", "skillId");

--
-- Name: Topic Topic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topic"
    ADD CONSTRAINT "Topic_pkey" PRIMARY KEY (id);

--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);

--
-- Name: VideoAnswer VideoAnswer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoAnswer"
    ADD CONSTRAINT "VideoAnswer_pkey" PRIMARY KEY (id);

--
-- Name: VideoProgress VideoProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoProgress"
    ADD CONSTRAINT "VideoProgress_pkey" PRIMARY KEY (id);

--
-- Name: Video Video_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Video"
    ADD CONSTRAINT "Video_pkey" PRIMARY KEY (id);

--
-- Name: Block_blockedId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Block_blockedId_idx" ON public."Block" USING btree ("blockedId");

--
-- Name: BuddyConnection_closedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BuddyConnection_closedById_idx" ON public."BuddyConnection" USING btree ("closedById");

--
-- Name: BuddyConnection_requesterId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BuddyConnection_requesterId_createdAt_idx" ON public."BuddyConnection" USING btree ("requesterId", "createdAt");

--
-- Name: BuddyConnection_userAId_userBId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BuddyConnection_userAId_userBId_key" ON public."BuddyConnection" USING btree ("userAId", "userBId");

--
-- Name: BuddyConnection_userBId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BuddyConnection_userBId_idx" ON public."BuddyConnection" USING btree ("userBId");

--
-- Name: ClassAssignment_classId_topicId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ClassAssignment_classId_topicId_key" ON public."ClassAssignment" USING btree ("classId", "topicId");

--
-- Name: ClassAssignment_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ClassAssignment_topicId_idx" ON public."ClassAssignment" USING btree ("topicId");

--
-- Name: ClassStudent_studentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ClassStudent_studentId_idx" ON public."ClassStudent" USING btree ("studentId");

--
-- Name: Class_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Class_code_key" ON public."Class" USING btree (code);

--
-- Name: Class_teacherId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Class_teacherId_idx" ON public."Class" USING btree ("teacherId");

--
-- Name: LearnerSubject_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LearnerSubject_subjectId_idx" ON public."LearnerSubject" USING btree ("subjectId");

--
-- Name: Message_connectionId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_connectionId_createdAt_idx" ON public."Message" USING btree ("connectionId", "createdAt");

--
-- Name: Message_senderId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_senderId_createdAt_idx" ON public."Message" USING btree ("senderId", "createdAt");

--
-- Name: QMAnswer_questionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QMAnswer_questionId_idx" ON public."QMAnswer" USING btree ("questionId");

--
-- Name: QMAnswer_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QMAnswer_sessionId_idx" ON public."QMAnswer" USING btree ("sessionId");

--
-- Name: QMQuestion_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QMQuestion_topicId_idx" ON public."QMQuestion" USING btree ("topicId");

--
-- Name: QMSession_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QMSession_topicId_idx" ON public."QMSession" USING btree ("topicId");

--
-- Name: QMSession_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QMSession_userId_idx" ON public."QMSession" USING btree ("userId");

--
-- Name: QMTopicSkill_skillId_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QMTopicSkill_skillId_subjectId_idx" ON public."QMTopicSkill" USING btree ("skillId", "subjectId");

--
-- Name: QMTopicSkill_topicId_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QMTopicSkill_topicId_subjectId_idx" ON public."QMTopicSkill" USING btree ("topicId", "subjectId");

--
-- Name: QMTopic_id_subjectId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "QMTopic_id_subjectId_key" ON public."QMTopic" USING btree (id, "subjectId");

--
-- Name: QMTopic_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QMTopic_subjectId_idx" ON public."QMTopic" USING btree ("subjectId");

--
-- Name: QuestionOption_id_questionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "QuestionOption_id_questionId_key" ON public."QuestionOption" USING btree (id, "questionId");

--
-- Name: QuestionOption_questionId_order_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "QuestionOption_questionId_order_key" ON public."QuestionOption" USING btree ("questionId", "order");

--
-- Name: Question_videoId_order_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Question_videoId_order_key" ON public."Question" USING btree ("videoId", "order");

--
-- Name: RateEvent_key_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RateEvent_key_createdAt_idx" ON public."RateEvent" USING btree (key, "createdAt");

--
-- Name: Report_messageId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_messageId_idx" ON public."Report" USING btree ("messageId");

--
-- Name: Report_reportedId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_reportedId_idx" ON public."Report" USING btree ("reportedId");

--
-- Name: Report_reporterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_reporterId_idx" ON public."Report" USING btree ("reporterId");

--
-- Name: Report_resolvedAt_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Report_resolvedAt_createdAt_idx" ON public."Report" USING btree ("resolvedAt", "createdAt");

--
-- Name: Skill_id_subjectId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Skill_id_subjectId_key" ON public."Skill" USING btree (id, "subjectId");

--
-- Name: Skill_subjectId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Skill_subjectId_name_key" ON public."Skill" USING btree ("subjectId", name);

--
-- Name: SpellRightAnswer_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpellRightAnswer_sessionId_idx" ON public."SpellRightAnswer" USING btree ("sessionId");

--
-- Name: SpellRightAnswer_wordId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpellRightAnswer_wordId_idx" ON public."SpellRightAnswer" USING btree ("wordId");

--
-- Name: SpellRightSession_setId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpellRightSession_setId_idx" ON public."SpellRightSession" USING btree ("setId");

--
-- Name: SpellRightSession_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpellRightSession_userId_idx" ON public."SpellRightSession" USING btree ("userId");

--
-- Name: SpellRightSetSkill_setId_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpellRightSetSkill_setId_subjectId_idx" ON public."SpellRightSetSkill" USING btree ("setId", "subjectId");

--
-- Name: SpellRightSetSkill_skillId_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpellRightSetSkill_skillId_subjectId_idx" ON public."SpellRightSetSkill" USING btree ("skillId", "subjectId");

--
-- Name: SpellRightSet_id_subjectId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SpellRightSet_id_subjectId_key" ON public."SpellRightSet" USING btree (id, "subjectId");

--
-- Name: SpellRightSet_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpellRightSet_subjectId_idx" ON public."SpellRightSet" USING btree ("subjectId");

--
-- Name: SpellRightWord_setId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpellRightWord_setId_idx" ON public."SpellRightWord" USING btree ("setId");

--
-- Name: SubjectExpert_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SubjectExpert_userId_idx" ON public."SubjectExpert" USING btree ("userId");

--
-- Name: Subject_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subject_name_key" ON public."Subject" USING btree (name);

--
-- Name: TopicSkill_skillId_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TopicSkill_skillId_subjectId_idx" ON public."TopicSkill" USING btree ("skillId", "subjectId");

--
-- Name: TopicSkill_topicId_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TopicSkill_topicId_subjectId_idx" ON public."TopicSkill" USING btree ("topicId", "subjectId");

--
-- Name: Topic_id_subjectId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Topic_id_subjectId_key" ON public."Topic" USING btree (id, "subjectId");

--
-- Name: Topic_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Topic_subjectId_idx" ON public."Topic" USING btree ("subjectId");

--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);

--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);

--
-- Name: VideoAnswer_optionId_questionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VideoAnswer_optionId_questionId_idx" ON public."VideoAnswer" USING btree ("optionId", "questionId");

--
-- Name: VideoAnswer_questionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VideoAnswer_questionId_idx" ON public."VideoAnswer" USING btree ("questionId");

--
-- Name: VideoAnswer_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VideoAnswer_userId_createdAt_idx" ON public."VideoAnswer" USING btree ("userId", "createdAt");

--
-- Name: VideoProgress_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VideoProgress_userId_idx" ON public."VideoProgress" USING btree ("userId");

--
-- Name: VideoProgress_userId_videoId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VideoProgress_userId_videoId_key" ON public."VideoProgress" USING btree ("userId", "videoId");

--
-- Name: Video_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Video_topicId_idx" ON public."Video" USING btree ("topicId");

--
-- Name: Block Block_blockedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: Block Block_blockerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: BuddyConnection BuddyConnection_closedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BuddyConnection"
    ADD CONSTRAINT "BuddyConnection_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;

--
-- Name: BuddyConnection BuddyConnection_requesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BuddyConnection"
    ADD CONSTRAINT "BuddyConnection_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: BuddyConnection BuddyConnection_userAId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BuddyConnection"
    ADD CONSTRAINT "BuddyConnection_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: BuddyConnection BuddyConnection_userBId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BuddyConnection"
    ADD CONSTRAINT "BuddyConnection_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: ClassAssignment ClassAssignment_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassAssignment"
    ADD CONSTRAINT "ClassAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: ClassAssignment ClassAssignment_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassAssignment"
    ADD CONSTRAINT "ClassAssignment_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."QMTopic"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: ClassStudent ClassStudent_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassStudent"
    ADD CONSTRAINT "ClassStudent_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: ClassStudent ClassStudent_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassStudent"
    ADD CONSTRAINT "ClassStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: Class Class_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Class"
    ADD CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: LearnerSubject LearnerSubject_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LearnerSubject"
    ADD CONSTRAINT "LearnerSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: LearnerSubject LearnerSubject_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LearnerSubject"
    ADD CONSTRAINT "LearnerSubject_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: Message Message_connectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES public."BuddyConnection"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: QMAnswer QMAnswer_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMAnswer"
    ADD CONSTRAINT "QMAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."QMQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: QMAnswer QMAnswer_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMAnswer"
    ADD CONSTRAINT "QMAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."QMSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: QMQuestion QMQuestion_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMQuestion"
    ADD CONSTRAINT "QMQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."QMTopic"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: QMSession QMSession_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMSession"
    ADD CONSTRAINT "QMSession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."QMTopic"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: QMSession QMSession_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMSession"
    ADD CONSTRAINT "QMSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;

--
-- Name: QMTopicSkill QMTopicSkill_skillId_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMTopicSkill"
    ADD CONSTRAINT "QMTopicSkill_skillId_subjectId_fkey" FOREIGN KEY ("skillId", "subjectId") REFERENCES public."Skill"(id, "subjectId") ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: QMTopicSkill QMTopicSkill_topicId_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMTopicSkill"
    ADD CONSTRAINT "QMTopicSkill_topicId_subjectId_fkey" FOREIGN KEY ("topicId", "subjectId") REFERENCES public."QMTopic"(id, "subjectId") ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: QMTopic QMTopic_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QMTopic"
    ADD CONSTRAINT "QMTopic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: QuestionOption QuestionOption_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuestionOption"
    ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."Question"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: Question Question_videoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Question"
    ADD CONSTRAINT "Question_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES public."Video"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: Report Report_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE SET NULL;

--
-- Name: Report Report_reportedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: Report Report_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: Skill Skill_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Skill"
    ADD CONSTRAINT "Skill_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: SpellRightAnswer SpellRightAnswer_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightAnswer"
    ADD CONSTRAINT "SpellRightAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."SpellRightSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: SpellRightAnswer SpellRightAnswer_wordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightAnswer"
    ADD CONSTRAINT "SpellRightAnswer_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES public."SpellRightWord"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: SpellRightSession SpellRightSession_setId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightSession"
    ADD CONSTRAINT "SpellRightSession_setId_fkey" FOREIGN KEY ("setId") REFERENCES public."SpellRightSet"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: SpellRightSession SpellRightSession_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightSession"
    ADD CONSTRAINT "SpellRightSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;

--
-- Name: SpellRightSetSkill SpellRightSetSkill_setId_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightSetSkill"
    ADD CONSTRAINT "SpellRightSetSkill_setId_subjectId_fkey" FOREIGN KEY ("setId", "subjectId") REFERENCES public."SpellRightSet"(id, "subjectId") ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: SpellRightSetSkill SpellRightSetSkill_skillId_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightSetSkill"
    ADD CONSTRAINT "SpellRightSetSkill_skillId_subjectId_fkey" FOREIGN KEY ("skillId", "subjectId") REFERENCES public."Skill"(id, "subjectId") ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: SpellRightSet SpellRightSet_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightSet"
    ADD CONSTRAINT "SpellRightSet_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: SpellRightWord SpellRightWord_setId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpellRightWord"
    ADD CONSTRAINT "SpellRightWord_setId_fkey" FOREIGN KEY ("setId") REFERENCES public."SpellRightSet"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: SubjectExpert SubjectExpert_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubjectExpert"
    ADD CONSTRAINT "SubjectExpert_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: SubjectExpert SubjectExpert_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubjectExpert"
    ADD CONSTRAINT "SubjectExpert_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: TopicSkill TopicSkill_skillId_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicSkill"
    ADD CONSTRAINT "TopicSkill_skillId_subjectId_fkey" FOREIGN KEY ("skillId", "subjectId") REFERENCES public."Skill"(id, "subjectId") ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: TopicSkill TopicSkill_topicId_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TopicSkill"
    ADD CONSTRAINT "TopicSkill_topicId_subjectId_fkey" FOREIGN KEY ("topicId", "subjectId") REFERENCES public."Topic"(id, "subjectId") ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: Topic Topic_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topic"
    ADD CONSTRAINT "Topic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;

--
-- Name: VideoAnswer VideoAnswer_optionId_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoAnswer"
    ADD CONSTRAINT "VideoAnswer_optionId_questionId_fkey" FOREIGN KEY ("optionId", "questionId") REFERENCES public."QuestionOption"(id, "questionId") ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: VideoAnswer VideoAnswer_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoAnswer"
    ADD CONSTRAINT "VideoAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."Question"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: VideoAnswer VideoAnswer_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoAnswer"
    ADD CONSTRAINT "VideoAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: VideoProgress VideoProgress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoProgress"
    ADD CONSTRAINT "VideoProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: VideoProgress VideoProgress_videoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoProgress"
    ADD CONSTRAINT "VideoProgress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES public."Video"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: Video Video_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Video"
    ADD CONSTRAINT "Video_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topic"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- PostgreSQL database dump complete
--
