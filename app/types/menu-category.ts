export type MenuModifier = {
    id: string;
    name: string;
    price: number;
    category: string;
};

export type MenuItem = {
    id: string;
    name: string;
    selling_price: number;
    description: string | null;
    status: string;
    modifiers: MenuModifier[];
};

export type CartMenuResponse = {
    items: MenuItem[];
};

export type OrderLine = {
    menuId: MenuItem["id"];
    menu: MenuItem;
    quantity: number;
    modifiers: {
        modifierId: MenuModifier["id"];
        modifier: MenuModifier;
        quantity: number;
    }[];
};

export type RecipeCategory = {
    id: number;
    category: string;
    menus: MenuItem[];
};

export type MenuCategory = {
    id: number;
    category: string;
    recipe_categories: RecipeCategory[];
};