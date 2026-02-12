-- Remove onboarding dependency by auto-generating friendly usernames on signup.
-- Also backfill legacy anon_* usernames and mark existing profiles complete.

CREATE OR REPLACE FUNCTION public.generate_profile_username(p_seed text, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_display_name TEXT;
  v_avatar_url TEXT;
  v_username TEXT;
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
    id, username, display_name, generated_display_name,
    avatar_url, email, is_anonymous, profile_completed
  )
  VALUES (
    NEW.id,
    v_username,
    v_display_name,
    v_display_name,
    v_avatar_url,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'is_anonymous')::boolean, true),
    true
  );

  RETURN NEW;
END;
$$;

ALTER TABLE public.profiles
ALTER COLUMN profile_completed SET DEFAULT true;

UPDATE public.profiles
SET profile_completed = true
WHERE profile_completed = false;

DO $$
DECLARE
  rec record;
  v_seed text;
  v_username text;
BEGIN
  FOR rec IN
    SELECT id, username, display_name, generated_display_name, email
    FROM public.profiles
    WHERE username ~ '^anon_[0-9a-f]{8}$'
       OR username IS NULL
       OR length(trim(username)) = 0
  LOOP
    v_seed := COALESCE(
      NULLIF(rec.generated_display_name, ''),
      NULLIF(rec.display_name, ''),
      NULLIF(split_part(COALESCE(rec.email, ''), '@', 1), ''),
      'researcher'
    );
    v_username := public.generate_profile_username(v_seed, rec.id);

    UPDATE public.profiles
    SET username = v_username
    WHERE id = rec.id;
  END LOOP;
END;
$$;
