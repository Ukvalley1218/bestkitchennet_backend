const tenantMiddleware = (req, res, next) => {
  /**
   * Super Admin → access all tenants
   */
  if (req.user.tenantId === null) {
    req.tenantFilter = {}; // no filter
  } else {
    /**
     * Company users → restricted to their tenant
     */
    req.tenantFilter = { tenantId: req.user.tenantId };
  }

  next();
};

export default tenantMiddleware;
