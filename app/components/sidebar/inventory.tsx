import { 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent,
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "../ui/sidebar"

import { matchPath, NavLink, useLocation } from "react-router"
import type { SidebarData } from "./app-sidebar"


type ComponentProps = {
    nav_items: SidebarData[]
    title: string
}

export function SidebarNavigations({ nav_items, title } : ComponentProps) {
    const { pathname } = useLocation()
    const isActive = (item: SidebarData) =>
        matchPath(
            { path: "/pos/menu/:categoryId", end: true },
            pathname
        )?.params.categoryId === String(item.id)

    return (
        <SidebarGroup>
          <SidebarGroupLabel>{title}</SidebarGroupLabel>
          <SidebarGroupContent>
              <SidebarMenu>
                            {nav_items.filter((item) => !item.isHidden).map((item) => {
                  return (
                      <SidebarMenuItem key={item.category}>
                        <SidebarMenuButton
                            isActive={isActive(item)}
                            className={
                                isActive(item)
                                    ? "bg-green-500 text-white hover:bg-green-500 hover:text-white data-active:bg-green-500 data-active:text-white"
                                    : ""
                            }
                            render={
                                <NavLink
                                    to={`/pos/menu/${item.id}`}
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