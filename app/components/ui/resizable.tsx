"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import { Panel, Group } from "react-resizable-panels";
import { cn } from "../../libs/utils";

// -------------------- ResizablePanelGroup --------------------
interface ResizablePanelGroupProps extends React.ComponentProps<typeof Group> {}

const ResizablePanelGroup: React.FC<ResizablePanelGroupProps> = ({ className, ...props }) => (
  <Group
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

// -------------------- ResizablePanel --------------------
const ResizablePanel: React.FC<React.ComponentProps<typeof Panel>> = (props) => <Panel {...props} />;

// -------------------- ResizableHandle --------------------
// For your version, the handle is automatically rendered via Panel
// If you want a custom handle, you can just create a div and style it
const ResizableHandle: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "flex h-full w-1 cursor-col-resize bg-border",
      className
    )}
  >
    <GripVertical className="h-4 w-4 text-gray-500" />
  </div>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
