import { Suspense } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentMember } from "@/lib/auth";
import { signOut } from "./actions";

async function MemberCard() {
  const member = await getCurrentMember({ required: true });

  return (
    <>
      <CardHeader className="justify-items-center gap-2 text-center">
        <Heart className="size-10 fill-primary-soft text-primary" aria-hidden />
        <CardTitle className="text-3xl">Olá, {member.displayName}</CardTitle>
        {member.role === "admin" && (
          <p className="text-text-muted">Você está como administrador</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Link
          href="/estilo"
          className={buttonVariants({ variant: "secondary", className: "w-full" })}
        >
          Ver estilo
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="w-full">
            Sair
          </Button>
        </form>
      </CardContent>
    </>
  );
}

function MemberCardSkeleton() {
  return (
    <CardHeader className="items-center justify-items-center gap-3" aria-busy="true">
      <div className="size-10 rounded-full bg-primary-soft" />
      <div className="h-8 w-48 rounded-full bg-surface-alt" />
      <div className="h-12 w-full rounded-full bg-surface-alt" />
    </CardHeader>
  );
}

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-6">
      <Card className="w-full max-w-sm">
        <Suspense fallback={<MemberCardSkeleton />}>
          <MemberCard />
        </Suspense>
      </Card>
    </main>
  );
}
