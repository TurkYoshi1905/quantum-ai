import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Quantum ağına bağlanılıyor...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/sohbet" />;
  }

  return <Redirect to="/giris" />;
}
