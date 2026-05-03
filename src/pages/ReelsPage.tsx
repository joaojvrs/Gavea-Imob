/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Heart,
  MessageCircle,
  Volume2,
  VolumeX,
  Play,
  Film,
  Plus,
  Send,
  Upload,
  Share2,
  Bookmark,
  BookmarkCheck,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/context/AuthContext";
import { cn } from "@/src/lib/utils";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Reel {
  id: string;
  title: string | null;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  created_by: string | null;
  views: number;
  creator_name: string | null;
  creator_role: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_liked?: boolean;
}

interface Comment {
  id: string;
  reel_id: string;
  user_id: string;
  content: string;
  author_name: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function getInitial(name: string | null | undefined): string {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

// ─── CommentsPanel ────────────────────────────────────────────────────────────

interface CommentsPanelProps {
  reelId: string;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

function CommentsPanel({ reelId, onClose, onCountChange }: CommentsPanelProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from("reel_comments")
        .select("*")
        .eq("reel_id", reelId)
        .order("created_at", { ascending: true });
      if (data) {
        setComments(data as Comment[]);
        onCountChange(data.length);
      }
    };
    fetchComments();
  }, [reelId, onCountChange]);

  // Realtime — deduplicates against optimistic placeholder
  useEffect(() => {
    const channel = supabase
      .channel(`comments_${reelId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "reel_comments",
          filter: `reel_id=eq.${reelId}`,
        },
        (payload: any) => {
          const incoming = payload.new as Comment;
          setComments((prev) => {
            // Replace optimistic placeholder if same user + content
            const optimisticIdx = prev.findIndex(
              (c) =>
                c.id.startsWith("temp_") &&
                c.user_id === incoming.user_id &&
                c.content === incoming.content
            );
            if (optimisticIdx !== -1) {
              const updated = [...prev];
              updated[optimisticIdx] = incoming;
              onCountChange(updated.length);
              return updated;
            }
            const updated = [...prev, incoming];
            onCountChange(updated.length);
            return updated;
          });
          setTimeout(() => {
            listRef.current?.scrollTo({
              top: listRef.current.scrollHeight,
              behavior: "smooth",
            });
          }, 80);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reelId, onCountChange]);

  useEffect(() => {
    setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, 150);
  }, []);

  const handleSend = async () => {
    if (!user || !text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    const authorName =
      profile?.full_name ?? user.email?.split("@")[0] ?? "Anônimo";

    // Optimistic: add immediately with temp ID, clear input right away
    const tempId = `temp_${Date.now()}`;
    const optimistic: Comment = {
      id: tempId,
      reel_id: reelId,
      user_id: user.id,
      content,
      author_name: authorName,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => {
      const updated = [...prev, optimistic];
      onCountChange(updated.length);
      return updated;
    });
    setText("");
    setTimeout(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);

    await supabase.from("reel_comments").insert({
      reel_id: reelId,
      user_id: user.id,
      content,
      author_name: authorName,
    });
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute bottom-0 left-0 right-0 z-30 bg-[#0d1520]/96 backdrop-blur-xl rounded-t-3xl flex flex-col"
      style={{ maxHeight: "65vh" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8 flex-shrink-0">
        <span
          className="text-white text-[11px] font-bold uppercase tracking-[0.18em]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Comentários
        </span>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* List */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0"
      >
        {comments.length === 0 && (
          <p className="text-white/30 text-sm text-center py-8">
            Nenhum comentário ainda. Seja o primeiro!
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-accent/30 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-accent text-xs font-bold">
                {getInitial(c.author_name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-[11px] font-semibold leading-none mb-1 flex items-center gap-2">
                {c.author_name}
                {c.id.startsWith("temp_") && (
                  <span className="text-white/25 text-[9px]">enviando…</span>
                )}
              </p>
              <p className="text-white/70 text-sm leading-snug break-words">
                {c.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-3 border-t border-white/8 flex-shrink-0">
        {user ? (
          <div className="flex items-center gap-2 bg-white/8 rounded-2xl px-4 py-2.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Adicionar comentário..."
              maxLength={300}
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className={cn(
                "p-1.5 rounded-xl transition-all duration-200",
                text.trim() && !sending
                  ? "text-brand-accent hover:bg-brand-accent/20"
                  : "text-white/20"
              )}
            >
              <Send size={16} />
            </button>
          </div>
        ) : (
          <p className="text-white/40 text-sm text-center">
            Faça login para comentar
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── UploadModal ──────────────────────────────────────────────────────────────

interface UploadModalProps {
  onClose: () => void;
  onSuccess: (reel: Reel) => void;
}

function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const { user, profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (f: File) => {
    if (!f.type.startsWith("video/")) {
      setError("Apenas arquivos de vídeo são aceitos.");
      return;
    }
    if (f.size > 80 * 1024 * 1024) {
      setError("O vídeo deve ter no máximo 80 MB.");
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSetFile(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    setError(null);

    try {
      const ext = file.name.split(".").pop() ?? "mp4";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("reels")
        .upload(path, file);
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from("reels")
        .getPublicUrl(path);

      const { data: reelData, error: insertError } = await supabase
        .from("reels")
        .insert({
          title: title.trim() || null,
          description: description.trim() || null,
          video_url: urlData.publicUrl,
          created_by: user.id,
        })
        .select("*")
        .single();
      if (insertError) throw insertError;

      onSuccess({
        ...(reelData as any),
        creator_name: profile?.full_name ?? user?.email?.split("@")[0] ?? null,
        creator_role: profile?.role ?? null,
        likes_count: 0,
        comments_count: 0,
        user_liked: false,
      } as Reel);
    } catch (err: any) {
      setError(err?.message ?? "Erro ao fazer upload. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="w-full max-w-md bg-[#0a1628] border border-white/8 rounded-t-3xl md:rounded-3xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-white font-bold text-sm uppercase tracking-[0.18em]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Novo Reel
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 py-12 cursor-pointer transition-all duration-300",
              dragging
                ? "border-brand-accent bg-brand-accent/10"
                : "border-white/15 hover:border-brand-accent/50 hover:bg-white/3"
            )}
          >
            <Upload size={28} className="text-white/30" />
            <div className="text-center">
              <p className="text-white/70 text-sm font-medium">
                Arraste um vídeo ou clique para selecionar
              </p>
              <p className="text-white/30 text-xs mt-1">
                MP4, MOV, WEBM · máx. 80 MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-64">
            <video
              src={preview}
              className="w-full h-full object-contain"
              controls
              playsInline
            />
            <button
              onClick={removeFile}
              className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-1.5 text-white hover:bg-black/80 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Título (opcional)"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm outline-none focus:border-brand-accent/50 transition-colors"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Descrição (opcional)"
            className="w-full bg-white/6 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm outline-none focus:border-brand-accent/50 transition-colors resize-none"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleUpload}
          disabled={!file || uploading}
          className={cn(
            "w-full py-3 rounded-2xl font-bold text-sm uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2",
            file && !uploading
              ? "bg-brand-accent text-white hover:bg-brand-accent/90"
              : "bg-white/8 text-white/30 cursor-not-allowed"
          )}
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {uploading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              />
              Enviando...
            </>
          ) : (
            "Publicar Reel"
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── ReelCard ─────────────────────────────────────────────────────────────────

interface ReelCardProps {
  reel: Reel;
  isSaved: boolean;
  onUpdate: (id: string, changes: Partial<Reel>) => void;
  onToggleSave: (id: string) => void;
}

function ReelCard({ reel, isSaved, onUpdate, onToggleSave }: ReelCardProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);
  // Stable refs so the IntersectionObserver closure always sees latest values
  const reelRef = useRef(reel);
  reelRef.current = reel;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const lastTapRef = useRef<number>(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Play when 70% visible; increment views once per mount
  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().then(() => setPlaying(true)).catch(() => {});
          if (!viewedRef.current) {
            viewedRef.current = true;
            const id = reelRef.current.id;
            const currentViews = reelRef.current.views;
            supabase
              .rpc("increment_reel_views", { p_reel_id: id })
              .then(() => onUpdateRef.current(id, { views: currentViews + 1 }));
          }
        } else {
          video.pause();
          video.currentTime = 0;
          setPlaying(false);
        }
      },
      { threshold: 0.7 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // intentionally empty — uses stable refs

  const handleLike = useCallback(async () => {
    if (!user) return;
    const liked = reel.user_liked;
    onUpdate(reel.id, {
      user_liked: !liked,
      likes_count: liked ? reel.likes_count - 1 : reel.likes_count + 1,
    });
    if (liked) {
      await supabase
        .from("reel_likes")
        .delete()
        .eq("reel_id", reel.id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("reel_likes")
        .insert({ reel_id: reel.id, user_id: user.id });
    }
  }, [user, reel, onUpdate]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/reels`;
    const shareTitle = reel.title ?? "Gávea Reels";
    const shareText = reel.description ?? "Confira este reel no Gávea Imob!";

    // 1. Web Share API — mobile e browsers suportados
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return; // usuário cancelou
        // outro erro: cai para o fallback de clipboard abaixo
      }
    }

    // 2. Clipboard API (funciona em HTTPS / localhost)
    const copyToClipboard = async () => {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        return;
      }
      // 3. Fallback legado para HTTP ou browsers sem Clipboard API
      const el = document.createElement("textarea");
      el.value = url;
      el.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    };

    try {
      await copyToClipboard();
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2200);
    } catch {
      // nada que possamos fazer
    }
  }, [reel.title, reel.description]);

  const handleVideoClick = () => {
    const now = Date.now();
    const gap = now - lastTapRef.current;
    lastTapRef.current = now;

    if (gap < 300) {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 700);
      if (!reel.user_liked) handleLike();
      return;
    }

    if (clickTimerRef.current) return;
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        video.play().then(() => setPlaying(true)).catch(() => {});
      } else {
        video.pause();
        setPlaying(false);
      }
    }, 300);
  };

  const handleCommentsCountChange = useCallback(
    (count: number) => {
      onUpdate(reel.id, { comments_count: count });
    },
    [reel.id, onUpdate]
  );

  return (
    <div
      ref={containerRef}
      className="h-dvh snap-start relative overflow-hidden bg-black flex items-center justify-center flex-shrink-0"
    >
      {/* Blurred letterbox bg */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-110 pointer-events-none"
        style={{
          backgroundImage: reel.thumbnail_url
            ? `url(${reel.thumbnail_url})`
            : undefined,
          backgroundColor: "#0a1628",
        }}
      />

      {/* Inner video container */}
      <div
        className="relative h-full w-full max-w-[420px] flex items-center justify-center"
        onClick={handleVideoClick}
      >
        <video
          ref={videoRef}
          src={reel.video_url}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          playsInline
          muted={muted}
          preload="metadata"
          poster={reel.thumbnail_url ?? undefined}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

        {/* Play indicator */}
        <AnimatePresence>
          {!playing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-black/40 backdrop-blur-sm rounded-full p-5">
                <Play size={36} className="text-white fill-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Heart burst */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              key="heart-burst"
              initial={{ scale: 0.3, opacity: 1 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            >
              <Heart size={90} className="text-white fill-white drop-shadow-xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* "Link copiado!" toast */}
        <AnimatePresence>
          {showCopied && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-lg border border-white/15 px-4 py-2 rounded-full pointer-events-none z-20"
            >
              <span className="text-white text-xs font-semibold">
                Link copiado!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar — right actions */}
        <div
          className="absolute right-4 bottom-28 flex flex-col items-center gap-5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Like */}
          <div className="flex flex-col items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 1.35 }}
              onClick={handleLike}
              className="p-1"
            >
              <Heart
                size={28}
                className={cn(
                  "transition-colors duration-200",
                  reel.user_liked
                    ? "text-red-500 fill-red-500"
                    : "text-white fill-transparent stroke-white"
                )}
              />
            </motion.button>
            <span className="text-white text-xs font-semibold drop-shadow">
              {formatCount(reel.likes_count)}
            </span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 1.2 }}
              onClick={() => setShowComments((p) => !p)}
              className="p-1"
            >
              <MessageCircle size={28} className="text-white" />
            </motion.button>
            <span className="text-white text-xs font-semibold drop-shadow">
              {formatCount(reel.comments_count)}
            </span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1">
            <motion.button
              whileTap={{ scale: 1.2 }}
              onClick={handleShare}
              className="p-1"
            >
              <Share2 size={24} className="text-white" />
            </motion.button>
            <span
              className="text-white/45 text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Share
            </span>
          </div>

          {/* Save */}
          <div className="flex flex-col items-center gap-1">
            <motion.button
              whileTap={{ scale: 1.2 }}
              onClick={() => onToggleSave(reel.id)}
              className="p-1"
            >
              {isSaved ? (
                <BookmarkCheck
                  size={24}
                  className="text-brand-accent fill-brand-accent"
                />
              ) : (
                <Bookmark size={24} className="text-white" />
              )}
            </motion.button>
            <span
              className="text-white/45 text-[9px] uppercase tracking-[0.1em]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Salvar
            </span>
          </div>

          {/* Mute */}
          <motion.button
            whileTap={{ scale: 1.2 }}
            onClick={() => setMuted((p) => !p)}
            className="p-1"
          >
            {muted ? (
              <VolumeX size={24} className="text-white" />
            ) : (
              <Volume2 size={24} className="text-white" />
            )}
          </motion.button>
        </div>

        {/* Bottom info */}
        <div
          className="absolute left-4 right-16 bottom-6 z-10 flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Creator */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-brand-accent/30 border border-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {getInitial(reel.creator_name)}
              </span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">
                {reel.creator_name ?? "Gávea Imob"}
              </p>
              {reel.creator_role && (
                <p
                  className="text-white/50 text-[9px] uppercase tracking-[0.15em]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {reel.creator_role}
                </p>
              )}
            </div>
          </div>

          {reel.title && (
            <p className="text-white font-semibold text-sm leading-snug">
              {reel.title}
            </p>
          )}
          {reel.description && (
            <p className="text-white/70 text-sm leading-snug line-clamp-2">
              {reel.description}
            </p>
          )}

          {/* Views */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <Eye size={11} className="text-white/35" />
            <span className="text-white/35 text-xs">
              {formatCount(reel.views)} visualizações
            </span>
          </div>
        </div>

        {/* Comments panel */}
        <AnimatePresence>
          {showComments && (
            <CommentsPanel
              reelId={reel.id}
              onClose={() => setShowComments(false)}
              onCountChange={handleCommentsCountChange}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── ReelsPage ────────────────────────────────────────────────────────────────

export default function ReelsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("gavea_saved_reels");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const canPost =
    !!user &&
    !!profile &&
    ["admin", "corretor"].includes(profile.role) &&
    profile.status === "active";

  const fetchReels = useCallback(async () => {
    setLoading(true);
    const { data: reelData } = await supabase
      .from("reels_with_stats")
      .select("*")
      .order("created_at", { ascending: false });

    if (!reelData) {
      setLoading(false);
      return;
    }

    let likedIds = new Set<string>();
    if (user) {
      const { data: likesData } = await supabase
        .from("reel_likes")
        .select("reel_id")
        .eq("user_id", user.id);
      if (likesData) {
        likedIds = new Set(likesData.map((l: any) => l.reel_id));
      }
    }

    setReels(
      (reelData as any[]).map((r) => ({
        ...r,
        user_liked: likedIds.has(r.id),
      })) as Reel[]
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  const handleUpdate = useCallback((id: string, changes: Partial<Reel>) => {
    setReels((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...changes } : r))
    );
  }, []);

  const handleToggleSave = useCallback((reelId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(reelId)) {
        next.delete(reelId);
      } else {
        next.add(reelId);
      }
      try {
        localStorage.setItem("gavea_saved_reels", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const handleUploadSuccess = (reel: Reel) => {
    setReels((prev) => [reel, ...prev]);
    setShowUpload(false);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-safe pt-4 pb-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <button
          className="pointer-events-auto p-2 text-white/70 hover:text-white transition-colors"
          onClick={() => navigate(-1)}
        >
          <X size={24} />
        </button>
        <h1 className="font-display font-bold tracking-[0.12em] uppercase text-white text-sm pointer-events-none">
          Gávea Reels
        </h1>
        <div className="w-10" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-brand-accent"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && reels.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
          <Film size={52} className="text-white/20" />
          <div>
            <p className="text-white/60 text-base font-semibold mb-1">
              Nenhum reel ainda
            </p>
            <p className="text-white/30 text-sm">
              Seja o primeiro a compartilhar um vídeo.
            </p>
          </div>
          {canPost && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowUpload(true)}
              className="bg-brand-accent text-white text-sm font-bold uppercase tracking-[0.15em] px-8 py-3 rounded-2xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Postar Reel
            </motion.button>
          )}
        </div>
      )}

      {/* Snap scroll feed */}
      {!loading && reels.length > 0 && (
        <div className="h-full overflow-y-scroll snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {reels.map((reel) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              isSaved={savedIds.has(reel.id)}
              onUpdate={handleUpdate}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}

      {/* Post button */}
      {canPost && !loading && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.06 }}
          onClick={() => setShowUpload(true)}
          className="fixed bottom-8 right-5 z-20 bg-brand-accent w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_8px_32px_rgba(59,130,246,0.4)]"
        >
          <Plus size={22} className="text-white" />
        </motion.button>
      )}

      {/* Upload modal */}
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onSuccess={handleUploadSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
