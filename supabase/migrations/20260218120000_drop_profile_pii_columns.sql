


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."compute_post_search_document"("p_title" "text", "p_content" "text", "p_tags" "text"[], "p_doi" "text", "p_arxiv_id" "text", "p_company" "text") RETURNS "tsvector"
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    setweight(to_tsvector('simple', coalesce(p_title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(p_content, '')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(p_tags, '{}'::text[]), ' ')), 'B') ||
    setweight(to_tsvector('simple', coalesce(p_doi, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(p_arxiv_id, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(p_company, '')), 'C');
$$;


ALTER FUNCTION "public"."compute_post_search_document"("p_title" "text", "p_content" "text", "p_tags" "text"[], "p_doi" "text", "p_arxiv_id" "text", "p_company" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_profile_username"("p_seed" "text", "p_user_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $_$
DECLARE
  base text;
  candidate text;
  suffix integer := 0;
BEGIN
  base := lower(COALESCE(p_seed, ''));
  base := regexp_replace(base, '[^a-z0-9_-]+', '_', 'g');
  base := regexp_replace(base, '_+', '_', 'g');
  base := regexp_replace(base, '^_|_$', '', 'g');

  IF length(base) < 3 THEN
    base := 'materialist_' || substr(replace(p_user_id::text, '-', ''), 1, 8);
  END IF;

  base := left(base, 30);
  candidate := base;

  WHILE EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.username = candidate
  ) LOOP
    suffix := suffix + 1;
    candidate := left(base, 30 - length(suffix::text) - 1) || '_' || suffix::text;
  END LOOP;

  RETURN candidate;
END;
$_$;


ALTER FUNCTION "public"."generate_profile_username"("p_seed" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_materialists"("p_limit" integer DEFAULT 5, "p_days" integer DEFAULT 30) RETURNS TABLE("id" "uuid", "username" "text", "display_name" "text", "avatar_url" "text", "post_count" bigint, "comment_count" bigint, "score" numeric)
    LANGUAGE "sql" STABLE
    AS $$
  WITH cutoff AS (
    SELECT now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1)) AS value
  ),
  post_activity AS (
    SELECT
      author_id,
      COUNT(*)::bigint AS post_count,
      COALESCE(SUM(vote_count), 0)::bigint AS post_votes
    FROM public.posts
    WHERE created_at >= (SELECT value FROM cutoff)
    GROUP BY author_id
  ),
  comment_activity AS (
    SELECT
      author_id,
      COUNT(*)::bigint AS comment_count,
      COALESCE(SUM(vote_count), 0)::bigint AS comment_votes
    FROM public.comments
    WHERE created_at >= (SELECT value FROM cutoff)
    GROUP BY author_id
  ),
  activity AS (
    SELECT
      COALESCE(pa.author_id, ca.author_id) AS author_id,
      COALESCE(pa.post_count, 0)::bigint AS post_count,
      COALESCE(ca.comment_count, 0)::bigint AS comment_count,
      COALESCE(pa.post_votes, 0)::bigint AS post_votes,
      COALESCE(ca.comment_votes, 0)::bigint AS comment_votes
    FROM post_activity pa
    FULL OUTER JOIN comment_activity ca
      ON ca.author_id = pa.author_id
  )
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    a.post_count,
    a.comment_count,
    (
      a.post_count * 4 +
      a.comment_count * 2 +
      a.post_votes * 0.35 +
      a.comment_votes * 0.2 +
      COALESCE(p.karma, 0) * 0.03
    )::numeric AS score
  FROM activity a
  INNER JOIN public.profiles p
    ON p.id = a.author_id
  WHERE (a.post_count > 0 OR a.comment_count > 0)
    AND p.is_bot = false
  ORDER BY score DESC
  LIMIT GREATEST(COALESCE(p_limit, 5), 1);
$$;


ALTER FUNCTION "public"."get_top_materialists"("p_limit" integer, "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_trending_topics"("p_limit" integer DEFAULT 8, "p_days" integer DEFAULT 7) RETURNS TABLE("tag" "text", "count" bigint, "vote_score" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  WITH tagged_posts AS (
    SELECT
      unnest(tags) AS raw_tag,
      vote_count
    FROM public.posts
    WHERE created_at >= now() - make_interval(days => GREATEST(COALESCE(p_days, 7), 1))
      AND tags IS NOT NULL
  )
  SELECT
    CASE
      WHEN left(trim(raw_tag), 1) = '#' THEN trim(raw_tag)
      ELSE '#' || trim(raw_tag)
    END AS tag,
    COUNT(*)::bigint AS count,
    COALESCE(SUM(vote_count), 0)::bigint AS vote_score
  FROM tagged_posts
  WHERE trim(raw_tag) <> ''
  GROUP BY 1
  ORDER BY (COUNT(*) * 0.5 + COALESCE(SUM(vote_count), 0) * 0.5) DESC, COUNT(*) DESC
  LIMIT GREATEST(COALESCE(p_limit, 8), 1);
$$;


ALTER FUNCTION "public"."get_trending_topics"("p_limit" integer, "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_comment_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."handle_comment_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_comment_vote_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'comment' THEN
    UPDATE public.comments SET vote_count = vote_count + NEW.vote_direction
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.target_type = 'comment' THEN
    UPDATE public.comments SET vote_count = vote_count - OLD.vote_direction + NEW.vote_direction
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'comment' THEN
    UPDATE public.comments SET vote_count = vote_count - OLD.vote_direction
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."handle_comment_vote_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_display_name TEXT;
  v_username TEXT;
  v_avatar_url TEXT;
  v_adjectives TEXT[] := ARRAY[
    'Quantum','Cosmic','Atomic','Nano','Photonic',
    'Magnetic','Electric','Thermal','Kinetic','Ionic',
    'Galvanic','Luminous','Resonant','Catalytic','Spectral',
    'Orbital','Sonic','Chaotic','Dynamic','Elastic',
    'Crystalline','Molten','Volatile','Radiant','Charged',
    'Spinning','Turbulent','Iridescent','Fluorescent','Holographic',
    'Cryogenic','Bold','Curious','Brave','Clever',
    'Swift','Mighty','Blazing','Drifting','Bouncy',
    'Fizzy','Sparkly','Glowing','Fuzzy','Zappy',
    'Groovy','Funky','Hyper','Epic','Wild'
  ];
  v_nouns TEXT[] := ARRAY[
    'Einstein','Curie','Newton','Tesla','Feynman',
    'Hawking','Darwin','Bohr','Planck','Faraday',
    'Maxwell','Schrodinger','Heisenberg','Dirac','Fermi',
    'Pauling','Mendeleev','Pasteur','Galileo','Kepler',
    'Euler','Gauss','Lorentz','Boltzmann','Rutherford',
    'Oppenheimer','Turing','Noether','Hooke','Kelvin',
    'Ampere','Volta','Joule','Hertz','Doppler',
    'Avogadro','Coulomb','Becquerel','Hubble','Sagan',
    'Meitner','Franklin','Laplace','Fourier','Gibbs',
    'Carnot','Chandrasekhar','Ramanujan','Lovelace','Archimedes'
  ];
BEGIN
  v_display_name :=
    v_adjectives[1 + floor(random() * array_length(v_adjectives, 1))::int]
    || v_nouns[1 + floor(random() * array_length(v_nouns, 1))::int]
    || (10 + floor(random() * 90))::text;

  v_username := public.generate_profile_username(v_display_name, NEW.id);

  v_avatar_url := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'avatar_url'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'picture'), ''),
    ''
  );

  INSERT INTO public.profiles (
    id, username, display_name, generated_display_name, anon_display_name,
    avatar_url, email, is_anonymous, profile_completed
  )
  VALUES (
    NEW.id,
    v_username,
    v_display_name,
    v_display_name,
    v_display_name,
    v_avatar_url,
    NEW.email,
    true,
    true
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_post_search_document"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.search_document := public.compute_post_search_document(
    NEW.title,
    NEW.content,
    NEW.tags,
    NEW.doi,
    NEW.arxiv_id,
    NEW.company
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_post_search_document"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_post_vote_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
    UPDATE public.posts SET vote_count = vote_count + NEW.vote_direction
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.target_type = 'post' THEN
    UPDATE public.posts SET vote_count = vote_count - OLD.vote_direction + NEW.vote_direction
    WHERE id = NEW.target_id;
  ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
    UPDATE public.posts SET vote_count = vote_count - OLD.vote_direction
    WHERE id = OLD.target_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."handle_post_vote_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_profile_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Allow service_role to update any field
  IF current_setting('request.jwt.claims', true)::json ->> 'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For non-service-role callers, restore protected fields to their original values
  NEW.karma := OLD.karma;
  NEW.orcid_id := OLD.orcid_id;
  NEW.orcid_name := OLD.orcid_name;
  NEW.orcid_verified_at := OLD.orcid_verified_at;
  NEW.is_bot := OLD.is_bot;
  NEW.email := OLD.email;
  NEW.generated_display_name := OLD.generated_display_name;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."protect_profile_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_post_ids"("p_query" "text", "p_section" "text" DEFAULT NULL::"text", "p_author_id" "uuid" DEFAULT NULL::"uuid", "p_tag" "text" DEFAULT NULL::"text", "p_sort" "text" DEFAULT 'hot'::"text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("post_id" "uuid", "rank" real, "created_at" timestamp with time zone, "vote_count" integer)
    LANGUAGE "sql" STABLE
    AS $$
  WITH normalized AS (
    SELECT trim(regexp_replace(coalesce(p_query, ''), '\\s+', ' ', 'g')) AS query
  ),
  tsq AS (
    SELECT
      query,
      plainto_tsquery('simple', query) AS ts_query
    FROM normalized
  ),
  ranked AS (
    SELECT
      p.id AS post_id,
      ts_rank_cd(p.search_document, t.ts_query) AS rank,
      p.created_at,
      p.vote_count
    FROM public.posts p
    CROSS JOIN tsq t
    WHERE t.query <> ''
      AND (
        p.search_document @@ t.ts_query
        OR lower(p.title) % lower(t.query)
      )
      AND (p_section IS NULL OR p.section = p_section)
      AND (p_author_id IS NULL OR p.author_id = p_author_id)
      AND (p_tag IS NULL OR p.tags @> ARRAY[p_tag]::text[])
  )
  SELECT
    ranked.post_id,
    ranked.rank,
    ranked.created_at,
    ranked.vote_count
  FROM ranked
  ORDER BY
    CASE WHEN p_sort = 'new' THEN ranked.created_at END DESC,
    CASE WHEN p_sort = 'top' THEN ranked.vote_count END DESC,
    CASE WHEN p_sort <> 'new' AND p_sort <> 'top' THEN ranked.rank END DESC,
    ranked.vote_count DESC,
    ranked.created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 20), 1)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;


ALTER FUNCTION "public"."search_post_ids"("p_query" "text", "p_section" "text", "p_author_id" "uuid", "p_tag" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_post_ids"("p_query" "text", "p_section" "text" DEFAULT NULL::"text", "p_author_id" "uuid" DEFAULT NULL::"uuid", "p_tag" "text" DEFAULT NULL::"text", "p_author_type" "text" DEFAULT NULL::"text", "p_sort" "text" DEFAULT 'hot'::"text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("post_id" "uuid", "rank" real, "created_at" timestamp with time zone, "vote_count" integer)
    LANGUAGE "sql" STABLE
    AS $$
  WITH normalized AS (
    SELECT trim(regexp_replace(coalesce(p_query, ''), '\s+', ' ', 'g')) AS query
  ),
  tsq AS (
    SELECT
      query,
      plainto_tsquery('simple', query) AS ts_query
    FROM normalized
  ),
  ranked AS (
    SELECT
      p.id AS post_id,
      ts_rank_cd(p.search_document, t.ts_query) AS rank,
      p.created_at,
      p.vote_count
    FROM public.posts p
    CROSS JOIN tsq t
    LEFT JOIN public.profiles prof ON prof.id = p.author_id
    WHERE t.query <> ''
      AND (
        p.search_document @@ t.ts_query
        OR lower(p.title) % lower(t.query)
      )
      AND (p_section IS NULL OR p.section = p_section)
      AND (p_author_id IS NULL OR p.author_id = p_author_id)
      AND (p_tag IS NULL OR p.tags @> ARRAY[p_tag]::text[])
      AND (p_author_type IS NULL
           OR (p_author_type = 'bot' AND prof.is_bot = true)
           OR (p_author_type = 'human' AND prof.is_bot = false))
  )
  SELECT
    ranked.post_id,
    ranked.rank,
    ranked.created_at,
    ranked.vote_count
  FROM ranked
  ORDER BY
    CASE WHEN p_sort = 'new' THEN ranked.created_at END DESC,
    CASE WHEN p_sort = 'top' THEN ranked.vote_count END DESC,
    CASE WHEN p_sort <> 'new' AND p_sort <> 'top' THEN ranked.rank END DESC,
    ranked.vote_count DESC,
    ranked.created_at DESC
  LIMIT GREATEST(COALESCE(p_limit, 20), 1)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;


ALTER FUNCTION "public"."search_post_ids"("p_query" "text", "p_section" "text", "p_author_id" "uuid", "p_tag" "text", "p_author_type" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "parent_comment_id" "uuid",
    "depth" integer DEFAULT 0 NOT NULL,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    "vote_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "depth_limit" CHECK (("depth" <= 6))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "section" "text" NOT NULL,
    "type" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_anonymous" boolean DEFAULT false NOT NULL,
    "vote_count" integer DEFAULT 0 NOT NULL,
    "comment_count" integer DEFAULT 0 NOT NULL,
    "doi" "text",
    "arxiv_id" "text",
    "url" "text",
    "flair" "text",
    "project_url" "text",
    "tech_stack" "text"[] DEFAULT '{}'::"text"[],
    "showcase_type" "text",
    "company" "text",
    "location" "text",
    "job_type" "text",
    "application_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_document" "tsvector",
    "deadline" timestamp with time zone,
    CONSTRAINT "posts_flair_check" CHECK (("flair" = ANY (ARRAY['discussion'::"text", 'question'::"text", 'career'::"text", 'news'::"text"]))),
    CONSTRAINT "posts_job_type_check" CHECK (("job_type" = ANY (ARRAY['full-time'::"text", 'part-time'::"text", 'contract'::"text", 'remote'::"text", 'internship'::"text", 'postdoc'::"text", 'phd'::"text"]))),
    CONSTRAINT "posts_section_check" CHECK (("section" = ANY (ARRAY['papers'::"text", 'forum'::"text", 'showcase'::"text", 'jobs'::"text"]))),
    CONSTRAINT "posts_showcase_type_check" CHECK (("showcase_type" = ANY (ARRAY['tool'::"text", 'dataset'::"text", 'model'::"text", 'library'::"text", 'workflow'::"text"]))),
    CONSTRAINT "posts_type_check" CHECK (("type" = ANY (ARRAY['text'::"text", 'link'::"text", 'paper'::"text", 'showcase'::"text", 'job'::"text"])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."posts"."deadline" IS 'Application deadline for job postings';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "display_name" "text" DEFAULT 'Anonymous Researcher'::"text" NOT NULL,
    "generated_display_name" "text",
    "avatar_url" "text" DEFAULT ''::"text",
    "email" "text",
    "orcid_id" "text",
    "orcid_name" "text",
    "orcid_verified_at" timestamp with time zone,
    "bio" "text",
    "karma" integer DEFAULT 0 NOT NULL,
    "is_anonymous" boolean DEFAULT true NOT NULL,
    "profile_completed" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "anon_display_name" "text",
    "anon_avatar_url" "text" DEFAULT ''::"text",
    "is_bot" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."is_anonymous" IS 'DEPRECATED: Identity mode is now theme-driven. Retained for backward compat.';



CREATE TABLE IF NOT EXISTS "public"."votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "vote_direction" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "votes_target_type_check" CHECK (("target_type" = ANY (ARRAY['post'::"text", 'comment'::"text"]))),
    CONSTRAINT "votes_vote_direction_check" CHECK (("vote_direction" = ANY (ARRAY['-1'::integer, 1])))
);


ALTER TABLE "public"."votes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_orcid_id_key" UNIQUE ("orcid_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_user_id_target_type_target_id_key" UNIQUE ("user_id", "target_type", "target_id");



CREATE INDEX "idx_comments_author_created_at" ON "public"."comments" USING "btree" ("author_id", "created_at" DESC);



CREATE INDEX "idx_comments_author_id" ON "public"."comments" USING "btree" ("author_id");



CREATE INDEX "idx_comments_created_at" ON "public"."comments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_comments_parent_comment_id" ON "public"."comments" USING "btree" ("parent_comment_id") WHERE ("parent_comment_id" IS NOT NULL);



CREATE INDEX "idx_comments_post_created_at" ON "public"."comments" USING "btree" ("post_id", "created_at" DESC);



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE UNIQUE INDEX "idx_posts_arxiv_id_author" ON "public"."posts" USING "btree" ("arxiv_id", "author_id") WHERE ("arxiv_id" IS NOT NULL);



CREATE INDEX "idx_posts_author_created_at" ON "public"."posts" USING "btree" ("author_id", "created_at" DESC);



CREATE INDEX "idx_posts_author_id" ON "public"."posts" USING "btree" ("author_id");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_search_document" ON "public"."posts" USING "gin" ("search_document");



CREATE INDEX "idx_posts_section" ON "public"."posts" USING "btree" ("section");



CREATE INDEX "idx_posts_section_created_at" ON "public"."posts" USING "btree" ("section", "created_at" DESC);



CREATE INDEX "idx_posts_section_vote_count_created_at" ON "public"."posts" USING "btree" ("section", "vote_count" DESC, "created_at" DESC);



CREATE INDEX "idx_posts_tags" ON "public"."posts" USING "gin" ("tags");



CREATE INDEX "idx_posts_title_trgm" ON "public"."posts" USING "gin" ("lower"("title") "public"."gin_trgm_ops");



CREATE INDEX "idx_posts_vote_count" ON "public"."posts" USING "btree" ("vote_count" DESC);



CREATE INDEX "idx_posts_vote_count_created_at" ON "public"."posts" USING "btree" ("vote_count" DESC, "created_at" DESC);



CREATE UNIQUE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email") WHERE ("email" IS NOT NULL);



CREATE INDEX "idx_profiles_is_bot" ON "public"."profiles" USING "btree" ("id") WHERE ("is_bot" = true);



CREATE INDEX "idx_profiles_orcid_id" ON "public"."profiles" USING "btree" ("orcid_id") WHERE ("orcid_id" IS NOT NULL);



CREATE INDEX "idx_votes_target" ON "public"."votes" USING "btree" ("target_type", "target_id");



CREATE INDEX "idx_votes_user_id" ON "public"."votes" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "on_comment_count_changed" AFTER INSERT OR DELETE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_comment_count"();



CREATE OR REPLACE TRIGGER "on_comment_updated" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_post_search_document" BEFORE INSERT OR UPDATE OF "title", "content", "tags", "doi", "arxiv_id", "company" ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_post_search_document"();



CREATE OR REPLACE TRIGGER "on_post_updated" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_profile_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_vote_changed_comments" AFTER INSERT OR DELETE OR UPDATE ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_comment_vote_count"();



CREATE OR REPLACE TRIGGER "on_vote_changed_posts" AFTER INSERT OR DELETE OR UPDATE ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_post_vote_count"();



CREATE OR REPLACE TRIGGER "on_vote_updated" BEFORE UPDATE ON "public"."votes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "protect_profile_fields_trigger" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."protect_profile_fields"();



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can create comments" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Authenticated users can create posts" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Comments are viewable by everyone" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Posts are viewable by everyone" ON "public"."posts" FOR SELECT USING (true);



CREATE POLICY "Profiles are publicly readable" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can create votes" ON "public"."votes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own comments" ON "public"."comments" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can delete their own posts" ON "public"."posts" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can delete their own votes" ON "public"."votes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own comments" ON "public"."comments" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update their own posts" ON "public"."posts" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can update their own votes" ON "public"."votes" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view all votes" ON "public"."votes" FOR SELECT USING (true);



ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."compute_post_search_document"("p_title" "text", "p_content" "text", "p_tags" "text"[], "p_doi" "text", "p_arxiv_id" "text", "p_company" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."compute_post_search_document"("p_title" "text", "p_content" "text", "p_tags" "text"[], "p_doi" "text", "p_arxiv_id" "text", "p_company" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_post_search_document"("p_title" "text", "p_content" "text", "p_tags" "text"[], "p_doi" "text", "p_arxiv_id" "text", "p_company" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_profile_username"("p_seed" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_profile_username"("p_seed" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_profile_username"("p_seed" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_materialists"("p_limit" integer, "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_materialists"("p_limit" integer, "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_materialists"("p_limit" integer, "p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_trending_topics"("p_limit" integer, "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_trending_topics"("p_limit" integer, "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_trending_topics"("p_limit" integer, "p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_comment_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_comment_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_comment_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_comment_vote_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_comment_vote_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_comment_vote_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_post_search_document"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_post_search_document"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_post_search_document"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_post_vote_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_post_vote_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_post_vote_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_profile_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_profile_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_profile_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_post_ids"("p_query" "text", "p_section" "text", "p_author_id" "uuid", "p_tag" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_post_ids"("p_query" "text", "p_section" "text", "p_author_id" "uuid", "p_tag" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_post_ids"("p_query" "text", "p_section" "text", "p_author_id" "uuid", "p_tag" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_post_ids"("p_query" "text", "p_section" "text", "p_author_id" "uuid", "p_tag" "text", "p_author_type" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_post_ids"("p_query" "text", "p_section" "text", "p_author_id" "uuid", "p_tag" "text", "p_author_type" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_post_ids"("p_query" "text", "p_section" "text", "p_author_id" "uuid", "p_tag" "text", "p_author_type" "text", "p_sort" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."votes" TO "anon";
GRANT ALL ON TABLE "public"."votes" TO "authenticated";
GRANT ALL ON TABLE "public"."votes" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();



