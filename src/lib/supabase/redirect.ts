const DEFAULT_REDIRECT_PATH = "/account";

export function sanitizeRedirectPath(input: string | null | undefined) {
  if (!input || !input.startsWith("/") || input.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  return input;
}
