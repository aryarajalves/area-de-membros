/**
 * Helper para geração de links universais de adição à agenda (Google Agenda e iCal).
 */

export function generateGoogleCalendarUrl({ title, description = '', startTime, endTime, meetingUrl = '' }) {
  if (!startTime) return '';

  const start = new Date(startTime);
  if (isNaN(start.getTime())) return '';

  const end = endTime && !isNaN(new Date(endTime).getTime())
    ? new Date(endTime)
    : new Date(start.getTime() + 60 * 60 * 1000); // 1 hora padrão de duração

  const formatUtc = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');
  const dates = `${formatUtc(start)}/${formatUtc(end)}`;

  let detailsText = description || '';
  if (meetingUrl) {
    detailsText = detailsText
      ? `${detailsText}\n\n🔗 Link da Transmissão: ${meetingUrl}`
      : `🔗 Link da Transmissão: ${meetingUrl}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates,
    details: detailsText,
    location: meetingUrl || 'Transmissão Ao Vivo (Online)',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function formatBrasiliaDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  // Formata explicitamente em Horário de Brasília (America/Sao_Paulo)
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getEventStatus(startTime, endTime) {
  const now = new Date();
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  if (now >= start && now <= end) {
    return 'live'; // Ao Vivo Agora
  }
  if (now < start) {
    return 'upcoming'; // Próximo
  }
  return 'past'; // Encerrado
}
