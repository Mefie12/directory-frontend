"use client";

import { useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  saving: boolean;
  onStayAndSave: () => void;
  onDiscard: () => void;
  onLeave: () => void;
  onCancel: () => void;
}

export function ListingDirtyGuard({ open, saving, onStayAndSave, onDiscard, onLeave, onCancel }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save your changes?</AlertDialogTitle>
          <AlertDialogDescription>
            This step contains changes that have not been saved yet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-between">
          <AlertDialogCancel onClick={onCancel}>Keep editing</AlertDialogCancel>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={onDiscard} disabled={saving}>Discard</Button>
            <Button type="button" variant="ghost" onClick={onLeave} disabled={saving}>Leave without saving</Button>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); onStayAndSave(); }} disabled={saving}>
              {saving ? "Saving…" : "Stay and save"}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useBeforeUnloadWhenDirty(dirty: boolean) {
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}
