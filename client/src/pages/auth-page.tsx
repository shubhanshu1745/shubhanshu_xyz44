import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  loginSchema, 
  registerSchema, 
  forgotPasswordSchema,
  resetPasswordSchema
} from "@shared/schema";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, setLocation] = useLocation();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-[#1A73E8] text-white flex-col justify-center items-center p-8">
        <div className="max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-[#FF5722]">Cric</span>Social
            </h1>
            <p className="text-xl">Connect with cricket lovers worldwide</p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Share Your Cricket Moments</h3>
              <p>Post photos and videos from matches, practice sessions, or your cricket collection.</p>
            </div>
            
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Follow Your Favorite Players</h3>
              <p>Stay updated with posts from international stars and local talents.</p>
            </div>
            
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Join Cricket Discussions</h3>
              <p>Comment on posts and participate in debates about matches, players, and techniques.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Forms */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 bg-neutral-50">
        <div className="w-full max-w-md">
          <Card className="border-none shadow-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                <span className="text-[#FF5722]">Cric</span>
                <span className="text-[#1A73E8]">Social</span>
              </CardTitle>
              <CardDescription>
                The social platform for cricket lovers
              </CardDescription>
            </CardHeader>
            
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="yourusername" {...field} />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-[#1A73E8] hover:bg-[#1565C0]"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Log in"}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="flex items-center my-4">
                    <Separator className="flex-grow" />
                    <span className="px-3 text-xs text-neutral-500">OR</span>
                    <Separator className="flex-grow" />
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"></path>
                    </svg>
                    Continue with Facebook
                  </Button>
                </CardContent>
                
                <CardFooter className="flex justify-center border-t pt-4">
                  <p className="text-sm text-neutral-600">
                    Don't have an account? 
                    <Button variant="link" className="p-0 h-auto text-sm ml-1" onClick={() => document.querySelector('[data-state="inactive"][data-value="register"]')?.click()}>
                      Sign up
                    </Button>
                  </p>
                </CardFooter>
              </TabsContent>
              
              <TabsContent value="register">
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="youremail@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="yourusername" {...field} />
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
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
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
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <p className="text-xs text-neutral-500">
                        By signing up, you agree to our Terms, Privacy Policy and Cookies Policy.
                      </p>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-[#1A73E8] hover:bg-[#1565C0]"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Signing up..." : "Sign up"}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="flex items-center my-4">
                    <Separator className="flex-grow" />
                    <span className="px-3 text-xs text-neutral-500">OR</span>
                    <Separator className="flex-grow" />
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"></path>
                    </svg>
                    Continue with Facebook
                  </Button>
                </CardContent>
                
                <CardFooter className="flex justify-center border-t pt-4">
                  <p className="text-sm text-neutral-600">
                    Have an account? 
                    <Button variant="link" className="p-0 h-auto text-sm ml-1" onClick={() => document.querySelector('[data-state="inactive"][data-value="login"]')?.click()}>
                      Log in
                    </Button>
                  </p>
                </CardFooter>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
