import { EyeIcon, EyeOffIcon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";

function InputPassword({ className, ...props }: React.ComponentProps<"input">) {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<div className="relative">
			<Input
				type={showPassword ? "text" : "password"}
				className={className}
				{...props}
			/>
			<Button
				size="icon"
				className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
				onClick={() => setShowPassword((v) => !v)}
				aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
			>
				{showPassword ? (
					<EyeOffIcon className="size-4" />
				) : (
					<EyeIcon className="size-4" />
				)}
			</Button>
		</div>
	);
}

export { InputPassword };
