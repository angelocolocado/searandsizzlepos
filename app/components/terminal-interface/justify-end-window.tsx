import { useEffect, useState } from "react";
import { Info, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { SlideToConfirm } from "~/components/lightswind/slide-to-confirm";
import type { OrderLine } from "~/types/menu-category";
import { toast } from "sonner";
import { useFetcher } from "react-router";
import type { MenuItem } from "~/types/menu-category";
import type { clientAction } from "~/routes/cart/fetch-cartdata-route";

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

type ComponentProps = {
    handleClose: () => void
    cart: OrderLine[]
    cartError: string | null
    onMenusLoaded: (menus: MenuItem[]) => void
    onQuantityChange: (menuId: string, quantity: number) => void
    onModifierQuantityChange: (menuId: string, modifierId: string, quantity: number) => void
    onRemoveMenu: (menuId: string) => void
}

export function ProccessOrderPanel({
    handleClose,
    cart,
    cartError,
    onMenusLoaded,
    onQuantityChange,
    onModifierQuantityChange,
    onRemoveMenu,
}: ComponentProps) {
    const fetcher = useFetcher<typeof clientAction>()
    const [infoMenuId, setInfoMenuId] = useState<string | null>(null)
    const [removalLine, setRemovalLine] = useState<OrderLine | null>(null)
    const infoMenu = cart.find((line) => line.menuId === infoMenuId)?.menu
    const itemCount = cart.reduce((count, line) => count + line.quantity, 0)
    const total = cart.reduce(
        (sum, line) =>
            sum +
            line.menu.selling_price * line.quantity +
            line.modifiers.reduce(
                (modifierTotal, modifier) =>
                    modifierTotal + modifier.modifier.price * modifier.quantity,
                0
            ),
        0
    )
    const lineTotal = (line: OrderLine) =>
        line.menu.selling_price * line.quantity +
        line.modifiers.reduce(
            (modifierTotal, modifier) =>
                modifierTotal + modifier.modifier.price * modifier.quantity,
            0
        )
    const formatPrice = (price: number) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(price)

    useEffect(() => {
        if (!fetcher.data) return;

        if ("error" in fetcher.data && typeof fetcher.data.error === "string") {
            toast.error(fetcher.data.error);
            return;
        }

        if (
            "items" in fetcher.data &&
            Array.isArray(fetcher.data.items) &&
            fetcher.data.items.every(isMenuItem)
        ) {
            onMenusLoaded(fetcher.data.items);
            return;
        }

        toast.error("The backend returned invalid menu details.");
    }, [fetcher.data, onMenusLoaded])

    useEffect(() => {
        try {
            const savedOrder = window.localStorage.getItem("searsizzle-pos-order-cart");
            const orderData: unknown = savedOrder ? JSON.parse(savedOrder) : [];

            if (
                !Array.isArray(orderData) ||
                !orderData.every(
                    (line: unknown) =>
                        typeof line === "object" &&
                        line !== null &&
                        "menu_id" in line &&
                        typeof line.menu_id === "string" &&
                        "quantity" in line &&
                        typeof line.quantity === "number" &&
                        Number.isInteger(line.quantity) &&
                        line.quantity >= 1
                )
            ) {
                throw new Error("Saved cart entries must have a menu_id and a positive quantity.");
            }

            const menuIds = [...new Set(orderData.map((line) => line.menu_id))];
            if (menuIds.length === 0) return;

            fetcher.submit(
                { menu_ids: JSON.stringify(menuIds) },
                { method: "POST", action: "/cart" }
            );
        } catch (error) {
            console.error("Unable to read saved cart data.", error);
            toast.error("Invalid cart data. Cart has been reset.");
            window.localStorage.setItem("searsizzle-pos-order-cart", "[]");
        }
    }, [])

    return (
        <aside id="process-order-panel" className="flex h-full w-full min-w-0 flex-col border-l bg-background">
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-4">
                <div>
                    <h2 className="text-base font-semibold">Current order</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                    </p>
                </div>
                <Button
                    type="button"
                    onClick={handleClose}
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Close process order panel"
                >
                    <X />
                </Button>
            </div>
            {cartError && (
                <p role="alert" className="border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive">
                    {cartError}
                </p>
            )}
            <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
                {cart.length > 0 ? cart.map((line) => (
                    <article
                        key={line.menuId}
                        className="rounded-xl border bg-card p-3 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="min-w-0 flex-1 text-sm font-semibold leading-5">
                                {line.menu.name}
                            </h3>
                            <p className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs font-semibold tabular-nums">
                                {formatPrice(line.menu.selling_price)}
                            </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="outline"
                                    aria-label={`Decrease ${line.menu.name} quantity`}
                                    disabled={line.quantity <= 1}
                                    onClick={() => onQuantityChange(line.menuId, line.quantity - 1)}
                                >
                                    <Minus />
                                </Button>
                                <span className="min-w-5 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                                    {line.quantity}
                                </span>
                                <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="outline"
                                    aria-label={`Increase ${line.menu.name} quantity`}
                                    onClick={() => onQuantityChange(line.menuId, line.quantity + 1)}
                                >
                                    <Plus />
                                </Button>
                                <span className="ml-1 text-[10px] text-muted-foreground">QTY</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="ghost"
                                    aria-label={`View ${line.menu.name} details`}
                                    onClick={() => setInfoMenuId(line.menuId)}
                                >
                                    <Info />
                                </Button>
                                <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    aria-label={`Delete ${line.menu.name}`}
                                    onClick={() => setRemovalLine(line)}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        </div>
                        {line.menu.modifiers.length > 0 && (
                            <section className="mt-3 space-y-2 border-t pt-3" aria-label={`${line.menu.name} modifiers`}>
                                <h4 className="text-xs font-semibold text-muted-foreground">Modifiers</h4>
                                {line.menu.modifiers.map((modifier) => {
                                    const selected = line.modifiers.find(
                                        (item) => item.modifierId === modifier.id
                                    );
                                    const quantity = selected?.quantity ?? 0;
                                    return (
                                        <div key={modifier.id} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-medium">{modifier.name}</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {formatPrice(modifier.price)} each
                                                </p>
                                            </div>
                                            <div className="inline-flex shrink-0 items-center gap-1.5">
                                                <Button
                                                    type="button"
                                                    size="icon-xs"
                                                    variant="outline"
                                                    aria-label={`Decrease ${modifier.name} quantity`}
                                                    disabled={quantity === 0}
                                                    onClick={() => onModifierQuantityChange(line.menuId, modifier.id, quantity - 1)}
                                                >
                                                    <Minus />
                                                </Button>
                                                <span className="min-w-5 text-center text-xs font-semibold tabular-nums" aria-live="polite">
                                                    {quantity}
                                                </span>
                                                <Button
                                                    type="button"
                                                    size="icon-xs"
                                                    variant="outline"
                                                    aria-label={`Increase ${modifier.name} quantity`}
                                                    onClick={() => onModifierQuantityChange(line.menuId, modifier.id, quantity + 1)}
                                                >
                                                    <Plus />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </section>
                        )}
                        {line.modifiers.length > 0 && (
                            <section className="mt-3 space-y-1.5 border-t pt-3" aria-label="Selected modifiers">
                                <h4 className="text-xs font-semibold text-muted-foreground">Selected modifiers</h4>
                                {line.modifiers.map((selected) => (
                                    <div key={selected.modifierId} className="flex justify-between gap-2 text-xs">
                                        <span className="min-w-0 truncate">
                                            {selected.modifier.name} <span className="text-muted-foreground">× {selected.quantity}</span>
                                        </span>
                                        <span className="shrink-0 font-medium tabular-nums">
                                            {formatPrice(selected.modifier.price * selected.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </section>
                        )}
                        <div className="mt-3 flex justify-between border-t pt-2 text-xs">
                            <span className="text-muted-foreground">Line total</span>
                            <span className="font-semibold tabular-nums">
                                {formatPrice(lineTotal(line))}
                            </span>
                        </div>
                    </article>
                )) : (
                    <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <ShoppingBag className="size-5" />
                        </span>
                        <p className="text-sm font-medium">Your order is empty</p>
                        <p className="mt-1 text-xs text-muted-foreground">Choose a menu item to get started.</p>
                    </div>
                )}
            </div>
            <footer className="shrink-0 border-t bg-background p-4">
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-lg font-bold tabular-nums">
                        {formatPrice(total)}
                    </span>
                </div>
                <Button type="button" disabled className="h-10 w-full bg-green-600 text-white hover:bg-green-700">
                    Process payment
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Payment checkout is not connected yet.
                </p>
            </footer>

            <Dialog open={Boolean(infoMenu)} onOpenChange={(open) => !open && setInfoMenuId(null)}>
                {infoMenu && (
                    <DialogContent className="max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{infoMenu.name}</DialogTitle>
                            <DialogDescription>Menu item details · ID: {infoMenu.id}</DialogDescription>
                        </DialogHeader>
                        <dl className="space-y-3">
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Price</dt>
                                <dd className="font-semibold">{formatPrice(infoMenu.selling_price)}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Status</dt>
                                <dd>{infoMenu.status}</dd>
                            </div>
                            <div>
                                <dt className="mb-1 text-muted-foreground">Description / notes</dt>
                                <dd className="whitespace-pre-wrap">{infoMenu.description || "No notes provided."}</dd>
                            </div>
                            <div>
                                <dt className="mb-1 text-muted-foreground">Modifiers</dt>
                                {infoMenu.modifiers.length > 0 ? (
                                    <ul className="space-y-2">
                                        {infoMenu.modifiers.map((modifier) => (
                                            <li key={modifier.id} className="flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-2">
                                                <span>
                                                    <span className="block font-medium">{modifier.name}</span>
                                                    <span className="text-xs text-muted-foreground">{modifier.category}</span>
                                                </span>
                                                <span className="shrink-0 text-sm">{formatPrice(modifier.price)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm">No modifiers available.</p>
                                )}
                            </div>
                        </dl>
                    </DialogContent>
                )}
            </Dialog>

            <Dialog open={Boolean(removalLine)} onOpenChange={(open) => !open && setRemovalLine(null)}>
                {removalLine && (
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Remove {removalLine.menu.name}?</DialogTitle>
                            <DialogDescription>
                                Slide to confirm removing this item from your order.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center py-2">
                            <SlideToConfirm
                                text="Slide to delete"
                                successText="Item deleted"
                                width={280}
                                height={52}
                                onConfirm={() => {
                                    onRemoveMenu(removalLine.menuId)
                                    setRemovalLine(null)
                                }}
                            />
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </aside>
    )
}
