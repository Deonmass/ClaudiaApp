/** Indique une base Supabase non initialisée (tables / schéma manquants). */
export function isSupabaseSchemaError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('does not exist') ||
    m.includes('could not find the table') ||
    m.includes('schema cache') ||
    m.includes('pgrst205') ||
    m.includes('relation') && m.includes('not found')
  )
}

export function formatSupabaseError(error: unknown): string {
  if (typeof error === 'string') return error

  const raw =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message)
      : error instanceof Error
        ? error.message
        : 'Erreur Supabase.'

  const tablePrefix = raw.match(/^(\w+):\s*(.+)$/)
  const message = tablePrefix ? tablePrefix[2] : raw

  if (message.includes('duplicate key')) {
    if (message.includes('users_email_unique')) {
      return 'Cet email est déjà utilisé par un autre compte.'
    }
    if (message.includes('users_username_unique')) {
      return "Ce nom d'utilisateur (login) est déjà pris."
    }
    if (message.includes('projects_code_unique')) {
      return 'Ce code projet existe déjà.'
    }
    return 'Cette valeur existe déjà (doublon).'
  }

  if (isSupabaseSchemaError(message) || isSupabaseSchemaError(raw)) {
    return tablePrefix
      ? `Table « ${tablePrefix[1]} » introuvable dans Supabase.`
      : 'Schéma Supabase non initialisé.'
  }

  if (message.includes('permission denied') || message.includes('row-level security')) {
    return 'Accès refusé par les politiques Supabase (RLS).'
  }

  if (
    message.includes('foreign key') ||
    message.includes('violates') ||
    message.includes('still referenced')
  ) {
    return 'Impossible de supprimer : cet utilisateur est encore lié à des projets ou des opérations de caisse.'
  }

  return tablePrefix ? `${tablePrefix[1]} : ${message}` : message
}

export function isDuplicateUserError(error: unknown): boolean {
  const msg = formatSupabaseError(error).toLowerCase()
  return (
    msg.includes('email est déjà') ||
    msg.includes('login') && msg.includes('déjà') ||
    msg.includes('duplicate key')
  )
}

export function duplicateUserAlertMessage(error: unknown): string {
  const msg = formatSupabaseError(error)
  if (msg.includes('email')) return 'Cet email est déjà utilisé par un autre compte.'
  if (msg.includes('utilisateur') || msg.includes('login')) {
    return "Ce nom d'utilisateur (login) est déjà pris."
  }
  return msg
}
