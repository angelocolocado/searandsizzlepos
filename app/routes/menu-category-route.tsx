import type { Route } from "./+types/menu-category-route";
import TerminalInterface from "~/components/terminal-interface/app-terminal-interface";
import { Spinner } from "~/components/ui/spinner";
import api from "~/lib/axios";
import type { MenuCategory } from "~/types/menu-category";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
    const { data } = await api.get<MenuCategory>(`/v1/menu-categories/${params.categoryId}`);
    return data;
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
    return <TerminalInterface menuCategory={loaderData} />;
}