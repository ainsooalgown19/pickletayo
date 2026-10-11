# OpenAPI

The active API is implemented by thin Next.js Route Handlers under `/api/v1`. Request and response schemas belong to their TypeScript business module and must be validated at the server boundary. Database rows and Supabase service responses are never returned directly.

An OpenAPI 3.1 document may be generated from the TypeScript schemas after the active Route Handlers exist. The former Spring `/v3/api-docs` and Swagger UI are legacy and are not part of the current architecture.

## Modular MVP endpoints

| Module | Public/player API | Management API |
| --- | --- | --- |
| Identity | `/api/v1/auth/**`, `/api/v1/account/**` where a server endpoint is required beyond Supabase Auth | Platform-administrator bootstrap is a server-only TypeScript operation. |
| Organization | — | `POST/GET /api/v1/organizations` (platform admin), `GET /api/v1/organizations/mine`. |
| Facility | `GET /api/v1/facilities`, `GET /api/v1/facilities/{id}`, `GET /api/v1/facilities/{id}/availability?date=YYYY-MM-DD&durationMinutes=60` | `GET/POST /api/v1/organizations/{organizationId}/facilities`, `PATCH /api/v1/facilities/{facilityId}/status`, `POST /api/v1/facilities/{facilityId}/courts`, `PUT /api/v1/facilities/{facilityId}/operating-hours`, `POST /api/v1/courts/{courtId}/rate-rules`, and `POST /api/v1/courts/{courtId}/availability-blocks`. |
| Booking | `POST /api/v1/bookings/holds`, `GET /api/v1/bookings`, `GET /api/v1/bookings/{id}`, and `DELETE /api/v1/bookings/{id}`. Payment submission remains pending. | `GET /api/v1/admin/bookings`, `POST /api/v1/admin/bookings/{id}/cancel`, and `POST /api/v1/admin/bookings/{id}/check-in`. |
| Notifications | `GET/PUT /api/v1/account/notification-preferences` | `POST /api/v1/internal/notifications/process` requires the server-only worker bearer secret. |

Booking hold creation requires an `Idempotency-Key` request header. Holds expire after 10 minutes and are lazily marked expired during booking operations. The database prevents overlapping active reservations.

Operator booking search is scoped to organizations the account owns or actively manages; platform administrators can search all organizations. Operator cancellation and check-in record the acting user and reason in booking status history.

The organization, facility, availability, hold, owned-booking history/detail, player cancellation, and operator booking paths listed above are implemented. Payment submission and manual operator booking remain desired product contracts.
