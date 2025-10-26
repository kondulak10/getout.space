import { useState } from "react";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

function App() {
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

      console.log("🔍 Testing backend at:", backendUrl);

      const response = await fetch(`${backendUrl}/api/test`);
      const data = await response.json();

      console.log("✅ Backend response:", data);
    } catch (error) {
      console.error("❌ Backend error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl">GetOut.space</CardTitle>
          <CardDescription>Testing Backend Connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={testBackend}
            disabled={loading}
            size="lg"
            className="w-full"
            variant="outline"
          >
            {loading ? "Testing..." : "🧪 Test Backend API"}
          </Button>

          <div className="space-y-2 text-sm text-muted-foreground bg-muted p-4 rounded-md">
            <p className="font-semibold">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Make sure backend is running:
                <code className="ml-2 bg-background px-2 py-1 rounded text-xs">
                  cd backend && npm run dev
                </code>
              </li>
              <li>Click the button above</li>
              <li>Open browser console (F12) to see the response</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Built with Tailwind CSS + shadcn/ui
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;
