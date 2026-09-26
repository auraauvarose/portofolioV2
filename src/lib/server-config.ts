export function adminPassword(): string {
  return (process.env.ADMIN_PASSWORD ?? "").trim();
}

export function sessionSecret(): string {
  return process.env.ADMIN_COOKIE_SECRET?.trim() || adminPassword();
}
