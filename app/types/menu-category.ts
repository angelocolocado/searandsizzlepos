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

export type CheckoutCartModifier = {
    modifier_id: string;
    quantity: number;
};

export type CheckoutCartLine = {
    menu_id: string;
    quantity: number;
    modifiers?: CheckoutCartModifier[];
};

export type CheckoutPrepareResponse = {
    totalAmount: number;
};

export type CheckoutSuccessResponse = {
    status: "success";
    totalAmount: number;
    payment_method: "cash" | "cashless";
    payment: {
        status: "accepted";
        amount: number;
    };
};

export type KitchenOrder = {
    orderNumber: number;
    itemCount: number;
    elapsed: string;
    type: "Dine in" | "Take out";
    payment_status: "paid" | "pay_later";
    totalPayment?: number;
    order: {
        name: string;
        quantity: number;
        modifiers: {
            name: string;
            quantity: number;
        }[];
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