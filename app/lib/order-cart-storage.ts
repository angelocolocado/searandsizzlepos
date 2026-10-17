export type StoredOrderLine = {
    menu_id: string;
    quantity: number;
    modifiers?: StoredModifierQuantity[];
}

type StoredModifierQuantity = {
    modifier_id: string;
    quantity: number;
}

export type StoredOrderCart = {
    cart_uuid: string;
    items: StoredOrderLine[];
}

export const CART_STORAGE_KEY = "searsizzle-pos-order-cart";

export function createCartUuid(): string {
    return window.crypto.randomUUID();
}

function isStoredOrderLine(value: unknown): value is StoredOrderLine {
    if (typeof value !== "object" || value === null) return false;

    const line = value as Record<string, unknown>;
    return (
        typeof line.menu_id === "string" &&
        typeof line.quantity === "number" &&
        Number.isInteger(line.quantity) &&
        line.quantity >= 1 &&
        (line.modifiers === undefined ||
            (Array.isArray(line.modifiers) &&
                line.modifiers.every((modifier: unknown) => {
                    if (typeof modifier !== "object" || modifier === null) return false;
                    const selectedModifier = modifier as Record<string, unknown>;
                    return (
                        typeof selectedModifier.modifier_id === "string" &&
                        typeof selectedModifier.quantity === "number" &&
                        Number.isInteger(selectedModifier.quantity) &&
                        selectedModifier.quantity >= 0
                    );
                })))
    );
}

export function parseStoredOrderCart(value: unknown): StoredOrderCart {
    if (Array.isArray(value) && value.every(isStoredOrderLine)) {
        return { cart_uuid: createCartUuid(), items: value };
    }

    if (typeof value === "object" && value !== null) {
        const cart = value as Record<string, unknown>;
        if (
            typeof cart.cart_uuid === "string" &&
            cart.cart_uuid.length > 0 &&
            Array.isArray(cart.items) &&
            cart.items.every(isStoredOrderLine)
        ) {
            return { cart_uuid: cart.cart_uuid, items: cart.items };
        }
    }

    throw new Error("Saved order data has an invalid format.");
}
