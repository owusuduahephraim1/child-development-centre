CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid NOT NULL,
  email text NOT NULL,
  display_name text,
  role text DEFAULT 'content_admin'::text NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text,
  description text,
  goal_amount numeric(14,2),
  amount_raised numeric(14,2) DEFAULT 0 NOT NULL,
  currency text DEFAULT 'GHS'::text NOT NULL,
  deadline date,
  beneficiaries text,
  related_program_id uuid,
  related_project_id uuid,
  status text DEFAULT 'draft'::text NOT NULL,
  cover_image_url text,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  category text NOT NULL,
  name text,
  email text,
  details text NOT NULL,
  is_safeguarding boolean DEFAULT false NOT NULL,
  status text DEFAULT 'new'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  category text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'new'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  reference_code text,
  phone text,
  subject text,
  admin_notes text,
  responded_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  category text,
  description text,
  public_url text,
  storage_path text,
  is_public boolean DEFAULT false NOT NULL,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.donation_activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  intent_id uuid,
  donation_id uuid,
  action text NOT NULL,
  note text,
  actor_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.donation_designations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.donation_intents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text,
  email text NOT NULL,
  designation text NOT NULL,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL,
  status text DEFAULT 'interest'::text NOT NULL,
  provider_reference text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  reference_code text,
  phone text,
  donation_type text DEFAULT 'one_time'::text NOT NULL,
  preferred_method text,
  donor_id uuid,
  admin_notes text,
  last_contacted_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.donation_payment_attempts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  intent_id uuid NOT NULL,
  provider text NOT NULL,
  provider_reference text NOT NULL,
  expected_amount numeric(14,2) NOT NULL,
  expected_currency text NOT NULL,
  status text DEFAULT 'initialized'::text NOT NULL,
  authorization_url text,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.donation_payment_methods (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  method_type text DEFAULT 'manual'::text NOT NULL,
  public_instructions text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  provider_code text,
  online_enabled boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS public.donations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  donor_id uuid,
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL,
  designation text,
  status text DEFAULT 'pending'::text NOT NULL,
  provider text,
  provider_reference text,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  intent_id uuid,
  receipt_number text,
  payment_method text,
  received_at timestamp with time zone,
  verified_by uuid,
  internal_notes text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.donors (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text,
  email text,
  phone text,
  country text,
  consent boolean DEFAULT false NOT NULL,
  anonymous_preference boolean DEFAULT false NOT NULL,
  internal_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  donor_number text,
  source_intent_id uuid
);

CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text,
  description text,
  event_date timestamp with time zone,
  end_date timestamp with time zone,
  location text,
  organiser text,
  registration_url text,
  related_program_id uuid,
  related_project_id uuid,
  status text DEFAULT 'draft'::text NOT NULL,
  cover_image_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.gallery_albums (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  category text,
  short_description text,
  description text,
  cover_image_url text,
  event_date date,
  location text,
  organisation_type text DEFAULT 'general'::text NOT NULL,
  related_program_id uuid,
  related_project_id uuid,
  related_event_id uuid,
  is_featured boolean DEFAULT false NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  privacy_level text DEFAULT 'public'::text NOT NULL,
  slideshow_interval integer DEFAULT 5 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.gallery_media (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  album_id uuid NOT NULL,
  image_url text NOT NULL,
  storage_path text,
  thumbnail_url text,
  caption text,
  alt_text text,
  credit text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  publication_approved boolean DEFAULT false NOT NULL,
  consent_confirmed boolean DEFAULT false NOT NULL,
  child_identifiable boolean DEFAULT false NOT NULL,
  visibility text DEFAULT 'private'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  image_url text NOT NULL,
  storage_path text,
  alt_text text,
  caption text,
  sort_order integer DEFAULT 0 NOT NULL,
  publication_approved boolean DEFAULT false NOT NULL,
  child_identifiable boolean DEFAULT false NOT NULL,
  consent_confirmed boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.impact_statistics (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  year integer,
  category text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.intervention_areas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text,
  summary text,
  description text,
  icon text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leadership (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  title text NOT NULL,
  organisation_type text DEFAULT 'ngo'::text NOT NULL,
  bio text,
  photo_url text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.media_videos (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  description text DEFAULT ''::text NOT NULL,
  category text DEFAULT 'Appreciation'::text NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text DEFAULT ''::text NOT NULL,
  organisation_type text DEFAULT 'ngo'::text NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  publication_approved boolean DEFAULT false NOT NULL,
  child_identifiable boolean DEFAULT false NOT NULL,
  consent_confirmed boolean DEFAULT false NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid,
  updated_by uuid,
  storage_provider text DEFAULT 'external'::text NOT NULL,
  storage_key text DEFAULT ''::text NOT NULL,
  original_filename text DEFAULT ''::text NOT NULL,
  mime_type text DEFAULT ''::text NOT NULL,
  file_size_bytes bigint DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.news_articles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text,
  excerpt text,
  body text,
  category text,
  cover_image_url text,
  status text DEFAULT 'draft'::text NOT NULL,
  published_at timestamp with time zone,
  seo_title text,
  meta_description text,
  og_image text,
  organisation_type text DEFAULT 'ngo'::text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  consent_at timestamp with time zone DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  name text,
  source text DEFAULT 'website'::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  unsubscribed_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.partners (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  logo_url text,
  description text,
  category text,
  website_url text,
  start_date date,
  status text DEFAULT 'active'::text NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.programs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text,
  summary text,
  description text,
  objectives text,
  target_beneficiaries text,
  age_group text,
  location text,
  start_date date,
  end_date date,
  status text DEFAULT 'draft'::text NOT NULL,
  organisation_type text DEFAULT 'ngo'::text NOT NULL,
  funding_requirement numeric(14,2),
  funding_received numeric(14,2),
  progress integer,
  outcomes text,
  sdgs text[],
  cover_image_url text,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text,
  summary text,
  description text,
  category text,
  location text,
  beneficiaries text,
  start_date date,
  expected_completion date,
  completion_date date,
  budget numeric(14,2),
  funding_requirement numeric(14,2),
  funding_received numeric(14,2),
  partners text,
  objectives text,
  activities text,
  milestones text,
  progress integer,
  impact_results text,
  status text DEFAULT 'draft'::text NOT NULL,
  cover_image_url text,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.scholarship_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  applicant_reference text NOT NULL,
  program_id uuid,
  education_level text,
  status text DEFAULT 'new'::text NOT NULL,
  private_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.school_profile (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  school_name text DEFAULT 'Nipe International School'::text NOT NULL,
  tagline text,
  description text,
  history text,
  educational_mission text,
  website_url text,
  logo_url text,
  admissions_url text,
  contact_email text,
  contact_phone text,
  relationship_description text DEFAULT 'Nipe International School is the educational institution of Child Development Centre.'::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.supporter_recognition (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  display_name text,
  organisation_name text,
  supporter_type text DEFAULT 'supporter'::text NOT NULL,
  contribution_area text,
  recognition_message text,
  image_url text,
  website_url text,
  sort_order integer DEFAULT 0 NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  recognition_consent boolean DEFAULT false NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.volunteer_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  skills text,
  area_of_interest text,
  availability text,
  safeguarding_agreement boolean DEFAULT false NOT NULL,
  cv_storage_path text,
  status text DEFAULT 'new'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.website_settings (
  key text NOT NULL,
  value text DEFAULT ''::text NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);
