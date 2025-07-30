/**
 * Formatea un número como moneda (CLP por defecto)
 * @param amount - Monto a formatear
 * @param locale - Localización para el formato (por defecto 'es-CL')
 * @param currency - Moneda (por defecto 'CLP')
 * @returns String formateado como moneda
 */
export const formatCurrency = (
  amount: number, 
  locale: string = 'es-CL', 
  currency: string = 'CLP'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formatea una fecha ISO a formato local
 * @param dateString - Fecha en formato ISO string
 * @param locale - Localización para el formato (por defecto 'es-CL')
 * @returns String con la fecha formateada
 */
export const formatDate = (
  dateString: string,
  locale: string = 'es-CL'
): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formatea una fecha y hora ISO a formato local
 * @param dateString - Fecha en formato ISO string
 * @param locale - Localización para el formato (por defecto 'es-CL')
 * @returns String con la fecha y hora formateadas
 */
export const formatDateTime = (
  dateString: string,
  locale: string = 'es-CL'
): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
