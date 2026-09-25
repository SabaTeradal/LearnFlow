import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useSendChatMessage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Bot, User as UserIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { ChatMessage } from "@workspace/api-client-react";

export function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  
  const sendMessage = useSendChatMessage();

  const handleSend = () => {
    if (!message.trim()) return;
    
    const newUserMsg: ChatMessage = { role: "user", content: message };
    const newHistory = [...history, newUserMsg];
    setHistory(newHistory);
    setMessage("");

    sendMessage.mutate({
      data: {
        message: newUserMsg.content,
        history: history
      }
    }, {
      onSuccess: (data) => {
        setHistory([...newHistory, { role: "assistant", content: data.reply }]);
      }
    });
  };

  if (!user) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setIsOpen(true)}
          data-testid="button-open-chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[500px] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden"
            data-testid="chat-widget-panel"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">LearnFlow Assistant</span>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setIsOpen(false)} data-testid="button-close-chat">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-4">
                {history.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground mt-10">
                    Ask me anything about your courses, coding, or concepts!
                  </div>
                )}
                {history.map((msg, i) => (
                  <div key={i} className={clsx("flex gap-3 max-w-[85%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    <div className="flex-shrink-0 mt-1">
                      {msg.role === "user" ? (
                        <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                          <UserIcon className="h-3 w-3 text-secondary-foreground" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className={clsx("rounded-2xl px-4 py-2 text-sm", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                      <FormatMessage content={msg.content} />
                    </div>
                  </div>
                ))}
                {sendMessage.isPending && (
                  <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-muted text-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border bg-card">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-muted/50 border-transparent focus-visible:ring-primary"
                  disabled={sendMessage.isPending}
                  data-testid="input-chat-message"
                />
                <Button type="submit" size="icon" disabled={!message.trim() || sendMessage.isPending} data-testid="button-send-chat">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function FormatMessage({ content }: { content: string }) {
  // Very basic markdown code block parsing
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="whitespace-pre-wrap flex flex-col gap-2">
      {parts.map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const code = part.slice(3, -3).replace(/^[\w-]+\n/, "");
          return (
            <pre key={i} className="bg-background text-foreground p-3 rounded-md overflow-x-auto text-xs font-mono border border-border mt-1">
              <code>{code.trim()}</code>
            </pre>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
