# Frontend passkey sign-in and setup

The Laravel backend exposes passkey authentication through Fortify. The passkey
feature is enabled, the `passkeys` table migration is applied, and the backend
uses the `web` session guard.

These examples assume a React Router v7 framework-mode application with
server-side rendering disabled and Axios for application HTTP requests.

## Backend environment

Set the frontend origin in the backend environment. Multiple origins may be
comma-separated:

```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
PASSKEYS_RELYING_PARTY_ID=localhost
```

`PASSKEYS_RELYING_PARTY_ID` should be the frontend's effective domain, without
the scheme or port. In production, serve the frontend over HTTPS. Browsers
allow WebAuthn on `localhost` during local development, but not on an
arbitrary insecure domain.

## Install the client

```bash
npm install @laravel/passkeys
```

The package uses the browser WebAuthn API and handles the options and credential
JSON conversion required by Laravel.

## Configure Axios and passkey requests

The frontend and backend must share the Laravel session. Configure one Axios
instance with the backend URL and cookies:

```js
// app/lib/api.client.js
import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
    withCredentials: true,
    headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    },
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
});
```

Before login, registration, password confirmation, or passkey management,
request the Sanctum CSRF cookie:

```js
import { api } from "./api.client";

export async function initializeAuth() {
    await api.get("/sanctum/csrf-cookie");
}
```

Call `initializeAuth()` from a client-only route/component before submitting
authentication actions. Axios then reads the `XSRF-TOKEN` cookie and sends the
`X-XSRF-TOKEN` header for state-changing requests.

The `@laravel/passkeys` client uses the browser `fetch` API rather than Axios.
Configure its fetch calls to include the Laravel session cookie:

```js
// app/lib/passkeys.client.js
import { Passkeys } from "@laravel/passkeys";

Passkeys.configure({
    fetch: {
        credentials: "include",
        headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
        },
    },
});

export { Passkeys };
```

Keep this module client-only. In React Router v7 framework mode with
`ssr: false`, import it from browser event handlers or client-side components,
not from server loaders or server-only modules.

## Add or set up a passkey on an account

The user must already be signed in before a passkey can be added. The setup
flow is:

1. The user signs in with a password or an existing passkey.
2. The frontend calls `initializeAuth()` if the CSRF cookie has not been loaded.
3. The user opens **Account security** and chooses **Add passkey**.
4. Ask the user to confirm their password if the application has not recently
   confirmed it. The backend has `confirmPassword` enabled for passkey
   management, so registration requests require Laravel's password-confirmed
   session state.
5. Ask for a recognizable passkey name, such as `Work laptop` or `iPhone`.
6. Start the browser's native passkey prompt:

```js
import { Passkeys } from "./passkeys.client";

export async function addPasskey(name) {
    const trimmedName = name.trim();

    if (!trimmedName) {
        throw new Error("Enter a name for this passkey.");
    }

    return Passkeys.register({ name: trimmedName });
}
```

7. The user chooses where to save the credential, then completes the device
   biometric, PIN, or screen-lock prompt.
8. Show a success message and refresh the passkey list. The registration
   request uses:

- `GET /user/passkeys/options`
- `POST /user/passkeys`

If the user cancels the native prompt, leave the account unchanged and allow
them to retry. The passkey name is only a label; it is not the passkey secret.
Never ask the user to copy, export, or send passkey credential data.

To display existing passkeys, call the authenticated list endpoint:

```js
const { data } = await api.get("/user/passkeys");
// data.passkeys: [{ id, name, last_used_at, created_at }]
```

The list intentionally does not return credential public-key data. To remove a
passkey or rename it, use its ID:

```js
await api.patch(`/user/passkeys/${passkeyId}`, {
    name: "Personal laptop",
});
```

The rename endpoint is `PATCH /user/passkeys/{passkey}`. It changes only the
display label; the credential itself remains unchanged. To delete the passkey:

```js
await api.delete(`/user/passkeys/${passkeyId}`);
```

The delete endpoint is `DELETE /user/passkeys/{passkey}` and requires an
authenticated session. Listing and renaming use the password-confirmed
management session; complete password confirmation before those actions.

## Sign in with a passkey

```js
import { Passkeys } from "./passkeys.client";

async function signInWithPasskey() {
    try {
        const response = await Passkeys.verify({ remember: true });

        if (response.redirect) {
            window.location.assign(response.redirect);
        }
    } catch (error) {
        // Show a retry message for a cancelled or failed browser prompt.
        console.error("Passkey sign-in failed", error);
    }
}
```

In a React Router v7 framework route, check browser support in a client-side
effect or event handler. Do not access `window`, `navigator`, or WebAuthn APIs
from a server loader:

```js
import { useEffect, useState } from "react";
import { Passkeys } from "./passkeys.client";

export function PasskeyButton() {
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        setIsSupported(Passkeys.isSupported());
    }, []);

    if (!isSupported) {
        return null;
    }

    return <button type="button" onClick={signInWithPasskey}>
        Sign in with passkey
    </button>;
}
```

For passkey autofill, mount a username/email input before starting the
ceremony:

```html
<input type="email" autocomplete="email webauthn" />
<button type="button" onclick="signInWithPasskey()">
    Sign in with passkey
</button>
```

`Passkeys.verify()` calls these backend endpoints:

- `GET /passkeys/login/options`
- `POST /passkeys/login`

The successful login creates the Laravel session. Use the configured Axios
instance for subsequent API requests; its `withCredentials: true` setting
includes the session cookie. The backend returns a frontend URL such as
`http://localhost:5173/home`, not a Laravel backend URL.

## Error handling

The client exposes typed errors such as `NotSupportedError`,
`UserCancelledError`, `InvalidDomainError`, and `ServerError`. Treat a `419`
response as an expired CSRF/session state and ask the user to reload or repeat
the CSRF-cookie request. A domain/origin error means `FRONTEND_URL`,
`PASSKEYS_RELYING_PARTY_ID`, and the browser URL do not match.

## Manage passkeys (UPDATED ADDED)

The backend supports listing, registering, renaming, and deleting passkeys.

Delete a passkey from the account security screen after confirming the user
intends to remove it:

```js
import { api } from "./api.client";

export async function deletePasskey(passkeyId) {
    await api.delete(`/user/passkeys/${passkeyId}`);
}
```

The request is sent to `DELETE /user/passkeys/{passkey}` and requires the user
to be authenticated. Because passkey management has password confirmation
enabled, the password-confirmed session must still be valid.

After deletion, remove the item from the local UI only after the request
succeeds, then offer **Add passkey** so the user can register a replacement.
Do not delete the user's last passkey without warning them that they will need
another sign-in method to access the account.
