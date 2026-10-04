import { ProccessOrderPanel } from "./justify-end-window";
import { MainView } from "./justify-start-window";
import { useCallback, useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { MenuCategory, MenuItem, OrderLine } from "~/types/menu-category";
import type { clientLoader as kitchenOrdersClientLoader } from "~/routes/kitchen-orders-route";

type TerminalInterfaceProps = {
    menuCategory?: MenuCategory;
}

type StoredOrderLine = {
    menu_id: string;
    quantity: number;
    modifiers?: StoredModifierQuantity[];
}

type StoredModifierQuantity = {
    modifier_id: string;
    quantity: number;
}

const CART_STORAGE_KEY = "searsizzle-pos-order-cart";

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

function withoutZeroModifiers(line: StoredOrderLine): StoredOrderLine {
    const modifiers = line.modifiers?.filter((modifier) => modifier.quantity > 0);
    return {
        menu_id: line.menu_id,
        quantity: line.quantity,
        ...(modifiers?.length ? { modifiers } : {}),
    };
}

export default function TerminalInterface({ menuCategory }: TerminalInterfaceProps){

    const kitchenOrdersFetcher = useFetcher<typeof kitchenOrdersClientLoader>();
    const [isPrcOrderPanelOpen, setIsPrcOrderPanelOpen] = useState(false)
    const [order, setOrder] = useState<StoredOrderLine[]>([])
    const [menusById, setMenusById] = useState<Record<string, MenuItem>>({})
    const [isCartLoaded, setIsCartLoaded] = useState(false)
    const [cartError, setCartError] = useState<string | null>(null)
    const [kitchenOrdersRefreshKey, setKitchenOrdersRefreshKey] = useState(0)

    const loadKitchenOrders = useCallback(() => {
        kitchenOrdersFetcher.load("/kitchen-orders");
    }, [kitchenOrdersFetcher.load])

    useEffect(() => {
        loadKitchenOrders();
        const interval = window.setInterval(loadKitchenOrders, 30_000);
        return () => window.clearInterval(interval);
    }, [loadKitchenOrders, kitchenOrdersRefreshKey])

    const handleMenusLoaded = useCallback((menus: MenuItem[]) => {
        setMenusById((current) => ({
            ...current,
            ...Object.fromEntries(menus.map((menu) => [menu.id, menu])),
        }));
    }, [])

    useEffect(() => {
        try {
            const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
            if (storedCart) {
                const parsedCart: unknown = JSON.parse(storedCart);
                if (!Array.isArray(parsedCart) || !parsedCart.every(isStoredOrderLine)) {
                    throw new Error("Saved order data has an invalid format.");
                }
                setOrder(parsedCart.map(withoutZeroModifiers));
            }
        } catch (error) {
            console.error("Unable to load the saved order cart.", error);
            setCartError("Could not load the saved order. Check browser storage and reload.");
        } finally {
            setIsCartLoaded(true);
        }
    }, [])

    useEffect(() => {
        if (!isCartLoaded || cartError) return;

        try {
            window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(order));
        } catch (error) {
            console.error("Unable to save the order cart.", error);
            setCartError("Your latest order changes could not be saved to this device.");
        }
    }, [order, cartError, isCartLoaded])

    useEffect(() => {
        const menus = menuCategory?.recipe_categories.flatMap(
            (recipeCategory) => recipeCategory.menus
        ) ?? [];

        if (menus.length > 0) {
            setMenusById((current) => ({
                ...current,
                ...Object.fromEntries(menus.map((menu) => [menu.id, menu])),
            }));
        }
    }, [menuCategory])

    const cart: OrderLine[] = order.flatMap((line) => {
        const menu = menusById[line.menu_id];
        return menu
            ? [{
                menuId: line.menu_id,
                menu,
                quantity: line.quantity,
                modifiers: (line.modifiers ?? []).flatMap((selectedModifier) => {
                    const modifier = menu.modifiers.find(
                        (item) => item.id === selectedModifier.modifier_id
                    );
                    return modifier
                        ? [{ modifierId: modifier.id, modifier, quantity: selectedModifier.quantity }]
                        : [];
                }),
            }]
            : [];
    })

    const handleSelectMenu = (menu: MenuItem) => {
        setMenusById((current) => ({ ...current, [menu.id]: menu }));
        setOrder((currentOrder) => {
            const existingLine = currentOrder.find((line) => line.menu_id === menu.id);
            if (existingLine) {
                return currentOrder.map((line) =>
                    line.menu_id === menu.id
                        ? { ...line, quantity: line.quantity + 1 }
                        : line
                );
            }
            return [...currentOrder, { menu_id: menu.id, quantity: 1 }];
        })
        setIsPrcOrderPanelOpen(true)
    }

    const updateQuantity = (menuId: string, quantity: number) => {
        setOrder((currentOrder) =>
            currentOrder.map((line) =>
                line.menu_id === menuId ? { ...line, quantity } : line
            )
        )
    }

    const updateModifierQuantity = (
        menuId: string,
        modifierId: string,
        quantity: number
    ) => {
        setOrder((currentOrder) =>
            currentOrder.map((line) => {
                if (line.menu_id !== menuId) return line;

                const modifiers = (line.modifiers ?? []).filter(
                    (modifier) => modifier.modifier_id !== modifierId
                );
                if (quantity > 0) {
                    modifiers.push({ modifier_id: modifierId, quantity });
                }

                return {
                    menu_id: line.menu_id,
                    quantity: line.quantity,
                    ...(modifiers.length ? { modifiers } : {}),
                };
            })
        )
    }

    const removeMenu = (menuId: string) => {
        setOrder((currentOrder) => currentOrder.filter((line) => line.menu_id !== menuId))
    }

    const clearOrderAfterCheckout = useCallback(() => {
        setOrder([]);
        setKitchenOrdersRefreshKey((current) => current + 1);
        try {
            window.localStorage.setItem(CART_STORAGE_KEY, "[]");
        } catch (error) {
            console.error("Checkout succeeded, but the saved order could not be cleared.", error);
            setCartError("Checkout succeeded, but the saved order could not be cleared.");
        }
    }, [])

    const kitchenOrders = kitchenOrdersFetcher.data &&
        "orders" in kitchenOrdersFetcher.data &&
        Array.isArray(kitchenOrdersFetcher.data.orders)
        ? kitchenOrdersFetcher.data.orders
        : [];
    const kitchenOrdersError = kitchenOrdersFetcher.data &&
        "error" in kitchenOrdersFetcher.data &&
        typeof kitchenOrdersFetcher.data.error === "string"
        ? kitchenOrdersFetcher.data.error
        : null;

    return <>
        <div className="relative flex h-screen w-full min-w-0 overflow-hidden animate-in fade-in duration-500 ease-out">
            <div className="min-w-0 flex-1">
                <MainView
                    onSelectMenu={handleSelectMenu}
                    handleProccessPanelToggle={() => setIsPrcOrderPanelOpen(true)}
                    isProccessPanelOpen={isPrcOrderPanelOpen}
                    menuCategory={menuCategory}
                    orders={kitchenOrders}
                    ordersError={kitchenOrdersError}
                    ordersLoading={kitchenOrdersFetcher.state !== "idle"}
                />
            </div>

            {isPrcOrderPanelOpen && (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/35 lg:hidden"
                    aria-label="Close process order panel"
                    onClick={() => setIsPrcOrderPanelOpen(false)}
                />
            )}
            <div
                className={`fixed inset-y-0 right-0 z-50 h-full w-[min(92vw,26rem)] min-w-0 shrink-0 overflow-hidden border-l bg-background shadow-xl transition-transform duration-300 ease-in-out motion-reduce:transition-none lg:relative lg:inset-auto lg:z-auto lg:w-auto lg:shadow-none lg:transition-[flex-basis] ${isPrcOrderPanelOpen ? "translate-x-0 lg:basis-[clamp(20rem,32vw,30rem)]" : "translate-x-full lg:translate-x-0 lg:basis-0"}`}
                aria-hidden={!isPrcOrderPanelOpen}
                inert={!isPrcOrderPanelOpen}
            >
                <ProccessOrderPanel
                    handleClose={() => setIsPrcOrderPanelOpen(false)}
                    cart={cart}
                    cartError={cartError}
                    onMenusLoaded={handleMenusLoaded}
                    onQuantityChange={updateQuantity}
                    onModifierQuantityChange={updateModifierQuantity}
                    onRemoveMenu={removeMenu}
                    onCheckoutComplete={clearOrderAfterCheckout}
                />
            </div>
        </div>
    </>
}