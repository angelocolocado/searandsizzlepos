import api from "~/lib/axios";
import type { Route } from "./+types/fetch-cartdata-route";
import { data } from "react-router";
import type { CartMenuResponse, MenuItem } from "~/types/menu-category";

function isMenuItem(value: unknown): value is MenuItem {
    if (typeof value !== "object" || value === null) return false;

    const menu = value as Record<string, unknown>;
    return (
        typeof menu.id === "string" &&
        typeof menu.name === "string" &&
        typeof menu.selling_price === "number" &&
        (typeof menu.description === "string" || menu.description === null) &&
        typeof menu.status === "string" &&
        Array.isArray(menu.modifiers) &&
        menu.modifiers.every((modifier: unknown) => {
            if (typeof modifier !== "object" || modifier === null) return false;
            const item = modifier as Record<string, unknown>;
            return (
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                typeof item.price === "number" &&
                typeof item.category === "string"
            );
        })
    );
}

export async function clientAction({ request }: Route.ClientActionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Only POST requests are supported." }, { status: 405 });
    }

    try {
        const formData = await request.formData();
        const idsField = formData.get("menu_ids");

        if (typeof idsField !== "string") {
            return data({ error: "The menu_ids field is required." }, { status: 400 });
        }

        const menuIds: unknown = JSON.parse(idsField);
        if (
            !Array.isArray(menuIds) ||
            !menuIds.every((menuId) => typeof menuId === "string")
        ) {
            return data({ error: "menu_ids must be an array of menu ID strings." }, { status: 400 });
        }

        const response = await api.get<unknown>("v1/cart", {
            params: {
                menu_ids: menuIds,
            },
        });

        const responseBody = response.data as Partial<CartMenuResponse>;
        if (
            typeof responseBody !== "object" ||
            responseBody === null ||
            !Array.isArray(responseBody.items) ||
            !responseBody.items.every(isMenuItem)
        ) {
            throw new Error("Backend returned an invalid cart response.");
        }

        const returnedIds = new Set(responseBody.items.map((menu) => menu.id));
        if (!menuIds.every((menuId) => returnedIds.has(menuId))) {
            throw new Error("Backend did not return details for every requested menu ID.");
        }

        return data({ items: responseBody.items });
    } catch (error) {
        console.error("Failed to fetch cart menu details from the backend.", error);
        return data(
            {
                error:
                    "Some items are currently unavailable. Your cart has been reset. Please review your order and try again.",
            },
            { status: 502 }
        );
    }
}