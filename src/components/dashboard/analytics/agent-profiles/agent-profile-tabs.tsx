import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Tab {
  title: string;
  content: React.ReactNode;
}

interface AgentProfileTabsProps {
  tabs: Tab[];
}

export const AgentProfileTabs: React.FC<AgentProfileTabsProps> = ({ tabs }) => {
  return (
    <Tabs defaultValue={tabs[0].title} className="w-full">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.title} value={tab.title}>
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.title} value={tab.title}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};