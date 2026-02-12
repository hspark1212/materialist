-- =============================================================================
-- Initial schema: profiles, posts, comments, votes
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Utility functions
-- ---------------------------------------------------------------------------

-- Auto-update updated_at on any table
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Auto-create profile on signup
-- Generates a fun pseudonym: AdjectiveScientistNN (200K combinations)
-- Extracts OAuth avatar (Google picture / GitHub avatar_url)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_display_name TEXT;
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

  v_avatar_url := COALESCE(
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'avatar_url'), ''),
    NULLIF(btrim(NEW.raw_user_meta_data ->> 'picture'), ''),
    ''
  );

  INSERT INTO public.profiles (
    id, username, display_name, generated_display_name,
    avatar_url, email, is_anonymous
  )
  VALUES (
    NEW.id,
    'anon_' || substr(NEW.id::text, 1, 8),
    v_display_name,
    v_display_name,
    v_avatar_url,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'is_anonymous')::boolean, true)
  );
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. profiles
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Anonymous Researcher',
  generated_display_name TEXT,
  avatar_url TEXT DEFAULT '',

  -- Contact
  email TEXT,

  -- ORCID
  orcid_id TEXT UNIQUE,
  orcid_name TEXT,
  orcid_verified_at TIMESTAMPTZ,

  -- Profile metadata
  institution TEXT,
  bio TEXT,
  karma INTEGER NOT NULL DEFAULT 0,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,

  -- Affiliation details
  position TEXT,
  department TEXT,
  country TEXT,
  website_url TEXT,
  research_interests TEXT[] DEFAULT '{}',

  -- Onboarding
  profile_completed BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_orcid_id
  ON public.profiles(orcid_id) WHERE orcid_id IS NOT NULL;

CREATE INDEX idx_profiles_profile_completed
  ON public.profiles(profile_completed) WHERE profile_completed = false;

CREATE UNIQUE INDEX idx_profiles_email
  ON public.profiles(email) WHERE email IS NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 3. posts
-- ---------------------------------------------------------------------------

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('papers', 'forum', 'showcase', 'jobs')),
  type TEXT NOT NULL CHECK (type IN ('text', 'link', 'paper', 'showcase', 'job')),

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  vote_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,

  -- Paper-specific fields
  doi TEXT,
  arxiv_id TEXT,
  url TEXT,

  -- Forum-specific fields
  flair TEXT CHECK (flair IN ('discussion', 'question', 'career', 'news')),

  -- Showcase-specific fields
  project_url TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  showcase_type TEXT CHECK (showcase_type IN ('tool', 'dataset', 'model', 'library', 'workflow')),

  -- Job-specific fields
  company TEXT,
  location TEXT,
  job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'remote', 'internship', 'postdoc', 'phd')),
  application_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_section ON public.posts(section);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_vote_count ON public.posts(vote_count DESC);
CREATE INDEX idx_posts_tags ON public.posts USING GIN(tags);

CREATE TRIGGER on_post_updated
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- 4. comments
-- ---------------------------------------------------------------------------

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  depth INTEGER NOT NULL DEFAULT 0,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT depth_limit CHECK (depth <= 6)
);

CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_parent_comment_id ON public.comments(parent_comment_id)
  WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_author_id ON public.comments(author_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

CREATE TRIGGER on_comment_updated
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-increment/decrement post.comment_count
CREATE OR REPLACE FUNCTION public.handle_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE TRIGGER on_comment_count_changed
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count();

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE TO authenticated
  USING (auth.uid() = author_id);

-- ---------------------------------------------------------------------------
-- 5. votes
-- ---------------------------------------------------------------------------

CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  vote_direction INTEGER NOT NULL CHECK (vote_direction IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, target_type, target_id)
);

CREATE INDEX idx_votes_target ON public.votes(target_type, target_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);

CREATE TRIGGER on_vote_updated
  BEFORE UPDATE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-update post.vote_count
CREATE OR REPLACE FUNCTION public.handle_post_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE TRIGGER on_vote_changed_posts
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_post_vote_count();

-- Auto-update comment.vote_count
CREATE OR REPLACE FUNCTION public.handle_comment_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE TRIGGER on_vote_changed_comments
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_vote_count();

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all votes"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Users can create votes"
  ON public.votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.votes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
