export const qs = (selector, scope = document) => scope.querySelector(selector);

export const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export const setHidden = (element, hidden) => {
  if (!element) return;
  element.hidden = hidden;
  element.classList.toggle('hidden', hidden);
};

export const toggleClass = (element, className, condition) => {
  if (!element) return;
  element.classList.toggle(className, Boolean(condition));
};

export const createFragmentFromHTML = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content;
};

export const sanitizeUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch (error) {
    return '#';
  }
};

export const truncateText = (text, maxLength = 160) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
};

export const preferReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const animateSwap = (container) => {
  if (!container || preferReducedMotion()) return;
  container.animate(
    [
      { opacity: 0, transform: 'translateY(12px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    {
      duration: 320,
      easing: 'ease-out',
    },
  );
};
