import { api, setTokens } from "./client";
import type {
  Article,
  ArticleQuery,
  ArticlesResponse,
  AuthTokens,
  Comment,
  CurrentUser,
  Profile,
} from "./types";

interface LoginResponse extends AuthTokens {
  user: { id: number; email: string; roles: string[] };
}

export const authApi = {
  async login(email: string, password: string): Promise<void> {
    const data = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  },

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<void> {
    const data = await api.post<LoginResponse>("/auth/register", {
      username,
      email,
      password,
    });
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout").catch(() => undefined);
    setTokens(null);
  },
};

export const userApi = {
  me: () => api.get<{ user: CurrentUser }>("/user"),
  update: (user: Partial<CurrentUser> & { password?: string }) =>
    api.put<{ user: CurrentUser }>("/user", { user }),
};

export const articlesApi = {
  list(query: ArticleQuery = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    return api.get<ArticlesResponse>(`/posts${qs ? `?${qs}` : ""}`);
  },
  get: (slug: string) => api.get<{ post: Article }>(`/posts/${slug}`),
  create: (post: {
    title: string;
    description: string;
    body: string;
    tagList: string[];
  }) => api.post<{ post: Article }>("/posts", { post }),
  update: (
    slug: string,
    post: Partial<{
      title: string;
      description: string;
      body: string;
      tagList: string[];
    }>,
  ) => api.put<{ post: Article }>(`/posts/${slug}`, { post }),
  remove: (slug: string) => api.delete<void>(`/posts/${slug}`),
  favorite: (slug: string) =>
    api.post<{ post: Article }>(`/posts/${slug}/favorite`),
  unfavorite: (slug: string) =>
    api.delete<{ post: Article }>(`/posts/${slug}/favorite`),
};

export const commentsApi = {
  list: (slug: string) =>
    api.get<{ comments: Comment[] }>(`/posts/${slug}/comments`),
  create: (slug: string, body: string) =>
    api.post<{ comment: Comment }>(`/posts/${slug}/comments`, {
      comment: { body },
    }),
  remove: (slug: string, id: number) =>
    api.delete<void>(`/posts/${slug}/comments/${id}`),
};

export const profilesApi = {
  get: (username: string) =>
    api.get<{ profile: Profile }>(`/profiles/${username}`),
  follow: (username: string) =>
    api.post<{ profile: Profile }>(`/profiles/${username}/follow`),
  unfollow: (username: string) =>
    api.delete<{ profile: Profile }>(`/profiles/${username}/follow`),
};

export const tagsApi = {
  list: () => api.get<{ data: { id: number; name: string }[] }>("/tags"),
};
