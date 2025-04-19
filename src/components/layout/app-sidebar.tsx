"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  User,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

// Pages that should automatically collapse the sidebar
const COLLAPSE_ON_PAGES = ["/chat"];

export default function AppSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isMobile = useMobile();
  const { state, setOpen } = useSidebar();

  // Add mounted state to check if component has mounted
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Auto-collapse sidebar on specific pages
    if (COLLAPSE_ON_PAGES.includes(pathname)) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [pathname, setOpen]);

  // If not mounted, return null (or show fallback loading state)
  if (!mounted) {
    return null;
  }

  const mainNavItems = [
    { name: "Feed", href: "/", icon: Home },
    { name: "Messages", href: "/chat", icon: MessageSquare },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  const profileNavItems = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // If mobile, render bottom bar instead of sidebar
  if (isMobile) {
    return <MobileBottomBar pathname={pathname} />;
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="flex justify-center py-4">
        <Link
          href="/"
          className={`flex ${
            state === "expanded" ? "items-center gap-2 px-4" : "justify-center"
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden">
            <Image src="/img/logo.png" alt="Logo" width={32} height={32} />
          </div>
          {state === "expanded" && (
            <span className="text-lg font-bold">Palmtagram</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {profileNavItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.name}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={toggleTheme}
                  tooltip={theme === "dark" ? "Light Mode" : "Dark Mode"}
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div
          className={`p-3 ${
            state === "collapsed" ? "flex justify-center" : ""
          }`}
        >
          {state === "expanded" ? (
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src="/img/avatar1.png" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-sm">
                <span className="font-medium">Alex Johnson</span>
                <span className="text-xs text-muted-foreground">@alexj</span>
              </div>
              <LogOut className="ml-auto h-4 w-4" />
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/img/avatar1.png" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

// Mobile bottom navigation bar
function MobileBottomBar({ pathname }: { pathname: string }) {
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const mainNavItems = [
    { name: "Feed", href: "/", icon: Home },
    { name: "Messages", href: "/chat", icon: MessageSquare },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Profile", href: "/profile", icon: User },
  ];

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="flex justify-around items-center h-16">
          {mainNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full ${
                pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
          <button
            className="flex flex-col items-center justify-center w-full h-full text-muted-foreground"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">More</span>
          </button>
        </div>
      </div>

      {/* User Menu Popup */}
      {showUserMenu && (
        <div className="fixed bottom-16 right-0 left-0 bg-background border-t border-border p-4 space-y-3 z-50">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-4 w-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span>Dark Mode</span>
              </>
            )}
          </Button>

          <Button variant="ghost" className="w-full justify-start gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src="/img/avatar1.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-sm">
              <span className="font-medium">Alex Johnson</span>
              <span className="text-xs text-muted-foreground">@alexj</span>
            </div>
            <LogOut className="ml-auto h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Button>
        </div>
      )}

      {/* Add padding to the bottom of the page to account for the bottom bar */}
      <div className="h-16"></div>
    </>
  );
}
