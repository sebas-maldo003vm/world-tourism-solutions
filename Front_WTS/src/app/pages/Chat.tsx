import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { mockConversations, mockMessages } from '../Services/mockData';
import { Send, Paperclip, MoreVertical, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Chat() {
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [messageText, setMessageText] = useState('');
  const [showChat, setShowChat] = useState(false);

  const [showSupport, setShowSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [serviceName, setServiceName] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setMessageText('');
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      
      {/* Top Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Mensajes</h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* Conversations List */}
        <div className={`${showChat ? 'hidden md:block' : 'block'} w-full md:w-80 border-r bg-white flex flex-col`}>
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Mensajes</h2>
          </div>

          <ScrollArea className="flex-1">
            <div className="divide-y">
              {mockConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConversation(conv);
                    setShowChat(true);
                  }}
                  className={`w-full p-4 text-left hover:bg-gray-50 ${
                    selectedConversation.id === conv.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between mb-1">
                    <h3 className="font-semibold text-sm">{conv.serviceName}</h3>
                    <span className="text-xs text-gray-500">{conv.timestamp}</span>
                  </div>

                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <div className="ml-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                        {conv.unread}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">

          {/* Chat Header */}
          <div className="p-4 border-b flex justify-between">
            <div>
              <h2 className="font-semibold">{selectedConversation.serviceName}</h2>
              <p className="text-sm text-gray-600">Responde generalmente en minutos</p>
            </div>

            <div className="flex gap-2">
              
              <Button
                onClick={() => setShowSupport(true)}
                className="rounded-full bg-red-100 hover:bg-red-200 text-red-600"
              >
                Soporte
              </Button>

              <Button variant="outline" size="sm" className="rounded-full">
                Ir a reserva
              </Button>

              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {showSupport ? (

              <div className="max-w-md mx-auto">
                <Card>
                  <CardContent className="p-6 space-y-8">

                    <h2 className="text-xl font-semibold text-center">
                      Soporte
                    </h2>

                    
                    <Input
                      placeholder="Describe tu solicitud..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                    />

                    <div className="flex gap-2 flex items-center justify-center px-4" >
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowSupport(false)}
                      >
                        Cancelar
                      </Button>
<div  className="space-y-2">
                      <Button
                        className="w-full bg-red-500 hover:bg-red-600"
                        onClick={() => {
                          alert('Soporte enviado ');
                          setShowSupport(false);
                          setSupportMessage('');
                          setServiceName('');
                        }}
                      >
                        Enviar
                      </Button>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>

            ) : (

              <div className="space-y-4">
                {mockMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md rounded-2xl px-4 py-2 ${
                        message.isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p>{message.text}</p>
                      <span className="text-xs block mt-1">
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            )}
          </ScrollArea>

          {/* INPUT */}
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">

              <Button type="button" variant="ghost" size="icon">
                <Paperclip className="h-5 w-5 text-gray-600" />
              </Button>

              <Input
                disabled={showSupport}
                placeholder="Escribe un mensaje..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 rounded-full"
              />

              <Button
                type="submit"
                size="icon"
                className="rounded-full bg-blue-600 hover:bg-blue-700"
                disabled={showSupport}
              >
                <Send className="h-4 w-4" />
              </Button>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}