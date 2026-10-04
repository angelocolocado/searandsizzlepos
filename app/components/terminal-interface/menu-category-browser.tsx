import { Button } from "@base-ui/react";
import { memo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { MenuCategory, MenuItem } from "~/types/menu-category";

const MenuItemCard = memo(function MenuItemCard({ menu, onSelectMenu }: { menu: MenuItem, onSelectMenu: (menu: MenuItem) => void }) {

    const handleClick = () => {
        onSelectMenu(menu)
    }

    return (
        <Button onClick={handleClick}>
            <article
                aria-label={`${menu.name}, ${menu.status}`}
                className="flex min-h-[68px] w-[92px] items-center justify-center rounded-sm border bg-background px-2 py-2 text-center text-[13px] leading-4 font-medium shadow-sm"
            >
                <span className="line-clamp-3">{menu.name}</span>
            </article>
        </Button>
    );
});

export const MenuCategoryBrowser = memo(function MenuCategoryBrowser({ category, onSelectMenu }: { category?: MenuCategory, onSelectMenu: (menu: MenuItem) => void }) {
    if (!category) {
        return (
            <section className="mt-3 flex min-h-32 items-center justify-center rounded-md border bg-card px-4 text-sm text-muted-foreground">
                Choose a menu category to view its items.
            </section>
        );
    }

    const recipeCategories = category.recipe_categories;

    if (recipeCategories.length === 0) {
        return (
            <section className="mt-3 flex min-h-32 items-center justify-center rounded-md border bg-card px-4 text-sm text-muted-foreground">
                No menu categories available.
            </section>
        );
    }

    return (
        <section className="mt-3 overflow-hidden rounded-md border bg-card">
            <Tabs
                key={category.id}
                defaultValue={String(recipeCategories[0].id)}
                className="w-full gap-0 flex flex-col"
            >
                <TabsList
                    variant="line"
                    className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b px-2"
                >
                    {recipeCategories.map((recipeCategory) => (
                        <TabsTrigger
                            key={recipeCategory.id}
                            value={String(recipeCategory.id)}
                            className="min-h-10 flex-none rounded-none border-r px-3 last:border-r-0 after:bg-green-600"
                        >
                            {recipeCategory.category}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {recipeCategories.map((recipeCategory) => (
                    <TabsContent
                        key={recipeCategory.id}
                        value={String(recipeCategory.id)}
                        className="min-h-24 p-4"
                    >
                        {recipeCategory.menus.length > 0 ? (
                            <div className="grid grid-cols-[repeat(auto-fill,92px)] gap-3">
                                {recipeCategory.menus.map((menu) => (
                                    <MenuItemCard onSelectMenu={onSelectMenu} key={menu.id} menu={menu} />
                                ))}
                            </div>
                        ) : (
                            <p className="py-4 text-sm text-muted-foreground">
                                No menu items in this category.
                            </p>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </section>
    );
});