import api from "~/lib/axios"

export type TwoFactorSetupData = {
  qrCodeSvg: string
  secretKey: string
}

export type TwoFactorChallengePayload =
  | { code: string }
  | { recovery_code: string }

export async function confirmCurrentPassword(password: string): Promise<void> {
  await api.post("/user/confirm-password", { password })
}

export async function enableTwoFactorAuthentication(): Promise<void> {
  await api.post("/user/two-factor-authentication")
}

export async function getTwoFactorSetupData(): Promise<TwoFactorSetupData> {
  const [qrCodeResponse, secretKeyResponse] = await Promise.all([
    api.get<{ svg: string }>("/user/two-factor-qr-code"),
    api.get<{ secretKey: string }>("/user/two-factor-secret-key"),
  ])

  return {
    qrCodeSvg: qrCodeResponse.data.svg,
    secretKey: secretKeyResponse.data.secretKey,
  }
}

export async function confirmTwoFactorAuthentication(code: string): Promise<void> {
  await api.post("/user/confirmed-two-factor-authentication", { code })
}

export async function getTwoFactorRecoveryCodes(): Promise<string[]> {
  const response = await api.get<string[]>("/user/two-factor-recovery-codes")
  return response.data
}

export async function disableTwoFactorAuthentication(): Promise<void> {
  await api.delete("/user/two-factor-authentication")
}

export async function submitTwoFactorChallenge(
  payload: TwoFactorChallengePayload
): Promise<void> {
  await api.post("/two-factor-challenge", payload)
}
