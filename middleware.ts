import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Vérifier si l'utilisateur est connecté
  const token = request.cookies.get("auth_token")?.value

  // Si l'utilisateur n'est pas connecté et qu'il essaie d'accéder à une page protégée
  if (!token && !request.nextUrl.pathname.startsWith("/login")) {
    // Rediriger vers la page de connexion
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Si l'utilisateur est connecté et qu'il essaie d'accéder à la page de connexion
  if (token && request.nextUrl.pathname.startsWith("/login")) {
    // Rediriger vers la page d'accueil
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// Configurer les chemins sur lesquels le middleware doit s'exécuter
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

