import { z } from "zod";

export const CreateKeySchema = z.object({
  name: z
    .string({
      required_error: "El nombre es obligatorio",
    })
    .min(1, { message: "El nombre no puede estar vacío" })
    .max(50, { message: "El nombre no puede tener más de 50 caracteres" }),
  urlWebSite: z
    .string()
    .url({ message: "La URL proporcionada no es válida" })
    .nullable()
    .optional(),
  userName: z
    .string()
    .max(50, {
      message: "El nombre de usuario no puede tener más de 50 caracteres",
    })
    .nullable()
    .optional(),
  password: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
  keyTypeId: z
    .string({
      required_error: "El ID del tipo de clave es obligatorio",
    })
    .min(1, { message: "El ID del tipo de clave no puede estar vacío" }),
});

export type CreateKeySchemaType = z.infer<typeof CreateKeySchema>;

