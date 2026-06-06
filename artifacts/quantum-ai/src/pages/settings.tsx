import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useGetModelStatus, useTrainModel, useGetUserProfile, useUpdateUserProfile, getGetModelStatusQueryKey, getGetUserProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Server, User, Database, Cpu, Zap, Save } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/giris" />;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
        <AppSidebar />
        <div className="flex-1 overflow-y-auto">
          <header className="h-14 border-b border-border/50 flex items-center px-6 bg-background/80 backdrop-blur-md sticky top-0 z-10">
            <h1 className="font-semibold text-lg text-primary tracking-tight">Sistem Ayarları</h1>
          </header>
          
          <div className="p-6 max-w-4xl mx-auto space-y-8 pb-20 relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <UserProfileSettings />
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <ModelStatusCard />
            </motion.div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

function UserProfileSettings() {
  const { data: profile, isLoading } = useGetUserProfile();
  const updateProfile = useUpdateUserProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [username, setUsername] = useState("");
  
  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  const handleUpdate = () => {
    if (!username.trim() || username === profile?.username) return;
    
    updateProfile.mutate(
      { data: { username } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
          toast({ title: "Profil güncellendi" });
        },
        onError: () => {
          toast({ title: "Hata oluştu", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) return <CardSkeleton />;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <User className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Ajan Profili</CardTitle>
            <CardDescription>Kimlik bilgilerinizi güncelleyin.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Kullanıcı Adı</Label>
            <Input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="bg-background/50 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>E-posta (Salt Okunur)</Label>
            <Input value={profile?.email || ""} disabled className="bg-muted/50" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
          <div className="flex flex-col items-center justify-center p-4 bg-background/50 rounded-lg border border-border/30">
            <span className="text-3xl font-bold text-primary">{profile?.totalChats || 0}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Toplam Protokol</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-background/50 rounded-lg border border-border/30">
            <span className="text-3xl font-bold text-secondary">{profile?.totalMessages || 0}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">İşlenen Veri</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/20 justify-end">
        <Button 
          onClick={handleUpdate} 
          disabled={updateProfile.isPending || username === profile?.username}
          className="gap-2"
        >
          {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Değişiklikleri Kaydet
        </Button>
      </CardFooter>
    </Card>
  );
}

function ModelStatusCard() {
  const { data: status, isLoading } = useGetModelStatus();
  const trainModel = useTrainModel();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleTrain = () => {
    trainModel.mutate(undefined, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getGetModelStatusQueryKey() });
        toast({ 
          title: "Eğitim Tamamlandı", 
          description: `${res.samplesUsed} örnek işlendi. ${res.message}` 
        });
      },
      onError: (err: any) => {
        toast({ 
          title: "Eğitim Başarısız", 
          description: err.data?.error || "Ağ hatası",
          variant: "destructive" 
        });
      }
    });
  };

  if (isLoading) return <CardSkeleton />;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Cpu className="w-40 h-40" />
      </div>
      <div className="h-1 bg-gradient-to-r from-accent to-primary" />
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(var(--accent),0.2)]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Quantum Çekirdeği Durumu</CardTitle>
              <CardDescription>Model parametreleri ve sistem sağlığı.</CardDescription>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 ${
            status?.isReady 
              ? "bg-green-500/10 text-green-400 border-green-500/30" 
              : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
          }`}>
            <span className={`w-2 h-2 rounded-full ${status?.isReady ? "bg-green-400" : "bg-yellow-400"} animate-pulse`} />
            {status?.isReady ? "ÇEVRİMİÇİ" : "EĞİTİLİYOR"}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusItem icon={<Database className="w-4 h-4 text-muted-foreground" />} label="Model" value={status?.name || "-"} />
          <StatusItem icon={<Cpu className="w-4 h-4 text-muted-foreground" />} label="Sürüm" value={status?.version || "-"} />
          <StatusItem icon={<Server className="w-4 h-4 text-muted-foreground" />} label="Sözlük Boyutu" value={status?.vocabSize.toLocaleString() || "0"} />
          <StatusItem icon={<Zap className="w-4 h-4 text-muted-foreground" />} label="Eğitim Verisi" value={status?.totalTrainingSamples.toLocaleString() || "0"} />
        </div>
        
        {status?.lastTrainedAt && (
          <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1">
            <span className="font-medium text-foreground/70">Son Eğitim:</span> {new Date(status.lastTrainedAt).toLocaleString('tr-TR')}
          </p>
        )}
      </CardContent>
      <CardFooter className="bg-muted/20 border-t border-border/50 justify-between">
        <p className="text-xs text-muted-foreground max-w-[200px] sm:max-w-md">
          Ağdaki yeni verileri quantum çekirdeğine entegre etmek için modeli eğitin.
        </p>
        <Button 
          onClick={handleTrain} 
          disabled={trainModel.isPending || !status?.isReady}
          className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-[0_0_15px_rgba(var(--accent),0.3)] hover:shadow-[0_0_25px_rgba(var(--accent),0.5)] gap-2 transition-all"
        >
          {trainModel.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Modeli Eğit
        </Button>
      </CardFooter>
    </Card>
  );
}

function StatusItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-background/40 rounded-lg border border-border/30 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-mono font-medium text-lg text-foreground">{value}</div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <div className="w-48 h-6 bg-muted rounded animate-pulse mb-2" />
        <div className="w-72 h-4 bg-muted/50 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="w-full h-32 bg-muted/30 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}
