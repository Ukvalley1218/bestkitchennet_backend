export const getDashboardFilter = (req) => {
  const filter = {
    tenantId: req.user.tenantId,
  };

  if (req.user.role === "sales") {
    filter.createdBy = req.user.id;
  }

  if (req.user.role === "manager") {
    filter.createdBy = { $in: req.user.teamUserIds };
  }

  if (req.query.from && req.query.to) {
    filter.createdAt = {
      $gte: new Date(req.query.from),
      $lte: new Date(req.query.to),
    };
  }

  return filter;
};
