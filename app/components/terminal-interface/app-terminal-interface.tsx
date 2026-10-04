import { ProccessOrderPanel } from "./justify-end-window";
import { MainView } from "./justify-start-window";
import { useEffect, useState } from "react";
import type { MenuCategory, MenuItem, OrderLine } from "~/types/menu-category";

type TerminalInterfaceProps = {
    menuCategory?: MenuCategory;
}

const CART_STORAGE_KEY = "searsizzle-pos-order-cart";

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

function isOrderLine(value: unknown): value is OrderLine {
    if (typeof value !== "object" || value === null) return false;

    const line = value as Record<string, unknown>;
    return (
        typeof line.menuId === "string" &&
        isMenuItem(line.menu) &&
        line.menuId === line.menu.id &&
        typeof line.quantity === "number" &&
        Number.isInteger(line.quantity) &&
        line.quantity >= 1
    );
}

export default function TerminalInterface({ menuCategory }: TerminalInterfaceProps){

    const [isPrcOrderPanelOpen, setIsPrcOrderPanelOpen] = useState(false)
    const [cart, setCart] = useState<OrderLine[]>([])
    const [isCartLoaded, setIsCartLoaded] = useState(false)
    const [cartError, setCartError] = useState<string | null>(null)

    useEffect(() => {
        try {
            const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
            if (storedCart) {
                const parsedCart: unknown = JSON.parse(storedCart);
                if (!Array.isArray(parsedCart) || !parsedCart.every(isOrderLine)) {
                    throw new Error("Saved order data has an invalid format.");
                }
                setCart(parsedCart);
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
            window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch (error) {
            console.error("Unable to save the order cart.", error);
            setCartError("Your latest order changes could not be saved to this device.");
        }
    }, [cart, cartError, isCartLoaded])

    const handleSelectMenu = (menu: MenuItem) => {
        setCart((currentCart) => {
            const existingLine = currentCart.find((line) => line.menuId === menu.id);
            if (existingLine) {
                return currentCart.map((line) =>
                    line.menuId === menu.id
                        ? { ...line, menu, quantity: line.quantity + 1 }
                        : line
                );
            }
            return [...currentCart, { menuId: menu.id, menu, quantity: 1 }];
        })
        setIsPrcOrderPanelOpen(true)
    }

    const updateQuantity = (menuId: string, quantity: number) => {
        setCart((currentCart) =>
            currentCart.map((line) =>
                line.menuId === menuId ? { ...line, quantity } : line
            )
        )
    }

    const removeMenu = (menuId: string) => {
        setCart((currentCart) => currentCart.filter((line) => line.menuId !== menuId))
    }

    return <>
        <div className="flex h-screen w-full min-w-0 overflow-hidden animate-in fade-in duration-500 ease-out">
            <div className="min-w-0 flex-1">
                <MainView
                    onSelectMenu={handleSelectMenu}
                    handleProccessPanelToggle={() => setIsPrcOrderPanelOpen(true)}
                    isProccessPanelOpen={isPrcOrderPanelOpen}
                    menuCategory={menuCategory}
                />
            </div>

            <div
                className={`h-full min-w-0 shrink-0 overflow-hidden transition-[flex-basis] duration-300 ease-in-out motion-reduce:transition-none ${isPrcOrderPanelOpen ? "basis-[30%]" : "basis-0"}`}
                aria-hidden={!isPrcOrderPanelOpen}
                inert={!isPrcOrderPanelOpen}
            >
                <ProccessOrderPanel
                    handleClose={() => setIsPrcOrderPanelOpen(false)}
                    cart={cart}
                    cartError={cartError}
                    onQuantityChange={updateQuantity}
                    onRemoveMenu={removeMenu}
                />
            </div>
        </div>
    </>
}