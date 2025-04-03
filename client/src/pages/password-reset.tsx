import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const passwordResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function PasswordReset() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof passwordResetSchema>) {
    try {
      setIsSubmitting(true);
      const res = await apiRequest("POST", "/api/reset-password", {
        email: values.email,
        newPassword: values.newPassword,
      });
      
      if (res.ok) {
        setSuccess(true);
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset. You can now log in with your new password.",
        });
      } else {
        const errorData = await res.json();
        toast({
          title: "Password Reset Failed",
          description: errorData.error || "There was an error resetting your password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Password Reset Failed",
        description: "There was an error resetting your password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-background/80 p-4">
      <div className="w-full max-w-md">
        <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your email and new password to reset your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-6">
                <div className="text-primary text-4xl mb-4">✓</div>
                <h3 className="text-xl font-medium mb-2">Password Reset Complete</h3>
                <p className="text-muted-foreground mb-4">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <Button asChild className="w-full">
                  <a href="/auth">Go to Login</a>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="your@email.com" 
                            {...field} 
                            autoComplete="email" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                            autoComplete="new-password" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                            autoComplete="new-password" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isSubmitting ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/40 pt-4">
            <Button variant="link" asChild className="px-2">
              <a href="/auth">Remember your password? Login</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}