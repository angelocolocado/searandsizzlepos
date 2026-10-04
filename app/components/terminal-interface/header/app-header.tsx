import { SidebarTrigger } from "~/components/ui/sidebar";
import { SearchBar } from "./searchbar";
import { PaperBag } from "lucide-react";
import { Button } from "~/components/ui/button";

type ComponentProp = {
    handleProccessPanelToggle: () => void
    isProccessPanelOpen: boolean
}

export function Header({ handleProccessPanelToggle, isProccessPanelOpen } : ComponentProp){
    return <>
    
        <div className="flex w-full items-center justify-between border-b p-3">
            <div className="flex min-w-sm items-center gap-2">
                <SidebarTrigger />
                <SearchBar />
            </div>
            <Button
                onClick={handleProccessPanelToggle}
                size="icon-lg"
                variant="ghost"
                aria-label="Open process order panel"
                aria-controls="process-order-panel"
                aria-expanded={isProccessPanelOpen}
                aria-hidden={isProccessPanelOpen}
                disabled={isProccessPanelOpen}
                className={isProccessPanelOpen ? "invisible" : undefined}
            >
                <PaperBag />
            </Button>
        </div>

    
    </>
}