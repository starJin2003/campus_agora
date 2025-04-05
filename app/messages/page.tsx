"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import MobileNav from "@/components/mobile-nav"
import ProfileButton from "@/components/profile-button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Message {
  id: string
  senderId: string
  receiverId: string
  text: string
  timestamp: string
  isRead: boolean
}

interface Chat {
  id: string
  userId: string
  userName: string
  userDepartment: string
  itemId: string
  itemTitle: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  type: "selling" | "buying" // 판매 또는 구매 채팅 구분
}

// 모의 데이터
const mockChats: Chat[] = [
  {
    id: "chat1",
    userId: "user1",
    userName: "김학생",
    userDepartment: "컴퓨터공학과",
    itemId: "1",
    itemTitle: "데이터베이스 개론 교재",
    lastMessage: "안녕하세요, 책 상태가 어떤가요?",
    lastMessageTime: "2023-03-20T14:30:00Z",
    unreadCount: 2,
    type: "selling", // 내가 판매하는 물품에 대한 채팅
  },
  {
    id: "chat2",
    userId: "user2",
    userName: "이대학",
    userDepartment: "경영학과",
    itemId: "2",
    itemTitle: "아이패드 프로 11인치 (2021)",
    lastMessage: "네, 내일 3시에 도서관 앞에서 만나요.",
    lastMessageTime: "2023-03-21T09:15:00Z",
    unreadCount: 0,
    type: "buying", // 내가 구매하려는 물품에 대한 채팅
  },
  {
    id: "chat3",
    userId: "user3",
    userName: "박기숙",
    userDepartment: "건축학과",
    itemId: "3",
    itemTitle: "책상 의자",
    lastMessage: "가격 조금만 더 낮춰주실 수 있나요?",
    lastMessageTime: "2023-03-19T16:45:00Z",
    unreadCount: 1,
    type: "selling",
  },
  {
    id: "chat4",
    userId: "user4",
    userName: "최통계",
    userDepartment: "통계학과",
    itemId: "4",
    itemTitle: "통계학 개론 교재",
    lastMessage: "책 상태가 어떤가요?",
    lastMessageTime: "2023-03-18T11:30:00Z",
    unreadCount: 0,
    type: "selling",
  },
  {
    id: "chat5",
    userId: "user5",
    userName: "정자전",
    userDepartment: "체육교육과",
    itemId: "5",
    itemTitle: "자전거 (삼천리 하이브리드)",
    lastMessage: "직거래 가능하신가요?",
    lastMessageTime: "2023-03-17T16:20:00Z",
    unreadCount: 0,
    type: "buying",
  },
  {
    id: "chat6",
    userId: "user6",
    userName: "한코딩",
    userDepartment: "소프트웨어학과",
    itemId: "6",
    itemTitle: "프로그래밍 언어론 교재",
    lastMessage: "내일 만나서 거래 가능할까요?",
    lastMessageTime: "2023-03-16T09:45:00Z",
    unreadCount: 0,
    type: "buying",
  },
]

// 모의 메시지 데이터 생성 함수
const getMockMessages = (chatId: string): Message[] => {
  // 구매 채팅인 경우 (내가 먼저 메시지를 보냄)
  if (chatId === "chat2" || chatId === "chat5" || chatId === "chat6") {
    return [
      {
        id: "msg1",
        senderId: "me",
        receiverId: chatId === "chat2" ? "user2" : chatId === "chat5" ? "user5" : "user6",
        text: `안녕하세요, ${
          chatId === "chat2" ? "아이패드 프로" : chatId === "chat5" ? "자전거" : "프로그래밍 언어론 교재"
        }에 관심이 있습니다. 혹시 아직 판매 중인가요?`,
        timestamp: "2023-03-20T14:20:00Z",
        isRead: true,
      },
      {
        id: "msg2",
        senderId: chatId === "chat2" ? "user2" : chatId === "chat5" ? "user5" : "user6",
        receiverId: "me",
        text: "네, 안녕하세요! 아직 판매 중입니다. 어떤 점이 궁금하신가요?",
        timestamp: "2023-03-20T14:25:00Z",
        isRead: true,
      },
    ].concat(
      chatId === "chat2"
        ? [
            {
              id: "msg3",
              senderId: "me",
              receiverId: "user2",
              text: "아이패드 상태는 어떤가요? 스크래치가 있나요?",
              timestamp: "2023-03-20T14:30:00Z",
              isRead: true,
            },
            {
              id: "msg4",
              senderId: "user2",
              receiverId: "me",
              text: "스크래치 없고 상태 좋습니다. 내일 시간 되시나요?",
              timestamp: "2023-03-20T14:35:00Z",
              isRead: true,
            },
            {
              id: "msg5",
              senderId: "me",
              receiverId: "user2",
              text: "네, 내일 3시에 도서관 앞에서 만나요.",
              timestamp: "2023-03-21T09:15:00Z",
              isRead: true,
            },
          ]
        : chatId === "chat5"
          ? [
              {
                id: "msg3",
                senderId: "me",
                receiverId: "user5",
                text: "직거래 가능하신가요?",
                timestamp: "2023-03-17T16:20:00Z",
                isRead: true,
              },
            ]
          : [
              {
                id: "msg3",
                senderId: "me",
                receiverId: "user6",
                text: "내일 만나서 거래 가능할까요?",
                timestamp: "2023-03-16T09:45:00Z",
                isRead: true,
              },
            ],
    )
  }

  // 판매 채팅인 경우 (상대방이 먼저 메시지를 보냄)
  const baseMessages: Message[] = [
    {
      id: "msg1",
      senderId: chatId === "chat1" ? "user1" : chatId === "chat3" ? "user3" : "user4",
      receiverId: "me",
      text:
        "안녕하세요, 판매 중인 " +
        (chatId === "chat1" ? "데이터베이스 개론 교재" : chatId === "chat3" ? "책상 의자" : "통계학 개론 교재") +
        "에 관심이 있습니다.",
      timestamp: "2023-03-20T14:20:00Z",
      isRead: true,
    },
    {
      id: "msg2",
      senderId: "me",
      receiverId: chatId === "chat1" ? "user1" : chatId === "chat3" ? "user3" : "user4",
      text: "네, 안녕하세요! 어떤 점이 궁금하신가요?",
      timestamp: "2023-03-20T14:25:00Z",
      isRead: true,
    },
  ]

  if (chatId === "chat1") {
    baseMessages.push({
      id: "msg3",
      senderId: "user1",
      receiverId: "me",
      text: "책 상태가 어떤가요? 필기나 밑줄이 많이 있나요?",
      timestamp: "2023-03-20T14:30:00Z",
      isRead: false,
    })
  } else if (chatId === "chat3") {
    baseMessages.push({
      id: "msg3",
      senderId: "user3",
      receiverId: "me",
      text: "가격 조금만 더 낮춰주실 수 있나요?",
      timestamp: "2023-03-19T16:45:00Z",
      isRead: false,
    })
  } else if (chatId === "chat4") {
    baseMessages.push({
      id: "msg3",
      senderId: "user4",
      receiverId: "me",
      text: "책 상태가 어떤가요?",
      timestamp: "2023-03-18T11:30:00Z",
      isRead: true,
    })
  }

  return baseMessages
}

export default function MessagesPage() {
  const { toast } = useToast()
  const [chats, setChats] = useState<Chat[]>([])
  const [filteredChats, setFilteredChats] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatFilter, setChatFilter] = useState<"all" | "selling" | "buying">("all")
  const [isSending, setIsSending] = useState(false) // 메시지 전송 중 상태 추가
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatListRef = useRef<HTMLDivElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)

  // 채팅 목록 불러오기
  useEffect(() => {
    // 로컬 스토리지에서 저장된 채팅 목록 가져오기
    try {
      const storedChats = JSON.parse(localStorage.getItem("chats") || "[]")
      const allChats = [...mockChats, ...storedChats]
      setChats(allChats)

      // 로컬 스토리지에서 선택된 채팅 ID 가져오기
      const storedSelectedChatId = localStorage.getItem("selectedChatId")
      if (storedSelectedChatId) {
        setSelectedChatId(storedSelectedChatId)
        // 사용 후 삭제
        localStorage.removeItem("selectedChatId")
      }
    } catch (error) {
      console.error("Failed to load chats:", error)
      setChats(mockChats)
    }
  }, [])

  // 필터에 따라 채팅 목록 필터링
  useEffect(() => {
    if (chatFilter === "all") {
      setFilteredChats(chats)
    } else {
      setFilteredChats(chats.filter((chat) => chat.type === chatFilter))
    }
  }, [chats, chatFilter])

  // 채팅방 선택 시 메시지 불러오기
  useEffect(() => {
    if (selectedChatId) {
      // 로컬 스토리지에서 메시지 가져오기 시도
      try {
        const storedMessages = JSON.parse(localStorage.getItem(`messages_${selectedChatId}`) || "[]")
        if (storedMessages.length > 0) {
          setMessages(storedMessages)
        } else {
          // 저장된 메시지가 없으면 모의 데이터 사용
          const chatMessages = getMockMessages(selectedChatId)
          setMessages(chatMessages)
          // 모의 메시지 저장
          localStorage.setItem(`messages_${selectedChatId}`, JSON.stringify(chatMessages))
        }
      } catch (error) {
        console.error("Failed to load messages:", error)
        const chatMessages = getMockMessages(selectedChatId)
        setMessages(chatMessages)
      }

      // 읽음 처리
      setChats((prevChats) =>
        prevChats.map((chat) => (chat.id === selectedChatId ? { ...chat, unreadCount: 0 } : chat)),
      )
    }
  }, [selectedChatId])

  // 메시지 로드 후 스크롤 아래로
  useEffect(() => {
    if (messagesEndRef.current && messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight
    }
  }, [messages])

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || null

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChatId || isSending) return

    setIsSending(true) // 전송 중 상태로 변경

    // 새 메시지 추가
    const newMsg: Message = {
      id: `msg${Date.now()}`,
      senderId: "me",
      receiverId: selectedChat?.userId || "",
      text: newMessage,
      timestamp: new Date().toISOString(),
      isRead: false,
    }

    const updatedMessages = [...messages, newMsg]
    setMessages(updatedMessages)

    // 로컬 스토리지에 메시지 저장
    localStorage.setItem(`messages_${selectedChatId}`, JSON.stringify(updatedMessages))

    // 채팅 목록 업데이트
    const updatedChats = chats.map((chat) =>
      chat.id === selectedChatId
        ? {
            ...chat,
            lastMessage: newMessage,
            lastMessageTime: new Date().toISOString(),
          }
        : chat,
    )
    setChats(updatedChats)

    // 로컬 스토리지에 채팅 목록 저장
    const storedChats = JSON.parse(localStorage.getItem("chats") || "[]")
    const existingChatIndex = storedChats.findIndex((chat: Chat) => chat.id === selectedChatId)

    if (existingChatIndex >= 0) {
      storedChats[existingChatIndex] = {
        ...storedChats[existingChatIndex],
        lastMessage: newMessage,
        lastMessageTime: new Date().toISOString(),
      }
    } else {
      const mockChat = mockChats.find((chat) => chat.id === selectedChatId)
      if (mockChat) {
        storedChats.push({
          ...mockChat,
          lastMessage: newMessage,
          lastMessageTime: new Date().toISOString(),
        })
      }
    }

    localStorage.setItem("chats", JSON.stringify(storedChats))

    setNewMessage("")

    // 메시지 전송 후 스크롤 아래로
    setTimeout(() => {
      if (messagesEndRef.current && messageListRef.current) {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight
      }
      setIsSending(false) // 전송 완료 상태로 변경
    }, 100)
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Link>
        <h1 className="text-2xl font-bold">메시지</h1>
        <ProfileButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ height: "calc(100vh - 200px)" }}>
        {/* 채팅 목록 */}
        <div className="md:col-span-1 border rounded-lg flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b bg-muted">
            <h2 className="font-semibold mb-3">채팅 목록</h2>
            <Tabs
              defaultValue="all"
              value={chatFilter}
              onValueChange={(value) => setChatFilter(value as "all" | "selling" | "buying")}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">전체</TabsTrigger>
                <TabsTrigger value="selling">판매</TabsTrigger>
                <TabsTrigger value="buying">구매</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div ref={chatListRef} className="divide-y overflow-y-auto flex-1">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 ${selectedChatId === chat.id ? "bg-muted/50" : ""}`}
                  onClick={() => setSelectedChatId(chat.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {chat.userName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 max-w-[calc(100%-50px)]">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{chat.userName}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatDate(chat.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full mr-1 ${
                            chat.type === "selling" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {chat.type === "selling" ? "판매" : "구매"}
                        </span>
                        <p className="text-sm text-muted-foreground truncate">{chat.itemTitle}</p>
                      </div>
                      <p className="text-sm truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>아직 메시지가 없습니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 채팅 내용 */}
        <div className="md:col-span-2 border rounded-lg flex flex-col h-full overflow-hidden">
          {selectedChat ? (
            <>
              <div className="p-4 border-b bg-muted flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {selectedChat.userName.charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold">{selectedChat.userName}</h2>
                  <div className="flex items-center">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full mr-1 ${
                        selectedChat.type === "selling" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}
                    >
                      {selectedChat.type === "selling" ? "판매" : "구매"}
                    </span>
                    <p className="text-xs text-muted-foreground">{selectedChat.userDepartment}</p>
                  </div>
                </div>
                <Link href={`/items/${selectedChat.itemId}`} className="ml-auto">
                  <Button variant="outline" size="sm">
                    상품 보기
                  </Button>
                </Link>
              </div>

              <div ref={messageListRef} className="p-4 space-y-4 flex-1 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.senderId === "me" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p>{message.text}</p>
                      <div
                        className={`text-xs mt-1 ${
                          message.senderId === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                        } text-right`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="메시지를 입력하세요..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    disabled={isSending}
                  />
                  <Button onClick={handleSendMessage} disabled={isSending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full p-8 text-center text-muted-foreground">
              <div>
                <p className="mb-2">채팅을 선택해주세요</p>
                <p className="text-sm">왼쪽 목록에서 대화할 채팅방을 선택하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <MobileNav />
    </div>
  )
}

