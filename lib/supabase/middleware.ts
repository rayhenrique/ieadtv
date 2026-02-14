import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_ONLY_PATHS = ['/admin/usuarios', '/admin/auditoria']
const USER_ROLES_TABLE = 'user_roles' as never

function isAdminOnlyPath(pathname: string) {
    return ADMIN_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    if (!user && pathname.startsWith('/admin')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user && pathname.startsWith('/login')) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/dashboard'
        return NextResponse.redirect(url)
    }

    if (user && isAdminOnlyPath(pathname)) {
        const { data: roleRow, error: roleError } = await supabase
            .from(USER_ROLES_TABLE)
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle()

        const resolvedRole = (roleRow as { role?: string } | null)?.role
        if (roleError || resolvedRole !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/admin/perfil'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
