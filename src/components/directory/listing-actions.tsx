"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  CalendarCheck,
  Check,
  Copy,
  DotsThree,
  EnvelopeSimple,
  Globe,
  NavigationArrow,
  Phone,
  Ticket,
  VideoCamera,
  WhatsappLogo,
  type Icon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { actionRel, type ListingAction, type ListingActionKind } from "@/lib/directory/listing-actions";
import { setStickyActionBarVisible } from "@/lib/directory/sticky-action-bar";

const ICONS: Record<ListingActionKind, Icon> = {
  call: Phone,
  whatsapp: WhatsappLogo,
  website: Globe,
  directions: NavigationArrow,
  email: EnvelopeSimple,
  tickets: Ticket,
  register: CalendarCheck,
  online: VideoCamera,
};

const BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C01F] focus-visible:ring-offset-2";
const PRIMARY = "bg-[#93C01F] text-white hover:bg-[#82ab1b]";
const SECONDARY = "border border-gray-200 bg-white text-gray-800 hover:border-[#93C01F] hover:text-[#5f7f12]";

/** True on devices whose main pointer is a finger, where tel: links dial (spec Q-6). */
function useCanDial(): boolean {
  const [canDial, setCanDial] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const update = () => setCanDial(query.matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return canDial;
}

function ActionContent({ action }: { action: ListingAction }) {
  const IconComponent = ICONS[action.kind];
  return (
    <>
      <IconComponent className="h-5 w-5 shrink-0" weight="fill" aria-hidden="true" />
      <span>{action.label}</span>
      {action.external && <span className="sr-only">(opens in a new tab)</span>}
    </>
  );
}

/** Desktop "Call": show the number with a copy button instead of a tel: link that can't dial. */
function CallReveal({ action, className }: { action: ListingAction; className: string }) {
  const [copied, setCopied] = useState(false);
  const number = action.phone ?? action.href.replace(/^tel:/, "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the number.");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={className}>
          <ActionContent action={action} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div className="flex items-center gap-3">
          <a href={action.href} className="text-base font-semibold text-gray-900 hover:underline">
            {number}
          </a>
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ActionButton({
  action,
  primary,
  disabled,
  canDial,
  className,
}: {
  action: ListingAction;
  primary: boolean;
  disabled: boolean;
  canDial: boolean;
  className?: string;
}) {
  const classes = cn(BASE, primary ? PRIMARY : SECONDARY, className);

  // Preview mode: shown so the owner sees the layout, but never navigates.
  if (disabled) {
    return (
      <span className={cn(classes, "cursor-default opacity-90")} aria-disabled="true">
        <ActionContent action={action} />
      </span>
    );
  }

  if (action.kind === "call" && !canDial) return <CallReveal action={action} className={classes} />;

  return (
    <a
      href={action.href}
      className={classes}
      target={action.external ? "_blank" : undefined}
      rel={actionRel(action)}
    >
      <ActionContent action={action} />
    </a>
  );
}

/** Overflow menu. "Call" shows the number in its label, so it also works where tel: can't dial. */
function MoreActions({ actions, disabled }: { actions: ListingAction[]; disabled: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn(BASE, SECONDARY, "px-3")} aria-label="More ways to get in touch">
          <DotsThree className="h-5 w-5" weight="bold" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">More</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {actions.map((action) => {
          const IconComponent = ICONS[action.kind];
          return (
            <DropdownMenuItem key={action.kind} asChild disabled={disabled}>
              <a
                href={disabled ? undefined : action.href}
                target={action.external ? "_blank" : undefined}
                rel={actionRel(action)}
                className="flex cursor-pointer items-center gap-2 py-2"
              >
                <IconComponent className="h-4 w-4 text-gray-500" weight="fill" aria-hidden="true" />
                {action.kind === "call" && action.phone ? `Call ${action.phone}` : action.label}
                {action.external && <span className="sr-only">(opens in a new tab)</span>}
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * A row of listing actions: up to `max` buttons, the rest under "More".
 * The first action is the primary (filled) button.
 */
export function ListingActionBar({
  actions,
  max = 3,
  disabled = false,
  className,
  fill = false,
}: {
  actions: ListingAction[];
  max?: number;
  disabled?: boolean;
  className?: string;
  /** Stretch buttons to share the row (mobile rows and the sticky bar). */
  fill?: boolean;
}) {
  const canDial = useCanDial();
  if (actions.length === 0) return null;

  const visible = actions.length > max ? actions.slice(0, max - 1) : actions;
  const overflow = actions.length > max ? actions.slice(max - 1) : [];

  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="group" aria-label="Get in touch">
      {visible.map((action, index) => (
        <ActionButton
          key={action.kind}
          action={action}
          primary={index === 0}
          disabled={disabled}
          canDial={canDial}
          className={fill ? "flex-1 basis-0" : undefined}
        />
      ))}
      {overflow.length > 0 && <MoreActions actions={overflow} disabled={disabled} />}
    </div>
  );
}

/**
 * Mobile-only bar pinned to the bottom of the screen once `anchorRef` (the header's
 * action row) scrolls out of view. Reserves page padding while shown so it never
 * covers content or focus (WCAG 2.4.11), and tells the WhatsApp floater to step aside.
 */
export function StickyListingActions({
  actions,
  anchorRef,
  disabled = false,
}: {
  actions: ListingAction[];
  anchorRef: RefObject<HTMLElement | null>;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || actions.length === 0) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    const observer = new IntersectionObserver(([entry]) => {
      // Only once the row has scrolled *above* the viewport, not before it is reached.
      setShow(mobile.matches && !entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorRef, actions.length]);

  useEffect(() => {
    setStickyActionBarVisible(show);
    const height = show ? (barRef.current?.offsetHeight ?? 0) : 0;
    document.body.style.paddingBottom = height ? `${height}px` : "";
    return () => {
      setStickyActionBarVisible(false);
      document.body.style.paddingBottom = "";
    };
  }, [show]);

  if (actions.length === 0) return null;

  return (
    <div
      ref={barRef}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-3 pt-3 backdrop-blur md:hidden",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "motion-safe:transition-transform motion-safe:duration-200",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      aria-hidden={!show}
      inert={!show}
      data-testid="sticky-listing-actions"
    >
      <ListingActionBar actions={actions} max={2} disabled={disabled} fill />
    </div>
  );
}

/** Closing "Get in touch" card after "What we do", on every listing (decision C-6). */
export function GetInTouchCard({
  name,
  actions,
  disabled = false,
  children,
}: {
  name: string;
  actions: ListingAction[];
  disabled?: boolean;
  children?: ReactNode;
}) {
  if (actions.length === 0) return null;
  return (
    <section aria-labelledby="get-in-touch-heading" className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 id="get-in-touch-heading" className="text-lg font-semibold text-gray-900">
        Get in touch
      </h2>
      <p className="mt-1 text-sm text-gray-500">Contact {name} directly.</p>
      {children}
      <ListingActionBar actions={actions} max={4} disabled={disabled} className="mt-4" />
    </section>
  );
}
