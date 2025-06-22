"use client";

interface TypingProps {
  typingUsers: string[];
}

export function Typing({ typingUsers }: TypingProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing`;
    } else {
      return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;
    }
  };
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-0.5">
        <div className="w-1 h-1 bg-muted-foreground rounded-sm animate-[mercuryTyping_1.5s_infinite_ease-in-out] [animation-delay:200ms]"></div>
        <div className="w-1 h-1 bg-muted-foreground rounded-sm animate-[mercuryTyping_1.5s_infinite_ease-in-out] [animation-delay:300ms]"></div>
        <div className="w-1 h-1 bg-muted-foreground rounded-sm animate-[mercuryTyping_1.5s_infinite_ease-in-out] [animation-delay:400ms]"></div>
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
}
