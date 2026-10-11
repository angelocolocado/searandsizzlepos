import axios from "axios"
import { toast } from "sonner"
import api from "~/lib/axios"

function getLogoutErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === "string") return message
  }

  return "Unable to sign out. Please try again."
}

export async function clientAction() {
  const requestPromise = api.post("/logout")

  toast.promise(requestPromise, {
    loading: "Signing you out...",
    success: "You have been signed out.",
    error: getLogoutErrorMessage,
  })

  try {
    await requestPromise
    return { success: true }
  } catch (error) {
    return { success: false, message: getLogoutErrorMessage(error) }
  }
}

export default function Logout() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Signing you out...</p>
    </main>
  )
}
