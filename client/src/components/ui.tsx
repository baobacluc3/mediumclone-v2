import { Link } from 'react-router-dom';
import type { PostResponse } from '../types';
import { formatDate } from '../utils/formatDate';

export const LoadingSpinner = () => <div className='p-4'>Loading...</div>;
export const ErrorMessage = ({ message }: { message: string }) => <div className='text-red-500 p-2'>{message}</div>;
export const TagChip = ({ tag, onClick }: { tag: string; onClick?: () => void }) => <button onClick={onClick} className='text-xs border rounded px-2 py-1 mr-1'>{tag}</button>;
export const Pagination = ({ page, total, setPage }: { page: number; total: number; setPage: (p:number)=>void }) => <div className='flex gap-1'>{Array.from({length:Math.ceil(total/10)||1},(_,i)=><button key={i} className='px-2 border' onClick={()=>setPage(i+1)}>{i+1}</button>)}</div>;
export const ArticleCard = ({ post, onFavorite }: { post: PostResponse; onFavorite?:()=>void }) => <div className='border p-4 mb-3'><div className='flex justify-between'><Link to={`/profile/${post.author.username}`}>{post.author.username}</Link><button onClick={onFavorite}>❤ {post.favoriteCount}</button></div><Link to={`/posts/${post.slug}`}><h3 className='font-bold'>{post.title}</h3><p>{post.description}</p></Link><small>{formatDate(post.createdAt)}</small><div>{post.tagList?.map(t=><TagChip key={t} tag={t}/> )}</div></div>;
