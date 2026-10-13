import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Plano Mayara</CardTitle>
          <CardDescription className="text-base">Em construção</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
