import { X } from "lucide-react";
import { Button } from "../ui/button";

type ComponentProps = {
    handleClose: () => void
}

export function ProccessOrderPanel({ handleClose }: ComponentProps){

    

    return (
        <aside id="process-order-panel" className="flex h-full w-full min-w-0 flex-col border-b border-l bg-background">
            <div className="flex py-4 shrink-0 items-center justify-between border-b px-4">
                <h2 className="text-sm font-semibold">Process order</h2>
                <Button onClick={handleClose} size="icon-sm" variant="ghost" aria-label="Close process order panel">
                    <X />
                </Button>
            </div>
            <div className="flex flex-1 items-center justify-center p-6 text-center">
                <p className="text-sm text-muted-foreground">No items in this order yet.</p>
            </div>
        </aside>
    )
}