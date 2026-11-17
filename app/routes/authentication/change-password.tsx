import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, KeyRound, LockKeyhole } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { redirect, useNavigation, useSearchParams, useSubmit } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

import type { Route } from "./+types/change-password"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Field, FieldError, FieldLabel, FieldSet } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { generatePassword } from "~/lib/password-generator"
import { Spinner } from "~/components/ui/spinner"
import api from "~/lib/axios"

const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, "Enter your current password."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  password_confirmation: z.string().min(1, "Please confirm your new password."),
}).refine((values) => values.password === values.password_confirmation, {
  message: "Passwords do not match.",
  path: ["password_confirmation"],
})

type ChangePasswordForm = z.infer<typeof ChangePasswordSchema>

type ChangePasswordActionData = {
  success: boolean
  message?: string
  errors?: Record<string, string[] | string>
  buster?: number
}

export async function clientAction({
  request,
}: Route.ClientActionArgs): Promise<ChangePasswordActionData | Response> {
  if (request.method !== "POST") {
    return { success: false, message: "Invalid request method." }
  }

  const formData = await request.formData()

  try {
    await api.put("/user/password", {
      current_password: formData.get("current_password"),
      password: formData.get("password"),
      password_confirmation: formData.get("password_confirmation"),
    })

    return redirect("/")
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data
      return {
        success: false,
        message: responseData?.message ?? "Unable to change your password.",
        errors: responseData?.errors,
        buster: Date.now(),
      }
    }

    return {
      success: false,
      message: "Unable to change your password. Please try again.",
      buster: Date.now(),
    }
  }
}

const passwordFields: {
  name: keyof ChangePasswordForm
  id: string
  label: string
  autoComplete: string
}[] = [
  {
    name: "current_password",
    id: "current-password",
    label: "Current password",
    autoComplete: "current-password",
  },
  {
    name: "password",
    id: "new-password",
    label: "New password",
    autoComplete: "new-password",
  },
  {
    name: "password_confirmation",
    id: "confirm-password",
    label: "Confirm new password",
    autoComplete: "new-password",
  },
]

export default function ChangePassword({ actionData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams()
  const submit = useSubmit()
  const navigation = useNavigation()
  const [visiblePasswords, setVisiblePasswords] = useState<Record<keyof ChangePasswordForm, boolean>>({
    current_password: false,
    password: false,
    password_confirmation: false,
  })
  const isRequired = searchParams.get("required") === "true"
  const message = searchParams.get("message")
  const isSubmitting = navigation.state !== "idle"
  const {
    handleSubmit,
    register,
    setError,
    setValue,
    formState: { errors, isDirty, isValid },
  } = useForm<ChangePasswordForm>({
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
    resolver: zodResolver(ChangePasswordSchema),
    mode: "onChange",
  })

  useEffect(() => {
    if (!actionData || actionData.success) return

    const serverMessage = actionData.message ?? "Unable to change your password."
    const fieldErrors = actionData.errors ?? {}

    for (const field of passwordFields) {
      const fieldError = fieldErrors[field.name]
      const errorMessage = Array.isArray(fieldError) ? fieldError[0] : fieldError
      if (errorMessage) {
        setError(field.name, { type: "server", message: errorMessage })
      }
    }

    if (!Object.keys(fieldErrors).length) {
      setError("root", { type: "server", message: serverMessage })
    }
  }, [actionData, setError])

  async function handleGeneratePassword() {
    const generatedPassword = generatePassword()

    setValue("password", generatedPassword, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    setValue("password_confirmation", generatedPassword, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })

    if (!navigator.clipboard) {
      toast.warning("Password generated, but clipboard access is unavailable.")
      return
    }

    try {
      await navigator.clipboard.writeText(generatedPassword)
      toast.success("Password generated and copied to clipboard.")
    } catch {
      toast.warning("Password generated, but could not copy it to the clipboard.")
    }
  }

  function onSubmit(values: ChangePasswordForm) {
    submit(values, { method: "POST" })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md rounded-sm">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
            <KeyRound className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Change your password
          </CardTitle>
          <CardDescription>
            {isRequired
              ? "Choose a new password before continuing to your account."
              : "Update your password whenever you want to keep your account secure."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRequired && (
            <Alert className="mb-4">
              <AlertTitle>Password change required</AlertTitle>
              <AlertDescription>
                {message ?? "You must change your password before continuing."}
              </AlertDescription>
            </Alert>
          )}

          <form id="change-password" onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldSet>
              {passwordFields.map(({ name, id, label, autoComplete }) => {
                const error = errors[name]
                const isVisible = visiblePasswords[name]

                return (
                  <Field key={name}>
                    <FieldLabel htmlFor={id}>{label}</FieldLabel>
                    <div className="relative">
                      <Input
                        id={id}
                        type={isVisible ? "text" : "password"}
                        autoComplete={autoComplete}
                        aria-invalid={Boolean(error)}
                        {...register(name)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-0 right-0"
                        aria-label={`${isVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
                        onClick={() => setVisiblePasswords((current) => ({
                          ...current,
                          [name]: !current[name],
                        }))}
                      >
                        {isVisible
                          ? <EyeOff className="size-4" aria-hidden="true" />
                          : <Eye className="size-4" aria-hidden="true" />}
                      </Button>
                    </div>
                    <FieldError>{error?.message}</FieldError>
                  </Field>
                )
              })}
              {errors.root && <FieldError role="alert">{errors.root.message}</FieldError>}
              <Button
                type="button"
                variant="secondary"
                onClick={handleGeneratePassword}
              >
                Generate password
              </Button>
            </FieldSet>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            form="change-password"
            type="submit"
            className="w-full rounded-sm bg-red-900"
            disabled={!isDirty || !isValid || isSubmitting}
          >
            {isSubmitting ? <Spinner /> : <LockKeyhole aria-hidden="true" />}
            {isSubmitting ? "Updating password..." : "Update password"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
