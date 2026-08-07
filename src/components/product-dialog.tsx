"use client";

import * as React from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ProductDialog({
  open,
  onOpenChange,
  cloudId,
  cloudName,
  product,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cloudId: string;
  cloudName: string;
  /** Passing a product switches the dialog into edit mode. */
  product?: Product;
}) {
  const { addProduct, updateProduct } = useStore();
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
  }, [open, product]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (product) {
      updateProduct(product.id, { name: trimmed });
      toast.success("Product updated");
    } else {
      addProduct({ cloudId, name: trimmed });
      toast.success(`Added ${trimmed} to ${cloudName}`);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{product ? "Edit product" : `New product in ${cloudName}`}</DialogTitle>
            <DialogDescription>
              A product is the thing you are running ads for inside this cloud.
            </DialogDescription>
          </DialogHeader>

          <div className="py-5">
            <div className="space-y-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Package Protection, Returns, Tracking…"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!name.trim()}>
              {product ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
