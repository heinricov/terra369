import ApiConnectionForm from "@/components/api-connection-form";
import { Toaster } from "sonner";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            API Connection Manager
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Connect, test, and interact with any REST API
          </p>
        </div>
        <ApiConnectionForm />
      </div>
      <Toaster position="top-right" />
    </main>
  );
}
