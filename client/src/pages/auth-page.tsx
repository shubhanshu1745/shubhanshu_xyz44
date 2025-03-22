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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // UI state management
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [showVerifyEmailAlert, setShowVerifyEmailAlert] = useState(false);
  
  // Check for verified parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "true") {
      toast({
        title: "Email verified",
        description: "Your email has been successfully verified. You can now log in.",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check for reset token in URL
    const token = params.get("token");
    if (token) {
      setIsResetPassword(true);
      setResetToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      // Show verify email alert if user email is not verified
      if (!user.emailVerified) {
        setShowVerifyEmailAlert(true);
      } else {
        setLocation("/");
      }
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
  
  // Forgot password form
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  
  // Reset password form
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: resetToken,
      password: "",
      confirmPassword: "",
    },
  });
  
  // Update token value when it changes
  useEffect(() => {
    resetPasswordForm.setValue("token", resetToken);
  }, [resetToken, resetPasswordForm]);

  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  }
  
  // Handle forgot password form submission
  const [forgotPasswordPending, setForgotPasswordPending] = useState(false);
  
  async function onForgotPasswordSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    try {
      setForgotPasswordPending(true);
      await apiRequest<any>("POST", "/api/forgot-password", values);
      
      setEmailSent(true);
      toast({
        title: "Password reset email sent",
        description: "If an account with that email exists, we've sent a password reset link.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setForgotPasswordPending(false);
    }
  }
  
  // Handle reset password form submission
  const [resetPasswordPending, setResetPasswordPending] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  async function onResetPasswordSubmit(values: z.infer<typeof resetPasswordSchema>) {
    try {
      setResetPasswordPending(true);
      await apiRequest<any>("POST", "/api/reset-password", values);
      
      setResetSuccess(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been reset. You can now log in with your new password.",
      });
      
      // Clear form and redirect to login after 2 seconds
      resetPasswordForm.reset();
      setTimeout(() => {
        setIsResetPassword(false);
      }, 2000);
      
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Error",
        description: "Failed to reset password. The link may be expired or invalid.",
        variant: "destructive",
      });
    } finally {
      setResetPasswordPending(false);
    }
  }
  
  // Handle resend verification email
  const [resendVerificationPending, setResendVerificationPending] = useState(false);
  
  async function handleResendVerification() {
    try {
      setResendVerificationPending(true);
      await apiRequest<any>("/api/resend-verification", {
        method: "POST"
      } as RequestInit);
      
      toast({
        title: "Verification email sent",
        description: "A new verification email has been sent to your email address.",
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendVerificationPending(false);
    }
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
                  {isResetPassword ? (
                    <>
                      {/* Reset Password Form */}
                      <div className="mb-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-0 flex items-center text-neutral-600"
                          onClick={() => setIsResetPassword(false)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                          </svg>
                          Back to login
                        </Button>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-4">Reset your password</h3>
                      
                      {resetSuccess ? (
                        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                          <AlertDescription>
                            Your password has been reset successfully. You can now log in with your new password.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Form {...resetPasswordForm}>
                          <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                            <FormField
                              control={resetPasswordForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New Password</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={resetPasswordForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm New Password</FormLabel>
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
                              disabled={resetPasswordPending}
                            >
                              {resetPasswordPending ? "Resetting..." : "Reset Password"}
                            </Button>
                          </form>
                        </Form>
                      )}
                    </>
                  ) : showForgotPassword ? (
                    <>
                      {/* Forgot Password Form */}
                      <div className="mb-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-0 flex items-center text-neutral-600"
                          onClick={() => setShowForgotPassword(false)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                          </svg>
                          Back to login
                        </Button>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-4">Reset your password</h3>
                      
                      {emailSent ? (
                        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                          <AlertDescription>
                            If an account exists with the email you provided, we've sent password reset instructions.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <p className="text-sm text-neutral-600 mb-4">
                            Enter your email address and we'll send you a link to reset your password.
                          </p>
                          
                          <Form {...forgotPasswordForm}>
                            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                              <FormField
                                control={forgotPasswordForm.control}
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
                              
                              <Button 
                                type="submit" 
                                className="w-full bg-[#1A73E8] hover:bg-[#1565C0]"
                                disabled={forgotPasswordPending}
                              >
                                {forgotPasswordPending ? "Sending..." : "Send Reset Link"}
                              </Button>
                            </form>
                          </Form>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Normal Login Form */}
                      {showVerifyEmailAlert && (
                        <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
                          <AlertDescription className="flex flex-col gap-2">
                            <p>Please verify your email address to access all features.</p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full mt-2"
                              onClick={handleResendVerification}
                              disabled={resendVerificationPending}
                            >
                              {resendVerificationPending ? "Sending..." : "Resend verification email"}
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                      
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
                          
                          <div className="flex justify-end">
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-sm"
                              onClick={() => setShowForgotPassword(true)}
                              type="button"
                            >
                              Forgot password?
                            </Button>
                          </div>
                          
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
                    </>
                  )}
                </CardContent>
                
                {!showForgotPassword && !isResetPassword && (
                  <CardFooter className="flex justify-center border-t pt-4">
                    <p className="text-sm text-neutral-600">
                      Don't have an account? 
                      <Button variant="link" className="p-0 h-auto text-sm ml-1" onClick={() => {
                        const registerTab = document.querySelector('[data-state="inactive"][data-value="register"]');
                        if (registerTab instanceof HTMLElement) {
                          registerTab.click();
                        }
                      }}>
                        Sign up
                      </Button>
                    </p>
                  </CardFooter>
                )}
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
