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
    subtotal?: number;
    discount_amount?: number;
    voucher_code?: string;
    voucher_valid?: boolean;
    voucher_message?: string | null;
};

export type CheckoutSuccessResponse = {
    status: "success";
    order_number: number;
    subtotal?: number;
    discount_amount?: number;
    voucher_code?: string;
    totalAmount: number;
    payment_method: "cash" | "cashless";
    payment: {
        status: "accepted";
        amount: number;
    };
};

export type VoucherValidationResponse = {
    valid: boolean;
    voucher_code: string | null;
    subtotal: number;
    discount_amount: number;
    total_amount: number;
    message: string | null;
};

export type KitchenOrder = {
    orderId: number
    orderNumber: number;
    itemCount: number | null;
    elapsed: string;
    type: "Dine in" | "Take out";
    payment_status: "paid" | "pay_later";
    totalPayment?: number;
    order: {
        name: string;
        quantity: number;
        unitPrice?: number;
        modifiers: {
            name: string;
            quantity: number;
            unitPrice?: number;
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