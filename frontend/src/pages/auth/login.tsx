import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from "@/components/ui/dialog";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const { isLoading } = useAuthRedirect(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      const response = await loginMutation.mutateAsync({ data: values });
      login(response.token, response.user);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ 
        title: "Login failed", 
        description: error.message || "Invalid credentials", 
        variant: "destructive" 
      });
    }
  };

  const handleForgotPassword = () => {
    if (!forgotEmail) return;
    toast({ 
      title: "Reset link sent!", 
      description: `If an account exists for ${forgotEmail}, a password reset link has been sent.` 
    });
    setForgotOpen(false);
    setForgotEmail("");
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-background">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold font-serif text-secondary">
              Traveloop
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your account and start planning.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="email">Email address</Label>
                <div className="mt-1">
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    className="appearance-none block w-full"
                  />
                  {form.formState.errors.email && (
                    <p className="mt-2 text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                        Forgot password?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your email address and we'll send you a link to reset your password.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="forgotEmail">Email address</Label>
                          <Input 
                            id="forgotEmail" 
                            type="email" 
                            placeholder="you@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                          />
                        </div>
                        <Button onClick={handleForgotPassword} className="w-full" disabled={!forgotEmail}>
                          Send Reset Link
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="mt-1">
                  <Input
                    id="password"
                    type="password"
                    {...form.register("password")}
                    className="appearance-none block w-full"
                  />
                  {form.formState.errors.password && (
                    <p className="mt-2 text-sm text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">
                    Don't have an account?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/register">
                  <Button variant="outline" className="w-full">
                    Create new account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1">
        <div 
          className="absolute inset-0 h-full w-full bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop)' }}
        />
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
      </div>
    </div>
  );
}
