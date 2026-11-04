import axios from "axios";
import { Link } from "react-router";
import type { Route } from "./+types/unverified";
import { buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import api from "~/lib/axios";

type ResendState =
  | { status: "success"; message: string }
  | { status: "verified"; message: string }
  | { status: "error"; message: string };

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
  }

  return "We could not send the verification email. Please try again.";
}

export async function clientLoader(_args: Route.ClientLoaderArgs): Promise<ResendState> {
  try {
    const response = await api.post<{ status?: string; message?: string }>(
      "/v1/email-verification/resend",
    );

    return {
      status: "success",
      message: response.data.message ?? "Verification link sent.",
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      return {
        status: "verified",
        message: getErrorMessage(error),
      };
    }

    console.error("Failed to resend the email verification link.", error);
    return {
      status: "error",
      message: getErrorMessage(error),
    };
  }
}

export default function Unverified({ loaderData }: Route.ComponentProps) {
  const isSuccess = loaderData.status === "success";
  const isAlreadyVerified = loaderData.status === "verified";

  return (
    <main className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      <Card className="w-full max-w-md rounded-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            {isSuccess
              ? "Verification email sent"
              : isAlreadyVerified
                ? "Email already verified"
                : "Unable to send verification email"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>{loaderData.message}</CardDescription>
          {isSuccess && (
            <CardDescription className="mt-3">
              Please check your inbox and click the verification link.
            </CardDescription>
          )}
          {isAlreadyVerified && (
            <Link
              to="/login"
              className={buttonVariants({ className: "mt-6 w-full rounded-sm bg-red-900" })}
            >
              Go to login
            </Link>
          )}
          {loaderData.status === "error" && (
            <p className="mt-3 text-sm text-muted-foreground">
              Please refresh the page to try again.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
