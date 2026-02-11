import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { handleLogin } from "@/handlers/authHandlers";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader2, Shield, Mail, Lock, Sparkles } from "lucide-react";
import { toast } from "react-toastify";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await handleLogin({ email, password }, router, setLoading, setError);
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred during login";
      setError(errorMessage);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - Unlimited Insurance CRM</title>
      </Head>
      
      <div className="min-h-screen flex">
        {/* Left Side - Decorative Background */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
              backgroundSize: '32px 32px'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          <div className="relative z-10 flex flex-col justify-center px-12 text-foreground">
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-primary/10 backdrop-blur-sm border border-primary/20 shadow-sm">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <span className="text-2xl font-bold tracking-tight">Unlimited Insurance CRM</span>
              </div>
              <h1 className="text-5xl font-bold mb-4 leading-tight">
                Welcome!
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Manage your leads, pipelines, and team with confidence.
              </p>
            </div>
            
            <div className="mt-16 space-y-5">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center border border-primary/20 shadow-sm">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span className="text-base text-foreground/80 group-hover:text-foreground transition-colors">Streamlined lead management</span>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center border border-primary/20 shadow-sm">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span className="text-base text-foreground/80 group-hover:text-foreground transition-colors">Real-time pipeline tracking</span>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center border border-primary/20 shadow-sm">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span className="text-base text-foreground/80 group-hover:text-foreground transition-colors">Advanced analytics & insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xl font-bold">Unlimited Insurance CRM</span>
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 space-y-6 backdrop-blur-sm">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-foreground tracking-tight">
                  Sign in to your account
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your credentials to access your dashboard
                </p>
              </div>


              <form className="space-y-5" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <label 
                    htmlFor="email" 
                    className="text-sm font-medium text-foreground flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label 
                    htmlFor="password" 
                    className="text-sm font-medium text-foreground flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-11"
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-base font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              

              <div className="pt-4 border-t border-border">
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm text-center text-muted-foreground">
                    Don't have an account?{" "}
                    <span className="font-medium text-foreground">
                      Contact your IT team
                    </span>
                    {" "}to request access.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Unlimited Insurance CRM. All rights reserved.
            </p>
          </div>
        </div>
      </div>

    </>
  );
}

