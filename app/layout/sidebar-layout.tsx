import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { AppSidebar } from "~/components/sidebar/app-sidebar"
import { NavLink, Outlet, useLocation } from "react-router"
import { Toaster } from "~/components/ui/sonner"
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
      <main className="min-w-0 flex-1 max-w-[1300px] items-center">
        <div className="flex-1 overflow-hidden">
          <Outlet />
          <Toaster theme="dark" richColors position="top-right" />
        </div>
      </main>
    </SidebarProvider>
  )
}