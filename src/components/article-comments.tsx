"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, Send, Heart, User, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuthToastStore } from "@/lib/stores/auth-toast-store";

interface Comment {
  id: string;
  article_id: string;
  parent_id: string | null;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  user_profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function ArticleComments({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useAuthToastStore();

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("article_comments")
        .select(`
          id,
          article_id,
          parent_id,
          user_id,
          content,
          likes_count,
          created_at,
          user_profiles (
            full_name,
            avatar_url
          )
        `)
        .eq("article_id", articleId)
        .order("created_at", { ascending: false });

      if (error) {
        // Table may not exist yet — fail silently
        setComments([]);
        return;
      }
      setComments((data as unknown as Comment[]) || []);
    } catch {
      // Supabase connection issue — fail silently
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  }, [articleId, supabase]);

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel("public:article_comments")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "article_comments",
          filter: `article_id=eq.${articleId}`,
        },
        () => {
          fetchComments(); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchComments, articleId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast("Necesitas iniciar sesión para comentar");
      return;
    }
    if (!newComment.trim() || !user?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("article_comments").insert([
        {
          article_id: articleId,
          user_id: user.id,
          content: newComment.trim(),
          parent_id: null,
        },
      ]);
      if (error) throw error;
      setNewComment("");
      fetchComments();
    } catch (err) {
      console.error("Error submitting comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!isAuthenticated) {
      showToast("Necesitas iniciar sesión para responder");
      return;
    }
    if (!replyContent.trim() || !user?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("article_comments").insert([
        {
          article_id: articleId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentId,
        },
      ]);
      if (error) throw error;
      setReplyContent("");
      setReplyingTo(null);
      fetchComments();
    } catch (err) {
      console.error("Error submitting reply:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string, currentLikes: number) => {
    if (!isAuthenticated) {
      showToast("Necesitas iniciar sesión para dar me gusta");
      return;
    }
    
    // Optimistic UI update
    setComments((prev) => 
      prev.map((c) => c.id === commentId ? { ...c, likes_count: c.likes_count + 1 } : c)
    );

    try {
      await supabase
        .from("article_comments")
        .update({ likes_count: currentLikes + 1 })
        .eq("id", commentId);
    } catch (error) {
       console.error("Error liking comment:", error);
       fetchComments(); // Revert optimistic update on error
    }
  };

  return (
    <div className="mt-16 editorial-rule-top pt-10">
      <div className="flex items-center gap-2 mb-8">
        <MessageSquare className="w-6 h-6 text-[#1890FF]" />
        <h3 className="font-editorial text-2xl font-bold text-foreground">
          Comentarios <span className="text-muted-foreground text-lg ml-1">({comments.length})</span>
        </h3>
      </div>

      {/* Caja de nuevo comentario */}
      <div className="bg-secondary/20 dark:bg-white/5 border border-border rounded-2xl p-4 sm:p-6 mb-10 shadow-sm relative overflow-hidden">
        {!isAuthenticated && (
          <div className="absolute inset-0 z-10 backdrop-blur-[3px] bg-background/50 flex flex-col items-center justify-center rounded-2xl">
             <MessageSquare className="w-8 h-8 text-foreground/50 mb-3" />
             <p className="font-bold text-foreground mb-3">Únete a la conversación</p>
             <button
                onClick={() => showToast("Inicia sesión para compartir tu opinión")}
                className="px-6 py-2.5 bg-[#1890FF] text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
             >
                Regístrate o Inicia Sesión
             </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="relative z-0">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0 border border-border">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary/80 text-muted-foreground">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="¿Qué opinas sobre este tema?"
                className="w-full bg-transparent border-none resize-none outline-none text-foreground placeholder:text-muted-foreground/60 min-h-[80px]"
                disabled={!isAuthenticated || isSubmitting}
              />
              <div className="flex justify-end mt-2 pt-3 border-t border-border/50">
                <button
                  type="submit"
                  disabled={!newComment.trim() || !isAuthenticated || isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-[#1890FF] text-white text-sm font-bold rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publicar
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Lista de comentarios */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
          </div>
        ) : comments.length > 0 ? (
          (() => {
            const topLevelComments = comments.filter(c => !c.parent_id);
            
            const renderComment = (comment: Comment, isReply = false) => {
              const replies = comments.filter(c => c.parent_id === comment.id).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              
              return (
                <div key={comment.id} className="flex flex-col">
                  <div className={`flex gap-4 group ${isReply ? "mt-4" : ""}`}>
                    <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0 border border-border mt-1">
                      {comment.user_profiles?.avatar_url ? (
                        <img src={comment.user_profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/80 text-muted-foreground">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="bg-secondary/10 dark:bg-white/5 border border-border/50 rounded-2xl rounded-tl-sm px-5 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-foreground text-sm">
                            {comment.user_profiles?.full_name || "Usuario Anónimo"}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                        <p className="text-foreground/90 text-[15px] leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-2 px-2">
                        <button 
                          onClick={() => handleLike(comment.id, comment.likes_count)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5" />
                          <span>{comment.likes_count > 0 ? comment.likes_count : "Me gusta"}</span>
                        </button>
                        <button 
                          onClick={() => {
                            setReplyingTo(replyingTo === comment.id ? null : comment.id);
                            setReplyContent("");
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#1890FF] transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Responder</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {replyingTo === comment.id && (
                    <div className="ml-14 mt-4 flex gap-3">
                      <input 
                        type="text"
                        autoFocus
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Respondiendo a ${comment.user_profiles?.full_name || 'Usuario'}...`}
                        className="flex-1 bg-secondary/20 dark:bg-white/5 border border-border rounded-xl px-4 py-2 text-sm text-foreground outline-none focus:border-[#1890FF]/50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleReplySubmit(comment.id);
                        }}
                      />
                      <button
                        onClick={() => handleReplySubmit(comment.id)}
                        disabled={!replyContent.trim() || isSubmitting}
                        className="px-4 py-2 bg-[#1890FF] text-white text-sm font-bold rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors shrink-0"
                      >
                        Enviar
                      </button>
                    </div>
                  )}

                  {replies.length > 0 && (
                    <div className="ml-5 pl-8 border-l-2 border-border/40 my-2 flex flex-col">
                      {replies.map(r => renderComment(r, true))}
                    </div>
                  )}
                </div>
              );
            };

            return topLevelComments.map(c => renderComment(c));
          })()
        ) : (
          <div className="text-center py-12 px-4 bg-secondary/10 border border-border/50 rounded-2xl border-dashed">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h4 className="text-base font-bold text-foreground mb-1">Sin comentarios aún</h4>
            <p className="text-sm text-muted-foreground">Sé el primero en compartir tu opinión sobre esta noticia.</p>
          </div>
        )}
      </div>
    </div>
  );
}
