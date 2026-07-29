interface Post { mediaUrl?: string; content?: string; [key: string]: unknown; }
interface PostViewerProps { post?: Post | null; onClose: () => void; }

export default function PostViewer({ post, onClose }: PostViewerProps) {
  if (!post) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="bg-[#0f172a] rounded-2xl p-6 w-full max-w-lg mx-4 text-white" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="float-right text-slate-400 hover:text-white mb-4">✕</button>
        {post.mediaUrl && <img src={post.mediaUrl} alt="post" className="w-full rounded-xl mb-4 object-cover max-h-80" />}
        <p className="text-sm text-slate-200">{post.content ?? '—'}</p>
      </div>
    </div>
  );
}