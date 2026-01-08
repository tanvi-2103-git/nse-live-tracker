import React from 'react';
import { Bot, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isAssistant = role === 'assistant';

  return (
    <div className={cn(
      "flex gap-3 p-4 fade-in",
      isAssistant ? "bg-muted/30" : "bg-transparent"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isAssistant 
          ? "bg-primary/20 text-primary" 
          : "bg-secondary text-muted-foreground"
      )}>
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-sm font-medium",
            isAssistant ? "text-primary" : "text-foreground"
          )}>
            {isAssistant ? 'Market Assistant' : 'You'}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(timestamp, 'HH:mm')}
          </span>
        </div>
        
        <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
}
