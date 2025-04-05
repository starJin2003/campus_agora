"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getUniversityFromEmail } from "@/lib/auth-utils"
import { setAuthToken } from "@/lib/auth-client"

export default function AuthPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [loginError, setLoginError] = useState("")
  const [signupError, setSignupError] = useState("")
  const [signupSuccess, setSignupSuccess] = useState("")
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verificationUser, setVerificationUser] = useState<any>(null)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [universityName, setUniversityName] = useState("")

  // Reset state when tab changes
  useEffect(() => {
    resetSignupState()
  }, [activeTab])

  // Reset signup state function
  const resetSignupState = () => {
    setSignupSuccess("")
    setSignupError("")
    // Reset form using DOM access
    const form = document.getElementById("signup-form") as HTMLFormElement
    if (form) form.reset()
  }

  // Login handler
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError("")
    setNeedsVerification(false)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403 && data.needsVerification) {
          setNeedsVerification(true)
          setVerificationUser({
            userId: data.userId,
            email: data.email,
            name: data.name,
          })
          setLoginError("Email verification required.")
        } else {
          setLoginError(data.error || "Login failed.")
        }
        setIsLoading(false)
        return
      }

      // Save token on successful login
      setAuthToken(data.token)

      // Merge user data with previous data
      const mergedUserData = {
        ...data.user,
        isLoggedIn: true,
      }

      // Get previously stored user info (if any)
      try {
        const storedUserStr = localStorage.getItem("user_backup")
        if (storedUserStr) {
          const storedUser = JSON.parse(storedUserStr)
          // Keep previously modified info
          if (storedUser.name) mergedUserData.name = storedUser.name
          if (storedUser.department) mergedUserData.department = storedUser.department
          if (storedUser.profileImage) mergedUserData.profileImage = storedUser.profileImage

          console.log("Merged with previous user data:", {
            stored: storedUser,
            merged: mergedUserData,
          })
        }
      } catch (error) {
        console.error("Failed to parse stored user data:", error)
      }

      // Get university info (assuming it's included in API response)
      if (data.university) {
        // University info included in API response
        mergedUserData.university = data.university.name
        mergedUserData.universityId = data.university.id
        mergedUserData.universitySlug = data.university.slug
      } else if (data.user.email) {
        // Extract university from email domain if not provided
        const emailDomain = data.user.email.split("@")[1]
        try {
          // Call university info API
          const universityResponse = await fetch(`/api/universities/by-domain?domain=${emailDomain}`)
          if (universityResponse.ok) {
            const universityData = await universityResponse.json()
            mergedUserData.university = universityData.name
            mergedUserData.universityId = universityData.id
            mergedUserData.universitySlug = universityData.slug
          }
        } catch (error) {
          console.error("Failed to fetch university info:", error)
        }
      }

      // Save merged user info
      localStorage.setItem("user", JSON.stringify(mergedUserData))
      localStorage.setItem("user_backup", JSON.stringify(mergedUserData))

      toast({
        title: "Login successful",
        description: "Welcome!",
      })

      // Redirect to university page (if university info exists)
      if (mergedUserData.universitySlug) {
        router.push(`/university/${mergedUserData.universitySlug}`)
      } else {
        // Redirect to homepage if no university info
        router.push("/")
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoginError("Server error. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Signup handler
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setSignupError("")
    setSignupSuccess("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const name = formData.get("name") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const department = (formData.get("department") as string) || ""

    // Password confirmation
    if (password !== confirmPassword) {
      setSignupError("Passwords do not match.")
      setIsLoading(false)
      return
    }

    // .edu email validation
    if (!email.toLowerCase().endsWith(".edu")) {
      setSignupError("Only educational institution emails (.edu) are allowed.")
      setIsLoading(false)
      return
    }

    // Extract university info
    const university = getUniversityFromEmail(email)
    setUniversityName(university)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name, password, department, university }),
      })

      const data = await response.json()

      if (!response.ok) {
        setSignupError(data.error || "Registration failed.")
        setIsLoading(false)
        return
      }

      // Signup success
      setSignupSuccess(data.message || "Registration complete. Please check your email to verify your account.")

      // Reset form
      e.currentTarget.reset()
    } catch (error) {
      console.error("Signup error:", error)
      setSignupError("Server error. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Resend verification email
  const handleResendVerification = async () => {
    if (!verificationUser || isResendingVerification) return

    setIsResendingVerification(true)

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verificationUser),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Failed to resend verification email",
          description: data.error || "Failed to resend verification email.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Verification email sent",
        description: data.message || "Verification email has been sent. Please check your inbox.",
      })
    } catch (error) {
      console.error("Resend verification error:", error)
      toast({
        title: "Failed to resend verification email",
        description: "Server error. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsResendingVerification(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center h-10 mr-2 text-primary">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="5" y="30" width="30" height="4" fill="currentColor" />
                  <rect x="7" y="6" width="26" height="4" fill="currentColor" />
                  <rect x="9" y="10" width="4" height="20" fill="currentColor" />
                  <rect x="27" y="10" width="4" height="20" fill="currentColor" />
                  <rect x="18" y="10" width="4" height="20" fill="currentColor" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-center">Campus Agora</CardTitle>
            </div>
            <CardDescription className="text-center">
              Login with your educational institution email to use our services
            </CardDescription>
            <TabsList className="grid w-full grid-cols-2 mt-4">
              <TabsTrigger value="login" id="login-tab">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                {loginError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Login Failed</AlertTitle>
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                {needsVerification && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle>Email Verification Required</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>You need to verify your email before using your account.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                        className="mt-2"
                      >
                        {isResendingVerification ? "Sending..." : "Resend Verification Email"}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Educational Institution Email</Label>
                  <Input id="email" name="email" type="email" placeholder="example@university.edu" required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot Password?
                    </Link>
                  </div>
                  <Input id="password" name="password" type="password" required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form id="signup-form" onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                {signupError && !signupSuccess && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Registration Failed</AlertTitle>
                    <AlertDescription>{signupError}</AlertDescription>
                  </Alert>
                )}

                {signupSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>Registration Successful</AlertTitle>
                    <AlertDescription>{signupSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Educational Institution Email</Label>
                  <Input id="signup-email" name="email" type="email" placeholder="example@university.edu" required />
                  <p className="text-xs text-muted-foreground">
                    * Only educational institution emails (.edu) are allowed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" type="text" placeholder="John Doe" required />
                  <p className="text-xs text-muted-foreground">* Please use your real name</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department (Optional)</Label>
                  <Input id="department" name="department" type="text" placeholder="Computer Science" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" name="password" type="password" required />
                  <p className="text-xs text-muted-foreground">
                    * At least 8 characters, including letters, numbers, and special characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" name="confirmPassword" type="password" required />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading || !!signupSuccess}>
                  {isLoading ? "Signing up..." : "Sign Up"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}

