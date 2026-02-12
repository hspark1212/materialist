-- Anonymous identity columns for dual-profile system (light=verified, dark=anonymous)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS anon_display_name TEXT,
  ADD COLUMN IF NOT EXISTS anon_avatar_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS anon_bio TEXT;

UPDATE public.profiles
  SET anon_display_name = generated_display_name
  WHERE anon_display_name IS NULL AND generated_display_name IS NOT NULL;

COMMENT ON COLUMN public.profiles.is_anonymous IS
  'DEPRECATED: Identity mode is now theme-driven. Retained for backward compat.';
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
