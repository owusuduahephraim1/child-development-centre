-- CDC media publication invariants. Tested on a Neon temporary branch before production application.
ALTER TABLE public.media_videos
  ADD CONSTRAINT media_videos_publish_approval_chk
  CHECK (is_published = false OR publication_approved = true);

ALTER TABLE public.gallery_media
  ADD CONSTRAINT gallery_media_publication_chk
  CHECK (
    visibility <> 'public'
    OR (
      publication_approved = true
      AND (child_identifiable = false OR consent_confirmed = true)
    )
  );
