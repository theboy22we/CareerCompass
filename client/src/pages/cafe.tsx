import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Coffee, 
  Users, 
  Calendar, 
  Star,
  MessageSquare,
  Clock,
  ChefHat,
  Utensils,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  Heart,
  Award
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CafeItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'coffee' | 'food' | 'pastry' | 'special';
  available: boolean;
  rating: number;
  orders: number;
  image?: string;
}

interface CafeOrder {
  id: string;
  items: { item: CafeItem; quantity: number }[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  customerName: string;
  orderTime: string;
  estimatedReady: string;
}

interface CafeEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  capacity: number;
  registered: number;
  type: 'workshop' | 'meetup' | 'special' | 'live-music';
}

export default function Cafe() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<{ item: CafeItem; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [activeTab, setActiveTab] = useState('menu');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch cafe menu
  const { data: menu, isLoading } = useQuery({
    queryKey: ['/api/cafe/menu'],
    refetchInterval: 30000,
  });

  // Fetch current orders
  const { data: orders } = useQuery({
    queryKey: ['/api/cafe/orders'],
    refetchInterval: 5000,
  });

  // Fetch cafe events
  const { data: events } = useQuery({
    queryKey: ['/api/cafe/events'],
  });

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: (orderData: any) => apiRequest('/api/cafe/orders', 'POST', orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cafe/orders'] });
      setCart([]);
      setCustomerName('');
      toast({ title: "Order placed successfully", description: "Your order is being prepared!" });
    },
  });

  // Register for event mutation
  const registerEventMutation = useMutation({
    mutationFn: (data: { eventId: string; customerName: string }) => 
      apiRequest('/api/cafe/events/register', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cafe/events'] });
      toast({ title: "Registration successful", description: "See you at the event!" });
    },
  });

  // Mock data
  const defaultMenu: CafeItem[] = [
    {
      id: 'coffee-1',
      name: 'KLOUD Espresso',
      description: 'Signature dark roast blend with cosmic energy',
      price: 4.50,
      category: 'coffee',
      available: true,
      rating: 4.8,
      orders: 1247
    },
    {
      id: 'coffee-2',
      name: 'TERA Latte',
      description: 'Smooth latte with justice-inspired foam art',
      price: 5.25,
      category: 'coffee',
      available: true,
      rating: 4.9,
      orders: 892
    },
    {
      id: 'food-1',
      name: 'Miner\'s Breakfast',
      description: 'Power breakfast for crypto warriors',
      price: 12.00,
      category: 'food',
      available: true,
      rating: 4.7,
      orders: 445
    },
    {
      id: 'pastry-1',
      name: 'Blockchain Croissant',
      description: 'Layered pastry representing blockchain technology',
      price: 3.75,
      category: 'pastry',
      available: true,
      rating: 4.6,
      orders: 678
    },
    {
      id: 'special-1',
      name: 'AI Smoothie Bowl',
      description: 'Algorithmically optimized nutrition',
      price: 8.50,
      category: 'special',
      available: true,
      rating: 4.8,
      orders: 234
    }
  ];

  const defaultOrders: CafeOrder[] = [
    {
      id: 'order-1',
      items: [{ item: defaultMenu[0], quantity: 2 }],
      total: 9.00,
      status: 'preparing',
      customerName: 'Alex',
      orderTime: '09:15 AM',
      estimatedReady: '09:25 AM'
    }
  ];

  const defaultEvents: CafeEvent[] = [
    {
      id: 'event-1',
      title: 'Crypto Trading Workshop',
      description: 'Learn advanced trading strategies with KLOUD BOT PRO',
      date: '2024-02-15',
      time: '2:00 PM',
      capacity: 25,
      registered: 18,
      type: 'workshop'
    },
    {
      id: 'event-2',
      title: 'AI Ethics Discussion',
      description: 'Community discussion on AI in social justice',
      date: '2024-02-20',
      time: '6:00 PM',
      capacity: 40,
      registered: 32,
      type: 'meetup'
    }
  ];

  const displayMenu = (menu as CafeItem[]) || defaultMenu;
  const displayOrders = (orders as CafeOrder[]) || defaultOrders;
  const displayEvents = (events as CafeEvent[]) || defaultEvents;

  const filteredMenu = selectedCategory === 'all' 
    ? displayMenu 
    : displayMenu.filter((item: CafeItem) => item.category === selectedCategory);

  const cartTotal = cart.reduce((sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity), 0);

  const addToCart = (item: CafeItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.item.id === item.id);
      if (existing) {
        return prev.map(cartItem => 
          cartItem.item.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    toast({ title: "Added to cart", description: `${item.name} added to your order` });
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0 || !customerName) {
      toast({ title: "Order incomplete", description: "Please add items and enter your name", variant: "destructive" });
      return;
    }
    
    const orderData = {
      items: cart,
      total: cartTotal,
      customerName,
      orderTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    placeOrderMutation.mutate(orderData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Coffee className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <p>Loading KLOUD BUGS Cafe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Coffee className="h-8 w-8 text-amber-500" />
            Tera4-24-72 Justice ai-/KLOUD BUGS Cafe
          </h1>
          <p className="text-muted-foreground">
            Community Space • Cosmic Cuisine • Tech Meetups
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="default" className="text-lg px-3 py-1">
            <Heart className="h-4 w-4 mr-1" />
            Community Hub
          </Badge>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <Award className="h-4 w-4 mr-1" />
            Tech Cafe
          </Badge>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">
              Based on 1,247 reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$847</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="menu">Menu & Orders</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        {/* Menu & Orders Tab */}
        <TabsContent value="menu" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5" />
                      Cafe Menu
                    </CardTitle>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Items</SelectItem>
                        <SelectItem value="coffee">Coffee</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="pastry">Pastries</SelectItem>
                        <SelectItem value="special">Specials</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMenu.map((item: CafeItem) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                          <Badge variant={item.available ? 'default' : 'secondary'}>
                            {item.available ? 'Available' : 'Sold Out'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-bold text-lg">${item.price.toFixed(2)}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Star className="h-3 w-3 fill-current text-yellow-500" />
                              <span>{item.rating}</span>
                              <span>({item.orders} orders)</span>
                            </div>
                          </div>
                          <Button 
                            onClick={() => addToCart(item)}
                            disabled={!item.available}
                            size="sm"
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cart & Orders */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Your Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Your cart is empty</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {cart.map((cartItem, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span>{cartItem.item.name} x{cartItem.quantity}</span>
                            <span>${(cartItem.item.price * cartItem.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between font-bold">
                        <span>Total</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Input
                      placeholder="Your name for the order"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <Button 
                      onClick={handlePlaceOrder}
                      disabled={cart.length === 0 || !customerName || placeOrderMutation.isPending}
                      className="w-full"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {placeOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Current Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayOrders.map((order: CafeOrder) => (
                      <div key={order.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{order.customerName}</span>
                          <Badge variant={
                            order.status === 'ready' ? 'default' :
                            order.status === 'preparing' ? 'secondary' : 'outline'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Ordered: {order.orderTime}</div>
                          <div>Ready: {order.estimatedReady}</div>
                          <div>Total: ${order.total.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayEvents.map((event: CafeEvent) => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{event.title}</CardTitle>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                  <CardDescription>{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Date</div>
                      <div className="font-medium">{event.date}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Time</div>
                      <div className="font-medium">{event.time}</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Registration</span>
                      <span>{event.registered}/{event.capacity}</span>
                    </div>
                    <Progress value={(event.registered / event.capacity) * 100} />
                  </div>

                  <Button 
                    className="w-full"
                    disabled={event.registered >= event.capacity}
                    onClick={() => registerEventMutation.mutate({ eventId: event.id, customerName: 'Guest' })}
                  >
                    {event.registered >= event.capacity ? 'Event Full' : 'Register Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Community Hub
              </CardTitle>
              <CardDescription>
                Connect with fellow crypto enthusiasts and justice advocates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Recent Discussions</h4>
                  {[
                    'Best practices for crypto mining efficiency',
                    'AI ethics in automated trading systems',
                    'Community impact of TERA token projects',
                    'Upcoming justice initiatives for 2024'
                  ].map((topic, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{topic}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Active Members</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['Alex M.', 'Sarah K.', 'Mike R.', 'Lisa T.', 'David W.', 'Emma S.'].map((member, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {member.charAt(0)}
                        </div>
                        <span className="text-sm">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Coffee Sales</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <Progress value={68} />
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Food Orders</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <Progress value={45} />
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Event Attendance</span>
                    <span className="font-medium">82%</span>
                  </div>
                  <Progress value={82} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {defaultMenu.slice(0, 3).map((item: CafeItem, index: number) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.orders} orders</div>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}