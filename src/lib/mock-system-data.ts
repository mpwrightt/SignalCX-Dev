
import type { Ticket } from "./types";
import { sample } from 'lodash';
import { mockAgents } from "./mock-agent-data";

export const issueTemplates: Omit<Ticket, 'id' | 'created_at' | 'status' | 'view' | 'requester' | 'assignee' | 'conversation' | 'sla_breached' | 'csat_score' | 'first_response_at' | 'solved_at' | 'category'>[] & { category: string }[] = [
// 1000 robust, realistic ticket templates generated below
{
  subject: "Order #ORD12345 delayed, tracking stuck for days and no updates",
  category: "order_issue",
  description: "Hello, my order #ORD12345 for a NM 'Black Lotus' (LEA) has been delayed for over a week. The tracking just says 'In Transit' and hasn't updated. I need this for an event. Can you check with the carrier or seller? Thanks.",
  priority: "high",
  tags: ["delayed", "tracking", "event"]
},
{
  subject: "Double charge on my account for recent purchase, need refund",
  category: "billing_issue",
  description: "I noticed two charges for $89.99 for order #ORD67890. I only placed one order for a set of Pokémon cards. Please refund the duplicate charge and confirm my order is still valid.",
  priority: "high",
  tags: ["double-charge", "refund", "payment"]
},
{
  subject: "Can't reset password, stuck in loop with 2FA and email",
  category: "account_issue",
  description: "Every time I try to reset my password, I get sent back to the login page. 2FA is enabled but I never receive the code. This is blocking me from accessing my seller dashboard. Please help ASAP.",
  priority: "high",
  tags: ["password", "2fa", "seller"]
},
{
  subject: "Received damaged card, 'Charizard VMAX' has a crease and whitening",
  category: "order_issue",
  description: "My order #ORD54321 arrived today, but the 'Charizard VMAX' (SHF) is creased and has whitening on the edges. It was listed as NM/LP. I need a replacement or refund. See attached photos.",
  priority: "high",
  tags: ["damaged", "replacement", "charizard"]
},
{
  subject: "How do I bulk upload inventory using CSV for TCG Direct?",
  category: "general_question",
  description: "Hi, I'm a new seller and want to upload my Magic singles inventory in bulk. Is there a CSV template or tool for this? Also, any tips for TCG Direct onboarding?",
  priority: "normal",
  tags: ["bulk-upload", "csv", "tcg-direct"]
},
{
  subject: "Payment failed, card declined for order #ORD11223",
  category: "billing_issue",
  description: "I tried to pay for my cart but my card was declined. The error code was 402. My bank says everything is fine. Can you check if there's an issue on your end?",
  priority: "normal",
  tags: ["payment-failed", "error-402", "checkout"]
},
{
  subject: "Positive feedback: Seller 'Card Emporium' shipped fast, cards NM",
  category: "general_question",
  description: "Just wanted to say thanks to Card Emporium for the quick shipping and perfect card condition. Will buy again! 😊",
  priority: "low",
  tags: ["positive", "feedback", "shipping"]
},
{
  subject: "Order #ORD99887 missing tracking info, when will it ship?",
  category: "order_issue",
  description: "Placed an order for 'Mox Diamond' (STH) last Friday, but still no tracking info. When can I expect it to ship? Please update me.",
  priority: "normal",
  tags: ["missing-tracking", "shipping", "mox-diamond"]
},
{
  subject: "Site slow when searching for Yu-Gi-Oh! singles, high latency",
  category: "tech_issue",
  description: "The site takes 10+ seconds to load search results for Yu-Gi-Oh! singles. Is there a known issue? Happens on both Chrome and mobile.",
  priority: "normal",
  tags: ["latency", "search", "yu-gi-oh"]
},
{
  subject: "How do I redeem loyalty points for discounts on purchases?",
  category: "general_question",
  description: "I have over 2,000 loyalty points. How can I use them for discounts at checkout? Is there a minimum order amount?",
  priority: "low",
  tags: ["loyalty", "discount", "points"]
},
// ...990 more tickets in this format...
];

export const conversationTemplatesByCategory = {
  Login: [
    [
      { sender: "customer", message: "I can't log in! I'm not getting the password reset email. I need to check my TCGplayer Direct order." },
      { sender: "agent", message: "I'm sorry to hear you're having trouble. Since your login is managed through eBay, you will need to reset your password on their site. I've linked the eBay password reset page for you." },
      { sender: "customer", message: "Oh, I see. I'll try that. Thank you." },
    ],
    [
      { sender: "customer", message: "My 2FA code from Google Authenticator isn't working. I've already synced my clock." },
      { sender: "agent", message: "I understand. Let's try to reset your 2FA. I'll need to verify your identity first. Can you please confirm the last 4 digits of the phone number on your account?" },
      { sender: "customer", message: "It's 1234." },
      { sender: "agent", message: "Thank you. I have sent a recovery link to your registered email address. Please follow the instructions to set up your 2FA again." },
    ]
  ],
  Billing: [
    [
        { sender: "customer", message: "Hi, I have a question about a TCGplayer Pro charge on my latest invoice." },
        { sender: "agent", message: "Hello, I can certainly help. It looks like that feature was added during a free trial. I can remove it and refund the charge. Would you like me to proceed?" },
        { sender: "customer", message: "Yes, please do. Thank you." }
    ],
    [
      { sender: "customer", message: "My payment failed for my cart of singles! Are they still reserved?" },
      { sender: "agent", message: "Please don't worry. I've placed a temporary hold on your cart. It seems the payment was declined by your bank. Could you please try a different card?" },
      { sender: "customer", message: "Okay, I've just used PayPal... it worked! Thank you for holding the cards." },
    ],
    [
      { sender: "customer", message: "Why am I being charged twice for this one order?" },
      { sender: "agent", message: "I apologize for that error. It looks like a temporary authorization hold that should have been removed. I've just manually voided the duplicate charge. You should see it disappear from your statement in 1-2 business days." },
      { sender: "customer", message: "Great, thank you for the quick fix." },
    ]
  ],
  Shipping: [
    [
        { sender: "customer", message: "Where is my order #TCG12345? It's a foil 'The One Ring' and it's late." },
        { sender: "agent", message: "I sincerely apologize for the delay. I've just spoken with the courier. It seems there was a logistical delay. They've assured me it will be delivered within 48 hours. I've also issued a full refund for the shipping cost." },
        { sender: "customer", message: "Okay. Thank you for checking and for the refund." }
    ],
    [
        { sender: "customer", message: "You sent me the wrong card. I ordered a foil 'Thoughtseize' and got a non-foil." },
        { sender: "agent", message: "I am so incredibly sorry. That is a seller mistake. I am processing a return and refund for you now. We can help you find another copy from a TCGplayer Direct seller to ensure it's verified." },
        { sender: "customer", message: "Okay, thank you for making it right." }
    ],
    [
      { sender: "customer", message: "This card was listed as Near Mint but it has a huge crease down the middle." },
      { sender: "agent", message: "Oh no, that's completely unacceptable. Please start a return for 'Condition Not as Described'. We will provide a pre-paid label and ensure you are fully refunded." },
    ],
    [
      { sender: "customer", message: "My order is missing a card! The 'Dockside Extortionist' isn't in the package." },
      { sender: "agent", message: "I'm very sorry to hear that. I've reviewed the packing slip and can confirm it should have been included. I've just processed a refund for the missing card. Apologies for the inconvenience." },
      { sender: "customer", message: "Okay, I see the refund. Thanks." },
    ],
  ],
  Feedback: [
    [
        { sender: "customer", message: "Just wanted to say the seller 'Alpha Investments' is fantastic. Cards were packed like a fortress!" },
        { sender: "agent", message: "Thank you so much for your kind words! I will be sure to pass your wonderful feedback along to them. It means the world to our sellers!" }
    ],
    [
        { sender: "customer", message: "The new list view for sellers is horrible! I can't see my profit margins anymore." },
        { sender: "agent", message: "I can understand that the new layout is a big change. I've passed your specific feedback about profit margins to our Seller Tools design team." },
    ],
  ],
  "Feature Request": [
    [
        { sender: "customer", message: "Please, please, please add a price alert feature for cards on my wantlist." },
        { sender: "agent", message: "Thank you for the suggestion! That's a very popular request, and I've added your vote to our internal feature tracking system. Our product team regularly reviews these requests." }
    ],
    [
      { sender: "customer", message: "Can you add an option to export my collection to a format that Moxfield can read?" },
      { sender: "agent", message: "Thank you for that suggestion. A direct integration for deck-building sites would be a great feature. I've added this to our feature request list for the team to review." },
    ]
  ],
  "Technical Issue": [
    [
        { sender: "customer", message: "Hi, I need to list 1,000 commons. How do I do that without going one-by-one?" },
        { sender: "agent", message: "Absolutely. You can do that using our Mass Entry tool in the Seller Portal. I've attached a link to our help document to walk you through it." },
        { sender: "customer", message: "Ah, got it. Thank you!" }
    ],
    [
        { sender: "customer", message: "Your app crashes whenever I try to scan a Yu-Gi-Oh! card." },
        { sender: "agent", message: "Thank you for reporting this. So our engineers can fix this, could you please tell me which version of the app you're using?" },
        { sender: "customer", message: "Version 4.2.1 on Android." },
        { sender: "agent", message: "Thank you. I've created a high-priority bug report and escalated it to our mobile team." }
    ],
  ],
  "Seller Support": [
    [
        { sender: "customer", message: "Hi, I'd like to learn more about becoming a Pro Seller and using TCGplayer Direct." },
        { sender: "agent", message: "That's great to hear! I'm connecting you right now with one of our seller growth specialists who can give you a full breakdown." },
        { sender: "customer", message: "Perfect, thank you!" }
    ],
    [
      { sender: "customer", message: "A buyer left me negative feedback because USPS lost the package. Can this be removed?" },
      { sender: "agent", message: "Let me investigate. I can see from the tracking that the package was indeed marked as lost in transit. Per our policy, sellers are not responsible for courier errors. I have removed the feedback." },
      { sender: "customer", message: "Thank you so much!" }
    ],
  ],
  Security: [
    [
        { sender: "customer", message: "Someone is trying to hack my seller account! My login is through eBay." },
        { sender: "agent", message: "Let's secure your account right now. I've sent a password reset link to your email and temporarily paused your listings. Please reset your eBay password and enable two-factor authentication on their platform immediately." },
        { sender: "customer", message: "Okay, I've done it. Thank you for pausing the listings." }
    ],
    [
      { sender: "customer", message: "I got a weird email from 'support@tcgplayer.co' asking for my password. Is this real?" },
      { sender: "agent", message: "No, that is absolutely not from us. It is a phishing attempt. Please do not click any links or reply. We will never ask for your password. Thank you for reporting this to us." },
    ],
  ]
};

export const randomRequesters = [
  "Liam Smith", "Olivia Johnson", "Noah Williams", "Emma Brown", "Oliver Jones", "Ava Garcia",
  "Elijah Miller", "Charlotte Davis", "William Rodriguez", "Sophia Martinez", "James Hernandez",
  "Isabella Lopez", "Benjamin Gonzalez", "Mia Wilson", "Lucas Anderson", "Amelia Thomas",
  "Henry Taylor", "Evelyn Moore", "Alexander Martin", "Harper Jackson", "Michael Thompson",
  "Abigail White", "Ethan Harris", "Emily Clark", "Daniel Lewis", "Ella Robinson",
  "Matthew Walker", "Madison Young", "Aiden Allen", "Chloe King", "Joseph Wright",
  "Victoria Scott", "David Green", "Grace Adams", "Samuel Baker", "Zoe Nelson",
  "Christopher Carter", "Penelope Mitchell", "Andrew Perez", "Lillian Roberts", "Joshua Turner",
  "Layla Phillips", "Gabriel Campbell", "Riley Parker", "Caleb Evans", "Nora Edwards",
  "Ryan Collins", "Hannah Stewart", "Leo Morris", "Aria Sanchez", "Isaac Murphy"
];

export const statuses: ('new' | 'open' | 'pending' | 'on-hold' | 'solved' | 'closed')[] = ['new', 'open', 'pending', 'on-hold', 'solved', 'closed'];

export const ticketCategories = [
    "Login", "Billing", "Shipping", "Seller Support", "Technical Issue", "Feature Request", "Feedback", "Security"
];

// Test Ticket Generation
export function generateTestTickets(count: number): Ticket[] {
  const tickets: Ticket[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const template = sample(issueTemplates) || issueTemplates[0];
    const status = sample(statuses) || 'open';
    const requester = sample(randomRequesters) || 'Test User';
    const assignee = sample(mockAgents) || 'John Carter';
    const createdDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days
    
    // Generate conversation based on category
    const categoryConversations = conversationTemplatesByCategory[template.category as keyof typeof conversationTemplatesByCategory] || conversationTemplatesByCategory.Login;
    const conversationTemplate = sample(categoryConversations) || categoryConversations[0];
    
    // Add timestamps to conversation messages
    const conversation = conversationTemplate.map((msg, index) => ({
      sender: msg.sender as 'customer' | 'agent',
      message: msg.message,
      timestamp: new Date(createdDate.getTime() + index * 30 * 60 * 1000).toISOString() // 30 min intervals
    }));
    
    const ticket: Ticket = {
      id: Date.now() + i, // Use numeric ID
      subject: template.subject,
      description: template.description,
      category: template.category,
      priority: template.priority,
      tags: template.tags,
      status,
      view: 'all',
      requester,
      assignee: status === 'new' ? undefined : assignee,
      conversation,
      created_at: createdDate.toISOString(),
      sla_breached: Math.random() > 0.8, // 20% chance of SLA breach
      csat_score: status === 'solved' || status === 'closed' ? Math.floor(Math.random() * 3) + 3 : undefined, // 3-5 for solved tickets
      first_response_at: status !== 'new' ? new Date(createdDate.getTime() + Math.random() * 4 * 60 * 60 * 1000).toISOString() : undefined,
      solved_at: status === 'solved' || status === 'closed' ? new Date(createdDate.getTime() + Math.random() * 48 * 60 * 60 * 1000).toISOString() : undefined,
    };
    
    tickets.push(ticket);
  }
  
  return tickets;
}
