import {
  Button,
  GridList as AriaGridList,
  GridListItem as AriaGridListItem,
  GridListLoadMoreItem as AriaGridListLoadMoreItem,
  Text,
  GridListSection,
  GridListHeader,
  type GridListItemProps,
  type GridListProps,
  type GridListLoadMoreItemProps,
} from "react-aria-components/GridList";
import { Checkbox } from "./Checkbox";
import { GripVertical } from "lucide-react";

import "./GridList.css";

export function GridList<T>({
  children,
  layout = "grid",
  ...props
}: GridListProps<T>) {
  return (
    <AriaGridList {...props} layout={layout}>
      {children}
    </AriaGridList>
  );
}

export function GridListItem({
  children,
  ...props
}: Omit<GridListItemProps, "children"> & {
  children?: React.ReactNode;
}) {
  const textValue = typeof children === "string" ? children : undefined;
  return (
    <AriaGridListItem textValue={textValue} {...props}>
      {({ selectionMode, selectionBehavior, allowsDragging }) => (
        <>
          {/* Add elements for drag and drop and selection. */}
          {allowsDragging && (
            <Button slot="drag">
              <GripVertical size={16} />
            </Button>
          )}
          {selectionMode === "multiple" && selectionBehavior === "toggle" && (
            <Checkbox slot="selection" />
          )}
          {children}
        </>
      )}
    </AriaGridListItem>
  );
}

export function GridListLoadMoreItem(props: GridListLoadMoreItemProps) {
  return <AriaGridListLoadMoreItem {...props}></AriaGridListLoadMoreItem>;
}

export { GridListSection, GridListHeader, Text };
