import { SearchIcon } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "~/components/ui/input-group"

export function SearchBar(){
    return <>
        <InputGroup className="rounded-3xl max-w-sm border transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 group">
        <InputGroupInput 
            placeholder="Look for the menu you're looking for..." 
            className="focus-visible:ring-0 focus-visible:outline-none border-none shadow-none"
        />
        <InputGroupAddon>
            <SearchIcon className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
        </InputGroupAddon>
        </InputGroup>
    </>
}