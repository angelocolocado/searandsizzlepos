import axios from "axios"
import { ServerError } from "@laravel/passkeys"
import { KeyRound, Pencil, Plus, Trash2, UserLock, UserRound } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useFetcher, useRevalidator } from "react-router"

import type { Route } from "./+types/profile"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group"
import { Spinner } from "~/components/ui/spinner"
import api from "~/lib/axios"
import { initializePasskeyAuth, Passkeys, passkeyRoutes } from "~/lib/passkeys.client"
import type { User } from "~/context/UserContext"

type Passkey = {
  id: string
  name: string
  last_used_at: string | null
  created_at: string
}

type PasskeysResponse = {
  passkeys: Passkey[]
}

type ProfileLoaderData = {
  user: User | null
  passkeys: Passkey[]
  error?: string
  requiresPasswordConfirmation?: boolean
}

type ProfileActionData = {
  success: boolean
  code?: number
  data?: {
    message?: string
  }
}

function passwordConfirmationRequired(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 423 &&
    error.response.data?.message === "Password confirmation required."
}

export async function clientLoader(): Promise<ProfileLoaderData> {
  try {
    const userResponse = await api.get<User>("user")

    try {
      const passkeysResponse = await api.get<PasskeysResponse>("/user/passkeys")

      return {
        user: userResponse.data,
        passkeys: passkeysResponse.data.passkeys ?? [],
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          user: userResponse.data,
          passkeys: [],
          error: error.response?.data?.message ?? "Unable to load your passkeys.",
          requiresPasswordConfirmation: passwordConfirmationRequired(error),
        }
      }

      return {
        user: userResponse.data,
        passkeys: [],
        error: "Unable to load your passkeys.",
      }
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        user: null,
        passkeys: [],
        error: error.response?.data?.message ?? "Unable to load your profile.",
      }
    }

    return {
      user: null,
      passkeys: [],
      error: "Unable to load your profile.",
    }
  }
}

export async function clientAction({ request }: Route.ClientActionArgs): Promise<ProfileActionData> {
  if (!["POST", "PATCH", "DELETE"].includes(request.method)) {
    return { success: false }
  }

  const formData = await request.formData()
  const data = Object.fromEntries(formData)

  switch (data.intent) {
    case "confirm-password":
      return handleConfirmPassword(data)
    case "rename-passkey":
      return handleRenamePasskey(data)
    case "delete-passkey":
      return handleDeletePasskey(data)
    default:
      return { success: false }
  }
}

async function handleRenamePasskey(data: any): Promise<ProfileActionData> {
  try {
    const requestPromise = api.patch(`/user/passkeys/${encodeURIComponent(String(data.id))}`, {
      name: String(data.name).trim(),
    })

    toast.promise(requestPromise, {
      loading: "Renaming passkey...",
      success: "Passkey renamed.",
      error: (error) =>
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        "Unable to rename this passkey.",
    })

    return { success: true, data: (await requestPromise).data }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return { success: false, code: error.response?.status, data: error.response?.data }
    }

    return { success: false }
  }
}

async function handleDeletePasskey(data: any): Promise<ProfileActionData> {
  try {
    const requestPromise = api.delete(`/user/passkeys/${encodeURIComponent(String(data.id))}`)

    toast.promise(requestPromise, {
      loading: "Removing passkey...",
      success: "Passkey removed.",
      error: (error) =>
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        "Unable to remove this passkey.",
    })

    return { success: true, data: (await requestPromise).data }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return { success: false, code: error.response?.status, data: error.response?.data }
    }

    return { success: false }
  }
}

async function handleConfirmPassword(data: any): Promise<ProfileActionData> {
  try {
    const requestPromise = api.post("/user/confirm-password", {
      password: String(data.password),
    })

    toast.promise(requestPromise, {
      loading: "Verifying password...",
      success: "Password verified.",
      error: (error) =>
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        "Unable to verify your password.",
    })

    return { success: true, data: (await requestPromise).data }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return { success: false, code: error.response?.status, data: error.response?.data }
    }

    return { success: false }
  }
}

export default function Profile({ loaderData }: Route.ComponentProps) {
  const passkeyFetcher = useFetcher<ProfileActionData>()
  const confirmPasswordFetcher = useFetcher<ProfileActionData>()
  const revalidator = useRevalidator()
  const [passkeys, setPasskeys] = useState(loaderData.passkeys)
  const [isSupported, setIsSupported] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<Passkey | null>(null)
  const [selectedPasskey, setSelectedPasskey] = useState<Passkey | null>(null)
  const [passkeyName, setPasskeyName] = useState("")
  const [password, setPassword] = useState("")
  const [isConfirmPasswordOpen, setIsConfirmPasswordOpen] = useState(
    Boolean(loaderData.requiresPasswordConfirmation)
  )
  const isMutating = passkeyFetcher.state !== "idle"
  const isConfirmingPassword = confirmPasswordFetcher.state !== "idle"
  const [lastMutation, setLastMutation] = useState<{ intent: string; id: string; name?: string } | null>(null)
  const handledPasswordConfirmation = useRef<ProfileActionData | null>(null)

  function openPasswordConfirmation() {
    setIsConfirmPasswordOpen(true)
  }

  useEffect(() => {
    setPasskeys(loaderData.passkeys)
  }, [loaderData.passkeys])

  useEffect(() => {
    setIsSupported(Passkeys.isSupported())
  }, [])

  useEffect(() => {
    if (passkeyFetcher.state !== "idle" || !passkeyFetcher.data?.success) return

    const intent = lastMutation?.intent
    const id = lastMutation?.id ?? ""

    if (intent === "delete-passkey") {
      setPasskeys((current) => current.filter((passkey) => passkey.id !== id))
    }

    if (intent === "rename-passkey") {
      setPasskeys((current) => current.map((passkey) =>
        passkey.id === id ? { ...passkey, name: lastMutation?.name ?? passkey.name } : passkey
      ))
      setIsRenameOpen(false)
    }
    setLastMutation(null)
  }, [lastMutation, passkeyFetcher.data, passkeyFetcher.state])

  useEffect(() => {
    if (passkeyFetcher.state !== "idle" || passkeyFetcher.data?.code !== 423) return

    openPasswordConfirmation()
  }, [passkeyFetcher.data, passkeyFetcher.state])

  useEffect(() => {
    if (confirmPasswordFetcher.state !== "idle" || !confirmPasswordFetcher.data) return

    if (
      confirmPasswordFetcher.data.success &&
      handledPasswordConfirmation.current !== confirmPasswordFetcher.data
    ) {
      handledPasswordConfirmation.current = confirmPasswordFetcher.data
      setPassword("")
      setIsConfirmPasswordOpen(false)
      revalidator.revalidate()
    }
  }, [
    confirmPasswordFetcher.data,
    confirmPasswordFetcher.state,
    revalidator,
  ])

  async function handleAddPasskey() {
    const name = passkeyName.trim()
    if (!name) {
      toast.error("Enter a name for this passkey.")
      return
    }

    try {
      setIsAdding(true)
      await initializePasskeyAuth()
      const passkey = await Passkeys.register({
        name,
        routes: passkeyRoutes.register,
      })
      setPasskeys((current) => [...current, {
        id: passkey.id,
        name: passkey.name,
        last_used_at: null,
        created_at: new Date().toISOString(),
      }])
      setPasskeyName("")
      setIsAddOpen(false)
      toast.success("Passkey added.")
    } catch (error) {
      if (error instanceof ServerError && error.status === 423) {
        openPasswordConfirmation()
        return
      }

      toast.error(error instanceof Error ? error.message : "Unable to add this passkey.")
    } finally {
      setIsAdding(false)
    }
  }

  function openRename(passkey: Passkey) {
    setSelectedPasskey(passkey)
    setPasskeyName(passkey.name)
    setIsRenameOpen(true)
  }

  function deletePasskey(passkey: Passkey) {
    setDeleteCandidate(passkey)
  }

  function confirmDeletePasskey() {
    if (!deleteCandidate) return

    setLastMutation({ intent: "delete-passkey", id: deleteCandidate.id })
    passkeyFetcher.submit(
      { intent: "delete-passkey", id: deleteCandidate.id },
      { method: "DELETE" },
    )
    setDeleteCandidate(null)
  }

  return (
    <main className="container mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">My profile</h1>
        <p className="text-muted-foreground">View your account details and manage your sign-in methods.</p>
      </div>

      {loaderData.error && (
        <p role="alert" className="text-sm text-destructive">{loaderData.error}</p>
      )}

      {loaderData.user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="size-5" /> Account details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-muted-foreground">Name</p><p>{loaderData.user.name}</p></div>
            <div><p className="text-sm text-muted-foreground">Username</p><p>{loaderData.user.username}</p></div>
            <div><p className="text-sm text-muted-foreground">Email</p><p>{loaderData.user.email}</p></div>
            <div><p className="text-sm text-muted-foreground">Account ID</p><p>{loaderData.user.id}</p></div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><KeyRound className="size-5" /> Passkeys</CardTitle>
            <CardDescription>Use a device biometric, PIN, or screen lock to sign in securely.</CardDescription>
          </div>
          {isSupported && (
            <Button type="button" onClick={() => setIsAddOpen(true)} disabled={isMutating}>
              <Plus /> Add passkey
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {passkeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No passkeys have been added.</p>
          ) : passkeys.map((passkey) => (
            <div key={passkey.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div>
                <p className="font-medium">{passkey.name}</p>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(passkey.created_at).toLocaleDateString()}
                  {passkey.last_used_at ? ` · Last used ${new Date(passkey.last_used_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="icon" aria-label={`Rename ${passkey.name}`} onClick={() => openRename(passkey)} disabled={isMutating}>
                  <Pencil />
                </Button>
                <Button type="button" variant="destructive" size="icon" aria-label={`Remove ${passkey.name}`} onClick={() => deletePasskey(passkey)} disabled={isMutating}>
                  {isMutating ? <Spinner /> : <Trash2 />}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {passkeyFetcher.data && !passkeyFetcher.data.success && (
        <p role="alert" className="text-sm text-destructive">
          {passkeyFetcher.data.data?.message ?? "Unable to update your passkeys."}
        </p>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add passkey</DialogTitle>
            <DialogDescription>Give this passkey a name so you can recognize it later.</DialogDescription>
          </DialogHeader>
          <Input value={passkeyName} onChange={(event) => setPasskeyName(event.target.value)} placeholder="Work laptop" autoFocus disabled={isAdding} />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" disabled={isAdding}>Cancel</Button>} />
            <Button type="button" onClick={handleAddPasskey} disabled={!passkeyName.trim() || isAdding}>
              {isAdding ? <Spinner /> : <Plus />}
              {isAdding ? "Adding passkey..." : "Add passkey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename passkey</DialogTitle>
            <DialogDescription>Update the label for this passkey.</DialogDescription>
          </DialogHeader>
          <Input value={passkeyName} onChange={(event) => setPasskeyName(event.target.value)} autoFocus disabled={isMutating} />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" disabled={isMutating}>Cancel</Button>} />
            <Button
              type="button"
              onClick={() => {
                if (!selectedPasskey) return
                setLastMutation({ intent: "rename-passkey", id: selectedPasskey.id, name: passkeyName.trim() })
                passkeyFetcher.submit(
                  { intent: "rename-passkey", id: selectedPasskey.id, name: passkeyName.trim() },
                  { method: "PATCH" },
                )
              }}
              disabled={!passkeyName.trim() || isMutating}
            >
              {isMutating ? <Spinner /> : <Pencil />}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isConfirmPasswordOpen}
        onOpenChange={(open) => {
          if (!isConfirmingPassword) setIsConfirmPasswordOpen(open)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Verify your password</DialogTitle>
            <DialogDescription>
              You need to verify your password before managing passkeys.
            </DialogDescription>
          </DialogHeader>
          <confirmPasswordFetcher.Form
            method="post"
            onSubmit={(event) => {
              if (!password.trim()) event.preventDefault()
            }}
          >
            <input type="hidden" name="intent" value="confirm-password" />
            <InputGroup className="rounded-sm">
              <InputGroupInput
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Current password"
                aria-label="Current password"
                disabled={isConfirmingPassword}
              />
              <InputGroupAddon>
                <UserLock />
              </InputGroupAddon>
            </InputGroup>
            {confirmPasswordFetcher.data && !confirmPasswordFetcher.data.success && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {confirmPasswordFetcher.data.data?.message ?? "Password verification failed."}
              </p>
            )}
            <DialogFooter className="mt-4">
              <DialogClose render={
                <Button type="button" variant="ghost" disabled={isConfirmingPassword}>
                  Cancel
                </Button>
              } />
              <Button type="submit" disabled={!password.trim() || isConfirmingPassword}>
                {isConfirmingPassword ? <Spinner /> : <KeyRound />}
                {isConfirmingPassword ? "Verifying..." : "Verify password"}
              </Button>
            </DialogFooter>
          </confirmPasswordFetcher.Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteCandidate)} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this passkey?</AlertDialogTitle>
            <AlertDialogDescription>
              {passkeys.length === 1
                ? "This is your only passkey. You will need another sign-in method to access your account."
                : `Remove ${deleteCandidate?.name ?? "this passkey"} from your account?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDeletePasskey}
              disabled={isMutating}
            >
              {isMutating ? <Spinner /> : <Trash2 />}
              Remove passkey
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
