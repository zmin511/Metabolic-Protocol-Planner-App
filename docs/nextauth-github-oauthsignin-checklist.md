# NextAuth + GitHub: ошибка `error=OAuthSignin`

Если редирект уходит на:

`/api/auth/signin?error=OAuthSignin`

чаще всего проблема не в callback `signIn`, а в OAuth-настройках (ID/secret/callback URL/окружение).

## Что проверить в первую очередь

1. **`GITHUB_CLIENT_ID` и `GITHUB_CLIENT_SECRET` заданы в Production и Preview.**  
   На Vercel переменная может быть создана только для `Preview`, и в `Production` тогда будет пусто.

2. **`NEXTAUTH_URL` строго совпадает с доменом окружения.**  
   Для прода это обычно `https://your-domain.com`, без лишнего слеша в конце.

3. **Callback URL в GitHub OAuth App**:  
   `https://your-domain.com/api/auth/callback/github`  
   (и для preview, если используете отдельное OAuth App на preview-домен).

4. **После изменения env на Vercel — сделать Redeploy.**

5. **Включить `NEXTAUTH_DEBUG=true` временно** и проверить серверные логи.

---

## Почему это важно

`OAuthSignin` обычно возникает **до** вашего `callbacks.signIn`.  
То есть проверка `ALLOWED_GITHUB_USER` чаще даёт `AccessDenied`, а не `OAuthSignin`.

---

## Более безопасный вариант `authOptions`

```ts
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

if (!githubClientId || !githubClientSecret) {
  throw new Error("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const allowed = process.env.ALLOWED_GITHUB_USER?.trim().toLowerCase();
      const login = (profile as { login?: string } | null)?.login?.trim().toLowerCase();

      if (!allowed) return false;
      return login === allowed;
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.login = (profile as { login?: string }).login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { login?: string }).login = token.login as string | undefined;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};
```

## Диагностика по шагам

1. Временно удалить проверку `ALLOWED_GITHUB_USER` (или вернуть `true` в `signIn`) и проверить вход.
2. Если всё равно `OAuthSignin`, проблема точно в provider/env/callback URL.
3. Если вход стал успешным — вернуть фильтр пользователя и проверить точное значение `login` в GitHub.
