import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "react-router";
import NProgress from "nprogress"
import "nprogress/nprogress.css"

import type { Route } from "./+types/root";
import "./app.css";
import { useEffect } from "react";
import { Skeleton } from "./components/ui/skeleton";
import { Toaster } from "./components/ui/sonner";
import { UserProvider } from "./context/UserContext";
import api from "./lib/axios";
import PwaStatus from "./components/pwa-status";


export const links: Route.LinksFunction = () => [
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <PwaStatus />
        <Toaster theme="dark" richColors position="top-right" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export async function clientLoader(){
  try{
    const response = await api.get("user")
    return response.data
  } catch(err) {
    return {}
  }
}


export function HydrateFallback() {
  useEffect(() => {
    NProgress.start();
    return () => {
      NProgress.done();
    };
  }, []);

  return (
    <main className="flex w-full h-screen bg-white gap-5 dark:bg-gray-900 p-10">
      <Skeleton className="h-full w-[16rem] rounded-md" />
      <div className="w-full flex flex-col gap-5">
        <Skeleton className="h-[50px] w-full rounded-md" />
        <Skeleton className="h-full w-full rounded-md" />
      </div>
    </main>
  );
}

export default function App({ loaderData } : Route.ComponentProps) {

  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state !== "idle") {
      NProgress.start();
    } else {
      NProgress.done(); 
    }
  }, [navigation.state]);

  return <>
    <UserProvider initialUser={loaderData}>
      <Outlet />
    </UserProvider>
  </>;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
