import ThemeSwitcher from "@/components/theme-switch";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex justify-between items-center p-4 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-2xl font-bold text-foreground">Socket Chat</h1>
        <ThemeSwitcher />
      </header>

      <main className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
          <h2 className="text-4xl font-bold text-center text-foreground">
            Welcome to Socket Chat
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-md">
            Connect with others in real-time chat rooms. Create your own room or
            join an existing one.
          </p>
        </div>
      </main>
    </div>
  );
}
