import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Code, 
  Cpu, 
  Zap, 
  Database, 
  Settings, 
  Brain, 
  MessageSquare, 
  Terminal,
  GitBranch,
  Bug,
  Lightbulb,
  Rocket,
  Shield,
  BarChart3,
  Wrench,
  Play,
  Square,
  RefreshCw,
  Wallet,
  Network,
  Activity
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  category?: string;
  codeSnippet?: string;
  apiResult?: any;
}

interface ConversationMemory {
  userPreferences: Record<string, any>;
  conversationHistory: Message[];
  activeProjects: string[];
  knownIssues: string[];
  userGoals: string[];
}

interface APICommand {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  category: string;
  data?: any;
}

interface QuickAction {
  label: string;
  prompt: string;
  category: string;
}

// API Commands available to the AI Assistant
const API_COMMANDS: APICommand[] = [
  // Mining Operations
  { id: 'mining-start', name: 'Start Mining', description: 'Start mining operations', endpoint: '/api/mining/start', method: 'POST', category: 'mining' },
  { id: 'mining-stop', name: 'Stop Mining', description: 'Stop all mining operations', endpoint: '/api/mining/stop', method: 'POST', category: 'mining' },
  { id: 'mining-stats', name: 'Get Mining Stats', description: 'Retrieve current mining statistics', endpoint: '/api/mining/stats/realtime', method: 'GET', category: 'stats' },
  { id: 'mining-settings', name: 'Get Mining Settings', description: 'Retrieve mining configuration', endpoint: '/api/mining/settings', method: 'GET', category: 'mining' },
  
  // Pool Management
  { id: 'pools-list', name: 'List Mining Pools', description: 'Get all configured mining pools', endpoint: '/api/mining/pools', method: 'GET', category: 'pools' },
  { id: 'pool-connect', name: 'Connect to Pool', description: 'Connect to a mining pool', endpoint: '/api/mining/pools/connect', method: 'POST', category: 'pools' },
  { id: 'pool-disconnect', name: 'Disconnect from Pool', description: 'Disconnect from a mining pool', endpoint: '/api/mining/pools/disconnect', method: 'POST', category: 'pools' },
  
  // TERA Guardian System
  { id: 'guardians-list', name: 'List TERA Guardians', description: 'Get all TERA Guardian AI entities', endpoint: '/api/tera/guardians', method: 'GET', category: 'guardian' },
  { id: 'guardian-activate', name: 'Activate Guardian', description: 'Activate a TERA Guardian AI', endpoint: '/api/tera/guardians/activate', method: 'POST', category: 'guardian' },
  
  // Rewards and Wallet
  { id: 'rewards-list', name: 'Get Rewards', description: 'Retrieve mining rewards', endpoint: '/api/mining/rewards', method: 'GET', category: 'rewards' },
  { id: 'wallet-balance', name: 'Check Wallet Balance', description: 'Get current wallet balance', endpoint: '/api/wallet/balance', method: 'GET', category: 'rewards' },
  
  // Hardware Monitoring
  { id: 'hardware-status', name: 'Hardware Status', description: 'Get hardware monitoring data', endpoint: '/api/mining/hardware', method: 'GET', category: 'hardware' },
  { id: 'hardware-optimize', name: 'Optimize Hardware', description: 'Run hardware optimization', endpoint: '/api/mining/hardware/optimize', method: 'POST', category: 'hardware' }
];

// Quick Actions for user convenience
const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Optimize my mining setup', prompt: 'Please analyze my current mining configuration and suggest optimizations for better performance and profitability.', category: 'optimization' },
  { label: 'Check security status', prompt: 'Run a comprehensive security check on my mining operations and highlight any vulnerabilities.', category: 'security' },
  { label: 'Troubleshoot connection issues', prompt: 'I\'m having trouble with my mining pool connections. Can you help diagnose and fix the issues?', category: 'troubleshooting' },
  { label: 'Generate profitability report', prompt: 'Create a detailed profitability analysis based on my current mining setup and market conditions.', category: 'analysis' },
  { label: 'Update mining configurations', prompt: 'Help me update my mining configurations with the latest optimal settings for maximum efficiency.', category: 'configuration' },
  { label: 'Monitor hardware performance', prompt: 'Check my hardware performance metrics and alert me to any issues or optimization opportunities.', category: 'monitoring' }
];

export default function AIAssistant() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [memory, setMemory] = useState<ConversationMemory>({
    userPreferences: {},
    conversationHistory: [],
    activeProjects: ['TERA Mining Platform'],
    knownIssues: [],
    userGoals: ['Optimize mining performance', 'Maximize profitability']
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Execute API command mutation
  const executeCommandMutation = useMutation({
    mutationFn: async (command: APICommand) => {
      const options: RequestInit = {
        method: command.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (command.data && command.method !== 'GET') {
        options.body = JSON.stringify(command.data);
      }

      const response = await fetch(command.endpoint, options);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data, command) => {
      toast({
        title: "API Command Executed",
        description: `Successfully executed ${command.name}`,
      });
      
      // Add system message with API result
      const systemMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `API Command "${command.name}" executed successfully. Result: ${JSON.stringify(data, null, 2)}`,
        timestamp: new Date(),
        category: command.category,
        apiResult: data
      };
      
      setMessages(prev => [...prev, systemMessage]);
    },
    onError: (error, command) => {
      toast({
        title: "API Command Failed",
        description: `Failed to execute ${command.name}: ${error.message}`,
        variant: "destructive"
      });
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `Error executing "${command.name}": ${error.message}`,
        timestamp: new Date(),
        category: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  // Password authentication function
  const handlePasswordSubmit = () => {
    if (password === 'kloudbugs5') {
      setIsAuthenticated(true);
      setShowPasswordInput(false);
      setMessages([
        {
          id: '1',
          type: 'assistant',
          content: 'V2 AI Agent activated successfully! I\'m your comprehensive AI assistant with advanced capabilities for mining operations, full-stack development, and system management. I have complete memory of our conversations and can execute API commands. I can help you code entire applications, debug complex issues, optimize mining operations, and provide expert-level assistance. How can I help you today?',
          timestamp: new Date(),
          category: 'general'
        }
      ]);
      toast({
        title: "AI Assistant Activated",
        description: "V2 Agent is now ready with full capabilities",
      });
    } else {
      toast({
        title: "Invalid Password",
        description: "Please enter the correct activation password",
        variant: "destructive"
      });
    }
  };

  // Send message to AI mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          password: 'kloudbugs5',
          capability: 'comprehensive-assistant',
          context: {
            memory,
            recentMessages: messages.slice(-5)
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message to AI');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        category: data.capability || 'general'
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update conversation memory
      setMemory(prev => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, assistantMessage]
      }));
    },
    onError: (error) => {
      toast({
        title: "AI Response Failed",
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsProcessing(true);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Update memory with user message
    setMemory(prev => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, userMessage]
    }));

    // Send to AI
    sendMessageMutation.mutate(inputMessage);
    
    setInputMessage('');
  };

  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt);
  };

  const executeApiCommand = (command: APICommand) => {
    executeCommandMutation.mutate(command);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mining': return <Cpu className="w-4 h-4" />;
      case 'pools': return <Network className="w-4 h-4" />;
      case 'guardian': return <Shield className="w-4 h-4" />;
      case 'rewards': return <Wallet className="w-4 h-4" />;
      case 'stats': return <BarChart3 className="w-4 h-4" />;
      case 'hardware': return <Settings className="w-4 h-4" />;
      default: return <Terminal className="w-4 h-4" />;
    }
  };

  const groupedCommands = API_COMMANDS.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, APICommand[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">
            {isAuthenticated ? 'V2 Agent - Advanced AI with full capabilities' : 'Password protected AI assistant'}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-2">
          <Brain className="w-4 h-4" />
          <span>{isAuthenticated ? 'V2 Agent - Activated' : 'Authentication Required'}</span>
        </Badge>
      </div>

      {/* Password Authentication */}
      {showPasswordInput && !isAuthenticated && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>AI Assistant Activation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the activation password to unlock the V2 AI Agent with advanced capabilities:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Natural conversation with emotional context detection</li>
              <li>• Full memory of conversation history and preferences</li>
              <li>• Multi-language programming expertise</li>
              <li>• Real-time API command execution</li>
              <li>• Complete TERA Guardian integration</li>
              <li>• Full-stack development capabilities</li>
            </ul>
            <div className="space-y-3">
              <Input
                type="password"
                placeholder="Enter activation password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
              />
              <Button onClick={handlePasswordSubmit} className="w-full">
                <Shield className="w-4 h-4 mr-2" />
                Activate AI Assistant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main AI Assistant Interface - Only show when authenticated */}
      {isAuthenticated && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Memory & Quick Actions */}
        <div className="space-y-4">
          {/* Conversation Memory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Memory System</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold">Active Projects</h4>
                <div className="text-xs text-muted-foreground">
                  {memory.activeProjects.map((project, index) => (
                    <div key={index}>• {project}</div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold">User Goals</h4>
                <div className="text-xs text-muted-foreground">
                  {memory.userGoals.map((goal, index) => (
                    <div key={index}>• {goal}</div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold">Conversation History</h4>
                <div className="text-xs text-muted-foreground">
                  {messages.length} messages in current session
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUICK_ACTIONS.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handleQuickAction(action.prompt)}
                >
                  <Rocket className="w-3 h-3 mr-2" />
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="chat" className="space-y-4">
            <TabsList>
              <TabsTrigger value="chat">AI Chat</TabsTrigger>
              <TabsTrigger value="commands">API Commands</TabsTrigger>
            </TabsList>

            <TabsContent value="chat">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>AI Conversation</span>
                    <Badge variant="secondary">Memory Enabled</Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages Area */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.type === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : message.type === 'system'
                                ? 'bg-muted border'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                            {message.category && (
                              <div className="flex items-center space-x-1 mt-2 text-xs opacity-70">
                                {getCategoryIcon(message.category)}
                                <span>{message.category}</span>
                                <span>• {message.timestamp.toLocaleTimeString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Ask me anything about mining, coding, or system management..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="resize-none"
                        rows={2}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isProcessing}
                        className="self-end"
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commands">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Terminal className="w-5 h-5" />
                      <span>Available API Commands</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Execute these commands directly through the AI assistant or run them manually.
                    </p>
                    
                    {Object.entries(groupedCommands).map(([category, commands]) => (
                      <div key={category} className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                          {getCategoryIcon(category)}
                          <span className="capitalize">{category}</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {commands.map((command) => (
                            <Card key={command.id} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{command.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {command.method}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-3">
                                {command.description}
                              </p>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => executeApiCommand(command)}
                                  disabled={executeCommandMutation.isPending}
                                  className="text-xs"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Execute
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      )}
    </div>
  );
}