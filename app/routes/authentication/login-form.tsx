import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel, FieldSet } from "~/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"

import z from "zod";
import { Eye, EyeOff, KeyRound, UserLock } from "lucide-react";
import { useEffect, useState } from "react";
import { Spinner } from "~/components/ui/spinner";
import { useNavigation, useSubmit } from "react-router";
import { initializePasskeyAuth, Passkeys, passkeyRoutes } from "~/lib/passkeys.client";
import { toast } from "sonner";

const LoginFormSchema = z.object({
    username: z
        .string()
        .min(1, "Username is required"),

    password: z
        .string()
        .min(1, "Password is required"),
});

type LoginFormType = z.infer<typeof LoginFormSchema>;

type ComponentProps = {
    error?: boolean,
    type? : string | "credential" | "form",
    message?: string
    buster?: string | number
}

export default function LoginForm({ error, message, type, buster } : ComponentProps){
    const { handleSubmit, register, setError, formState: { errors, isDirty } } = useForm<LoginFormType>({
        defaultValues: {
            username: "",
            password: ""
        },
        resolver: zodResolver(LoginFormSchema),
        mode: "onChange"
    });

    const [isPwdShown, setIsPwdShown] = useState(false)
    const [isPasskeySupported, setIsPasskeySupported] = useState(false)
    const [isPasskeySubmitting, setIsPasskeySubmitting] = useState(false)
    const [passkeyError, setPasskeyError] = useState<string | null>(null)
    const submit = useSubmit()
    const navigation = useNavigation()
    const isSubmitting = navigation.state !== "idle"

    useEffect(() => {
        setIsPasskeySupported(Passkeys.isSupported())
    }, [])

    useEffect(() => {
        if (error && message) {
            if (type === "username") {
                setError("username", { type: "server", message });
            } else if (type === "password") {
                setError("password", { type: "server", message });
            } else {
                setError("root", { type: "server", message });
            }
        }
    }, [error, message, type, buster, setError]);

    const handleOnSubmit = (d: LoginFormType) => {
        submit(d, {
            method: "POST"
        });
    }

    async function handlePasskeySignIn() {
        try {
            setIsPasskeySubmitting(true)
            setPasskeyError(null)
            await initializePasskeyAuth()
            const response = await Passkeys.verify({
                remember: true,
                routes: passkeyRoutes.verify,
            })

            if (response.redirect) {
                window.location.assign(response.redirect)
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Passkey sign-in failed. Please try again."
            setPasskeyError(message)
            toast.error(message)
        } finally {
            setIsPasskeySubmitting(false)
        }
    }

    return (<>
        <Card className="rounded-sm">
            <CardHeader>
                <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
                    Sear & Sizzle Terminal
                </CardTitle>
                <CardDescription className="text-sm font-normal text-muted-foreground">
                    Enter your staff credentials
                </CardDescription>
            </CardHeader>
            <CardContent className="min-w-sm">
                <form id="login" onSubmit={handleSubmit(handleOnSubmit)}>
                    <FieldSet>
                        <Field>
                            <FieldLabel htmlFor="username">Username</FieldLabel>
                            <InputGroup className="rounded-sm">
                                <InputGroupInput
                                    id="username"
                                    autoComplete="username"
                                    placeholder="searstaff"
                                    aria-invalid={Boolean(errors.username)}
                                    {...register("username")}
                                />
                                <InputGroupAddon>
                                    <UserLock />
                                </InputGroupAddon>
                            </InputGroup>
                            {errors.username && <FieldError>{errors.username.message}</FieldError>}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <InputGroup className="rounded-sm">
                                <InputGroupInput
                                    id="password"
                                    type={isPwdShown ? "text": "password"}
                                    autoComplete="current-password"
                                    aria-invalid={Boolean(errors.password)}
                                    {...register("password")}
                                />
                                <InputGroupAddon>
                                    <KeyRound />
                                </InputGroupAddon>
                                <InputGroupAddon align="inline-end">
                                    <Button type="button" size="icon" variant="ghost" onClick={() => setIsPwdShown(!isPwdShown)}>
                                        {isPwdShown ? <EyeOff /> : <Eye />}
                                    </Button>
                                </InputGroupAddon>
                            </InputGroup>
                            
                            {errors.password && <FieldError>{errors.password.message}</FieldError>}
                        </Field>
                        {errors.form && <FieldError>{errors.form.message}</FieldError>}
                        {errors.root && <FieldError>{errors.root.message}</FieldError>}
                    </FieldSet>
                </form>
            </CardContent>
            <CardFooter>
                <div className="flex w-full flex-col gap-3">
                  <Button form="login" className="w-full rounded-sm bg-red-900" type="submit" disabled={!isDirty || isSubmitting || isPasskeySubmitting}>
                    {isSubmitting ? <Spinner /> : 'Sign In'}
                  </Button>
                  {isPasskeySupported && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-sm"
                      onClick={handlePasskeySignIn}
                      disabled={isSubmitting || isPasskeySubmitting}
                    >
                      {isPasskeySubmitting ? <Spinner /> : <KeyRound />}
                      {isPasskeySubmitting ? "Waiting for passkey..." : "Sign in with passkey"}
                    </Button>
                  )}
                  {passkeyError && (
                    <p role="alert" className="text-sm text-destructive text-center">
                      {passkeyError}
                    </p>
                  )}
                </div>
            </CardFooter>
        </Card>
    </>)
}