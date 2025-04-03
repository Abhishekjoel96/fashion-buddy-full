import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

// Form schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, { 
      message: "Please enter a valid phone number with country code (e.g., +911234567890)" 
    }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle form submissions
  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  }

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-950">
      {/* Left side: Auth forms */}
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 text-transparent bg-clip-text">
              Fashion Buddy
            </div>
          </div>
        
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Login Form */}
            <TabsContent value="login">
              <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-white">Welcome back</CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter your credentials to sign in to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-200">Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="you@example.com" 
                                className="bg-gray-800 border-gray-700 text-white" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-200">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                className="bg-gray-800 border-gray-700 text-white" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Register Form */}
            <TabsContent value="register">
              <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-white">Create an account</CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter your details to create your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-200">Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Doe" 
                                className="bg-gray-800 border-gray-700 text-white" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-200">Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="you@example.com" 
                                className="bg-gray-800 border-gray-700 text-white" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-200">Phone Number (with country code)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="+911234567890" 
                                className="bg-gray-800 border-gray-700 text-white" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-200">Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                className="bg-gray-800 border-gray-700 text-white" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-200">Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                className="bg-gray-800 border-gray-700 text-white" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Sign Up"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="text-xs text-gray-500">
                  By signing up, you agree to use this application responsibly.
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right side: Hero section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-950 p-8 flex flex-col justify-center text-white">
        <div className="max-w-xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 text-transparent bg-clip-text">
              Your Personal AI Fashion Assistant
            </h1>
            <p className="text-xl mb-6 text-blue-100">
              Get personalized style recommendations based on your skin tone, body type, and preferences - directly in WhatsApp.
            </p>
          </div>
          
          <div className="space-y-6 border-l-2 border-blue-400/30 pl-8">
            <div className="relative">
              <div className="absolute -left-10 top-0 bg-blue-500 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-palette"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="17" r="2"/><circle cx="5" cy="17" r="2"/><path d="M13.5 9A5 5 0 0 1 8 3H7a3 3 0 0 0-3 3v0a5 5 0 0 0 5 5h0a5 5 0 0 1 5 5v0a3 3 0 0 0 3 3h0a5 5 0 0 0 5-5 9 9 0 0 0-9-10Z"/></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Skin Tone Analysis</h3>
                <p className="text-blue-200 opacity-80">Send a selfie to our AI and get colors that perfectly complement your unique skin tone.</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-10 top-0 bg-blue-500 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shirt"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Virtual Try-On</h3>
                <p className="text-blue-200 opacity-80">See how clothes look on you in seconds, without having to physically try them on.</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-10 top-0 bg-blue-500 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-bag"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Shopping Recommendations</h3>
                <p className="text-blue-200 opacity-80">Get personalized product suggestions from top Indian e-commerce stores like Myntra and Flipkart.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-blue-400/20">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-500/20 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
              </div>
              <p className="text-blue-100 text-sm font-medium">Sign up now and get instant access to your personal AI fashion assistant on WhatsApp!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}