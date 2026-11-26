import type { MenuItem } from "~/types/menu-category";

export function isMenuItem(value: unknown): value is MenuItem {
    if (typeof value !== "object" || value === null) return false;

    const menu = value as Record<string, unknown>;
    return (
        typeof menu.id === "string" &&
        typeof menu.name === "string" &&
        typeof menu.selling_price === "number" &&
        Number.isFinite(menu.selling_price) &&
        (typeof menu.description === "string" || menu.description === null) &&
        typeof menu.status === "string" &&
        (menu.insufficient === undefined || typeof menu.insufficient === "boolean") &&
        typeof menu.max_quantity === "number" &&
        Number.isFinite(menu.max_quantity) &&
        Array.isArray(menu.modifiers) &&
        menu.modifiers.every((modifier: unknown) => {
            if (typeof modifier !== "object" || modifier === null) return false;
            const item = modifier as Record<string, unknown>;
            return (
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                typeof item.price === "number" &&
                Number.isFinite(item.price) &&
                typeof item.category === "string"
            );
        })
    );
}
