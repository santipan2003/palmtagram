// User types
export interface User {
  name: string;
  username: string;
  avatar: string;
}

export interface ProfileUser extends User {
  bio: string;
  website: string;
  location: string;
  followers: number;
  following: number;
  posts: number;
}

// Post types
export interface Post {
  id: number;
  user: User;
  content: string;
  image: string | null;
  likes: number;
  comments: number;
  time: string;
}

// Comment type
export interface Comment {
  username: string;
  avatar: string;
  text: string;
  time: string;
}

// Profile Post type
export interface ProfilePost {
  id: number;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  time: string;
  commentData: Comment[];
}

// Conversation types
export interface Conversation {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  lastMessage: string;
  time: string;
  unread: number;
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "other";
  time: string;
}

// Notification types
export interface Notification {
  id: number;
  type: "like" | "comment" | "follow" | "mention";
  user: {
    name: string;
    avatar: string;
  };
  content: string;
  time: string;
  read: boolean;
}

// Profile Highlight type
export interface ProfileHighlight {
  id: number;
  title: string;
  cover: string;
}

// Mock data
export const mockPosts: Post[] = [
  {
    id: 1,
    user: {
      name: "Alex Johnson",
      username: "alexj",
      avatar: "/img/avatar1.png",
    },
    content:
      "Just finished a great hiking trip! The views were absolutely breathtaking. #nature #hiking #adventure",
    image: "/img/post1.png",
    likes: 42,
    comments: 5,
    time: "2h ago",
  },
  {
    id: 2,
    user: {
      name: "Sarah Williams",
      username: "sarahw",
      avatar: "/img/avatar2.png",
    },
    content:
      "Working on a new project with the team. Excited to share more details soon! #coding #teamwork",
    image: null,
    likes: 28,
    comments: 3,
    time: "5h ago",
  },
  {
    id: 3,
    user: {
      name: "Mike Chen",
      username: "mikec",
      avatar: "/img/avatar3.png",
    },
    content:
      "Just tried this amazing new restaurant downtown. The food was incredible! Highly recommend checking it out if you're in the area. #foodie #newfinds",
    image: "/img/post2.png",
    likes: 56,
    comments: 8,
    time: "1d ago",
  },
];

export const mockProfileUser: ProfileUser = {
  name: "Alex Johnson",
  username: "alexj",
  avatar: "/img/avatar1.png",
  bio: "Digital creator | Travel enthusiast | Coffee lover",
  website: "alexjohnson.com",
  location: "Bangkok, Thailand",
  followers: 1248,
  following: 567,
  posts: 86,
};

// Standard comments for reuse
const standardComments: Comment[][] = [
  [
    {
      username: "sarahw",
      avatar: "/img/avatar2.png",
      text: "Great photo! Love the composition.",
      time: "1h ago",
    },
    {
      username: "mikec",
      avatar: "/img/avatar3.png",
      text: "This looks amazing! Where was this taken?",
      time: "2h ago",
    },
    {
      username: "emma_d",
      avatar: "/img/avatar4.png",
      text: "Beautiful shot! 😍",
      time: "3h ago",
    },
  ],
  [
    {
      username: "james_w",
      avatar: "/img/avatar5.png",
      text: "Incredible view! I need to visit there.",
      time: "5h ago",
    },
    {
      username: "sarahw",
      avatar: "/img/avatar2.png",
      text: "The colors are so vibrant!",
      time: "6h ago",
    },
  ],
  [
    {
      username: "mikec",
      avatar: "/img/avatar3.png",
      text: "This is absolutely stunning!",
      time: "1d ago",
    },
    {
      username: "emma_d",
      avatar: "/img/avatar4.png",
      text: "Perfect shot at the perfect moment.",
      time: "1d ago",
    },
  ],
];

export const mockProfilePosts: ProfilePost[] = [
  {
    id: 1,
    image: "/img/post1.png",
    caption:
      "Beautiful day hiking in the mountains! The view was breathtaking. #nature #adventure #hiking",
    likes: 128,
    comments: 14,
    time: "1 day ago",
    commentData: standardComments[0],
  },
  {
    id: 2,
    image: "/img/post2.png",
    caption:
      "Exploring the city streets and finding hidden gems. #urbanexploration #citylife #architecture",
    likes: 95,
    comments: 8,
    time: "2 days ago",
    commentData: standardComments[1],
  },
  {
    id: 3,
    image: "/img/post3.png",
    caption:
      "Delicious meal at my favorite restaurant! The chef outdid himself tonight. #foodie #yummy #finedining",
    likes: 142,
    comments: 17,
    time: "3 days ago",
    commentData: standardComments[2],
  },
  {
    id: 4,
    image: "/img/post4.png",
    caption:
      "Beach day with perfect weather. Nothing beats the sound of waves. #beach #ocean #summer",
    likes: 187,
    comments: 22,
    time: "4 days ago",
    commentData: standardComments[0],
  },
  {
    id: 5,
    image: "/img/post5.png",
    caption:
      "Great time with friends last night! Making memories that will last forever. #friends #nightout #memories",
    likes: 156,
    comments: 19,
    time: "5 days ago",
    commentData: standardComments[1],
  },
  {
    id: 6,
    image: "/img/post6.png",
    caption:
      "Visited the new art exhibition downtown. So inspiring! #art #museum #culture",
    likes: 113,
    comments: 11,
    time: "1 week ago",
    commentData: standardComments[2],
  },
  {
    id: 7,
    image: "/img/post7.png",
    caption:
      "Morning workout complete! Starting the day with energy and focus. #fitness #workout #healthylifestyle",
    likes: 98,
    comments: 7,
    time: "1 week ago",
    commentData: standardComments[0],
  },
  {
    id: 8,
    image: "/img/post8.png",
    caption:
      "Finally visited this iconic landmark. It was even more impressive in person! #travel #landmark #bucketlist",
    likes: 201,
    comments: 26,
    time: "2 weeks ago",
    commentData: standardComments[1],
  },
  {
    id: 9,
    image: "/img/post9.png",
    caption:
      "My little buddy enjoying the sunshine. He's always ready for an adventure! #pets #dog #animals",
    likes: 235,
    comments: 31,
    time: "2 weeks ago",
    commentData: standardComments[2],
  },
];

export const mockProfileHighlights: ProfileHighlight[] = [
  {
    id: 1,
    title: "Travel",
    cover: "/img/post_content1.png",
  },
  {
    id: 2,
    title: "Food",
    cover: "/img/post_content2.png",
  },
  {
    id: 3,
    title: "Friends",
    cover: "/img/post_content3.png",
  },
  {
    id: 4,
    title: "Nature",
    cover: "/img/post_content1.png",
  },
  {
    id: 5,
    title: "Memories",
    cover: "/img/post_content2.png",
  },
];

export const mockConversations: Conversation[] = [
  {
    id: "1",
    user: {
      name: "Sarah Williams",
      avatar: "/img/avatar2.png",
    },
    lastMessage: "That sounds great! Let me know when you're free.",
    time: "2m ago",
    unread: 2,
  },
  {
    id: "2",
    user: {
      name: "Mike Chen",
      avatar: "/img/avatar3.png",
    },
    lastMessage: "Did you see the latest project update?",
    time: "1h ago",
    unread: 0,
  },
  {
    id: "3",
    user: {
      name: "Emma Davis",
      avatar: "/img/avatar4.png",
    },
    lastMessage: "Thanks for your help yesterday!",
    time: "1d ago",
    unread: 0,
  },
  {
    id: "4",
    user: {
      name: "James Wilson",
      avatar: "/img/avatar5.png",
    },
    lastMessage: "Are we still meeting tomorrow?",
    time: "2d ago",
    unread: 0,
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 1,
    type: "like",
    user: {
      name: "Sarah Williams",
      avatar: "/img/avatar2.png",
    },
    content: "liked your photo.",
    time: "2m ago",
    read: false,
  },
  {
    id: 2,
    type: "comment",
    user: {
      name: "Mike Chen",
      avatar: "/img/avatar3.png",
    },
    content: 'commented: "Great photo! Where was this taken?"',
    time: "1h ago",
    read: false,
  },
  {
    id: 3,
    type: "follow",
    user: {
      name: "Emma Davis",
      avatar: "/img/avatar4.png",
    },
    content: "started following you.",
    time: "3h ago",
    read: true,
  },
  {
    id: 4,
    type: "mention",
    user: {
      name: "James Wilson",
      avatar: "/img/avatar5.png",
    },
    content: "mentioned you in a comment.",
    time: "5h ago",
    read: true,
  },
  {
    id: 5,
    type: "like",
    user: {
      name: "Olivia Brown",
      avatar: "/img/avatar2.png",
    },
    content: "liked your comment.",
    time: "1d ago",
    read: true,
  },
  {
    id: 6,
    type: "follow",
    user: {
      name: "Daniel Lee",
      avatar: "/img/avatar3.png",
    },
    content: "started following you.",
    time: "2d ago",
    read: true,
  },
  {
    id: 7,
    type: "comment",
    user: {
      name: "Sophia Garcia",
      avatar: "/img/avatar4.png",
    },
    content: "commented on your photo.",
    time: "3d ago",
    read: true,
  },
  {
    id: 8,
    type: "mention",
    user: {
      name: "William Martinez",
      avatar: "/img/avatar5.png",
    },
    content: "mentioned you in a story.",
    time: "10d ago",
    read: true,
  },
];
