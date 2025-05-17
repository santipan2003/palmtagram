import { motion } from "framer-motion";
import { TabsContent } from "@/components/ui/tabs";
import { LucideIcon } from "lucide-react";

interface ProfileEmptyTabProps {
  tabValue: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ProfileEmptyTab({
  tabValue,
  icon: Icon,
  title,
  description,
}: ProfileEmptyTabProps) {
  return (
    <TabsContent value={tabValue} className="mt-6">
      <motion.div
        className="text-center py-16 bg-muted/50 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Icon className="h-12 w-12 mx-auto text-muted-foreground/70" />
        <h3 className="mt-4 text-xl font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {description}
        </p>
      </motion.div>
    </TabsContent>
  );
}
