import { motion } from "framer-motion";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid, BookmarkIcon, UserIcon, CalendarIcon } from "lucide-react";

export function ProfileTabList() {
  return (
    <TabsList className="w-full grid grid-cols-4 h-14 bg-gradient-to-b from-background to-background/80 border-t border-b border-muted/30 backdrop-blur-sm">
      <TabsTrigger
        value="posts"
        className="relative flex items-center justify-center h-full text-sm font-medium transition-all duration-300 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:bg-muted/20 rounded-none"
      >
        <Grid className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Posts</span>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500"
          initial={false}
          animate={{ scaleX: 0 }}
          transition={{ duration: 0.3 }}
          data-state-active="scaleX: 1"
        />
      </TabsTrigger>
      <TabsTrigger
        value="thread"
        className="relative flex items-center justify-center h-full text-sm font-medium transition-all duration-300 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:bg-muted/20 rounded-none"
      >
        <CalendarIcon className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Thread</span>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500"
          initial={false}
          animate={{ scaleX: 0 }}
          transition={{ duration: 0.3 }}
          data-state-active="scaleX: 1"
        />
      </TabsTrigger>
      <TabsTrigger
        value="saved"
        className="relative flex items-center justify-center h-full text-sm font-medium transition-all duration-300 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:bg-muted/20 rounded-none"
      >
        <BookmarkIcon className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Saved</span>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500"
          initial={false}
          animate={{ scaleX: 0 }}
          transition={{ duration: 0.3 }}
          data-state-active="scaleX: 1"
        />
      </TabsTrigger>
      <TabsTrigger
        value="tagged"
        className="relative flex items-center justify-center h-full text-sm font-medium transition-all duration-300 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:bg-muted/20 rounded-none"
      >
        <UserIcon className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Tagged</span>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-purple-500"
          initial={false}
          animate={{ scaleX: 0 }}
          transition={{ duration: 0.3 }}
          data-state-active="scaleX: 1"
        />
      </TabsTrigger>
    </TabsList>
  );
}
