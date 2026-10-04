import type { Route } from "./+types/menu-category-route";
import TerminalInterface from "~/components/terminal-interface/app-terminal-interface";
import { Spinner } from "~/components/ui/spinner";
import api from "~/lib/axios";
import axios from "axios";
import { Link, useRevalidator } from "react-router";
import { Button } from "~/components/ui/button";
import type { MenuCategory } from "~/types/menu-category";

type MenuCategoryLoaderData = {
    menuCategory: MenuCategory | null;
    error: string | null;
}

function getMenuCategoryError(error: unknown) {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
            return "This menu category could not be found. It may have been removed or is no longer available.";
        }
        if (!error.response) {
            return "The menu service could not be reached. Check your connection and try again.";
        }
    }

    return "We could not load this menu category. Please try again.";
}

export async function clientLoader({ params }: Route.ClientLoaderArgs): Promise<MenuCategoryLoaderData> {
    try {
        const response = await api.get<MenuCategory>(`/v1/menu-categories/${params.categoryId}`);
        return { menuCategory: response.data, error: null };
    } catch (error) {
        console.error("Failed to load menu category.", error);
        return { menuCategory: null, error: getMenuCategoryError(error) };
    }
}

clientLoader.hydrate = true as const;

export function HydrateFallback() {
    return (
        <main className="flex h-screen w-full items-center justify-center">
            <Spinner />
        </main>
    );
}

export default function MenuCategoryRoute({ loaderData }: Route.ComponentProps) {
    const revalidator = useRevalidator();

    if (loaderData.error || !loaderData.menuCategory) {
        return (
            <main className="flex h-screen w-full items-center justify-center p-6">
                <section className="w-full max-w-lg rounded-xl border bg-card p-6 text-center shadow-sm" role="alert">
                    <h1 className="text-lg font-semibold">Unable to load menu category</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {loaderData.error ?? "This menu category is unavailable."}
                    </p>
                    <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={revalidator.state !== "idle"}
                            onClick={() => revalidator.revalidate()}
                        >
                            {revalidator.state !== "idle" ? "Trying again..." : "Try again"}
                        </Button>
                        <Link
                            to="/"
                            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                        >
                            Browse menu categories
                        </Link>
                    </div>
                </section>
            </main>
        );
    }

    return <TerminalInterface menuCategory={loaderData.menuCategory} />;
}