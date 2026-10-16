import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";

import {
  Send,
  MessageCircle,
  Smartphone,
  LogOut,
  Loader2,
  Wifi,
} from "lucide-react";

import { io } from "socket.io-client";

export default function WhatsApp() {
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] =
    useState([]);

  const [active, setActive] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [text, setText] =
    useState("");

  const [waStatus, setWaStatus] =
    useState("disconnected");

  const [qr, setQr] =
    useState(null);

  const [loadingConnect, setLoadingConnect] =
    useState(false);

  const bottomRef =
    useRef(null);

  /*
  |--------------------------------------------------------------------------
  | Conversations
  |--------------------------------------------------------------------------
  */

  const fetchConversations = async () => {
    try {
      const res = await api.get(
        "/whatsapp/conversations"
      );

      const conversationList =
        res.data.conversations || [];

      setConversations(conversationList);

      const requestedConversationId =
        searchParams.get("conversation");

      setActive((current) => {
        /*
         * If Lead Detail opened WhatsApp with
         * ?conversation=ID, select that conversation.
         */
        if (requestedConversationId) {
          const requestedConversation =
            conversationList.find(
              (item) =>
                String(item._id) ===
                String(requestedConversationId)
            );

          if (requestedConversation) {
            return requestedConversation;
          }
        }

        /*
         * Keep currently selected conversation
         * after conversation list refresh.
         */
        if (current) {
          const updated =
            conversationList.find(
              (item) =>
                item._id === current._id
            );

          return updated || current;
        }

        /*
         * Otherwise select first conversation.
         */
        return (
          conversationList[0] ||
          null
        );
      });
    } catch (error) {
      console.error(
        "[WhatsApp] Conversations fetch failed:",
        error
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | WhatsApp Status
  |--------------------------------------------------------------------------
  */

  const fetchWhatsAppStatus =
    async () => {
      try {
       const res = await api.get("/whatsapp/status", {
  params: {
    _t: Date.now(),
  },
});

        setWaStatus(
          res.data.status ||
            "disconnected"
        );

        setQr(
          res.data.qr ||
            null
        );
      } catch (error) {
        console.error(
          "[WhatsApp] Status fetch failed:",
          error
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Connect WhatsApp
  |--------------------------------------------------------------------------
  */

  const connectWhatsApp =
    async () => {
      try {
        setLoadingConnect(true);
        setQr(null);

        const res =
          await api.post(
            "/whatsapp/connect"
          );

        setWaStatus(
          res.data.status ||
            "connecting"
        );

        setQr(
          res.data.qr ||
            null
        );
      } catch (error) {
        console.error(
          "[WhatsApp] Connect failed:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
            "Unable to connect WhatsApp"
        );
      } finally {
        setLoadingConnect(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Disconnect WhatsApp
  |--------------------------------------------------------------------------
  */

  const disconnectWhatsApp =
    async () => {
      try {
        const confirmed =
          window.confirm(
            "Are you sure you want to disconnect WhatsApp?"
          );

        if (!confirmed) return;

        await api.post(
          "/whatsapp/disconnect"
        );

        setWaStatus(
          "disconnected"
        );

        setQr(null);
      } catch (error) {
        console.error(
          "[WhatsApp] Disconnect failed:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
            "Unable to disconnect WhatsApp"
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Initial Load / URL Conversation
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchConversations();
    fetchWhatsAppStatus();
  }, [searchParams]);

  /*
  |--------------------------------------------------------------------------
  | Socket.IO
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const token =
      localStorage.getItem(
        "hyco_token"
      );

    if (!token) return;

    const socket = io(
      window.location.origin,
      {
        auth: {
          token,
        },
        withCredentials: true,
      }
    );



    /*
     * QR
     */
    socket.on(
      "whatsapp:qr",
      (data) => {
        console.log(
          "[Socket.IO] WhatsApp QR received"
        );

        setQr(data.qr);
        setWaStatus("qr");
      }
    );

    /*
     * Status
     */
    socket.on(
      "whatsapp:status",
      (data) => {
        console.log(
          "[Socket.IO] WhatsApp status:",
          data.status
        );

        setWaStatus(
          data.status
        );

        if (
          data.status ===
          "connected"
        ) {
          setQr(null);
        }

        if (
          data.status ===
          "disconnected"
        ) {
          setQr(null);
        }
      }
    );

    /*
     * Incoming message
     */
    socket.on(
      "whatsapp:message",
      (data) => {
        console.log(
          "[Socket.IO] New WhatsApp message:",
          data
        );

        /*
         * If this message belongs to
         * currently open conversation,
         * add it instantly.
         */
        setActive((current) => {
          if (
            current &&
            data.conversationId ===
              current._id
          ) {
            setMessages((prev) => {
              const exists =
                prev.some(
                  (message) =>
                    message._id ===
                    data.message._id
                );

              if (exists) {
                return prev;
              }

              return [
                ...prev,
                data.message,
              ];
            });
          }

          return current;
        });

        /*
         * Refresh conversation list
         * so latest message appears.
         */
        fetchConversations();
      }
    );

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "[Socket.IO] Connection error:",
          error.message
        );
      }
    );

    socket.on(
      "disconnect",
      () => {
        console.log(
          "[Socket.IO] Disconnected"
        );
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Load Messages
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!active) {
      setMessages([]);
      return;
    }

    api
      .get(
        `/whatsapp/conversations/${active._id}/messages`
      )
      .then((res) => {
        setMessages(
          res.data.messages || []
        );
      })
      .catch((error) => {
        console.error(
          "[WhatsApp] Messages fetch failed:",
          error
        );
      });
  }, [active]);

  /*
  |--------------------------------------------------------------------------
  | Scroll To Bottom
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
  |--------------------------------------------------------------------------
  | Send Message
  |--------------------------------------------------------------------------
  */

  const send = async (e) => {
    e.preventDefault();

    if (
      !text.trim() ||
      !active
    ) {
      return;
    }

    try {
      const res =
        await api.post(
          `/whatsapp/conversations/${active._id}/messages`,
          {
            body: text.trim(),
          }
        );

      
// setMessages((prev) => {
//   const newMessage = res.data.message;

//   if (!newMessage?._id) return prev;

//   const alreadyExists = prev.some(
//     (message) => message._id === newMessage._id
//   );

//   if (alreadyExists) return prev;

//   return [...prev, newMessage];
// });


      setText("");

      fetchConversations();
    } catch (error) {
      alert(
        error.response?.data
          ?.message ||
          "Message could not be sent"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Status UI
  |--------------------------------------------------------------------------
  */

  const isConnected =
    waStatus === "connected";

  const isConnecting =
    waStatus === "connecting" ||
    waStatus === "authenticated";

  return (
    <Layout title="WhatsApp">
      <div className="space-y-4">

        {/* =========================================================
            WhatsApp Connection Card
        ========================================================= */}

        <div className="bg-white rounded-xl2 border border-slate-100 shadow-card px-5 py-4">

          <div className="flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isConnected
                    ? "bg-green-50 text-green-600"
                    : "bg-slate-50 text-slate-500"
                }`}
              >
                {isConnected ? (
                  <Wifi size={19} />
                ) : (
                  <Smartphone size={19} />
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-ink">
                  WhatsApp Web
                </p>

                <p className="text-xs text-muted mt-0.5">
                  {isConnected
                    ? "WhatsApp connected"
                    : waStatus === "qr"
                    ? "Scan QR code from WhatsApp"
                    : isConnecting
                    ? "Connecting..."
                    : "WhatsApp not connected"}
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2">

              {isConnected ? (
                <button
                  onClick={
                    disconnectWhatsApp
                  }
                  className="px-3.5 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={15} />
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={
                    connectWhatsApp
                  }
                  disabled={
                    loadingConnect ||
                    isConnecting
                  }
                  className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-light disabled:opacity-60 flex items-center gap-2"
                >
                  {loadingConnect ||
                  isConnecting ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <Smartphone
                      size={15}
                    />
                  )}

                  {waStatus === "qr"
                    ? "Waiting for Scan"
                    : "Connect WhatsApp"}
                </button>
              )}

            </div>

          </div>

          {/* QR */}

          {waStatus === "qr" &&
            qr && (
              <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col items-center">

                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <img
                    src={qr}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64"
                  />
                </div>

                <p className="text-sm font-medium text-ink mt-4">
                  Scan this QR code
                </p>

                <p className="text-xs text-muted mt-1 text-center">
                  Open WhatsApp on your phone
                  → Linked Devices
                  → Link a Device
                </p>

              </div>
            )}

        </div>

       {/* =========================================================
    Conversations
========================================================= */}

<div className="bg-white rounded-xl2 border border-slate-100 shadow-card overflow-hidden h-[calc(100vh-245px)]">

  <div className="h-full flex">

    {/* =====================================================
        Conversation List
    ===================================================== */}

    <div
      className={`
        w-full md:w-1/3 md:block
        border-r border-slate-100
        overflow-y-auto
        ${active ? "hidden md:block" : "block"}
      `}
    >
      {conversations.map((c) => (
        <button
          key={c._id}
          onClick={() => setActive(c)}
          className={`w-full text-left px-4 py-3.5 border-b border-slate-50 hover:bg-canvas transition-colors ${
            active?._id === c._id ? "bg-canvas" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink truncate">
              {c.contactName || c.lead?.name || c.phone}
            </p>

            <span className="text-[10px] text-muted shrink-0">
              {new Date(c.lastMessageAt).toLocaleDateString()}
            </span>
          </div>

          <p className="text-xs text-muted truncate mt-0.5">
            {c.lastMessagePreview || "No messages yet"}
          </p>
        </button>
      ))}

      {conversations.length === 0 && (
        <div className="p-6 text-center text-sm text-muted">
          No WhatsApp conversations yet.
        </div>
      )}
    </div>

    {/* =====================================================
        Message Thread
    ===================================================== */}

    <div
      className={`
        w-full md:w-2/3
        flex flex-col min-h-0
        ${active ? "flex" : "hidden md:flex"}
      `}
    >
      {active ? (
        <>
          {/* Chat Header */}
          <div className="px-4 md:px-5 py-3.5 border-b border-slate-100 flex items-center gap-2 shrink-0">

            {/* Mobile Back */}
            <button
              type="button"
              onClick={() => setActive(null)}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-canvas hover:text-ink"
              title="Back to conversations"
            >
              ←
            </button>

            <MessageCircle
              size={16}
              className="text-success shrink-0"
            />

            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">
                {active.contactName || active.lead?.name || active.phone}
              </p>

              <p className="text-[11px] text-muted truncate">
                {active.phone}
              </p>
            </div>

          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-5 py-4 space-y-2 bg-canvas">

            {messages.map((m) => (
              <div
                key={m._id}
                className={`max-w-[85%] md:max-w-[70%] px-3.5 py-2 rounded-xl2 text-sm ${
                  m.direction === "out"
                    ? "ml-auto bg-navy text-white"
                    : "bg-white border border-slate-100 text-ink"
                }`}
              >
                {m.body}
              </div>
            ))}

            <div ref={bottomRef} />

          </div>

          {/* Message Input */}
          <form
            onSubmit={send}
            className="flex items-center gap-2 px-3 md:px-4 py-3 border-t border-slate-100 shrink-0"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 min-w-0 px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus-ring"
            />

            <button
              type="submit"
              disabled={!isConnected || !text.trim()}
              className="w-9 h-9 shrink-0 rounded-lg bg-navy text-white flex items-center justify-center hover:bg-navy-light disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </form>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-muted">
          Select a conversation to view messages
        </div>
      )}
    </div>

  </div>
</div>
      </div>
    </Layout>
  );
}