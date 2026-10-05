import { authError, forbiddenUnlessSameOrigin, readJson, signedIn } from "@/lib/server/auth-routes";
import { backendFetch, type TokenPair } from "@/lib/server/backend";

interface PasswordBody {
  mode: "signIn" | "create";
  email: string;
  password: string;
}

/** "Use a password instead": sign in, or create an account, with a password. */
export async function POST(request: Request) {
  const forbidden = forbiddenUnlessSameOrigin(request);
  if (forbidden) return forbidden;

  const body = await readJson<PasswordBody>(request);
  if (typeof body?.email !== "string" || typeof body.password !== "string") return authError("invalidEmail", 422);
  const email = body.email.trim();

  try {
    if (body.mode === "create") {
      if (body.password.length < 8) return authError("passwordShort", 422);
      const response = await backendFetch("/auth/register", { json: { email, password: body.password } });
      if (response.status === 409) return authError("exists", 409);
      if (response.status === 422) return authError("invalidEmail", 422);
      if (!response.ok) return authError("generic", 502);
      return signedIn((await response.json()) as TokenPair);
    }

    // The backend's OAuth2 password form calls the email "username".
    const response = await backendFetch("/auth/login", { form: { username: email, password: body.password } });
    if (response.status === 401 || response.status === 422) return authError("wrongPassword", 401);
    if (!response.ok) return authError("generic", 502);
    return signedIn((await response.json()) as TokenPair);
  } catch {
    return authError("unreachable", 502);
  }
}
