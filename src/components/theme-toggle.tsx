import { Moon, Sun } from "lucide-react";

import { Button, type buttonVariants } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/providers/theme";
import type { VariantProps } from "class-variance-authority";

export function ThemeToggle({
	...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
	const { setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="secondary" size="icon" className="size-7" {...props}>
					<Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme("light")}>
					Claro
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")}>
					Oscuro
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")}>
					Sistema
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
