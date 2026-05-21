-- Fix: allow max_users to be NULL (meaning unlimited users).
-- Required for business_plus and enterprise plans where PLAN_CONFIG.maxUsers = null.
-- The NOT NULL constraint caused webhook UPDATEs to fail silently for those plans.
--
-- The existing DEFAULT 1 is preserved: new organizations still start on the free
-- plan with max_users = 1 until the webhook sets the correct value after checkout.

alter table organizations
  alter column max_users drop not null;
