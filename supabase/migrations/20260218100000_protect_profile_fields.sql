-- Protect trusted profile fields from client-side tampering.
-- Only the service_role (admin client) can modify these fields.
-- Regular users can only update non-protected fields via RLS-allowed updates.

CREATE OR REPLACE FUNCTION protect_profile_fields()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_profile_fields_trigger ON profiles;

CREATE TRIGGER protect_profile_fields_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_fields();
