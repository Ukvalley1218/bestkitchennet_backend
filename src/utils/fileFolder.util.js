export const generateFolderPath = ({
  tenantId,
  moduleName,
  subFolder = "",
}) => {
  let basePath = `saas/${tenantId}/${moduleName}`;

  if (subFolder) {
    basePath += `/${subFolder}`;
  }

  return basePath;
};