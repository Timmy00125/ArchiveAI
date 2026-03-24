import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Paperclip, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (content.trim() && !isLoading) {
      onSend(content.trim());
      setContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [content]);

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative flex flex-col w-full rounded-2xl border border-border/40 bg-background/95 backdrop-blur-md shadow-2xl focus-within:border-primary/40 transition-all duration-300 ring-1 ring-black/5 dark:ring-white/5"
    >
      <div className="flex flex-col p-2 px-3">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your documents..."
          className="min-h-[60px] w-full resize-none bg-transparent px-2 py-2 border-0 focus-visible:ring-0 shadow-none text-[15px] leading-relaxed placeholder:text-muted-foreground/40"
          rows={1}
          disabled={isLoading}
        />
        
        <div className="flex items-center justify-between pb-1 px-1">
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Paperclip size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
              <Mic size={18} />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {content.length > 50 && (
                <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-tighter"
                >
                  {content.length}
                </motion.span>
              )}
            </AnimatePresence>
            
            <Button
              size="sm"
              className={cn(
                "h-8 px-4 rounded-xl font-bold transition-all",
                content.trim() && !isLoading 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]" 
                  : "bg-muted text-muted-foreground"
              )}
              onClick={handleSend}
              disabled={!content.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs">Send</span>
                  <Send className="h-3.5 w-3.5" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
