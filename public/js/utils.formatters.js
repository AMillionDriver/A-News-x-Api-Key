export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatDateTime = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const buildMetaText = (article) => {
  if (!article) return '';
  const parts = [];
  const formattedDate = formatDate(article.publishedAt);
  if (formattedDate) {
    parts.push(formattedDate);
  }
  if (article.source?.name) {
    parts.push(article.source.name);
  }
  return parts.join(' • ');
};

export const pluralize = (value, singular, plural) => {
  const amount = Number(value) || 0;
  return amount === 1 ? singular : plural;
};
