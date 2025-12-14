import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Plus, Loader2, Mic, Paperclip, MoreVertical, X } from "lucide-react";
import MessageBubble from "./chat/MessageBubble";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export default function ChatModal({ open, onOpenChange }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open]);

  const loadConversations = async () => {
    try {
      const convos = await base44.agents.listConversations({
        agent_name: "sanka"
      });
      setConversations(convos);

      if (convos.length > 0) {
        loadConversation(convos[0].id);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const conversation = await base44.agents.getConversation(conversationId);
      setCurrentConversation(conversation);
      setMessages(conversation.messages || []);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const createNewConversation = async () => {
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: "sanka",
        metadata: {
          name: `Chat ${new Date().toLocaleDateString()}`
        }
      });
      setCurrentConversation(conversation);
      setMessages([]);
      setConversations([conversation, ...conversations]);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  useEffect(() => {
    if (!currentConversation?.id) return;

    const unsubscribe = base44.agents.subscribeToConversation(
      currentConversation.id,
      (data) => {
        setMessages(data.messages || []);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentConversation?.id]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setAttachedFiles([...attachedFiles, ...uploadedUrls]);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const removeAttachedFile = (index) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;

    let conversation = currentConversation;

    if (!conversation) {
      try {
        conversation = await base44.agents.createConversation({
          agent_name: "sanka",
          metadata: {
            name: `Chat ${new Date().toLocaleDateString()}`
          }
        });
        setCurrentConversation(conversation);
        setConversations([conversation, ...conversations]);
      } catch (error) {
        console.error("Error creating conversation:", error);
        return;
      }
    }

    const message = inputValue;
    const files = attachedFiles;
    setInputValue("");
    setAttachedFiles([]);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: message || "Attached files",
        file_urls: files.length > 0 ? files : undefined
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setInputValue(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const quickPrompts = [
    "What are my low stock items?",
    "Show top customers this month",
    "Generate a sales report",
    "Add a new product to inventory"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200">
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69113d25d60420d42757a90b/717cc756f_Screenshot2025-12-11at100048PM.png"
                    alt="SMBP"
                    className="w-10 h-10 rounded-full" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-slate-900 text-sm">SMBP</h1>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={createNewConversation}
                className="rounded-full h-9 w-9">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
                  <div className="w-24 h-24 rounded-3xl bg-white border-2 border-slate-200 flex items-center justify-center mb-6 shadow-xl">
                    <img
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69113d25d60420d42757a90b/717cc756f_Screenshot2025-12-11at100048PM.png"
                      alt="SMBP"
                      className="w-24 h-24 rounded-3xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Let's Get to Business</h2>
                  <p className="text-slate-600 mb-8 max-w-md text-sm leading-relaxed">I am here to help you with your everyday business needs.</p>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                    {quickPrompts.map((prompt, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        onClick={() => setInputValue(prompt)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-left text-sm text-slate-700 hover:text-indigo-900 transition-all">
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <AnimatePresence>
                    {messages.map((message, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}>
                        <MessageBubble message={message} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex items-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full h-10 w-10 flex-shrink-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                  <Paperclip className="w-5 h-5" />
                </Button>

                <div className="flex-1 relative">
                  {attachedFiles.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {attachedFiles.map((fileUrl, idx) => (
                        <div key={idx} className="bg-slate-100 rounded-lg px-3 py-1 flex items-center gap-2 text-xs">
                          <Paperclip className="w-3 h-3" />
                          <span className="text-slate-700">File {idx + 1}</span>
                          <button
                            onClick={() => removeAttachedFile(idx)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleTextareaChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask SMBP anything..."
                    disabled={isLoading}
                    className="min-h-[44px] max-h-[120px] resize-none rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 pr-12 py-3 text-sm leading-relaxed"
                    rows={1} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 bottom-2 rounded-full h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading}
                  className="rounded-full h-10 w-10 p-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex-shrink-0 shadow-lg">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-center text-slate-500 mt-3">
                SMBP can make mistakes. Please verify important information.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}