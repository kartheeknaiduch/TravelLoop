import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phoneNumber: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export default function Register() {
  const { isLoading } = useAuthRedirect(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      firstName: "", lastName: "", email: "", password: "",
      phoneNumber: "", city: "", country: ""
    },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      const response = await registerMutation.mutateAsync({ data: values });
      login(response.token, response.user);
      toast({ title: "Welcome to Traveloop!", description: "Account created successfully." });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ 
        title: "Registration failed", 
        description: error.message || "Something went wrong", 
        variant: "destructive" 
      });
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block relative w-0 flex-1">
        <div 
          className="absolute inset-0 h-full w-full bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1968&auto=format&fit=crop)' }}
        />
        <div className="absolute inset-0 bg-secondary/30 mix-blend-multiply" />
      </div>
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-background py-12 overflow-y-auto">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="text-3xl font-extrabold font-serif text-secondary">
              Join Traveloop
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create an account to start your journey.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" {...form.register("firstName")} className="mt-1" />
                  {form.formState.errors.firstName && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" {...form.register("lastName")} className="mt-1" />
                  {form.formState.errors.lastName && (
                    <p className="mt-1 text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" {...form.register("email")} className="mt-1" />
                {form.formState.errors.email && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...form.register("password")} className="mt-1" />
                {form.formState.errors.password && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City (Optional)</Label>
                  <Input id="city" {...form.register("city")} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="country">Country (Optional)</Label>
                  <Input id="country" {...form.register("country")} className="mt-1" />
                </div>
              </div>

              <div>
                <Button type="submit" className="w-full mt-2" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Creating account..." : "Sign up"}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
