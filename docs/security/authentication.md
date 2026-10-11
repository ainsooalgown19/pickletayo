# Authentication security

The active application uses Supabase Auth through server-aware Next.js clients. PickleTayo does not implement password hashing, access-token signing, or refresh-token storage itself. Password, verification, recovery, session duration, and abuse settings must be configured in Supabase and tested against the MVP security requirements.

Sessions are synchronized through secure cookies using the supported Supabase SSR flow. Server components and Route Handlers must validate the authenticated user with Supabase rather than trusting browser-provided profile or role data. Application roles and organization memberships are loaded and enforced server-side, with Row Level Security as defense in depth.

The publishable key may be used by browser code. Database passwords and the Supabase service-role key are server-only secrets and must never use a `NEXT_PUBLIC_*` name, enter a client bundle, or be logged.

Production requires HTTPS, deployment secret management, trusted redirect URLs, rate limiting, bot/abuse protection, monitored security events, audited privileged actions, and tested account recovery and deletion. Tokens, passwords, authorization headers, cookie contents, and service credentials must never be logged.

The previous custom Java JWT and refresh-token design is legacy reference only and is not the active authentication architecture.
