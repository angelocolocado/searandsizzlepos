import api from "~/lib/axios";
import type { Route } from "./+types/kitchen-orders-route";
import { data } from "react-router";
import type { KitchenOrder } from "~/types/menu-category";

function isKitchenOrder(value: unknown): value is KitchenOrder {
    if (typeof value !== "object" || value === null) return false;

    const order = value as Record<string, unknown>;
    const validItems = Array.isArray(order.order) && order.order.every((item: unknown) => {
        if (typeof item !== "object" || item === null) return false;
        const menuItem = item as Record<string, unknown>;
        return (
            typeof menuItem.name === "string" &&
            typeof menuItem.quantity === "number" &&
            Number.isInteger(menuItem.quantity) &&
            menuItem.quantity >= 1 &&
            Array.isArray(menuItem.modifiers) &&
            menuItem.modifiers.every((modifier: unknown) => {
                if (typeof modifier !== "object" || modifier === null) return false;
                const selectedModifier = modifier as Record<string, unknown>;
                return (
                    typeof selectedModifier.name === "string" &&
                    typeof selectedModifier.quantity === "number" &&
                    Number.isInteger(selectedModifier.quantity) &&
                    selectedModifier.quantity >= 1
                );
            })
        );
    });

    return (
        typeof order.orderNumber === "number" &&
        Number.isInteger(order.orderNumber) &&
        typeof order.itemCount === "number" &&
        Number.isInteger(order.itemCount) &&
        order.itemCount >= 0 &&
        typeof order.elapsed === "string" &&
        (order.type === "Dine in" || order.type === "Take out") &&
        (order.payment_status === "paid" || order.payment_status === "pay_later") &&
        validItems &&
        (order.payment_status !== "pay_later" ||
            (typeof order.totalPayment === "number" &&
                Number.isFinite(order.totalPayment) &&
                order.totalPayment >= 0))
    );
}

export async function clientLoader(_args: Route.ClientLoaderArgs) {
    try {
        const response = await api.get<unknown>("v1/orders/cooking");
        if (!Array.isArray(response.data) || !response.data.every(isKitchenOrder)) {
            throw new Error("Backend returned an invalid cooking orders response.");
        }

        return data({ orders: response.data });
    } catch (error) {
        console.error("Failed to load cooking orders from the backend.", error);
        return data(
            { error: "Could not load kitchen orders. Please try again." },
            { status: 502 }
        );
    }
}
