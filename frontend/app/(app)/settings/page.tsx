"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAppStore } from "@/lib/store";
import { AlertTriangle, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const errors = useAppStore((s) => s.errors);
  const clearErrors = useAppStore((s) => s.clearErrors);
  const online = useAppStore((s) => s.online);

  return (
    <>
      <header className="flex h-16 items-center gap-4 border-b border-border/40 bg-background/50 backdrop-blur-md px-6 shrink-0 z-10">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-blue-500" />
          <h1 className="font-bold tracking-tight text-sm sm:text-base">
            Settings & Diagnostics
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-4xl mx-auto p-6 lg:p-10 space-y-8">
          <Card className="border-border/40 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${online ? "bg-emerald-500" : "bg-destructive"}`}
                />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {online
                  ? "You are connected to the network."
                  : "You are currently offline. Some features may not work."}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-lg shadow-black/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Error Log
                </CardTitle>
                {errors.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearErrors}
                    className="h-8"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {errors.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No errors recorded this session.
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-auto">
                  {errors.map((err) => (
                    <div
                      key={err.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                    >
                      <Badge variant="destructive" className="text-[10px] shrink-0 mt-0.5">
                        ERROR
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm break-words">{err.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(err.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-lg shadow-black/5">
            <CardHeader>
              <CardTitle className="text-lg">API Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Base URL</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {process.env.NEXT_PUBLIC_API_URL ||
                      "http://localhost:8000/api/v1"}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {process.env.NODE_ENV}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
