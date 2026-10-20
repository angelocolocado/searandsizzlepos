import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { AppSidebar } from "~/components/sidebar/app-sidebar"
import { NavLink, Outlet, useLocation } from "react-router"
import { Skeleton } from "~/components/ui/skeleton"
import { Spinner } from "~/components/ui/spinner"
import React from "react"

type ItemType = {
  label: string,
  url: string
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      {/* Ginawang mx-auto at w-full para manatiling nasa gitna kapag lumagpas ng 1300px */}
      <main className="min-w-0 flex-1 max-w-[1600px] w-full mx-auto">
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  )
}