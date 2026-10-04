import api from "~/lib/axios";
import type { Route } from "./+types/checkout-route";
import { data } from "react-router";
import type {
    CheckoutCartLine,
    CheckoutPrepareResponse,
} from "~/types/menu-category";

function isCheckoutCartLine(value: unknown): value is CheckoutCartLine {
    if (typeof value !== "object" || value === null) return false;

    const line = value as Record<string, unknown>;
    return (
        typeof line.menu_id === "string" &&
        typeof line.quantity === "number" &&
        Number.isInteger(line.quantity) &&
        line.quantity >= 1 &&
        (line.modifiers === undefined ||
            (Array.isArray(line.modifiers) &&
                line.modifiers.every((value: unknown) => {
                    if (typeof value !== "object" || value === null) return false;
                    const modifier = value as Record<string, unknown>;
                    return (
                        typeof modifier.modifier_id === "string" &&
                        typeof modifier.quantity === "number" &&
                        Number.isInteger(modifier.quantity) &&
                        modifier.quantity >= 0
                    );
                })))
    );
}

function isCheckoutPrepareResponse(value: unknown): value is CheckoutPrepareResponse {
    if (typeof value !== "object" || value === null) return false;

    const response = value as Record<string, unknown>;
    return (
        typeof response.totalAmount === "number" &&
        Number.isFinite(response.totalAmount) &&
        response.totalAmount >= 0
    );
}

export async function clientAction({ request }: Route.ClientActionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Only POST requests are supported." }, { status: 405 });
    }

    const formData = await request.formData();
    if (formData.get("intent") !== "handle_recalculate") {
        return data({ error: "Unsupported checkout action." }, { status: 400 });
    }

    const cartField = formData.get("cart");
    const cartSignature = formData.get("cart_signature");
    if (typeof cartField !== "string" || typeof cartSignature !== "string") {
        return data({ error: "Cart data is required to prepare checkout." }, { status: 400 });
    }

    let submittedCart: unknown;
    try {
        submittedCart = JSON.parse(cartField);
    } catch (error) {
        console.error("Checkout request contained invalid cart JSON.", error);
        return data({ error: "Cart data is not valid JSON." }, { status: 400 });
    }

    if (
        !Array.isArray(submittedCart) ||
        submittedCart.length === 0 ||
        !submittedCart.every(isCheckoutCartLine)
    ) {
        return data(
            { error: "Checkout requires a non-empty cart with valid menu and modifier quantities." },
            { status: 400 }
        );
    }

    const cart = submittedCart.map((line) => {
        const modifiers = line.modifiers?.filter((modifier) => modifier.quantity > 0);
        return {
            menu_id: line.menu_id,
            quantity: line.quantity,
            ...(modifiers?.length ? { modifiers } : {}),
        };
    });

    try {
        const response = await api.post<unknown>("v1/checkout", {
            intent: "prepare",
            cart,
        });

        if (!isCheckoutPrepareResponse(response.data)) {
            throw new Error("Backend returned an invalid totalAmount.");
        }

        return data({
            totalAmount: response.data.totalAmount,
            cartSignature,
        });
    } catch (error) {
        console.error("Failed to prepare checkout with the backend.", error);
        return data(
            { error: "Could not calculate the order total. Please try again." },
            { status: 502 }
        );
    }
}