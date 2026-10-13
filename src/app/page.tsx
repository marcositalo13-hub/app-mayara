import Link from "next/link";
import { Heart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-6">
      <Card className="w-full max-w-sm text-center">
        <CardHeader className="justify-items-center gap-2">
          <Heart className="size-10 fill-primary-soft text-primary" aria-hidden />
          <CardTitle className="text-3xl">Plano Mayara</CardTitle>
          <CardDescription>Em construção</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/estilo" className={buttonVariants({ className: "w-full" })}>
            Ver estilo
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
