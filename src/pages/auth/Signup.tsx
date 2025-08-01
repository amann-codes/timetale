"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { SignUp as SignUpBody } from "@/lib/types";

export default function SignUp() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpBody>();

  const onSubmit = async (data: SignUpBody) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });
      console.log(res);
      if (res.ok) {
        router.push("/signin");
      } else {
        toast.error("Failed to create account", {
          description: res.statusText,
        });
      }
    } catch (e) {
      toast.error("An unexpected error occurred", {
        description: "Error",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-xs p-5 bg-white border rounded-lg shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name" className=" text-xs font-medium">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              className=" text-xs h-9"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-destructive text-xs ">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className=" text-xs font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              className=" text-xs h-9"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email format",
                },
              })}
            />
            {errors.email && (
              <p className="text-destructive text-xs ">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password" className=" text-xs font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              className=" text-xs h-9"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            {errors.password && (
              <p className="text-destructive text-xs ">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full  text-xs h-9"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <p>Signing up...</p>
                <Loader2 className="w-4 h-4 animate-spin" />
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
          <div className="text-xs text-center">
            Already have an account?
            <Link className="underline ml-1" href={"/signin"}>
              Signin
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
