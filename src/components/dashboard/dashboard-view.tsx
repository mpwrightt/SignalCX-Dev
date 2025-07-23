
'use client';

import * as React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { AreaChart, Eye, EyeOff, FlaskConical, GripVertical } from "lucide-react";

import { useSettings } from "@/hooks/use-settings";
import type { AuthenticatedUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SortableDashboardItem = ({ 
  id, 
  children, 
  className, 
  isCustomizing,
  visible,
  onToggleVisibility
}: { 
  id: string; 
  children: React.ReactNode; 
  className?: string;
  isCustomizing: boolean;
  visible: boolean;
  onToggleVisibility: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id});

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      className={cn(
        "relative transform-gpu",
        className,
        isCustomizing && !visible && "opacity-40 ring-2 ring-dashed ring-muted-foreground",
        isDragging && "z-50 opacity-80 shadow-2xl scale-[1.03]"
      )}
    >
       {isCustomizing && (
        <div className="absolute top-2 right-2 z-10 flex gap-0.5 bg-background/80 backdrop-blur-sm rounded-md border p-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onToggleVisibility(id)} className="h-6 w-6">
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{visible ? 'Hide' : 'Show'} Component</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" {...listeners} className="h-6 w-6 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Drag to Reorder</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      <div className={cn(isCustomizing && "pointer-events-none select-none")}>
         {children}
      </div>
    </div>
  );
};

const DashboardTabContent = ({
  user,
  tab,
  isCustomizing,
  componentRenderers,
}: {
  user: AuthenticatedUser;
  tab: 'snapshot' | 'trends';
  isCustomizing: boolean;
  componentRenderers: Record<string, React.ReactNode>;
}) => {
  const { settings, updateSettings } = useSettings();
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      const oldComponents = settings.dashboardComponents;
      const oldIndex = oldComponents.findIndex(c => c.id === active.id);
      const newIndex = oldComponents.findIndex(c => c.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
          const activeComponent = oldComponents[oldIndex];
          const overComponent = oldComponents[newIndex];
          const isActiveKpi = activeComponent.type === 'kpi';
          const isOverKpi = overComponent.type === 'kpi';

          if (isActiveKpi !== isOverKpi) return;

          updateSettings({ dashboardComponents: arrayMove(oldComponents, oldIndex, newIndex) });
      }
    }
  }

  const toggleComponentVisibility = (id: string) => {
    const newComponents = settings.dashboardComponents.map(c => 
      c.id === id ? { ...c, visible: !c.visible } : c
    );
    updateSettings({ dashboardComponents: newComponents });
  };
  
  const componentsForTab = settings.dashboardComponents.filter(c => {
    if (c.tab !== tab) return false;
    // Hide agent leaderboard for agents
    if (c.id === 'summary-agent-leaderboard' && user.role !== 'manager') return false;
    return true;
  });

  const kpiComponents = componentsForTab.filter(c => c.type === 'kpi');
  const otherComponents = componentsForTab.filter(c => c.type !== 'kpi');

  const showKpiSection = isCustomizing || kpiComponents.some(c => c.visible);
  const showOtherSection = isCustomizing || otherComponents.some(c => c.visible);

  return (
    <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
      <div className="space-y-8">
        {showKpiSection && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold font-headline tracking-tight">Key Performance Indicators</h2>
            <SortableContext items={kpiComponents.map(c => c.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {kpiComponents.map(component => {
                  if (!isCustomizing && !component.visible) return null;
                  return (
                    <SortableDashboardItem
                      key={component.id}
                      id={component.id}
                      isCustomizing={isCustomizing}
                      visible={component.visible}
                      onToggleVisibility={toggleComponentVisibility}
                    >
                      {componentRenderers[component.id]}
                    </SortableDashboardItem>
                  )
                })}
              </div>
            </SortableContext>
          </div>
        )}

        {showOtherSection && (
          <div className="space-y-4">
             <h2 className="text-xl font-semibold font-headline tracking-tight">Visualizations &amp; Summaries</h2>
            <SortableContext items={otherComponents.map(c => c.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-4">
                {otherComponents.map(component => {
                  if (!isCustomizing && !component.visible) return null;
                  return (
                    <SortableDashboardItem
                      key={component.id}
                      id={component.id}
                      className={cn({
                          'md:col-span-4 lg:col-span-4': component.width === 'full',
                          'md:col-span-2 lg:col-span-2': component.width === 'half',
                      })}
                      isCustomizing={isCustomizing}
                      visible={component.visible}
                      onToggleVisibility={toggleComponentVisibility}
                    >
                      {componentRenderers[component.id]}
                    </SortableDashboardItem>
                  )
                })}
              </div>
            </SortableContext>
          </div>
        )}

        {!isCustomizing && !showKpiSection && !showOtherSection && (
          <Card className="md:col-span-2 lg:col-span-4">
            <CardContent>
              <p className="text-center text-muted-foreground p-8">No components enabled for this tab. Click 'Customize Dashboard' to add some.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DndContext>
  );
}

export const DashboardView = ({
  user,
  activeDashboardTab, 
  setActiveDashboardTab,
  componentRenderers,
}: {
  user: AuthenticatedUser;
  activeDashboardTab: string;
  setActiveDashboardTab: (tab: string) => void;
  componentRenderers: Record<string, React.ReactNode>;
}) => {
  const [isCustomizing, setIsCustomizing] = React.useState(false);

  return (
    <div className="space-y-4">
      <Tabs value={activeDashboardTab} onValueChange={setActiveDashboardTab} className="space-y-4">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          <div className="ml-auto">
            <Button variant={isCustomizing ? "default" : "outline"} onClick={() => setIsCustomizing(!isCustomizing)}>
              {isCustomizing ? 'Done' : 'Customize Dashboard'}
            </Button>
          </div>
        </div>
        <TabsContent value="snapshot">
          <DashboardTabContent 
            user={user}
            tab="snapshot" 
            isCustomizing={isCustomizing} 
            componentRenderers={componentRenderers}
          />
        </TabsContent>
        <TabsContent value="trends">
          <DashboardTabContent 
            user={user}
            tab="trends" 
            isCustomizing={isCustomizing} 
            componentRenderers={componentRenderers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
