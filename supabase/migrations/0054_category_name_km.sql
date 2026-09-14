-- Categories only ever had one "name" (English). To show categories in
-- Khmer when the site is switched to ខ្មែរ, they need their own Khmer
-- name -- falls back to the English name until an admin fills it in, so
-- nothing breaks for existing categories.
alter table categories add column if not exists name_km text;
