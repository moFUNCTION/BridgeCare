export const AppDomains = {
  Auth: "auth.example.test",
  Admin: "admin.example.test",
  Instructor: "instructor.example.test",
  Affiliate: "affiliate.example.test",
};

export const AppPorts = {
  Auth: 3005,
  Instructor: 7540,
  Affiliate: 4010,
  Admin: 3010,
};

export const getAppUrl = (app: keyof typeof AppDomains) => {
  const domain = AppDomains[app];
  const port = AppPorts[app as keyof typeof AppPorts];
  return port ? `http://${domain}:${port}` : `http://${domain}`;
};

export const getPlatformDashboardUrl = (subDomain: string) => {
  return `http://${subDomain}.127.0.0.1.nip.io:7640`;
};
