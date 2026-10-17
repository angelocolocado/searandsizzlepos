import type { KitchenOrder, MenuCategory } from "~/types/menu-category";

export type PricedKitchenOrderItem = KitchenOrder["order"][number];

export function getKitchenOrderPricing(
    order: KitchenOrder,
    menuCategory?: MenuCategory
): { items: PricedKitchenOrderItem[]; totalAmount: number | undefined } {
    const menus = menuCategory?.recipe_categories.flatMap((category) => category.menus) ?? [];
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
