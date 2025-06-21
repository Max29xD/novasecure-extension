export function roleTranslate(role?: string | null): string {
  if (!role) return 'Usuario'

  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'user':
      return 'Usuario'
    default:
      return 'Usuario'
  }
}

export function planTranslate(plan?: string | null): string {
  if (!plan) return 'Gratuito'

  switch (plan) {
    case 'FREE':
      return 'Gratuito'
    case 'PRO':
      return 'Pro'
    case 'PREMIUM':
      return 'Premium'
    default:
      return 'Gratuito'
  }
}