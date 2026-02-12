-- profile_completed is no longer used for onboarding routing.
-- Drop legacy partial index that only targeted profile_completed = false.
DROP INDEX IF EXISTS public.idx_profiles_profile_completed;
