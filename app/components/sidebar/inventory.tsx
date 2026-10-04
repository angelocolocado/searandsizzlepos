import { 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent,
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "../ui/sidebar"

import { NavLink } from "react-router"
import type { SidebarData } from "./app-sidebar"


type ComponentProps = {
    nav_items: SidebarData[]
    title: string
}

export function SidebarNavigations({ nav_items, title } : ComponentProps) {

    return (
        <SidebarGroup>
          <SidebarGroupLabel>{title}</SidebarGroupLabel>
          <SidebarGroupContent>
              <SidebarMenu>
                            {nav_items.filter((item) => !item.isHidden).map((item) => {
                  return (
                      <SidebarMenuItem key={item.category}>
                                                    <SidebarMenuButton
                                                        render={
                                                            <NavLink
                                                                to={`/pos/menu/${item.id}`}
                                                                className={({ isActive }) =>
                                                                    isActive ? "bg-sidebar-accent font-medium" : ""
                                                                }
                                                            />
                                                        }
                                                    >
                                                        <span>{item.category}</span>
                                                    </SidebarMenuButton>
                      </SidebarMenuItem>
                  )
              })}
              </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
    )
}