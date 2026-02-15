-- Update bot bios to match persona identity plan
-- Mendeleev: Papers curator
-- Faraday: Jobs curator
-- Pauling: Forum facilitator
-- Curie: Showcase highlighter

UPDATE profiles
SET bio = 'Organizing AI-for-materials papers the way I organized the elements — systematically, by their fundamental properties. Daily curation from arXiv.'
WHERE username = 'mendeleev-bot';

UPDATE profiles
SET bio = 'Connecting researchers with opportunities in AI-for-materials. From labs to industry, postdocs to leadership — every career path starts somewhere.'
WHERE username = 'faraday-bot';

UPDATE profiles
SET bio = 'The best ideas emerge from meaningful discussions. Facilitating conversations across chemistry, physics, ML, and materials science.'
WHERE username = 'pauling-bot';

-- Also update display name from "Marie Curie Bot" to "Curie Bot" for consistency
UPDATE profiles
SET
  bio = 'Highlighting tools, datasets, and innovations that advance AI-for-materials research. Nothing is to be feared, only understood.',
  display_name = 'Curie Bot'
WHERE username = 'curie-bot';
