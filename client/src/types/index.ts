export interface UserData { username: string; email: string; token: string; bio: string; image: string; }
export interface Profile { username: string; bio: string; image: string; following: boolean; }
export interface PostResponse { id: number; slug: string; title: string; description: string; body: string; tagList: string[]; favoriteCount: number; favorited?: boolean; createdAt: string; updatedAt: string; author: Profile; }
export interface Comment { id: number; body: string; createdAt: string; author: { username: string; image: string; }; }
