import React, { useState, useRef, useEffect } from 'react';

const icons = {
    robot: "M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM9 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
    send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    loader: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
};

const Icon = ({ d, size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d={d} />
    </svg>
);

export default function AIPanel({ activeFile, activeFileContent }) {
    const [messages, setMessages] = useState([
        { role: 'model', content: "Hello! I'm your AI coding assistant. I can see the file you currently have open. How can I help?" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message to UI immediately
        const updatedHistory = [...messages, { role: 'user', content: userMessage }];
        setMessages(updatedHistory);
        setIsTyping(true);

        try {
            const activeFileContext = activeFile ? {
                path: activeFile,
                content: activeFileContent
            } : null;

            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('ide_token') || ''}`,
                },
                body: JSON.stringify({
                    message: userMessage,
                    activeFileContext: activeFileContext,
                    history: messages // Send previous context
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Server returned an error');
            }

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: 'model',
                content: data.reply || data.error || "Sorry, I couldn't generate a response."
            }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                role: 'model',
                content: "Network error: Make sure the Cloud IDE backend is running and the Gemini API key is set in your .env file."
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-ide-sidebar">
            {/* Header */}
            <div className="h-9 px-3 flex items-center justify-between border-b border-ide-border shrink-0">
                <div className="flex items-center gap-2">
                    <Icon d={icons.robot} size={14} className="text-ide-accent" />
                    <span className="text-xs font-semibold text-ide-textMuted uppercase tracking-widest">AI Assistant</span>
                </div>
            </div>

            {/* Context Badge */}
            {activeFile && (
                <div className="bg-ide-bg border-b border-ide-border px-3 py-1.5 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] text-ide-textSubtle">Active Context:</span>
                    <span className="text-[11px] text-ide-accent font-mono truncate ml-2">{activeFile}</span>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`text-xs p-2.5 rounded-lg max-w-[90%] whitespace-pre-wrap font-sans leading-relaxed
              ${msg.role === 'user'
                                ? 'bg-ide-accent text-white rounded-br-none'
                                : 'bg-ide-panel text-ide-text border border-ide-border rounded-bl-none'
                            }`}
                        >
                            {msg.content}
                        </div>
                        <span className="text-[10px] text-ide-textSubtle mt-1 px-1">
                            {msg.role === 'user' ? 'You' : 'Gemini'}
                        </span>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex flex-col items-start">
                        <div className="text-xs p-2.5 rounded-lg bg-ide-panel text-ide-text border border-ide-border rounded-bl-none flex items-center gap-2">
                            <Icon d={icons.loader} size={12} className="animate-spin text-ide-accent" />
                            <span className="text-ide-textSubtle animate-pulse">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-ide-border bg-ide-sidebar shrink-0">
                <form
                    className="relative flex items-center"
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                >
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={activeFile ? `Ask about ${activeFile}...` : "Ask a coding question..."}
                        className="w-full bg-ide-bg text-ide-text text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-ide-accent resize-none placeholder-ide-textSubtle border border-ide-border box-border h-[42px] min-h-[42px] scrollbar-hide"
                        rows="1"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-1.5 p-1.5 text-ide-textMuted hover:text-ide-accent disabled:opacity-50 disabled:hover:text-ide-textMuted rounded-md transition-colors"
                    >
                        <Icon d={icons.send} size={14} />
                    </button>
                </form>
                <div className="text-[10px] text-center text-ide-textSubtle mt-2 flex items-center justify-center gap-1 opacity-70">
                    Powered by Gemini 2.5 Flash
                </div>
            </div>
        </div>
    );
}
