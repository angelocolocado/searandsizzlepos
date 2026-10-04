import { 
  BookOpen,
  Utensils,
  Soup,
  ConciergeBell,
  Sparkles,
  Cookie,
  BadgePercent,
  CupSoda,
  PlusCircle,
  Flame
} from "lucide-react"

export const navItems = {
  menu: [
    {
      title: "Menu",
      url: "/pos/menu",
      icon: BookOpen,
    },
    {
      title: "Ala Carte",
      url: "/pos/menu/ala-carte",
      icon: ConciergeBell,
    },
    {
      title: "Hot Plate",
      url: "/pos/menu/hot-plate",
      icon: Flame,
    },
    {
      title: "Silog",
      url: "/pos/menu/silog",
      icon: Utensils,
    },
    {
      title: "Pasta",
      url: "/pos/menu/pasta",
      icon: Soup,
    },
    {
      title: "Special",
      url: "/pos/menu/special",
      icon: Sparkles,
    },
    {
      title: "Nibbles",
      url: "/pos/menu/nibbles",
      icon: Cookie,
    },
    {
      title: "Every Day Deals",
      url: "/pos/menu/everyday-deals",
      icon: BadgePercent,
    },
    {
      title: "New menu Lomi Beef pares",
      url: "/pos/menu/lomi-beef-pares",
      icon: ConciergeBell,
    },
    {
      title: "Drinks",
      url: "/pos/menu/drinks",
      icon: CupSoda,
    },
    {
      title: "Add-ons",
      url: "/pos/menu/add-ons",
      icon: PlusCircle,
    },
  ],
}