import axios from "axios";
import { Link } from "react-router";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import api from "~/lib/axios";
import { useEffect, useState } from "react";
import { MessageCircleQuestionMark } from "lucide-react";

const PENDING_VERIFICATION_KEY = "pending_verify_url";

type VerificationState =
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "unauthenticated"; message: string }
  | { status: "error"; message: string };

function VerificationCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <main className="relative flex h-screen w-full items-center justify-center overflow-hidden">
      <Card className="w-full max-w-md rounded-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight text-slate-900">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}

function getVerificationPath(verifyUrl: string | null) {
  if (!verifyUrl) {
    return null;
  }

  try {
    const url = new URL(verifyUrl);

    if (!/^\/email\/verify\/[^/]+\/[^/]+$/.test(url.pathname)) {
      return null;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function savePendingVerification(verifyUrl: string) {
  sessionStorage.setItem(PENDING_VERIFICATION_KEY, verifyUrl);
}

export default function EmailVerify() {
  const [verification, setVerification] = useState<VerificationState>({
    status: "loading",
    message: "Please wait while we verify your email.",
  });

  useEffect(() => {
    const verifyUrl = new URL(window.location.href).searchParams.get("verify_url");
    const verificationPath = getVerificationPath(verifyUrl);

    if (!verifyUrl || !verificationPath) {
      setVerification({
        status: "error",
        message: "This email verification link is invalid or incomplete.",
      });
      return;
    }

    let active = true;

    api.get(verificationPath)
      .then(() => {
        if (active) {
          sessionStorage.removeItem(PENDING_VERIFICATION_KEY);
          setVerification({
            status: "success",
            message: "Your email has been verified successfully.",
          });
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 401)) {
          savePendingVerification(verifyUrl);
          setVerification({
            status: "unauthenticated",
            message: "Please log in first, then open this verification link again.",
          });
          return;
        }

        setVerification({
          status: "error",
          message: "We could not verify your email. Please try the link again.",
        });
      });

    return () => {
      active = false;
    };
  }, []);

  if (verification.status === "loading") {
    return (
      <VerificationCard title="Verifying your email">
        <CardDescription className="flex items-center gap-2">
          <Spinner />
          {verification.message}
        </CardDescription>
      </VerificationCard>
    );
  }

  if (verification.status === "success") {
    return (
      <VerificationCard title="Email verified">
        <CardDescription>{verification.message}</CardDescription>
        <Button className="mt-5 w-full rounded-sm bg-red-900"><Link to={'/login'}>Log In</Link></Button>
      </VerificationCard>
    );
  }

  if (verification.status === "unauthenticated") {
    return (
      <VerificationCard title="Login required">
        <CardDescription>{verification.message}</CardDescription>
        <Link
          to="/login"
          className={`${buttonVariants({ className: "mt-6 w-full rounded-sm bg-red-900" })}`}
        >
          Go to login
        </Link>
      </VerificationCard>
    );
  }

  return (
    <VerificationCard title="Verification failed">
      <CardDescription>{verification.message}</CardDescription>
      <Button className="mt-5 w-full rounded-sm bg-red-900" onClick={() => window.location.href = import.meta.env.VITE_DOCS_URL}><MessageCircleQuestionMark />Ask for support</Button>
    </VerificationCard>
  );
}
