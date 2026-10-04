import api from "~/lib/axios";
import axios from "axios";
import type { Route } from "./+types/checkout-route";
import { data } from "react-router";
import type {
    CheckoutCartLine,
    CheckoutPrepareResponse,
    CheckoutSuccessResponse,
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

function isCheckoutSuccessResponse(value: unknown): value is CheckoutSuccessResponse {
    if (typeof value !== "object" || value === null) return false;

    const response = value as Record<string, unknown>;
    if (typeof response.payment !== "object" || response.payment === null) return false;

    const payment = response.payment as Record<string, unknown>;
    return (
        response.status === "success" &&
        typeof response.totalAmount === "number" &&
        Number.isFinite(response.totalAmount) &&
        response.totalAmount >= 0 &&
        (response.payment_method === "cash" || response.payment_method === "cashless") &&
        payment.status === "accepted" &&
        typeof payment.amount === "number" &&
        Number.isFinite(payment.amount) &&
        payment.amount >= 0
    );
}

function getCheckoutErrorMessage(error: unknown, fallback: string) {
    if (!axios.isAxiosError(error)) return fallback;

    const responseData: unknown = error.response?.data;
    if (typeof responseData !== "object" || responseData === null) return fallback;

    const body = responseData as Record<string, unknown>;
    const validationMessages =
        typeof body.errors === "object" && body.errors !== null
            ? Object.values(body.errors as Record<string, unknown>)
                .flatMap((messages) => Array.isArray(messages) ? messages : [messages])
                .filter((message): message is string => typeof message === "string")
            : [];

    if (validationMessages.length > 0) return validationMessages.join(" ");
    return typeof body.message === "string" ? body.message : fallback;
}

export async function clientAction({ request }: Route.ClientActionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Only POST requests are supported." }, { status: 405 });
    }

    const formData = await request.formData();
    const formIntent = formData.get("intent");
    if (formIntent !== "handle_recalculate" && formIntent !== "handle_checkout") {
        return data({ error: "Unsupported checkout action." }, { status: 400 });
    }

    const cartField = formData.get("cart");
    if (typeof cartField !== "string") {
        return data({ error: "Cart data is required for checkout." }, { status: 400 });
    }

    const cartSignature = formData.get("cart_signature");
    const paymentMethod = formData.get("payment_method");
    const orderType = formData.get("order_type");
    if (
        formIntent === "handle_checkout" &&
        paymentMethod !== "cash" &&
        paymentMethod !== "cashless"
    ) {
        return data({ error: "A valid payment method is required to complete checkout." }, { status: 400 });
    }
    if (
        formIntent === "handle_checkout" &&
        orderType !== "dine_in" &&
        orderType !== "take_out"
    ) {
        return data({ error: "A valid order type is required to complete checkout." }, { status: 400 });
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
        if (formIntent === "handle_checkout") {
            const payLater = formData.get("pay_later") === "true";
            const response = await api.post<unknown>(
                payLater ? "v1/pay-later" : "v1/checkout",
                {
                intent: "checkout",
                order_type: orderType,
                payment_method: paymentMethod,
                cart,
                }
            );

            if (
                !isCheckoutSuccessResponse(response.data) ||
                response.data.payment_method !== paymentMethod ||
                response.data.payment.amount !== response.data.totalAmount
            ) {
                throw new Error("Backend returned an invalid checkout success response.");
            }

            return data({
                checkoutComplete: true,
                checkout: response.data,
                payLater,
            });
        }

        if (typeof cartSignature !== "string") {
            return data({ error: "A cart signature is required to prepare checkout." }, { status: 400 });
        }

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
        console.error(
            formIntent === "handle_checkout"
                ? "Failed to complete checkout with the backend."
                : "Failed to prepare checkout with the backend.",
            error
        );
        return data(
            {
                error: formIntent === "handle_checkout"
                    ? getCheckoutErrorMessage(error, "Could not complete checkout. Please try again.")
                    : getCheckoutErrorMessage(error, "Could not calculate the order total. Please try again."),
            },
            { status: 502 }
        );
    }
}