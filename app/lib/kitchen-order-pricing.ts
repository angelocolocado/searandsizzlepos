import type { KitchenOrder, MenuItem } from "~/types/menu-category";

export type PricedKitchenOrderItem = KitchenOrder["order"][number];

export function getKitchenOrderPricing(
    order: KitchenOrder,
    menus: MenuItem[]
): { items: PricedKitchenOrderItem[]; totalAmount: number | undefined } {
    const items = order.order.map((item) => {
        const menu = menus.find(
            (candidate) => candidate.name.toLocaleLowerCase() === item.name.toLocaleLowerCase()
        );

        return {
            ...item,
            unitPrice: item.unitPrice ?? menu?.selling_price,
            modifiers: item.modifiers.map((modifier) => {
                const menuModifier = menu?.modifiers.find(
                    (candidate) => candidate.name.toLocaleLowerCase() === modifier.name.toLocaleLowerCase()
                );
                return {
                    ...modifier,
                    unitPrice: modifier.unitPrice ?? menuModifier?.price,
                };
            }),
        };
    });

    let calculatedTotal: number | undefined = 0;
    for (const item of items) {
        if (item.unitPrice === undefined) {
            calculatedTotal = undefined;
            break;
        }
        calculatedTotal += item.quantity * item.unitPrice;
        for (const modifier of item.modifiers) {
            if (modifier.unitPrice === undefined) {
                calculatedTotal = undefined;
                break;
            }
            calculatedTotal += modifier.quantity * modifier.unitPrice;
        }
        if (calculatedTotal === undefined) break;
    }

    return {
        items,
        totalAmount: order.totalPayment ?? calculatedTotal,
    };
}
