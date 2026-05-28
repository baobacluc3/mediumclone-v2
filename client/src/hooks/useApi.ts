import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthApi, PostApi, ProfileApi, TagApi } from '../api';

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => AuthApi.me().then((r) => r.data.user), retry: false });
export const usePosts = (params:any, feed=false) => useQuery({ queryKey:['posts',params,feed], queryFn:()=> (feed?PostApi.feed(params):PostApi.list(params)).then(r=>r.data) });
export const usePost = (slug:string) => useQuery({ queryKey:['post',slug], queryFn:()=>PostApi.get(slug).then(r=>r.data.post), enabled:!!slug });
export const useTags = () => useQuery({ queryKey:['tags'], queryFn:()=>TagApi.list().then(r=>r.data) });
export const useComments = (slug:string)=>useQuery({queryKey:['comments',slug],queryFn:()=>PostApi.comments(slug).then(r=>r.data.comments)});
export const useFavorite = () => { const qc=useQueryClient(); return useMutation({ mutationFn:({slug,favorited}:{slug:string;favorited:boolean})=>favorited?PostApi.unfav(slug):PostApi.fav(slug), onMutate:async({slug,favorited})=>{await qc.cancelQueries({queryKey:['post',slug]}); const prev=qc.getQueryData<any>(['post',slug]); if(prev) qc.setQueryData(['post',slug],{...prev,favorited:!favorited,favoriteCount:prev.favoriteCount+(favorited?-1:1)}); return {prev};}, onError:(_e,v,ctx)=>ctx?.prev&&qc.setQueryData(['post',v.slug],ctx.prev), onSettled:(_d,_e,v)=>{qc.invalidateQueries({queryKey:['post',v.slug]});qc.invalidateQueries({queryKey:['posts']});} }); };
export const useAddComment = (slug:string)=>{ const qc=useQueryClient(); return useMutation({mutationFn:(body:string)=>PostApi.addComment(slug,body), onSuccess:()=>qc.invalidateQueries({queryKey:['comments',slug]})});};
export const useDeleteComment = (slug:string)=>{ const qc=useQueryClient(); return useMutation({mutationFn:(id:number)=>PostApi.delComment(slug,id), onSuccess:()=>qc.invalidateQueries({queryKey:['comments',slug]})});};
export const useProfile = (u:string)=>useQuery({queryKey:['profile',u],queryFn:()=>ProfileApi.get(u).then(r=>r.data.profile),enabled:!!u});
