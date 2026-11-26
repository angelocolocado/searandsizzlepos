import { SidebarTrigger } from "~/components/ui/sidebar";
import { SearchBar } from "./searchbar";
import { PaperBag } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { MenuItem } from "~/types/menu-category";

type ComponentProp = {
    handleProccessPanelToggle: () => void
    isProccessPanelOpen: boolean
    menuItems: MenuItem[]
    isMenuCatalogLoading: boolean
    onSelectMenu: (menu: MenuItem) => void
}

export function Header({
    handleProccessPanelToggle,
    isProccessPanelOpen,
    menuItems,
    isMenuCatalogLoading,
    onSelectMenu,
}: ComponentProp){
    return <>
    
        <div className="flex w-full items-center justify-between border-b p-3">
            <div className="flex min-w-sm items-center gap-2">
                <SidebarTrigger />
                <SearchBar
                    menuItems={menuItems}
                    isMenuCatalogLoading={isMenuCatalogLoading}
                    onSelectMenu={onSelectMenu}
                />
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