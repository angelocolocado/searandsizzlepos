import { useState } from "react";
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

type ComponentProps = {
    handleClose: () => void
    cart: OrderLine[]
    cartError: string | null
    onQuantityChange: (menuId: string, quantity: number) => void
    onRemoveMenu: (menuId: string) => void
}

export function ProccessOrderPanel({
    handleClose,
    cart,
    cartError,
    onQuantityChange,
    onRemoveMenu,
}: ComponentProps) {
    const [infoMenuId, setInfoMenuId] = useState<string | null>(null)
    const [removalLine, setRemovalLine] = useState<OrderLine | null>(null)
    const infoMenu = cart.find((line) => line.menuId === infoMenuId)?.menu
    const itemCount = cart.reduce((count, line) => count + line.quantity, 0)
    const total = cart.reduce(
        (sum, line) => sum + line.menu.selling_price * line.quantity,
        0
    )
    const formatPrice = (price: number) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(price)

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
                        <div className="mt-3 flex justify-between border-t pt-2 text-xs">
                            <span className="text-muted-foreground">Line total</span>
                            <span className="font-semibold tabular-nums">
                                {formatPrice(line.menu.selling_price * line.quantity)}
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
