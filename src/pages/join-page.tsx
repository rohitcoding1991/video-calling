import React, { useState } from "react";
import { useSocket } from "@/context/socket-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function JoinPage() {
  const [name, setName] = useState("");
  const { join } = useSocket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      join(name.trim());
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome</CardTitle>
          <CardDescription className="text-center">
            Type your name to get started. You'll see who's online and can call them instantly.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <Input
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg py-6"
              autoFocus
            />
          </CardContent>
          <CardFooter className="mt-4">
            <Button type="submit" className="w-full" disabled={!name.trim()}>
              Join
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
