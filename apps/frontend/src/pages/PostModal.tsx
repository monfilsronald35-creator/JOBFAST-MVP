interface Post { content?: string; caption?: string; [key: string]: unknown; }
interface PostModalProps { post?: Post | null; onClose: () => void; }

export default function PostModal({ post, onClose }: PostModalProps) {
  if (!post) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#0f172a] rounded-2xl p-6 w-full max-w-md mx-4 text-white" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="float-right text-slate-400 hover:text-white mb-2">✕</button>
        <p className="text-sm">{post.content ?? post.caption ?? '—'}</p>
      </div>
    </div>
  );
}