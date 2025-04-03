import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Send, User, Palette, Shirt } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isStartingChat, setIsStartingChat] = useState(false);

  const startWhatsAppChat = async () => {
    if (!user) return;
    
    setIsStartingChat(true);
    try {
      const response = await apiRequest("POST", "/api/start-chat", {
        name: user.name,
        phoneNumber: user.phoneNumber
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start WhatsApp chat");
      }
      
      toast({
        title: "WhatsApp Chat Started!",
        description: "Check your WhatsApp for a message from Fashion Buddy.",
      });
    } catch (error) {
      toast({
        title: "Error Starting Chat",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsStartingChat(false);
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container max-w-6xl py-10 px-4 md:px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and access Fashion Buddy features
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{user.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subscription:</span>
                  <span className="font-medium capitalize">{user.subscriptionTier}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5 text-primary" />
                Color Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Analyses Remaining:</span>
                  <span className="font-medium">
                    {user.subscriptionTier === 'premium' ? 'Unlimited' : 
                     Math.max(0, (user.subscriptionTier === 'free' ? 1 : 0) - (user.colorAnalysisCount || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Analyses Used:</span>
                  <span className="font-medium">{user.colorAnalysisCount || 0}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                onClick={startWhatsAppChat}
                disabled={isStartingChat}
              >
                {isStartingChat ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Chat...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Start Color Analysis
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Shirt className="mr-2 h-5 w-5 text-primary" />
                Virtual Try-On
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Try-Ons Remaining:</span>
                  <span className="font-medium">
                    {user.subscriptionTier === 'premium' ? 'Unlimited' : 
                     Math.max(0, (user.subscriptionTier === 'free' ? 1 : 0) - (user.virtualTryOnCount || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Try-Ons Used:</span>
                  <span className="font-medium">{user.virtualTryOnCount || 0}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                onClick={startWhatsAppChat}
                disabled={isStartingChat}
              >
                {isStartingChat ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Chat...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Start Virtual Try-On
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>
                Get started with Fashion Buddy in 3 simple steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <span className="flex items-center justify-center h-6 w-6 text-primary font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Start a WhatsApp chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the button above to start a conversation with our AI assistant on WhatsApp.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <span className="flex items-center justify-center h-6 w-6 text-primary font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Share your photos</h3>
                  <p className="text-sm text-muted-foreground">
                    Send a selfie for color analysis or a full-body photo for virtual try-on.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <span className="flex items-center justify-center h-6 w-6 text-primary font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Get personalized recommendations</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive color recommendations, virtual try-on results, and shopping suggestions directly in WhatsApp.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                onClick={startWhatsAppChat}
                disabled={isStartingChat}
              >
                {isStartingChat ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting WhatsApp Chat...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Start WhatsApp Chat Now
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}