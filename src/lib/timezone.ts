// Configuração de timezone
export const TIMEZONE = import.meta.env.VITE_TIMEZONE || 'America/Sao_Paulo';

/**
 * Converte uma data UTC para o timezone configurado
 */
export function formatDateWithTimezone(date: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options
  }).format(dateObj);
}

/**
 * Converte uma data UTC para o timezone configurado (formato curto)
 */
export function formatDateShort(date: string | Date): string {
  return formatDateWithTimezone(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Converte uma data UTC para o timezone configurado (apenas data)
 */
export function formatDateOnly(date: string | Date): string {
  return formatDateWithTimezone(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Converte uma data UTC para o timezone configurado (apenas hora)
 */
export function formatTimeOnly(date: string | Date): string {
  return formatDateWithTimezone(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Retorna a data/hora atual no timezone configurado
 */
export function getCurrentDateTime(): string {
  return formatDateWithTimezone(new Date());
}

/**
 * Calcula diferença de tempo em formato legível
 */
export function getTimeAgo(date: string | Date): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'agora mesmo';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} min atrás`;
  } else if (diffHours < 24) {
    return `${diffHours}h atrás`;
  } else {
    return `${diffDays}d atrás`;
  }
} 