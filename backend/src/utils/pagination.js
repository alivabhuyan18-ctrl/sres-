export const getPagination = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const shouldPaginate = (query) => ["page", "limit"].some((key) => key in query);

export const paginatedResponse = ({ items, total, page, limit }) => ({
  items,
  total,
  page,
  pages: Math.max(Math.ceil(total / limit), 1)
});
