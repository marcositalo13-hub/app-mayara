import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Plano Mayara" };

export default function EntrarPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="justify-items-center gap-2 text-center">
          <Heart className="size-10 fill-primary-soft text-primary" aria-hidden />
          <CardTitle className="text-2xl">Que bom te ver por aqui</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
