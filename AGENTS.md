# Project Guidance

## User Preferences

- Antarmuka berbahasa Indonesia
- Desain bersih dan modern untuk katalog properti

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- Frontend commands run from src/frontend/ (pnpm install --prefer-offline, pnpm typecheck, pnpm fix, pnpm build); backend from src/backend/ (mops install, mops check --fix, mops build); bindings via pnpm bindgen from root.
- React Query hashes keys with JSON.stringify, which throws on bigint; serialize bigint filter fields (e.g. minPrice/maxPrice to strings) in a key-only helper while passing the real typed filter to the backend call.
- TanStack Router hash links need a matching element id in the rendered route; add the target sections to the page rather than leaving dangling anchors.
- Room photos use Storage.ExternalBlob from mo:caffeineai-object-storage/Storage; render them with photo.getDirectURL() and upload with ExternalBlob.fromBytes(bytes, type, name).withUploadProgress(cb).
- OQL manual-mode .payload(name, extract) needs the resolver modules for each payload return type (NatValue, TextValue, IntValue) imported top-level in the file declaring entities; a missing one surfaces as M0230 'Cannot determine implicit argument _toRow'.
- A Motoko query function cannot read the caller, so an admin-gated read must be a public shared ({caller}) func.
- This core-infrastructure version exports only useActor, useInternetIdentity and InternetIdentityProvider; build the auth boundary from useInternetIdentity (isAuthenticated covers restored sessions).
- Biome rejects role="status" on a div; use <output aria-live="polite"> for loading status regions.
- Admin access is not first-caller-wins only: src/backend/main.mo exposes claimAdmin(), which grants #admin to the env-configured ADMIN_PRINCIPAL or to the caller when no admin is assigned yet, and is idempotent for an existing admin. The frontend must call it: useAuth exposes claimAdmin (a React Query mutation that invalidates the ['isCallerAdmin'] query), and RequireAdmin/Layout render a 'Klaim akses admin' control for a signed-in non-admin.
- A Motoko migration function must be non-generic, so it cannot read canister environment variables; the actor body can read them with Runtime.envVar<system>(...) into a transient let, which is re-evaluated on every canister start and needs no migration or stable field.
- AccessControl.isAdmin(state, caller) traps 'User is not registered' for a non-anonymous unregistered caller, so a claim function must check the configured principal / adminAssigned flag before calling isAdmin on an unknown caller.
