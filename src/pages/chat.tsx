import { useEffect, useRef, useState, useCallback } from "react";
import { useRoute, Redirect, useLocation } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetChat,
  useListMessages,
  useSendMessage,
  useCreateChat,
  getListMessagesQueryKey,
  getListChatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  Bot,
  User as UserIcon,
  Loader2,
  Sparkles,
  MessageSquarePlus,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Chat() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, params] = useRoute("/sohbet/:id");
  const chatId = params?.id ? parseInt(params.id) : null;

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/giris" />;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <header className="h-14 border-b border-border/50 flex items-center px-4 bg-background/80 backdrop-blur-md sticky top-0 z-10 gap-3 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            {chatId ? (
              <ChatHeader chatId={chatId} />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <h1 className="font-semibold text-base text-foreground tracking-tight">
                  Quantum AI
                </h1>
              </div>
            )}
          </header>

          <main className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(var(--color-primary),0.06),transparent)] pointer-events-none" />
            {chatId ? <ChatArea chatId={chatId} /> : <EmptyState />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ChatHeader({ chatId }: { chatId: number }) {
  const { data: chat } = useGetChat(chatId, { query: { enabled: !!chatId } });
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
        <Bot className="w-3 h-3 text-primary" />
      </div>
      <h1 className="font-semibold text-base text-foreground tracking-tight truncate">
        {chat?.title || "Sohbet"}
      </h1>
      {chat && chat.messageCount > 0 && (
        <span className="text-xs text-muted-foreground shrink-0">
          {chat.messageCount} mesaj
        </span>
      )}
    </div>
  );
}

function EmptyState() {
  const queryClient = useQueryClient();
  const createChat = useCreateChat();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleCreateChat = () => {
    createChat.mutate(
      { data: { title: "Yeni Sohbet" } },
      {
        onSuccess: (chat) => {
          queryClient.invalidateQueries({ queryKey: getListChatsQueryKey() });
          setLocation(`/sohbet/${chat.id}`);
        },
        onError: () => {
          toast({
            title: "Hata",
            description: "Sohbet oluşturulamadı.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const suggestions = [
    "Yapay zeka nedir?",
    "Türkiye'nin başkenti neresidir?",
    "Bana bir şey öğret",
    "Nasılsın?",
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center max-w-lg w-full"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative w-20 h-20 mx-auto mb-6"
        >
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <Bot className="w-8 h-8 text-primary" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-2 text-foreground">
            Quantum AI'ye Hoş Geldiniz
          </h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Quantum ağına bağlısınız. Sohbet başlatmak için aşağıdaki butona
            tıklayın ya da bir öneri seçin.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="grid grid-cols-2 gap-2 mb-6"
        >
          {suggestions.map((suggestion, i) => (
            <motion.button
              key={suggestion}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              onClick={() => {
                createChat.mutate(
                  { data: { title: suggestion.slice(0, 30) } },
                  {
                    onSuccess: (chat) => {
                      queryClient.invalidateQueries({
                        queryKey: getListChatsQueryKey(),
                      });
                      setLocation(`/sohbet/${chat.id}`);
                    },
                  }
                );
              }}
              className="text-left px-4 py-3 rounded-xl bg-card border border-border/60 hover:border-primary/40 hover:bg-primary/5 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 group"
            >
              <span className="block truncate">{suggestion}</span>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleCreateChat}
            disabled={createChat.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-200 gap-2"
          >
            {createChat.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="w-4 h-4" />
            )}
            Yeni Sohbet Başlat
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground"
      title="Kopyala"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function MessageBubble({
  msg,
  index,
}: {
  msg: { id: number; role: string; content: string; createdAt: string };
  index: number;
}) {
  const isUser = msg.role === "user";
  const time = new Date(msg.createdAt).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut", delay: index < 10 ? 0 : 0 }}
      className={`flex gap-3 group ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 border ${
          isUser
            ? "bg-secondary/20 border-secondary/40 text-secondary"
            : "bg-primary/15 border-primary/40 text-primary shadow-[0_0_8px_rgba(59,130,246,0.2)]"
        }`}
      >
        {isUser ? (
          <UserIcon className="w-3.5 h-3.5" />
        ) : (
          <Bot className="w-3.5 h-3.5" />
        )}
      </div>

      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm shadow-[0_2px_12px_rgba(59,130,246,0.2)]"
              : "bg-card border border-border/60 text-card-foreground rounded-tl-sm shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          {!isUser && (
            <div className="absolute top-2 right-2">
              <CopyButton text={msg.content} />
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground/70 px-1">{time}</span>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex gap-3"
    >
      <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_8px_rgba(59,130,246,0.2)] shrink-0 mt-1">
        <Bot className="w-3.5 h-3.5" />
      </div>
      <div className="bg-card border border-border/60 rounded-2xl rounded-tl-sm px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${delay}ms`, animationDuration: "0.9s" }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ChatArea({ chatId }: { chatId: number }) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");

  const { data: messages = [], isLoading } = useListMessages(chatId, {
    query: { enabled: !!chatId },
  });
  const sendMessage = useSendMessage();

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom("instant");
  }, [chatId]);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages.length, sendMessage.isPending]);

  const adjustTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    adjustTextareaHeight();
  };

  const handleSend = () => {
    if (!content.trim() || sendMessage.isPending) return;
    const text = content.trim();
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    sendMessage.mutate(
      { chatId, data: { content: text } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListMessagesQueryKey(chatId),
          });
          queryClient.invalidateQueries({ queryKey: getListChatsQueryKey() });
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col relative z-10">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-40 gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary/60" />
              </div>
              <p className="text-sm text-muted-foreground">
                Bağlantı kuruldu. Mesaj bekleniyor...
              </p>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <MessageBubble key={msg.id} msg={msg} index={i} />
              ))}
            </AnimatePresence>
          )}

          <AnimatePresence>
            {sendMessage.isPending && <TypingIndicator />}
          </AnimatePresence>

          <div className="h-2" />
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent border-t border-border/40">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-card border border-border/60 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.06)] hover:border-primary/30 focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.12)] transition-all duration-200">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Quantum ağına mesaj gönder... (Enter ile gönder, Shift+Enter ile yeni satır)"
              rows={1}
              disabled={sendMessage.isPending}
              className="flex-1 bg-transparent resize-none outline-none text-sm text-foreground placeholder:text-muted-foreground/60 px-4 py-3.5 min-h-[52px] max-h-40 leading-relaxed disabled:opacity-50"
            />
            <div className="flex items-end pb-2 pr-2 shrink-0">
              <Button
                onClick={handleSend}
                size="icon"
                disabled={!content.trim() || sendMessage.isPending}
                className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_12px_rgba(59,130,246,0.3)] hover:shadow-[0_0_18px_rgba(59,130,246,0.5)] transition-all duration-200 disabled:opacity-40 disabled:shadow-none shrink-0"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
            quantum-ai-0.1 · Sohbet geçmişinden öğrenir
          </p>
        </div>
      </div>
    </div>
  );
}
