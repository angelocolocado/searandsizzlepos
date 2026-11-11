import axios from "axios"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { Form, Link, redirect, useNavigation } from "react-router"
import { useState } from "react"

import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp"
import { submitTwoFactorChallenge } from "~/lib/two-factor"
import type { Route } from "./+types/2fa-challenge"

type ChallengeActionData = {
  error: string
  buster: number
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData()
  const code = formData.get("code")
  const recoveryCode = formData.get("recovery_code")
  const recoveryCodeValue = typeof recoveryCode === "string" ? recoveryCode.trim() : ""

  if (typeof code === "string" && code.length > 0) {
    if (!/^\d{6}$/.test(code)) {
      return {
        error: "Enter the 6-digit code from your authenticator app.",
        buster: Date.now(),
      } satisfies ChallengeActionData
    }
  } else if (recoveryCodeValue.length === 0) {
    return {
      error: "Enter an authenticator code or recovery code.",
      buster: Date.now(),
    } satisfies ChallengeActionData
  }

  try {
    if (typeof code === "string" && code.length > 0) {
      await submitTwoFactorChallenge({ code })
    } else {
      await submitTwoFactorChallenge({ recovery_code: recoveryCodeValue })
    }

    const pendingVerifyUrl = sessionStorage.getItem("pending_verify_url")
    if (pendingVerifyUrl) {
      return redirect(`/email-verify?verify_url=${encodeURIComponent(pendingVerifyUrl)}`)
    }

    return redirect("/")
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      const message = error.response?.data?.message
      if (error.response?.status === 422 && message) {
        return { error: message, buster: Date.now() } satisfies ChallengeActionData
      }
    }

    return {
      error: axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? "Could not verify your code. Please try again."
        : "Could not verify your code. Please try again.",
      buster: Date.now(),
    } satisfies ChallengeActionData
  }
}

export default function TwoFactorChallenge({ actionData }: Route.ComponentProps) {
  const navigation = useNavigation()
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)
  const isSubmitting = navigation.state !== "idle"

  return (
    <main className="flex min-h-[99vh] w-full items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md rounded-sm">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            Two-factor verification
          </CardTitle>
          <CardDescription>
            {useRecoveryCode
              ? "Enter one of your saved recovery codes."
              : "Enter the 6-digit code from your authenticator app."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            {useRecoveryCode ? (
              <div className="space-y-2">
                <label htmlFor="recovery-code" className="text-sm font-medium">Recovery code</label>
                <Input
                  id="recovery-code"
                  name="recovery_code"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  className="h-10 font-mono"
                  placeholder="Enter a recovery code"
                />
              </div>
            ) : (
              <div className="space-y-2 w-full flex items-center justify-center">
                <InputOTP
                  id="challenge-code"
                  name="code"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  pattern="[0-9]*"
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}

            {actionData?.error && (
              <p key={actionData.buster} role="alert" className="text-sm text-destructive">
                {actionData.error}
              </p>
            )}

            <Button type="submit" className="w-full rounded-sm bg-red-900" disabled={isSubmitting}>
              <ShieldCheck aria-hidden="true" />
              {isSubmitting ? "Verifying..." : "Verify and sign in"}
            </Button>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={() => setUseRecoveryCode((current) => !current)}
          >
            {useRecoveryCode ? "Use an authenticator code instead" : "Use a recovery code instead"}
          </Button>
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </main>
  )
}
