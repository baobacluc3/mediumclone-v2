import { api } from './client';
export const AuthApi = { register: (d:any)=>api.post('/users',{user:d}), login:(d:any)=>api.post('/users/login',{user:d}), me:()=>api.get('/user'), update:(d:any)=>api.put('/user',{user:d}) };
export const PostApi = {
 list:(params:any)=>api.get('/posts',{params}), feed:(params:any)=>api.get('/posts/feed',{params}), get:(slug:string)=>api.get(`/posts/${slug}`),
 create:(post:any)=>api.post('/posts',post), update:(slug:string,post:any)=>api.put(`/posts/${slug}`,post), del:(slug:string)=>api.delete(`/posts/${slug}`),
 fav:(slug:string)=>api.post(`/posts/${slug}/favorite`), unfav:(slug:string)=>api.delete(`/posts/${slug}/favorite`), comments:(slug:string)=>api.get(`/posts/${slug}/comments`), addComment:(slug:string,body:string)=>api.post(`/posts/${slug}/comments`,{comment:{body}}), delComment:(slug:string,id:number)=>api.delete(`/posts/${slug}/comments/${id}`)
};
export const ProfileApi = { get:(u:string)=>api.get(`/profiles/${u}`), follow:(u:string)=>api.post(`/profiles/${u}/follow`), unfollow:(u:string)=>api.delete(`/profiles/${u}/follow`) };
export const TagApi = { list:()=>api.get('/tags') };
