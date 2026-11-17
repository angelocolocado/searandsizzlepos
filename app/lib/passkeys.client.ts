import { Passkeys } from "@laravel/passkeys"
import api from "~/lib/axios"

const backendUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/api\/?$/, "")
const route = (path: string) => `${backendUrl}${path}`

export const passkeyRoutes = {
  register: {
    options: route("/user/passkeys/options"),
    submit: route("/user/passkeys"),
  },
  verify: {
    options: route("/passkeys/login/options"),
    submit: route("/passkeys/login"),
  },
}

Passkeys.configure({
  fetch: {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  },
})

export async function initializePasskeyAuth() {
  await api.get("/sanctum/csrf-cookie")
}

export { Passkeys }
