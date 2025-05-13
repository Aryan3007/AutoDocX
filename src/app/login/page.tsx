"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, FileText, Lock } from "lucide-react"
import { signIn, useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
    const { status } = useSession();
    const router = useRouter();
  
    useEffect(() => {
      if (status === "authenticated") {
        router.push("/dashboard/documentation");
      }
    }, [status, router]);
  
    if (status === "loading") return <div>Loading...</div>;
  
  return (
    <div className="flex min-h-screen justify-center items-center bg-gray-50">
        {/* Right Section - Visual Element */}
     
      {/* Left Section - Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-2xl  border-0">
          <CardHeader className="space-y-2 pb-8">
            <div className="flex items-center mb-2">
            <h1 className='text-lg font-medium'><span className='text-red-500 font-bold'>/</span>AutoDocX</h1>

            </div>
            <CardTitle className="text-3xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-lg">
              Connect with GitHub to access your repositories and generate documentation effortlessly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button onClick={() => signIn("github")} className="w-full py-6 text-lg" size="lg">
              <Github className="mr-3 h-6 w-6" />
              Continue with GitHub
            </Button>
            
            <div className="space-y-4 pt-4">
              <h3 className="text-xl font-medium">Why connect with GitHub?</h3>
              <div className="grid gap-4">
                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-4">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Access Your Repositories</h4>
                    <p className="text-muted-foreground">Connect to both public and private repositories without any setup hassle</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-4">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Secure Authentication</h4>
                    <p className="text-muted-foreground">We use OAuth for secure access without storing your credentials</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground pt-4">
              By continuing, you agree to our{" "}
              <Link href="#" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </Link>
              .
            </div>
          </CardContent>
        </Card>
      </div>

      
    </div>
  )
}