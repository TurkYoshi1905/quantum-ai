import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useListPlans } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Premium() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/giris" />;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
        <AppSidebar />
        <div className="flex-1 overflow-y-auto">
          <header className="h-14 border-b border-border/50 flex items-center px-6 bg-background/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-2 text-secondary">
              <Crown className="w-5 h-5" />
              <h1 className="font-semibold text-lg tracking-tight">Quantum Premium</h1>
            </div>
          </header>
          
          <div className="p-6 max-w-5xl mx-auto space-y-12 pb-20 relative">
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none" />
            
            <div className="text-center space-y-4 max-w-2xl mx-auto relative z-10 pt-10">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
                  Sınırları Kaldırın
                </h2>
                <p className="text-muted-foreground text-lg mt-4">
                  Daha hızlı işlem kapasitesi, özel modeller ve sınırsız veri işleme yetenekleriyle yapay zeka deneyiminizi bir üst boyuta taşıyın.
                </p>
              </motion.div>
            </div>

            <PlanList />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

function PlanList() {
  const { data: plans = [], isLoading } = useListPlans();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-10 h-10 text-secondary animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
      {plans.map((plan, i) => (
        <motion.div
          key={plan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <Card className={`h-full flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
            plan.isPopular 
              ? "border-secondary shadow-[0_0_30px_rgba(var(--secondary),0.15)] bg-card/80 backdrop-blur-sm" 
              : "border-border/50 bg-card/40 backdrop-blur-sm"
          }`}>
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                EN ÇOK TERCİH EDİLEN
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description || "Tüm temel özellikler"}</CardDescription>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-xl text-muted-foreground">{plan.currency}</span>
                <span className="text-muted-foreground ml-1">/{plan.period === "monthly" ? "ay" : "yıl"}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-0.5 ${plan.isPopular ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"}`}>
                      <Check className="w-3 h-3 font-bold" />
                    </div>
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className={`w-full font-semibold ${
                  plan.isPopular 
                    ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-[0_0_15px_rgba(var(--secondary),0.4)]" 
                    : "bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/30"
                }`}
              >
                Premium Ol
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
