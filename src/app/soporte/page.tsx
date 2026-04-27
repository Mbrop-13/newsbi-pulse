"use client";

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { SupportTicket, SupportMessage } from "@/lib/types";
import { Send, Headphones, ArrowLeft, Loader2, Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

export default function SupportPage() {
  const { user, isAuthenticated } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    const fetchOrCreateTicket = async () => {
      try {
        // 1. Check if user has an open ticket
        const { data: existingTickets, error: ticketError } = await supabase
          .from("support_tickets")
          .select("*")
          .eq("user_id", user?.id)
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(1);

        if (ticketError) throw ticketError;

        let currentTicket = existingTickets?.[0];

        if (!currentTicket) {
          // 2. Create new ticket if none exists
          const { data: newTicket, error: createError } = await supabase
            .from("support_tickets")
            .insert([{ user_id: user?.id, subject: "Soporte General" }])
            .select()
            .single();

          if (createError) throw createError;
          currentTicket = newTicket;

          // Add a welcome message from admin/bot
          await supabase.from("support_messages").insert([{
            ticket_id: currentTicket.id,
            user_id: user?.id,
            is_admin: true,
            message: "¡Hola! Bienvenido al soporte de Reclu. ¿En qué podemos ayudarte hoy?"
          }]);
        }

        setTicket(currentTicket);

        // 3. Fetch messages for the ticket
        const { data: msgs, error: msgError } = await supabase
          .from("support_messages")
          .select("*")
          .eq("ticket_id", currentTicket.id)
          .order("created_at", { ascending: true });

        if (msgError) throw msgError;
        setMessages(msgs || []);

      } catch (error) {
        console.error("Error loading support:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrCreateTicket();

    // 4. Set up realtime subscription for new messages
    const channel = supabase
      .channel('support_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        // filter by ticket_id isn't directly possible dynamically in setup sometimes, so we filter in callback
      }, (payload) => {
        const newMsg = payload.new as SupportMessage;
        setMessages((prev) => {
          // Only add if it belongs to our ticket and we don't already have it
          if (ticket && newMsg.ticket_id === ticket.id && !prev.find(m => m.id === newMsg.id)) {
            return [...prev, newMsg];
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id, router, supabase, ticket?.id]); // Note: ticket.id might cause re-renders, better to handle carefully

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket || isSending) return;

    const msgText = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      const { data, error } = await supabase
        .from("support_messages")
        .insert([{
          ticket_id: ticket.id,
          user_id: user?.id,
          is_admin: false,
          message: msgText
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state immediately for better UX
      setMessages(prev => [...prev, data]);
      
      // Update ticket updated_at
      await supabase
        .from("support_tickets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", ticket.id);

    } catch (error) {
      console.error("Error sending message:", error);
      // Revert or show error
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0E11] pt-16 flex flex-col">
      <div className="flex-1 max-w-3xl w-full mx-auto flex flex-col h-[calc(100vh-64px)] shadow-2xl bg-white dark:bg-slate-900 overflow-hidden md:border-x border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="h-16 px-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 z-10 relative">
          <div className="flex items-center gap-3">
            <Link href="/" className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-[#1890FF]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Soporte Reclu</h2>
              <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                En línea
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-mono">
            {ticket?.status === 'open' ? 'Ticket Abierto' : 'Ticket Cerrado'}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#E5DDD5] dark:bg-[#0B141A] custom-scrollbar">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-[#1890FF] animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <span className="text-[11px] font-medium text-gray-500 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
                  Tus mensajes están encriptados y seguros
                </span>
              </div>
              
              {messages.map((msg, idx) => {
                const isMe = !msg.is_admin;
                const showAvatar = !isMe && (idx === 0 || messages[idx - 1].is_admin !== msg.is_admin);
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div className="flex max-w-[85%] sm:max-w-[75%] items-end gap-2">
                      {!isMe && (
                        <div className="w-8 shrink-0 flex flex-col justify-end">
                          {showAvatar && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-[#1890FF] flex items-center justify-center shadow-md">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div 
                        className={`relative px-4 py-2 text-[15px] leading-relaxed shadow-sm ${
                          isMe 
                            ? 'bg-[#D9FDD3] dark:bg-[#005C4B] text-gray-900 dark:text-white rounded-2xl rounded-tr-sm' 
                            : 'bg-white dark:bg-[#202C33] text-gray-900 dark:text-white rounded-2xl rounded-tl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <div className={`text-[10px] text-right mt-1 opacity-60 flex items-center justify-end gap-1 ${isMe ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                          {format(new Date(msg.created_at), "HH:mm")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[#F0F2F5] dark:bg-[#202C33] shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto">
            <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-2xl md:rounded-full min-h-[44px] flex items-center px-4 shadow-sm border border-transparent focus-within:border-gray-300 dark:focus-within:border-gray-600 transition-colors">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="w-full bg-transparent border-none outline-none text-[15px] text-gray-900 dark:text-white py-3"
                disabled={ticket?.status === 'closed'}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending || ticket?.status === 'closed'}
              className="w-11 h-11 rounded-full bg-[#00A884] flex items-center justify-center shrink-0 shadow-md text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#008f6f] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A884] focus:ring-offset-2 dark:focus:ring-offset-[#202C33]"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-1" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
