import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"
import { SidebarNavigations } from "./inventory"
import { navItems } from "./data"
import { useFetcher } from "react-router"
import { useEffect, useState } from "react"

export type SidebarData = {
  isHidden?: boolean
  category: string
  id: number
}

export function AppSidebar() {

  const fetcher = useFetcher()
  const [sidebarData, setSidebarData] = useState<SidebarData[]>([]);

  useEffect(() => {

    if(fetcher.state === "idle" && !fetcher.data) fetcher.load('/sidebar')
    else setSidebarData(fetcher.data)

  }, [fetcher.data])

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                    
                    <div className="flex aspect-square size-10 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                      <img src="/logo.png" alt="" />
                    </div>
                    <p className="font-logo font-semibold tracking-wide text-xl">Sear and Sizzle</p>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>


        {sidebarData.length > 0 && <SidebarNavigations title="Menu" nav_items={sidebarData}  />}

      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}