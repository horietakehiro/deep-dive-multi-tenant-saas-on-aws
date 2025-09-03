import React from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
// import { Authenticator } from "@aws-amplify/ui-react";
import type { Route } from "./+types/root";
import type { RootContext } from "./lib/domain/model/context";
import "@aws-amplify/ui-react/styles.css";
import "./styles/app.css";
import "./styles/amplify.css";
import { config } from "./lib/domain/model/config";
import { amplifyRepositoryFactory } from "@intersection/backend/lib/adaptor/repository";
// import type { RootContext } from "./lib/domain/model/context";
// import { repository } from "./lib/adaptor/repository";
// import { signUp } from "./lib/domain/model/auth";

export const clientLoader = async () => {
  if (config.type === "PRODUCTION") {
    console.log("configure amplify...");
    await config.amplifyConfigFn();
  }
  const repository = await amplifyRepositoryFactory(config);
  return { config, repository };
};
export default function App({
  loaderData: { repository },
}: Route.ComponentProps) {
  const [tenant, setTenant] = React.useState<RootContext["tenant"]>(undefined);
  return (
    <React.StrictMode>
      <Outlet
        context={
          {
            tenant,
            setTenant,
            repository,
          } as RootContext
        }
      />
    </React.StrictMode>
  );
}

export const links: Route.LinksFunction = () => [
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
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
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
