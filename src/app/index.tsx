import Logo from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { InputPassword } from "@/components/ui/input-password";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CreateKeySchema, type CreateKeySchemaType } from "@/lib/schema";
import { planTranslate, roleTranslate } from "@/lib/translate";
import { apiClient, cn, toMilliseconds } from "@/lib/utils";
import type { CacheData, Endpoints, KeyTypeProps, SessionProps } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CopyIcon, DicesIcon, Loader2Icon, SaveIcon } from "lucide-react";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function App() {
	const [keyTypes, setKeyTypes] = useState<KeyTypeProps[]>([]);
	const [status, setStatus] = useState<string>("");
	const [session, setSession] = useState<SessionProps | null>(null);
	const [isTransitioning, startTransition] = useTransition();
	const [isLoading, setIsLoading] = useState(true);
	const [accountsForThisSite, setAccountsForThisSite] = useState<any[]>([]);

	const form = useForm<CreateKeySchemaType>({
		resolver: zodResolver(CreateKeySchema),
		defaultValues: {
			name: "",
			urlWebSite: "",
			userName: "",
			password: "",
			keyTypeId: "",
		},
	});

	// Función para obtener datos del caché
	const getCachedData = useCallback(async () => {
		if (!chrome?.storage?.local) return null;

		try {
			const data = await chrome.storage.local.get([
				"session",
				"status",
				"keyTypes",
				"lastUpdate",
			]);
			const lastUpdate = data.lastUpdate || 0;
			const now = Date.now();

			if (now - lastUpdate < toMilliseconds("1m")) {
				return data;
			}
			return null;
		} catch (error) {
			console.error("Error al obtener datos del caché:", error);
			return null;
		}
	}, []);

	// Función para guardar datos en el caché
	const saveToCache = useCallback(
		async (data: Omit<CacheData, "lastUpdate">) => {
			if (!chrome?.storage?.local) return;

			try {
				await chrome.storage.local.set({
					...data,
					lastUpdate: Date.now(),
				});
			} catch (error) {
				console.error("Error al guardar en caché:", error);
			}
		},
		[],
	);

	const getTabInfo = useCallback(async () => {
		if (!chrome?.tabs) return;
		try {
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});

			if (!tab?.url) return;

			const url = new URL(tab.url);
			const protocol = url.protocol.replace(":", "");
			const siteUrl = `${protocol}://${url.hostname}`;
			form.setValue("urlWebSite", siteUrl);

			// Consultar cuentas registradas para esta URL
			try {
				const response = await apiClient.fetch<{ data: any[] }>("/keybyurl" as Endpoints, {
					method: "POST",
					body: JSON.stringify({ url: siteUrl }),
				});
				setAccountsForThisSite(response.data || []);
			} catch (e) {
				setAccountsForThisSite([]);
			}

			const results = await chrome.scripting.executeScript({
				target: { tabId: tab.id as number },
				func: () => {
					const userFields = document.querySelectorAll<HTMLInputElement>(
						'input[type="text"], input[type="email"]',
					);
					const passFields = document.querySelectorAll<HTMLInputElement>(
						'input[type="password"]',
					);
					return {
						userName: userFields[0]?.value ?? "",
						password: passFields[0]?.value ?? "",
					};
				},
			});

			if (results?.[0]?.result) {
				const { userName, password } = results[0].result;
				form.setValue("userName", userName);
				form.setValue("password", password);
			}
		} catch (error) {
			console.error("Error al obtener información de la pestaña:", error);
		}
	}, [form]);

	// Inicialización de datos con caché
	const initializeData = useCallback(async () => {
		try {
			setIsLoading(true);
			// Intentar obtener datos del caché
			const cachedData = await getCachedData();

			if (cachedData?.session) {
				setSession(cachedData.session);
				setStatus(cachedData.status);
				setKeyTypes(cachedData.keyTypes);
				setIsLoading(false);
				return;
			}

			// Si no hay caché o está expirado, hacer las peticiones
			const sessionData = await apiClient.fetch<SessionProps>("/session");

			if (!sessionData) {
				setSession(null);
				setIsLoading(false);
				return;
			}

			const [statusData, keyTypesData] = await Promise.all([
				apiClient.fetch<string>("/status"),
				apiClient.fetch<KeyTypeProps[]>("/keytype"),
			]);

			// Actualizar estado
			setSession(sessionData);
			setStatus(statusData);
			setKeyTypes(keyTypesData);
			setIsLoading(false);

			// Guardar en caché
			await saveToCache({
				session: sessionData,
				status: statusData,
				keyTypes: keyTypesData,
			});
		} catch (error) {
			setSession(null);
			setIsLoading(false);
		}
	}, [getCachedData, saveToCache]);

	// Función para abrir la ventana de login
	const openLoginWindow = useCallback(async () => {
		if (!chrome?.windows || session) return;

		const loginWindow = await chrome.windows.create({
			url: "https://novasecure.vercel.app/login",
			type: "popup",
			width: 600,
			height: 600,
			focused: true,
			left: Math.round((screen.width - 600) / 2),
			top: Math.round((screen.height - 600) / 2),
		});

		// Escuchar cambios en la ventana de login
		chrome.tabs.onUpdated.addListener(function listener(_, changeInfo, tab) {
			if (tab.windowId === loginWindow.id && changeInfo.status === "complete") {
				if (tab.url?.includes("novasecure.vercel.app/dashboard")) {
					// Cerrar la ventana de login
					chrome.windows.remove(loginWindow.id);
					// Remover el listener
					chrome.tabs.onUpdated.removeListener(listener);
					// Recargar los datos
					initializeData();
				}
			}
		});
	}, [session, initializeData]);

	// Efecto para manejar la sesión
	useEffect(() => {
		if (!isLoading && !session) {
			openLoginWindow();
		}
	}, [isLoading, session, openLoginWindow]);

	useEffect(() => {
		initializeData();
		getTabInfo();
	}, [initializeData, getTabInfo]);

	const onSubmit = useCallback(async (formData: CreateKeySchemaType) => {
		startTransition(async () => {
			try {
				await apiClient.fetch("/password/save", {
					method: "POST",
					body: JSON.stringify(formData),
				});
				toast.success("Contraseña guardada exitosamente");
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Error al guardar",
				);
			}
		});
	}, []);

	const generatePassword = useCallback(async () => {
		try {
			const data = await apiClient.fetch<{ password: string }>("/password", {
				method: "POST",
				body: JSON.stringify({ length: 20, minStrength: 80 }),
			});

			form.setValue("password", data.password);
			toast.success("Contraseña generada");

			if (chrome?.tabs && chrome?.scripting) {
				const [tab] = await chrome.tabs.query({
					active: true,
					currentWindow: true,
				});
				if (tab?.id) {
					await chrome.scripting.executeScript({
						target: { tabId: tab.id },
						func: (password: string) => {
							const passField = document.querySelector(
								'input[type="password"]',
							) as HTMLInputElement;
							if (passField) passField.value = password;
						},
						args: [data.password],
					});
				}
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Error al generar contraseña",
			);
		}
	}, [form]);

	const copyPassword = useCallback(() => {
		const password = form.getValues("password");
		if (password) {
			navigator.clipboard.writeText(password);
			toast.success("Contraseña copiada");
		}
	}, [form]);

	// Componentes memoizados
	const HeaderContent = useMemo(
		() => (
			<>
				<div className="flex items-center justify-between w-full">
					{status && (
						<div className="flex items-center gap-2">
							<span
								className={cn(
									"size-4 rounded-full",
									!status ? "bg-rose-500" : "bg-emerald-500",
								)}
							/>
							<span className="text-xs text-muted-foreground">
								{status ? "En linea" : "Fuera de linea"}
							</span>
						</div>
					)}
					<div className="flex items-center gap-2">
						{session && (
							<HoverCard>
								<HoverCardTrigger asChild>
									<Avatar className="size-7">
										<AvatarImage src={session?.image ?? ""} />
										<AvatarFallback>
											{session?.name?.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
								</HoverCardTrigger>
								<HoverCardContent align="end">
									<div className="flex flex-col gap-3">
										<div>
											<h4 className="text-sm font-semibold line-clamp-1">
												{session?.name}
											</h4>
											<p className="text-xs text-muted-foreground line-clamp-1">
												{session?.email}
											</p>
										</div>
										<div className="border-t" />
										<div className="flex w-full items-stretch gap-0">
											<div className="flex flex-1 flex-col px-2">
												<span className="text-xs text-muted-foreground">
													Plan
												</span>
												<span className="text-sm font-medium">
													{planTranslate(session?.planName)}
												</span>
											</div>
											<div className="h-auto w-px bg-border mx-0" />
											<div className="flex flex-1 flex-col px-2">
												<span className="text-xs text-muted-foreground">
													Rol
												</span>
												<span className="text-sm font-medium">
													{roleTranslate(session?.role)}
												</span>
											</div>
										</div>
									</div>
								</HoverCardContent>
							</HoverCard>
						)}
						<ThemeToggle />
					</div>
				</div>
				<div className="flex items-center gap-2">
					<a
						href="https://novasecure.vercel.app/"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Logo className="size-15 text-primary" />
					</a>
					<CardTitle className="flex mt-3 flex-col text-xl font-bold leading-3">
						<span>Nova</span>
						<span className="text-2xl text-muted-foreground">Secure</span>
					</CardTitle>
				</div>
			</>
		),
		[status, session],
	);

	return (
		<Card className="w-full rounded-none border-none relative">
			<CardHeader className="flex flex-col items-center gap-2">
				{HeaderContent}
			</CardHeader>
			{isLoading ? (
				<CardContent className="flex flex-col items-center justify-center gap-4 p-6">
					<Loader2Icon className="size-8 animate-spin text-primary" />
					<p className="text-center text-sm font-medium">Cargando...</p>
				</CardContent>
			) : session ? (
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							{/* Mensaje de cuentas registradas para este sitio */}
							{accountsForThisSite.length > 0 && (
								<div className="mb-2 text-xs text-amber-600 font-semibold">
									Ya tienes {accountsForThisSite.length} usuario(s) registrado(s) en este sitio.
								</div>
							)}
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nombre</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="Ejemplo"
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="urlWebSite"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sitio web</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="www.ejemplo.com"
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="userName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Usuario</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="Ejemplo"
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Contraseña</FormLabel>
										<FormControl>
											<InputPassword {...field} placeholder="••••••••" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="keyTypeId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tipo de clave</FormLabel>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
												disabled={!keyTypes.length}
											>
												<SelectTrigger className="w-full">
													<SelectValue
														placeholder={
															keyTypes.length
																? "Seleccione un tipo"
																: "No hay tipos disponibles"
														}
													/>
												</SelectTrigger>
												<SelectContent className="max-h-80">
													{keyTypes.map((item) => (
														<SelectItem value={item.id} key={item.id}>
															{item.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid grid-cols-[1fr_auto_auto] gap-2">
								<Button
									type="submit"
									className="w-full shadow-primary/30 shadow-md"
									isLoading={isTransitioning}
								>
									<SaveIcon className="size-4" />
									Guardar
								</Button>
								<Button
									className="shadow-primary/30 shadow-md"
									size="icon"
									onClick={generatePassword}
								>
									<DicesIcon className="size-4" />
								</Button>
								<Button
									className="shadow-primary/30 shadow-md"
									size="icon"
									onClick={copyPassword}
								>
									<CopyIcon className="size-4" />
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			) : (
				<CardContent className="flex flex-col items-center justify-center gap-4 p-6">
					<Button variant="link" size="sm" onClick={openLoginWindow}>
						Abrir ventana de login
					</Button>
				</CardContent>
			)}
		</Card>
	);
}
