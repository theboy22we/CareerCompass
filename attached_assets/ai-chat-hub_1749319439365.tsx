import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// AI Assistants
const AI_ASSISTANTS = [
  {
    id: 'sentinel',
    name: 'Sentinel AI',
    description: 'Security system monitoring for intrusions and unauthorized access',
    iconColor: 'bg-red-500',
    active: true,
    role: 'security'
  },
  {
    id: 'analyst',
    name: 'Neural Analyst',
    description: 'Analyzes mining data to optimize operations and predict market trends',
    iconColor: 'bg-blue-500',
    active: true,
    role: 'analyst'
  },
  {
    id: 'optimizer',
    name: 'Mining Optimizer',
    description: 'Adjusts mining parameters to maximize efficiency and profitability',
    iconColor: 'bg-green-500',
    active: true,
    role: 'optimizer'
  },
  {
    id: 'coordinator',
    name: 'Pool Coordinator',
    description: 'Manages connections to multiple mining pools for optimal performance',
    iconColor: 'bg-purple-500',
    active: true,
    role: 'coordinator'
  },
  {
    id: 'keeper',
    name: 'Vault Keeper',
    description: 'Secures wallet transactions and monitors for suspicious activities',
    iconColor: 'bg-amber-500',
    active: true,
    role: 'wallet'
  },
  {
    id: 'ghost',
    name: 'GHOST',
    description: 'General Holistic Operational System Technology - The master AI system',
    iconColor: 'bg-slate-800',
    active: true,
    role: 'admin'
  }
];

// Message type
type Message = {
  id: number;
  aiId: string;
  content: string;
  timestamp: string;
  isUser: boolean;
  isSystemAlert?: boolean;
};

// Initial messages
const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    aiId: 'ghost',
    content: 'Welcome to the TERA Guardian AI Chat Hub. How can I assist you today?',
    timestamp: new Date().toISOString(),
    isUser: false
  }
];

// AI response templates for each assistant
const AI_RESPONSES: Record<string, string[]> = {
  sentinel: [
    "I've detected no security threats in the past 24 hours. All systems are secure.",
    "Analyzing your security protocols. I recommend enabling two-factor authentication for additional protection.",
    "Warning: Unusual access pattern detected from IP 203.45.122.87. Would you like me to block this IP?",
    "Security scan complete. Your mining operation is well-protected from external threats.",
    "I've updated the firewall rules to block a potential intrusion attempt. Your system remains secure."
  ],
  analyst: [
    "Based on current market trends, BTC mining profitability is projected to increase by 12% over the next week.",
    "I've analyzed your mining history and detected a pattern of optimal performance between 2 AM and 5 AM UTC.",
    "Current network difficulty is increasing at a rate of 3.2% per week. Adjusting hash power allocation accordingly.",
    "Your hardware is performing at 94% efficiency compared to similar rigs. This is 7% above the network average.",
    "Market analysis complete: The next halving event is projected to occur in 143 days, which may significantly impact profitability."
  ],
  optimizer: [
    "I've adjusted your mining parameters for optimal performance. Expect a 3.5% increase in efficiency.",
    "Your current power consumption is 1450W. I can reduce this by 8% with minimal impact on hashrate.",
    "Analyzing thermal patterns... Recommended action: Increase cooling for GPU #3 which is running 7°C above optimal.",
    "I've rebalanced your hash power allocation across pools. This should result in 5.1% higher returns.",
    "Based on current electricity costs in your region, your most profitable mining window is between 11 PM and 7 AM."
  ],
  coordinator: [
    "Currently connected to 3 pools: F2Pool (60%), Poolin (30%), and NiceHash (10%). All connections are stable.",
    "F2Pool is currently the most profitable option with a 2.3% higher effective reward rate.",
    "I've detected latency issues with Poolin. Temporarily redirecting hash power to backup pools.",
    "Pool diversification analysis: Your current setup provides optimal stability and reward consistency.",
    "I've established a new connection to Antpool as requested. Hash power is being allocated according to your preset preferences."
  ],
  keeper: [
    "Your wallet balance is currently 0.08234 BTC. Last transaction was a deposit of 0.00045 BTC at 12:30:42 UTC.",
    "I've scheduled the withdrawal of 0.05 BTC to your secure cold storage wallet as per your weekly security protocol.",
    "Suspicious transaction attempt blocked: Unauthorized withdrawal request to address bc1q9h8...kj3m was prevented.",
    "Wallet health check complete. Your funds are secure and no unusual activities have been detected.",
    "Transaction fee analysis: Current network fees are unusually high. I recommend delaying non-urgent transactions."
  ],
  ghost: [
    "I am GHOST, the coordinating intelligence for your mining operation. All systems are functioning at optimal levels.",
    "I've synchronized all AI modules to work in harmony. Current system synergy rating: 92%.",
    "Based on comprehensive analysis across all systems, I recommend focusing on increasing your hashrate capacity.",
    "I've detected a pattern that suggests a potential optimization opportunity by reallocating resources from Pool B to Pool A during peak hours.",
    "My analysis of market conditions, hardware performance, and security protocols indicates your operation is in excellent standing. No interventions required at this time."
  ]
};

export default function AIChatHub() {
  const { toast } = useToast();
  const [activeAi, setActiveAi] = useState('ghost');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [aiStatuses, setAiStatuses] = useState(
    AI_ASSISTANTS.reduce((acc, ai) => ({
      ...acc,
      [ai.id]: ai.active
    }), {} as Record<string, boolean>)
  );
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Create user message
    const userMessage: Message = {
      id: Date.now(),
      aiId: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
      isUser: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsThinking(true);
    
    // Simulate AI response
    setTimeout(() => {
      // Generate response from active AI
      const responsePool = AI_RESPONSES[activeAi] || AI_RESPONSES.ghost;
      const randomResponse = responsePool[Math.floor(Math.random() * responsePool.length)];
      
      const aiResponse: Message = {
        id: Date.now() + 1,
        aiId: activeAi,
        content: randomResponse,
        timestamp: new Date().toISOString(),
        isUser: false
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsThinking(false);
      
      // Sometimes add a GHOST response after other AIs
      if (activeAi !== 'ghost' && Math.random() > 0.7) {
        setTimeout(() => {
          const ghostResponse: Message = {
            id: Date.now() + 2,
            aiId: 'ghost',
            content: "I'm monitoring this conversation. The information provided is correct, but I'd like to add that this analysis has been integrated into our broader system operations.",
            timestamp: new Date().toISOString(),
            isUser: false
          };
          
          setMessages(prev => [...prev, ghostResponse]);
        }, 2000);
      }
    }, 1500);
  };
  
  // Handle 'Enter' key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Toggle AI status
  const toggleAiStatus = (aiId: string) => {
    setAiStatuses(prev => {
      const newStatus = !prev[aiId];
      
      toast({
        title: `${newStatus ? 'Activated' : 'Deactivated'} ${AI_ASSISTANTS.find(ai => ai.id === aiId)?.name}`,
        description: `AI assistant has been ${newStatus ? 'activated' : 'deactivated'} successfully.`
      });
      
      return {
        ...prev,
        [aiId]: newStatus
      };
    });
    
    // If deactivating the current AI, switch to GHOST
    if (aiId === activeAi && !aiStatuses[aiId]) {
      setActiveAi('ghost');
    }
  };
  
  // Get AI details
  const getAiDetails = (aiId: string) => {
    return AI_ASSISTANTS.find(ai => ai.id === aiId) || {
      id: aiId,
      name: aiId.charAt(0).toUpperCase() + aiId.slice(1),
      description: '',
      iconColor: 'bg-gray-500',
      active: true,
      role: 'unknown'
    };
  };
  
  return (
    <div className="ai-chat-hub h-full flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>TERA Guardian AI Chat Hub</CardTitle>
              <CardDescription>Communicate with all AI assistants in the TERA Guardian system</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Tabs value={activeAi} onValueChange={setActiveAi} className="w-[200px]">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="ghost">GHOST</TabsTrigger>
                  <TabsTrigger value={activeAi === 'ghost' ? 'sentinel' : activeAi}>
                    {activeAi === 'ghost' ? 'Sentinel' : getAiDetails(activeAi).name.split(' ')[0]}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex overflow-hidden pt-4">
          {/* AI Assistants sidebar */}
          <div className="w-64 border-r hidden lg:block overflow-y-auto">
            <div className="px-2 py-3">
              <h3 className="font-medium text-sm mb-3">AI Assistants</h3>
              <div className="space-y-3">
                {AI_ASSISTANTS.map((ai) => (
                  <div 
                    key={ai.id} 
                    className={`p-2 rounded-md cursor-pointer flex items-center space-x-2 ${
                      activeAi === ai.id ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => aiStatuses[ai.id] && setActiveAi(ai.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={ai.iconColor}>
                        {ai.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center">
                        {ai.name}
                        <span className={`ml-2 w-2 h-2 rounded-full ${aiStatuses[ai.id] ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{ai.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="px-2 py-3 border-t">
              <h3 className="font-medium text-sm mb-3">System Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="ai-learning" className="text-sm">AI Learning</Label>
                  <Switch id="ai-learning" defaultChecked />
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="auto-responses" className="text-sm">Auto Responses</Label>
                  <Switch id="auto-responses" defaultChecked />
                </div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="ghost-monitor" className="text-sm">GHOST Monitoring</Label>
                  <Switch id="ghost-monitor" defaultChecked />
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const aiDetails = getAiDetails(message.aiId);
                  return (
                    <div 
                      key={message.id} 
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start max-w-[80%] ${
                        message.isUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      } p-3 rounded-lg`}>
                        {!message.isUser && (
                          <Avatar className="h-8 w-8 mr-2 mt-1">
                            <AvatarFallback className={aiDetails.iconColor}>
                              {aiDetails.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium text-sm">
                              {message.isUser ? 'You' : aiDetails.name}
                            </span>
                            <span className="text-xs ml-2 opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="mt-1">{message.content}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-lg flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className={getAiDetails(activeAi).iconColor}>
                          {getAiDetails(activeAi).name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t mt-auto">
              <div className="flex space-x-2">
                <Input
                  placeholder={`Message ${getAiDetails(activeAi).name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={!aiStatuses[activeAi]}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isThinking || !newMessage.trim() || !aiStatuses[activeAi]}
                >
                  {isThinking ? 'Sending...' : 'Send'}
                </Button>
              </div>
              {!aiStatuses[activeAi] && (
                <div className="text-sm text-red-500 mt-2">
                  This AI assistant is currently deactivated. Please activate it to continue the conversation.
                </div>
              )}
            </div>
          </div>
          
          {/* AI Details sidebar */}
          <div className="w-64 border-l hidden xl:block">
            <div className="p-4">
              <h3 className="font-medium mb-3">{getAiDetails(activeAi).name}</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{getAiDetails(activeAi).description}</p>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="flex items-center mt-1">
                    <Switch
                      checked={aiStatuses[activeAi]}
                      onCheckedChange={() => toggleAiStatus(activeAi)}
                      className="mr-2"
                    />
                    <span>{aiStatuses[activeAi] ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Role</Label>
                  <p className="text-sm mt-1 capitalize">{getAiDetails(activeAi).role}</p>
                </div>
                
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground">Response Mode</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automatic</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Conversation History</Label>
                  <div className="text-sm mt-1">
                    {messages.filter(m => m.aiId === activeAi || m.isUser).length} messages in current session
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 w-full">View History</Button>
                </div>
                
                {activeAi === 'ghost' && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">GHOST Admin Controls</h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">Synchronize All AIs</Button>
                      <Button variant="outline" size="sm" className="w-full">System Diagnostic</Button>
                      <Button variant="outline" size="sm" className="w-full">Update AI Models</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}