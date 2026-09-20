import {
  Bot,
  Copy,
  FileText,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Upload,
  X,
  User,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
  KeyboardEvent,
} from "react";

import { useAuth } from "../context/AuthContext";


type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};


type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};


type SelectedDocument = {
  id: string;
  filename: string;
};


const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hello Pranav! 👋\n\nI'm your AI assistant. I can help you with coding, data analysis, documents, research and more.",
  },
];


const API_URL =
  "http://127.0.0.1:8000";


export default function Chat() {
  const { token } = useAuth();

  const [messages, setMessages] =
    useState<Message[]>(
      initialMessages
    );

  const [message, setMessage] =
    useState("");

  const [isTyping, setIsTyping] =
    useState(false);

  const [selectedModel, setSelectedModel] =
    useState("llama3.2:3b");

  const [
    conversations,
    setConversations,
  ] = useState<Conversation[]>([]);

  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState<string | null>(null);

  const [
    selectedDocument,
    setSelectedDocument,
  ] = useState<SelectedDocument | null>(null);

  const [
    isUploadingDocument,
    setIsUploadingDocument,
  ] = useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);


  // --------------------------------------------------
  // Auto scroll
  // --------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);


  // --------------------------------------------------
  // Load conversation history
  // --------------------------------------------------

  const loadHistory = async () => {
    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/chat/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `History API error: ${response.status}`
        );
      }

      const data: Conversation[] =
        await response.json();

      setConversations(data);

    } catch (error) {
      console.error(
        "Failed to load conversation history:",
        error
      );
    }
  };


  // --------------------------------------------------
  // Load history when Chat opens
  // --------------------------------------------------

  useEffect(() => {
    if (token) {
      void loadHistory();
    }
  }, [token]);


  // --------------------------------------------------
  // Load one conversation
  // --------------------------------------------------

  const loadConversation = async (
    conversationId: string
  ) => {
    if (isTyping || !token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/chat/history/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Conversation API error: ${response.status}`
        );
      }

      const data = await response.json();

      const loadedMessages: Message[] =
        data.messages.map(
          (
            item: {
              role:
                | "user"
                | "assistant";
              content: string;
            },
            index: number
          ) => ({
            id:
              Date.now() + index,
            role: item.role,
            content: item.content,
          })
        );

      setMessages(
        loadedMessages.length > 0
          ? loadedMessages
          : initialMessages
      );

      setActiveConversationId(
        conversationId
      );

    } catch (error) {
      console.error(
        "Failed to load conversation:",
        error
      );
    }
  };


  // --------------------------------------------------
  // Upload document for Chat
  // --------------------------------------------------

  const handleDocumentUpload = async (
    file: File
  ) => {
    if (!token) {
      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".txt",
      ".docx",
    ];

    const extension =
      "." +
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (
      !allowedExtensions.includes(
        extension
      )
    ) {
      alert(
        "Please upload a PDF, TXT, or DOCX file."
      );
      return;
    }

    try {
      setIsUploadingDocument(true);

      const formData = new FormData();

      formData.append(
        "file",
        file
      );

      const response = await fetch(
        `${API_URL}/api/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Document upload failed."
        );
      }

      setSelectedDocument({
        id: data.document.id,
        filename:
          data.document.filename,
      });

    } catch (error) {
      console.error(
        "Document upload error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to upload document."
      );

    } finally {
      setIsUploadingDocument(false);
    }
  };


  const handleDocumentChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (file) {
      void handleDocumentUpload(file);
    }

    event.target.value = "";
  };


  // --------------------------------------------------
  // Ask AI about selected document
  // --------------------------------------------------

  const askAboutDocument = async (
    question: string,
    document: SelectedDocument,
    assistantMessageId: number
  ) => {
    if (!token) {
      throw new Error(
        "Authentication required."
      );
    }

    const response = await fetch(
      `${API_URL}/api/documents/${document.id}/ask`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Document analysis failed."
      );
    }

    setMessages(
      (previous) =>
        previous.map(
          (msg) =>
            msg.id ===
            assistantMessageId
              ? {
                  ...msg,
                  content:
                    data.answer,
                }
              : msg
        )
    );
  };


  // --------------------------------------------------
  // Send message with streaming / document Q&A
  // --------------------------------------------------

  const sendMessage = async () => {
    const trimmedMessage =
      message.trim();

    if (
      !trimmedMessage ||
      isTyping ||
      !token
    ) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmedMessage,
    };

    setMessages(
      (previous) => [
        ...previous,
        userMessage,
      ]
    );

    setMessage("");
    setIsTyping(true);

    const assistantMessageId =
      Date.now() + 1;

    setMessages(
      (previous) => [
        ...previous,
        {
          id:
            assistantMessageId,
          role: "assistant",
          content: "",
        },
      ]
    );


    // --------------------------------------------------
    // Document Q&A
    // --------------------------------------------------

    if (selectedDocument) {
      try {
        await askAboutDocument(
          trimmedMessage,
          selectedDocument,
          assistantMessageId
        );

        setSelectedDocument(null);

      } catch (error) {
        console.error(
          "Document Q&A error:",
          error
        );

        setMessages(
          (previous) =>
            previous.map(
              (msg) =>
                msg.id ===
                assistantMessageId
                  ? {
                      ...msg,
                      content:
                        error instanceof
                        Error
                          ? error.message
                          : "Sorry, I couldn't analyze the document.",
                    }
                  : msg
            )
        );

      } finally {
        setIsTyping(false);
      }

      return;
    }


    // --------------------------------------------------
    // Streaming Chat
    // --------------------------------------------------

    try {
      const response =
        await fetch(
          `${API_URL}/api/chat/stream`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              message:
                trimmedMessage,

              conversation_id:
                activeConversationId,

              model:
                selectedModel,
            }),
          }
        );


      if (!response.ok) {
        if (
          response.status === 401
        ) {
          throw new Error(
            "Your session has expired. Please log in again."
          );
        }

        throw new Error(
          `API error: ${response.status}`
        );
      }


      if (!response.body) {
        throw new Error(
          "No response body received."
        );
      }


      // ----------------------------------------------
      // Get conversation ID from backend
      // ----------------------------------------------

      const newConversationId =
        response.headers.get(
          "X-Conversation-ID"
        );

      if (
        newConversationId &&
        newConversationId !==
          activeConversationId
      ) {
        setActiveConversationId(
          newConversationId
        );
      }


      // ----------------------------------------------
      // Read streaming response
      // ----------------------------------------------

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let accumulatedResponse =
        "";


      while (true) {
        const {
          value,
          done,
        } = await reader.read();

        if (done) {
          break;
        }

        const chunk =
          decoder.decode(
            value,
            {
              stream: true,
            }
          );

        accumulatedResponse +=
          chunk;

        setMessages(
          (previous) =>
            previous.map(
              (msg) =>
                msg.id ===
                assistantMessageId
                  ? {
                      ...msg,
                      content:
                        accumulatedResponse,
                    }
                  : msg
            )
        );
      }


      // ----------------------------------------------
      // Flush decoder
      // ----------------------------------------------

      const finalChunk =
        decoder.decode();

      if (finalChunk) {
        accumulatedResponse +=
          finalChunk;

        setMessages(
          (previous) =>
            previous.map(
              (msg) =>
                msg.id ===
                assistantMessageId
                  ? {
                      ...msg,
                      content:
                        accumulatedResponse,
                    }
                  : msg
            )
        );
      }


      // ----------------------------------------------
      // Refresh sidebar history
      // ----------------------------------------------

      await loadHistory();

    } catch (error) {
      console.error(
        "Streaming chat error:",
        error
      );

      setMessages(
        (previous) =>
          previous.map(
            (msg) =>
              msg.id ===
              assistantMessageId
                ? {
                    ...msg,
                    content:
                      error instanceof
                      Error
                        ? error.message
                        : "Sorry, I couldn't connect to the NexaAI backend. Please make sure FastAPI is running on port 8000.",
                  }
                : msg
          )
      );

    } finally {
      setIsTyping(false);
    }
  };


  // --------------------------------------------------
  // New Chat
  // --------------------------------------------------

  const startNewChat = () => {
    setMessages(
      initialMessages
    );

    setMessage("");

    setIsTyping(false);

    setActiveConversationId(
      null
    );

    setSelectedDocument(null);
  };


  // --------------------------------------------------
  // Keyboard handling
  // --------------------------------------------------

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void sendMessage();
    }
  };


  // --------------------------------------------------
  // Copy assistant response
  // --------------------------------------------------

  const copyMessage = async (
    content: string
  ) => {
    try {
      await navigator.clipboard.writeText(
        content
      );
    } catch {
      console.error(
        "Could not copy message."
      );
    }
  };


  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="flex h-[calc(100vh-9rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* ========================================= */}
      {/* Conversation Sidebar */}
      {/* ========================================= */}

      <aside className="hidden w-72 flex-col border-r border-slate-200 bg-slate-50 md:flex">

        <div className="border-b border-slate-200 p-4">

          <button
            onClick={
              startNewChat
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={17} />

            New Chat
          </button>

        </div>


        <div className="flex-1 overflow-y-auto p-3">

          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recent
          </p>


          <div className="space-y-1">

            {conversations.length ===
              0 && (
                <p className="px-3 py-4 text-xs text-slate-400">
                  No conversations yet.
                </p>
              )}


            {conversations.map(
              (
                conversation
              ) => (
                <button
                  key={
                    conversation.id
                  }
                  onClick={() =>
                    void loadConversation(
                      conversation.id
                    )
                  }
                  className={`w-full rounded-xl px-3 py-3 text-left text-sm transition ${
                    activeConversationId ===
                    conversation.id
                      ? "bg-white font-medium text-slate-950 shadow-sm"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200">

                      <Sparkles
                        size={14}
                      />

                    </div>


                    <span className="truncate">

                      {
                        conversation.title
                      }

                    </span>

                  </div>

                </button>
              )
            )}

          </div>

        </div>

      </aside>


      {/* ========================================= */}
      {/* Main Chat */}
      {/* ========================================= */}

      <section className="flex min-w-0 flex-1 flex-col">

        {/* Header */}

        <header className="flex h-16 items-center justify-between border-b border-slate-200 px-5">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">

              <Sparkles
                size={18}
              />

            </div>


            <div>

              <h1 className="text-sm font-semibold text-slate-950">
                NexaAI Assistant
              </h1>


              <div className="flex items-center gap-2">

                <span className="h-2 w-2 rounded-full bg-emerald-500" />

                <span className="text-xs text-slate-500">
                  Online
                </span>

              </div>

            </div>

          </div>


          <select
            value={selectedModel}
            onChange={(event) =>
              setSelectedModel(
                event.target.value
              )
            }
            disabled={isTyping}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >

            <option value="llama3.2:3b">
              Local AI
            </option>

            <option value="gpt-5.6-luna">
              OpenAI (API)
            </option>

            <option value="gpt-5.6-sol">
              Reasoning Model (API)
            </option>

          </select>

        </header>


        {/* ======================================= */}
        {/* Messages */}
        {/* ======================================= */}

        <div className="flex-1 overflow-y-auto px-5 py-8">

          <div className="mx-auto max-w-3xl space-y-8">

            {messages.map(
              (item) => {

                // User message

                if (
                  item.role ===
                  "user"
                ) {
                  return (
                    <div
                      key={
                        item.id
                      }
                      className="flex justify-end gap-4"
                    >

                      <div className="max-w-2xl">

                        <p className="text-right text-sm font-semibold text-slate-950">
                          You
                        </p>


                        <div className="mt-2 whitespace-pre-wrap rounded-2xl rounded-tr-none bg-slate-950 p-4 text-sm leading-7 text-white">

                          {
                            item.content
                          }

                        </div>

                      </div>


                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">

                        <User
                          size={18}
                        />

                      </div>

                    </div>
                  );
                }


                // Assistant message

                return (
                  <div
                    key={
                      item.id
                    }
                    className="flex gap-4"
                  >

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">

                      <Bot
                        size={18}
                      />

                    </div>


                    <div className="max-w-2xl">

                      <div className="flex items-center gap-3">

                        <p className="text-sm font-semibold text-slate-950">
                          NexaAI
                        </p>


                        {item.content && (
                          <button
                            onClick={() =>
                              void copyMessage(
                                item.content
                              )
                            }
                            className="text-slate-400 hover:text-slate-950"
                            title="Copy response"
                          >

                            <Copy
                              size={15}
                            />

                          </button>
                        )}

                      </div>


                      <div className="mt-2 whitespace-pre-wrap rounded-2xl rounded-tl-none bg-slate-100 p-4 text-sm leading-7 text-slate-700">

                        {
                          item.content
                        }

                      </div>

                    </div>

                  </div>
                );
              }
            )}


            {/* Streaming indicator */}

            {isTyping &&
              messages[
                messages.length -
                  1
              ]?.content ===
                "" && (
                <div className="flex gap-4">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">

                    <Bot
                      size={18}
                    />

                  </div>


                  <div className="rounded-2xl rounded-tl-none bg-slate-100 px-5 py-4">

                    <div className="flex items-center gap-1">

                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />

                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{
                          animationDelay:
                            "150ms",
                        }}
                      />

                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{
                          animationDelay:
                            "300ms",
                        }}
                      />

                    </div>

                  </div>

                </div>
              )}


            <div
              ref={
                messagesEndRef
              }
            />

          </div>

        </div>


        {/* ======================================= */}
        {/* Input */}
        {/* ======================================= */}

        <div className="border-t border-slate-200 p-4">

          <div className="mx-auto max-w-3xl">

            <div className="rounded-2xl border border-slate-300 bg-white shadow-sm focus-within:border-slate-500">

              {selectedDocument && (
                <div className="mx-3 mt-3 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">

                  <div className="flex min-w-0 items-center gap-2">

                    <FileText
                      size={16}
                    />

                    <span className="truncate">

                      {
                        selectedDocument.filename
                      }

                    </span>

                    <span className="text-xs text-indigo-500">

                      Ready for document Q&A

                    </span>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDocument(
                        null
                      )
                    }
                    className="ml-2 shrink-0 rounded-md p-1 hover:bg-indigo-100"
                    title="Remove document"
                  >

                    <X
                      size={15}
                    />

                  </button>

                </div>
              )}


              <textarea
                value={
                  message
                }
                onChange={(
                  event
                ) =>
                  setMessage(
                    event.target
                      .value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder="Message NexaAI..."
                rows={3}
                className="w-full resize-none bg-transparent px-4 pt-4 text-sm outline-none placeholder:text-slate-400"
              />


              <div className="flex items-center justify-between px-3 pb-3">

                <div className="flex items-center gap-1">

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      isTyping ||
                      isUploadingDocument
                    }
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Attach document"
                  >

                    {isUploadingDocument ? (
                      <Upload
                        size={18}
                        className="animate-pulse"
                      />
                    ) : (
                      <Paperclip
                        size={18}
                      />
                    )}

                  </button>


                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={
                      handleDocumentChange
                    }
                    className="hidden"
                  />


                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={
                      isTyping ||
                      isUploadingDocument
                    }
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Attach document"
                  >

                    <FileText
                      size={18}
                    />

                  </button>

                </div>


                <button
                  onClick={() =>
                    void sendMessage()
                  }
                  disabled={
                    !message.trim() ||
                    isTyping
                  }
                  className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >

                  Send

                  <Send
                    size={16}
                  />

                </button>

              </div>

            </div>


            <p className="mt-2 text-center text-xs text-slate-400">
              NexaAI can make mistakes. Verify important information.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
}