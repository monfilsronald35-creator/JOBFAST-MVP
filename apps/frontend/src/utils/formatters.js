export const debounce = (fn, delay = 300) => {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = (fn, limit = 300) => {
  let waiting = false;

  return (...args) => {
    if (waiting) return;

    fn(...args);
    waiting = true;

    setTimeout(() => {
      waiting = false;
    }, limit);
  };
};

export const uniqueArray = (array = []) => [
  ...new Set(array),
];

export const sortByDate = (
  items = [],
  field = "createdAt"
) =>
  [...items].sort(
    (a, b) =>
      new Date(b?.[field] || 0).getTime() -
      new Date(a?.[field] || 0).getTime()
  );

export const sortByRating = (
  items = [],
  field = "rating"
) =>
  [...items].sort(
    (a, b) =>
      (Number(b?.[field]) || 0) -
      (Number(a?.[field]) || 0)
  );

export const groupBy = (
  array = [],
  key
) =>
  array.reduce((acc, item) => {
    const group = item?.[key] ?? "unknown";

    if (!acc[group]) {
      acc[group] = [];
    }

    acc[group].push(item);

    return acc;
  }, {});

export const paginate = (
  items = [],
  page = 1,
  limit = 20
) => {
  const safePage = Math.max(
    1,
    Number(page) || 1
  );

  const safeLimit = Math.max(
    1,
    Number(limit) || 20
  );

  const start =
    (safePage - 1) * safeLimit;

  return {
    page: safePage,
    limit: safeLimit,
    total: items.length,
    pages: Math.ceil(
      items.length / safeLimit
    ),
    data: items.slice(
      start,
      start + safeLimit
    ),
  };
};

export const pick = (
  obj = {},
  keys = []
) =>
  keys.reduce((acc, key) => {
    if (
      Object.prototype.hasOwnProperty.call(
        obj,
        key
      )
    ) {
      acc[key] = obj[key];
    }

    return acc;
  }, {});

export const omit = (
  obj = {},
  keys = []
) =>
  Object.keys(obj).reduce(
    (acc, key) => {
      if (!keys.includes(key)) {
        acc[key] = obj[key];
      }

      return acc;
    },
    {}
  );

export const safeJsonParse = (
  value,
  fallback = null
) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const safeJsonStringify = (
  value,
  fallback = ""
) => {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
};

export const generateSlug = (
  text = ""
) =>
  String(text)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const calculateCompletion = (
  completed = 0,
  total = 0
) => {
  if (!total) return 0;

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (completed / total) * 100
      )
    )
  );
};

export const isToday = (
  dateString
) => {
  const date = new Date(dateString);

  if (
    Number.isNaN(date.getTime())
  ) {
    return false;
  }

  const today = new Date();

  return (
    date.getDate() ===
      today.getDate() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getFullYear() ===
      today.getFullYear()
  );
};

export const isFutureDate = (
  dateString
) => {
  const date = new Date(dateString);

  return (
    !Number.isNaN(date.getTime()) &&
    date > new Date()
  );
};

export const isPastDate = (
  dateString
) => {
  const date = new Date(dateString);

  return (
    !Number.isNaN(date.getTime()) &&
    date < new Date()
  );
};