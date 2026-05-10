import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";
import { useGetMe, useUpdateMe, useDeleteMe } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { User as UserIcon, Trash2, Shield, Globe } from "lucide-react";

export default function Profile() {
  useAuthRedirect();
  const { data: user, isLoading } = useGetMe();
  const { updateUser, logout } = useAuth();
  const updateMutation = useUpdateMe();
  const deleteMutation = useDeleteMe();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    city: "",
    country: "",
    language: "en",
    photo: "",
  });

  // Initialize form when user data loads
  const [initialized, setInitialized] = useState(false);
  if (user && !initialized) {
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      city: user.city || "",
      country: user.country || "",
      language: user.language || "en",
      photo: user.photo || "",
    });
    setInitialized(true);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = await updateMutation.mutateAsync({ data: formData });
      updateUser(updatedUser);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (error: any) {
      toast({ 
        title: "Update failed", 
        description: error.message || "Something went wrong", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteMutation.mutateAsync();
      logout();
      toast({ title: "Account deleted", description: "Your account has been permanently removed." });
      setLocation("/login");
    } catch (error: any) {
      toast({ 
        title: "Delete failed", 
        description: error.message || "Something went wrong", 
        variant: "destructive" 
      });
    }
  };

  if (isLoading || !user) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-secondary">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information and preferences.</p>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-8">
        <div className="space-y-6">
          <Card className="h-fit">
            <CardContent className="p-6 flex flex-col items-center text-center">
              {user.photo ? (
                <img src={user.photo} alt={user.firstName} className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-primary/20" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-4xl mb-4 border-4 border-primary/20">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
              <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              {user.isAdmin && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                  <Shield className="w-3 h-3" /> Admin
                </div>
              )}
              <div className="mt-4 text-sm text-muted-foreground bg-muted/50 w-full py-2 rounded-md">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-destructive text-base">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your trips, itineraries, notes, and checklists from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, delete my account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your contact details and preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Photo URL</Label>
                <Input id="photo" value={formData.photo} onChange={handleChange} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={formData.city} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={formData.country} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Preferred Language
                </Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, language: val }))}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={updateMutation.isPending} className="w-full md:w-auto">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
