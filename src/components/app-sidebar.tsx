import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator
} from "@/components/ui/sidebar";
import { useListChats, useCreateChat, useDeleteChat, getListChatsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Search, MessageSquare, Trash2, Settings, Crown, LogOut, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function AppSidebar() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: chats = [], isLoading: isLoadingChats } = useListChats();
  const createChat = useCreateChat();
  const deleteChat = useDeleteChat();

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

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
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleDeleteChat = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    e.preventDefault();
    deleteChat.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListChatsQueryKey() });
          toast({ title: "Sohbet silindi" });
        }
      }
    );
  };

  return (
    <Sidebar variant="inset" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 space-y-3">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center text-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-sidebar-foreground">QuantumAI</span>
        </div>
        
        <Button 
          onClick={handleCreateChat} 
          disabled={createChat.isPending}
          className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.1)] hover:shadow-[0_0_15px_rgba(var(--primary),0.25)] transition-all"
        >
          {createChat.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Yeni Sohbet
        </Button>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sohbet Ara..."
            className="pl-9 bg-sidebar-accent/50 border-sidebar-border focus-visible:ring-primary/50 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="py-0">
          <SidebarGroupLabel className="py-1.5 text-xs">Sohbet Geçmişi</SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoadingChats ? (
              <div className="flex justify-center p-4">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center p-4 text-sm text-muted-foreground">
                Sohbet bulunamadı.
              </div>
            ) : (
              <SidebarMenu className="gap-0.5">
                <AnimatePresence>
                  {filteredChats.map((chat, i) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.04, duration: 0.15 }}
                    >
                      <SidebarMenuItem className="py-0">
                        <SidebarMenuButton 
                          asChild 
                          className="group relative flex items-center justify-between hover:bg-sidebar-accent transition-colors h-auto py-1.5 px-2"
                        >
                          <Link href={`/sohbet/${chat.id}`}>
                            <div className="flex flex-col overflow-hidden w-full items-start text-left gap-0.5">
                              <div className="flex items-center gap-1.5 w-full">
                                <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="truncate text-sm font-medium flex-1 leading-tight">{chat.title}</span>
                                {chat.messageCount > 0 && (
                                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full shrink-0 leading-none">
                                    {chat.messageCount}
                                  </span>
                                )}
                              </div>
                              {chat.lastMessage && (
                                <span className="text-[11px] text-muted-foreground truncate w-full ml-5 leading-tight">
                                  {chat.lastMessage}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive shrink-0 transition-all ml-1"
                              onClick={(e) => handleDeleteChat(e, chat.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="bg-sidebar-border" />
      
      <SidebarFooter className="p-3 space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/premium" className="text-secondary hover:text-secondary hover:bg-secondary/10 group flex items-center gap-2">
                <Crown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Premium Ol</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/ayarlar" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Settings className="w-4 h-4" />
                <span>Ayarlar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => { logout(); setLocation("/giris"); }} className="flex items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <div className="flex items-center gap-2.5 px-2 pt-2 mt-1 border-t border-sidebar-border">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-xs text-primary">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate leading-tight">{user?.username}</span>
            <span className="text-[11px] text-muted-foreground truncate leading-tight">{user?.isPremium ? "Premium Ajan" : "Standart Ajan"}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
