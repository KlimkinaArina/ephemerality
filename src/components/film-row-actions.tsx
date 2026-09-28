"use client";

import { Button } from "@/components/ui/button";

export function FilmRowActions({
  onEdit,
  onDelete,
  editLabel = "Изменить",
  deleteLabel = "Удалить",
}: {
  onEdit?: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1 py-2">
      {onEdit ? (
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          {editLabel}
        </Button>
      ) : null}
      <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
        {deleteLabel}
      </Button>
    </div>
  );
}
