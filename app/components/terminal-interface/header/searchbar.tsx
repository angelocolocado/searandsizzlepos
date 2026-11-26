import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { SearchIcon } from "lucide-react";
import api from "~/lib/axios";
import { isMenuItem } from "~/lib/menu-item-validation";
import type { MenuItem } from "~/types/menu-category";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "~/components/ui/input-group";

const SEARCH_DEBOUNCE_MS = 350;
const MAX_SEARCH_RESULTS = 10;

type SearchState = "idle" | "loading" | "loaded" | "error";

function parseSearchResults(value: unknown): MenuItem[] {
    if (typeof value !== "object" || value === null || !("results" in value)) {
        throw new Error("Menu search returned an invalid response.");
    }

    const results = value.results;
    if (!Array.isArray(results) || !results.every(isMenuItem)) {
        throw new Error("Menu search returned invalid menu items.");
    }

    return results;
}

const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(price);

type SearchBarProps = {
    menuItems: MenuItem[];
    isMenuCatalogLoading: boolean;
    onSelectMenu: (menu: MenuItem) => void;
};

export function SearchBar({
    menuItems,
    isMenuCatalogLoading,
    onSelectMenu,
}: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [searchState, setSearchState] = useState<SearchState>("idle");
    const [serverResults, setServerResults] = useState<MenuItem[]>([]);
    const [serverQuery, setServerQuery] = useState("");
    const [searchError, setSearchError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const normalizedQuery = query.trim().toLocaleLowerCase();

    const localResults = useMemo(() => {
        if (!normalizedQuery) return [];

        return menuItems
            .filter((menu) =>
                menu.name.toLocaleLowerCase().includes(normalizedQuery) ||
                menu.description?.toLocaleLowerCase().includes(normalizedQuery)
            )
            .slice(0, MAX_SEARCH_RESULTS);
    }, [menuItems, normalizedQuery]);

    useEffect(() => {
        setSearchError(null);
        setServerResults([]);
        setServerQuery("");

        if (!normalizedQuery || localResults.length > 0 || isMenuCatalogLoading) {
            setSearchState("idle");
            return;
        }

        const controller = new AbortController();
        setSearchState("loading");
        const timeout = window.setTimeout(async () => {
            try {
                const response = await api.get<unknown>("/v1/menus/search", {
                    params: { query: query.trim(), limit: MAX_SEARCH_RESULTS },
                    signal: controller.signal,
                });
                const results = parseSearchResults(response.data);
                if (!controller.signal.aborted) {
                    setServerResults(results.slice(0, MAX_SEARCH_RESULTS));
                    setServerQuery(normalizedQuery);
                    setSearchState("loaded");
                }
            } catch (error) {
                if (controller.signal.aborted) return;

                console.error("Menu search request failed.", error);
                setServerQuery(normalizedQuery);
                setSearchState("error");
                setSearchError(
                    axios.isAxiosError(error) && error.response?.status === 404
                        ? "Server menu search is not available yet."
                        : "Could not search the full menu catalog. Try again."
                );
            }
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [isMenuCatalogLoading, localResults.length, normalizedQuery, query]);

    const isOpen = isFocused && normalizedQuery.length > 0;
    const visibleResults = localResults.length > 0
        ? localResults
        : serverQuery === normalizedQuery
            ? serverResults
            : [];
    const selectMenu = (menu: MenuItem) => {
        onSelectMenu(menu);
        setQuery("");
        setIsFocused(false);
        setActiveIndex(-1);
    };
    const statusMessage = localResults.length > 0
        ? `Showing ${localResults.length} menu match${localResults.length === 1 ? "" : "es"} from loaded data.`
        : isMenuCatalogLoading
            ? "Searching loaded menus..."
            : searchState === "loading"
                ? "Searching all menus..."
                : searchError ??
                    (searchState === "loaded"
                        ? "No matching menus found."
                        : "No matching menus in loaded data yet.");

    return (
        <div
            ref={containerRef}
            className="relative w-full max-w-sm"
            onFocus={() => setIsFocused(true)}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsFocused(false);
                }
            }}
        >
            <InputGroup className="rounded-3xl border transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 group">
                <InputGroupInput
                    type="search"
                    role="combobox"
                    aria-label="Search menus"
                    aria-autocomplete="list"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? "menu-search-results" : undefined}
                    aria-activedescendant={
                        activeIndex >= 0 ? `menu-search-option-${activeIndex}` : undefined
                    }
                    placeholder="Look for the menu you're looking for..."
                    maxLength={100}
                    className="focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setActiveIndex(-1);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            setIsFocused(false);
                            setActiveIndex(-1);
                        } else if (visibleResults.length > 0 && event.key === "ArrowDown") {
                            event.preventDefault();
                            setActiveIndex((current) =>
                                current >= visibleResults.length - 1 ? 0 : current + 1
                            );
                        } else if (visibleResults.length > 0 && event.key === "ArrowUp") {
                            event.preventDefault();
                            setActiveIndex((current) =>
                                current <= 0 ? visibleResults.length - 1 : current - 1
                            );
                        } else if (event.key === "Enter" && activeIndex >= 0) {
                            const menu = visibleResults[activeIndex];
                            if (menu) {
                                event.preventDefault();
                                selectMenu(menu);
                            }
                        }
                    }}
                />
                <InputGroupAddon align="inline-end">
                    <SearchIcon className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                </InputGroupAddon>
            </InputGroup>

            {isOpen && (
                <div
                    id="menu-search-results"
                    role="listbox"
                    aria-label="Menu search results"
                    className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
                >
                    {visibleResults.length > 0 ? (
                        visibleResults.map((menu, index) => {
                            const unavailable =
                                menu.insufficient === true || menu.max_quantity <= 0;
                            return (
                                <button
                                    key={menu.id}
                                    id={`menu-search-option-${index}`}
                                    type="button"
                                    role="option"
                                    aria-selected={activeIndex === index}
                                    disabled={unavailable}
                                    className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50 ${activeIndex === index ? "bg-accent" : ""}`}
                                    onMouseMove={() => setActiveIndex(index)}
                                    onClick={() => selectMenu(menu)}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">{menu.name}</span>
                                        {unavailable && (
                                            <span className="block text-xs text-muted-foreground">
                                                Currently unavailable
                                            </span>
                                        )}
                                    </span>
                                    <span className="shrink-0 tabular-nums">
                                        {formatPrice(menu.selling_price)}
                                    </span>
                                </button>
                            );
                        })
                    ) : (
                        <p
                            role={searchState === "error" ? "alert" : "status"}
                            className="px-3 py-3 text-sm text-muted-foreground"
                        >
                            {statusMessage}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
