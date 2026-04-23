/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Globe, Question, MapPin } from "@phosphor-icons/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BusinessHoursSelector,
  DaySchedule,
} from "@/components/dashboard/listing/business-hours";
import { useListing } from "@/context/listing-form-context";
import { ListingFormHandle } from "@/components/dashboard/listing/types";
import { CountryDropdown, Country } from "@/components/ui/country-dropdown";
import { countries } from "country-data-list";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// --- Mapbox Imports Updated ---
import {
  AddressAutofill,
  AddressMinimap,
  useConfirmAddress,
} from "@mapbox/search-js-react";

// --- Helper function to validate URL (allows without protocol) ---
const isValidUrl = (url: string): boolean => {
  if (!url) return true; // Empty is valid (optional field)
  // Allow URLs with or without protocol
  return /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i.test(url);
};

// --- Helper function to normalize URL (add https:// if missing) ---
const normalizeUrl = (url: string): string => {
  if (!url) return "";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};

// --- Helper function to validate URL (Strict https requirement) ---
const isStrictHttpsUrl = (url: string): boolean => {
  if (!url) return true;
  return (
    url.startsWith("https://") &&
    /^(https:\/\/)([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i.test(url)
  );
};

const convertToHHmm = (time: string | undefined | null): string => {
  if (!time) return "09:00";
  const cleaned = time.trim().toUpperCase();
  const timeMatch = cleaned.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch && !cleaned.includes("AM") && !cleaned.includes("PM")) {
    return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }
  const amPmMatch = cleaned.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1]);
    const minutes = amPmMatch[2];
    const period = amPmMatch[3];
    if (period === "PM" && hours < 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }
  return "09:00";
};

const convertDateToInput = (value: string | undefined | null): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return trimmed.slice(0, 10);
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const convertTimeToInput = (time: string | undefined | null): string => {
  if (!time) return "";
  const cleaned = time.trim().toUpperCase();

  const hhmmss = cleaned.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  if (hhmmss) {
    return `${hhmmss[1].padStart(2, "0")}:${hhmmss[2]}`;
  }

  const hhmm = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    return `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`;
  }

  const amPmMatch = cleaned.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2];
    const period = amPmMatch[3];
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  return "";
};

export const DetailsFormSchema = z
  .object({
    address: z.string().min(1, "Address is required"),
    country: z.string().min(1, "Country is required"),
    city: z.string().min(1, "City is required"),
    google_plus_code: z.string().optional(),
    businessHours: z
      .array(
        z.object({
          day_of_week: z.string(),
          startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
            message: "Format must be HH:mm (24h)",
          }),
          endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
            message: "Format must be HH:mm (24h)",
          }),
          enabled: z.boolean(),
        }),
      )
      .min(1, "Hours are required"),
    // Event-specific fields
    event_price: z.string().optional(),
    event_currency: z.string().optional(),
    event_ticket_url: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.startsWith("https://"), {
        message:
          "URL must start with https:// (e.g., https://www.eventbrite.com/my-event)",
      }),
    event_online_url: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.startsWith("https://"), {
        message:
          "URL must start with https:// (e.g., https://zoom.us/j/123...)",
      }),
    event_start_date: z.string().min(1, "Start date is required"),
    event_end_date: z.string().min(1, "End date is required"),
    event_start_time: z.string().min(1, "Start time is required"),
    event_end_time: z.string().min(1, "End time is required"),
    event_location: z.string().min(1, "Event type is required"),
  })
  .refine(
    (data) => {
      if (data.event_start_date && data.event_end_date) {
        const start = new Date(data.event_start_date);
        const end = new Date(data.event_end_date);
        return end >= start;
      }
      return true;
    },
    {
      message: "End date cannot be earlier than the start date",
      path: ["event_end_date"],
    },
  )
  .refine(
    (data) => {
      // Both can be empty, but if one has a value, the other must also have a value
      const hasPrice = data.event_price && data.event_price.trim() !== "";
      const hasCurrency =
        data.event_currency && data.event_currency.trim() !== "";
      // Allow: both empty, or both have values
      return !((hasPrice && !hasCurrency) || (!hasPrice && hasCurrency));
    },
    {
      message: "Price and currency must both be provided or both be empty",
      path: ["event_price"],
    },
  );

const formTextConfig = {
  business: {
    addressLabel: "Business Address",
    addressPlaceholder: "Enter business address",
    cityLabel: "Business City",
    countryLabel: "Business Country",
    googlePlusCodeLabel: "Google Plus Code",
    subtitle: "Provide the business details below",
  },
  event: {
    addressLabel: "Event Venue Address",
    addressPlaceholder: "Enter event venue address",
    cityLabel: "Event City",
    countryLabel: "Event Country",
    googlePlusCodeLabel: "Google Plus Code",
    subtitle: "Provide the event details below",
  },
  community: {
    addressLabel: "Community Address",
    addressPlaceholder: "Enter community address",
    cityLabel: "Community City",
    countryLabel: "Community Country",
    googlePlusCodeLabel: "Google Plus Code",
    subtitle: "Provide the community details below",
  },
};

export type DetailsFormValues = z.infer<typeof DetailsFormSchema>;

type Props = {
  listingType: "business" | "event" | "community";
  listingSlug: string;
};

export const BusinessDetailsForm = forwardRef<ListingFormHandle, Props>(
  ({ listingType, listingSlug }, ref) => {
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

    // --- Mapbox Confirmation Hook ---
    const { formRef, showConfirm } = useConfirmAddress({
      accessToken: MAPBOX_TOKEN,
    });
    const [minimapFeature, setMinimapFeature] = useState<any>();

    useEffect(() => {
      setMounted(true);
    }, []);

    const form = useForm<DetailsFormValues>({
      resolver: zodResolver(DetailsFormSchema),
      mode: "onChange",
      defaultValues: {
        address: "",
        country: "",
        city: "",
        google_plus_code: "",
        businessHours: [
          {
            day_of_week: "Monday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: true,
          },
          {
            day_of_week: "Tuesday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: true,
          },
          {
            day_of_week: "Wednesday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: true,
          },
          {
            day_of_week: "Thursday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: true,
          },
          {
            day_of_week: "Friday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: true,
          },
          {
            day_of_week: "Saturday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: false,
          },
          {
            day_of_week: "Sunday",
            startTime: "09:00",
            endTime: "17:00",
            enabled: false,
          },
        ],
        // Event-specific default values
        event_price: "",
        event_currency: "",
        event_ticket_url: "",
        event_online_url: "",
        event_start_date: "",
        event_end_date: "",
        event_start_time: "",
        event_end_time: "",
        event_location: "",
      },
    });

    const {
      register,
      setValue,
      watch,
      trigger,
      control,
      reset,
      formState: { errors },
    } = form;
    const { businessDetails, setBusinessDetails } = useListing();
    const [isSaving, setIsSaving] = useState(false);
    // Tracks the backend event record ID so we can use the update endpoint on subsequent saves.
    const [eventId, setEventId] = useState<string | null>(null);
    const currentHours =
      (watch("businessHours") as unknown as DaySchedule[]) || [];
    const text = formTextConfig[listingType];

     const eventLocationType = watch("event_location");
    const selectedCountryName = watch("country");
    const startDateValue = watch("event_start_date");

    const minEndDate = startDateValue || undefined;

    useEffect(() => {
      const loadDetails = async () => {
        const effectiveSlug = listingSlug || searchParams.get("slug");
        if (!effectiveSlug) return;
        try {
          const token = localStorage.getItem("authToken");
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";
          const res = await fetch(
            `${API_URL}/api/listing/${effectiveSlug}/show`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            },
          );
          if (res.ok) {
            const json = await res.json();
            const d = json.data || json;
            const isEvent = (d?.type || listingType) === "event";
            // Capture the event record ID for subsequent saves (update vs create)
            if (isEvent) {
              const eid = d.event?.id ?? d.event_id ?? null;
              if (eid) setEventId(String(eid));
            }
            const mappedHours = form
              .getValues("businessHours")
              .map((defaultDay) => {
                const defaultDayLower = defaultDay.day_of_week.toLowerCase();
                const apiDay = d.opening_hours?.find(
                  (h: any) => h.day_of_week?.toLowerCase() === defaultDayLower,
                );
                return apiDay
                  ? {
                      ...defaultDay,
                      id: apiDay.id,
                      startTime: convertToHHmm(apiDay.open_time),
                      endTime: convertToHHmm(apiDay.close_time),
                      enabled: true,
                    }
                  : { ...defaultDay, enabled: false };
              });
            reset({
              // Event listings use event_* keys from API; non-events use normal address keys.
              address: isEvent
                ? d.event_venue || d.address || d.location?.address || ""
                : d.address || d.location?.address || "",
              city: isEvent
                ? d.event_city || d.city || d.location?.city || ""
                : d.city || d.location?.city || "",
              country: isEvent
                ? d.event_country || d.country || d.location?.country || "Ghana"
                : d.country || d.location?.country || "Ghana",
              google_plus_code:
                d.google_plus_code || d.location?.google_plus_code || "",
              businessHours: mappedHours,
              event_price: d.event_price || "",
              event_currency: d.event_currency || "",
              event_ticket_url: d.event_ticket_url || d.ticket_url || "",
              event_online_url: d.event_online_url || d.online_url || "",
              event_start_date: convertDateToInput(
                d.event_start_date || d.start_date,
              ),
              event_end_date: convertDateToInput(
                d.event_end_date || d.end_date || d.event_start_date || d.start_date,
              ),
              event_start_time: convertTimeToInput(
                d.event_start_time || d.start_time,
              ),
              event_end_time: convertTimeToInput(d.event_end_time || d.end_time),
              event_location: d.event_location || d.event_type || "",
            });
          }
        } catch (err) {
          console.error("Failed to load details:", err);
        }
      };
      loadDetails();
    }, [listingSlug, reset, searchParams, form, listingType]);

    const saveDataToApi = async () => {
      // Only run Mapbox address confirmation when a token is present.
      // Without a token showConfirm() throws, which silently blocks submission.
      if (MAPBOX_TOKEN) {
        const confirmResult = await showConfirm();
        if (confirmResult.type === "change") {
          return false; // User wants to correct the suggested address
        }
      }

      // Skip business hours processing for events
      if (listingType !== "event") {
        const currentValues = form.getValues("businessHours");
        const sanitized = currentValues.map((h) => ({
          ...h,
          startTime: convertToHHmm(h.startTime),
          endTime: convertToHHmm(h.endTime),
        }));
        setValue("businessHours", sanitized);

        const isValid = await trigger([
          "address",
          "country",
          "city",
          "google_plus_code",
          "businessHours",
        ]);
        if (!isValid) {
          if (errors.businessHours) toast.error("Check time formats (HH:mm)");
          return false;
        }
      } else {
        // For events, validate address fields AND event details
        const isValid = await trigger([
          "address",
          "country",
          "city",
          "google_plus_code",
          "event_start_date",
          "event_end_date",
          "event_start_time",
          "event_end_time",
          "event_location",
        ]);
        if (!isValid) {
          return false;
        }
      }

      const effectiveSlug = listingSlug || searchParams.get("slug");
      if (!effectiveSlug) {
        return false;
      }
      const token = localStorage.getItem("authToken");
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

      try {
        setIsSaving(true);
        const data = form.getValues();
        // Build payload based on listing type - events need different field names
        const detailsPayload: Record<string, unknown> = {};

        if (listingType === "event") {
          // For events: use event-specific field names and EXCLUDE google_plus_code
          detailsPayload.event_venue = data.address;
          detailsPayload.event_city = data.city;
          detailsPayload.event_country = data.country;

          // Add event-specific fields
          detailsPayload.event_price = data.event_price;
          detailsPayload.event_currency = data.event_currency;
          detailsPayload.event_ticket_url = normalizeUrl(
            data.event_ticket_url || "",
          );
          detailsPayload.event_online_url = normalizeUrl(
            data.event_online_url || "",
          );
          detailsPayload.event_start_date = data.event_start_date;
          detailsPayload.event_end_date = data.event_end_date;
          detailsPayload.event_start_time = data.event_start_time;
          detailsPayload.event_end_time = data.event_end_time;
          detailsPayload.event_location = data.event_location;
        } else {
          // For business/community: use standard field names including google_plus_code
          detailsPayload.address = data.address;
          detailsPayload.city = data.city;
          detailsPayload.country = data.country;
          detailsPayload.google_plus_code = data.google_plus_code;
        }

        // Only prepare business hours for non-event listings
        const enabledHours =
          listingType !== "event"
            ? data.businessHours
                .filter((h: DaySchedule) => h.enabled)
                .map((h: DaySchedule) => ({
                  id: h.id,
                  day_of_week: h.day_of_week,
                  open_time: h.startTime,
                  close_time: h.endTime,
                }))
            : [];

        // For events: POST to create on first save, PATCH update endpoint on subsequent saves.
        // For business/community: PUT to the address proxy.
        let detailsEndpoint: string;
        let detailsMethod: string;
        if (listingType === "event") {
          if (eventId) {
            detailsEndpoint = `/api/listing/${effectiveSlug}/event/${eventId}/update`;
            detailsMethod = "PUT";
          } else {
            detailsEndpoint = `/api/listing/${effectiveSlug}/eventDetails`;
            detailsMethod = "POST";
          }
        } else {
          detailsEndpoint = `/api/listing/${effectiveSlug}/address`;
          detailsMethod = "PUT";
        }

        const detailsReq = fetch(detailsEndpoint, {
          method: detailsMethod,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(detailsPayload),
        });

        // Only send business hours for non-event listings
        let hoursResults: Response[] = [];
        if (listingType !== "event" && enabledHours.length > 0) {
          const hasExistingHours = enabledHours.some((h: any) => h.id);

          if (hasExistingHours) {
            // PUT each hour individually to update existing opening hours
            hoursResults = await Promise.all(
              enabledHours.map((h: any) => {
                if (h.id) {
                  return fetch(`${API_URL}/api/opening_hours/${h.id}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Accept: "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      day_of_week: h.day_of_week,
                      open_time: h.open_time,
                      close_time: h.close_time,
                    }),
                  });
                } else {
                  return fetch(`${API_URL}/api/listing/${effectiveSlug}/opening_hours`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Accept: "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify([{
                      day_of_week: h.day_of_week,
                      open_time: h.open_time,
                      close_time: h.close_time,
                    }]),
                  });
                }
              }),
            );
          } else {
            // POST all hours as a batch for initial creation
            const res = await fetch(`${API_URL}/api/listing/${effectiveSlug}/opening_hours`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(enabledHours),
            });
            hoursResults = [res];
          }
        }

        const [detailsRes] = await Promise.all([detailsReq]);

        const hoursOk = hoursResults.every((r) => r.ok);
        if (!detailsRes.ok || !hoursOk) {
          throw new Error("Update failed");
        }

        // If this was a create (POST), capture the returned event ID for subsequent saves.
        if (listingType === "event" && !eventId) {
          try {
            const created = await detailsRes.clone().json();
            const newId = created?.data?.id ?? created?.id ?? null;
            if (newId) setEventId(String(newId));
          } catch {
            // Non-fatal — next page load will re-hydrate the ID
          }
        }

        setBusinessDetails({ ...businessDetails, ...data });
        toast.success("Details saved!");
        return true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to save details";
        toast.error(msg);
        return false;
      } finally {
        setIsSaving(false);
      }
    };

    useImperativeHandle(ref, () => ({
      async submit() {
        return await saveDataToApi();
      },
    }));

    // --- Mapbox Handler Updated ---
    const handleRetrieve = (res: any) => {
      const feature = res.features[0];
      if (feature) {
        setMinimapFeature(feature); // For visual map
        const placeName =
          feature.properties.full_address || feature.properties.name || "";
        const city = feature.properties.context?.place?.name || "";
        const country = feature.properties.context?.country?.name || "";

        setValue("address", placeName, { shouldValidate: true });
        if (city) setValue("city", city, { shouldValidate: true });
        if (country) setValue("country", country, { shouldValidate: true });
      }
    };

    return (
      <form
        ref={formRef}
        className="w-full max-w-5xl space-y-6 mx-auto p-0.5 lg:p-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <h2 className="text-2xl font-semibold">Details</h2>
          <p className="text-sm text-gray-500 mt-1">{text.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="font-medium text-sm">{text.countryLabel}</label>
            <CountryDropdown
              placeholder="Select your country"
              defaultValue={
                countries.all.find((c) => c.name === selectedCountryName)
                  ?.alpha3
              }
              onChange={(country: Country) =>
                setValue("country", country.name, { shouldValidate: true })
              }
            />
            {errors.country && (
              <p className="text-red-500 text-xs">{errors.country.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="font-medium text-sm">{text.addressLabel}</label>
            <div className="relative">
              {mounted && MAPBOX_TOKEN ? (
                <AddressAutofill
                  accessToken={MAPBOX_TOKEN}
                  onRetrieve={handleRetrieve}
                >
                  <Input
                    {...register("address")}
                    autoComplete="shipping address-line1"
                    placeholder={text.addressPlaceholder}
                    className={cn(errors.address && "border-red-500")}
                  />
                </AddressAutofill>
              ) : (
                <Input
                  {...register("address")}
                  placeholder={text.addressPlaceholder}
                />
              )}
              <MapPin
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
            {errors.address && (
              <p className="text-red-500 text-xs">{errors.address.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="font-medium text-sm">{text.cityLabel}</label>
            <Input
              {...register("city")}
              autoComplete="shipping address-level2"
              placeholder="e.g., Accra"
              className={cn(errors.city && "border-red-500")}
            />
            {errors.city && (
              <p className="text-red-500 text-xs">{errors.city.message}</p>
            )}
          </div>

          {listingType !== "event" && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <label className="font-medium text-sm">
                  {text.googlePlusCodeLabel}
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Question size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px] p-3">
                      <div className="space-y-2 text-xs">
                        <p className="font-semibold">What is a Plus Code?</p>
                        <p>
                          A simple digital address that works like a street
                          address.
                        </p>
                        <p className="font-semibold">How to find it:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Open Google Maps and tap your location.</li>
                          <li>
                            Look for the plus code icon (e.g., 849VCWC8+R9).
                          </li>
                        </ol>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                {...register("google_plus_code")}
                placeholder="e.g., 849VCWC8+R9"
                className={cn(errors.google_plus_code && "border-red-500")}
              />
              {errors.google_plus_code && (
                <p className="text-red-500 text-xs">
                  {errors.google_plus_code.message}
                </p>
              )}
            </div>
          )}
        </div>

        {listingType !== "event" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <BusinessHoursSelector
                value={currentHours}
                onChange={(val) => {
                  const formatted = val.map((d: DaySchedule) => ({
                    ...d,
                    startTime: convertToHHmm(d.startTime),
                    endTime: convertToHHmm(d.endTime),
                  }));
                  setValue("businessHours", formatted, {
                    shouldValidate: true,
                  });
                }}
              />
              {errors.businessHours && (
                <p className="text-red-500 text-xs mt-1">
                  Please check time format (HH:mm)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Event-specific fields - Only show for events */}
        {listingType === "event" && (
          <div className="space-y-6 pt-4 border-t">
            <h3 className="text-lg font-semibold">Event Details</h3>

            {/* Event Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-sm">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register("event_start_date")}
                  type="date"
                  className={cn(errors.event_start_date && "border-red-500")}
                />
                {errors.event_start_date && (
                  <p className="text-red-500 text-xs">
                    {errors.event_start_date.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="font-medium text-sm">
                  End Date <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register("event_end_date")}
                  type="date"
                  min={minEndDate}
                  className={cn(errors.event_end_date && "border-red-500")}
                />
                {errors.event_end_date && (
                  <p className="text-red-500 text-xs">
                    {errors.event_end_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Event Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-sm">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register("event_start_time")}
                  type="time"
                  className={cn(errors.event_start_time && "border-red-500")}
                />
                {errors.event_start_time && (
                  <p className="text-red-500 text-xs">
                    {errors.event_start_time.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="font-medium text-sm">
                  End Time <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register("event_end_time")}
                  type="time"
                  className={cn(errors.event_end_time && "border-red-500")}
                />
                {errors.event_end_time && (
                  <p className="text-red-500 text-xs">
                    {errors.event_end_time.message}
                  </p>
                )}
              </div>
            </div>

            {/* Event Type */}
            <div
              className={cn(
                "grid grid-cols-1 gap-4",
                eventLocationType === "online"
                  ? "md:grid-cols-2"
                  : "md:grid-cols-1",
              )}
            >
              <div className="space-y-1">
                <label className="font-medium text-sm">
                  Event Type <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="event_location"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        className={cn(
                          "h-10 rounded-lg border-gray-300 w-full",
                          errors.event_location && "border-red-500",
                        )}
                      >
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="in_person">In-Person</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.event_location && (
                  <p className="text-red-500 text-xs">
                    {errors.event_location.message}
                  </p>
                )}
              </div>

              {(eventLocationType === "online" || eventLocationType === "hybrid") && (
                <div className="space-y-1">
                  <label className="font-medium text-sm">
                    Event Online URL (Optional)
                  </label>
                  <div className="relative">
                    <Input
                      {...register("event_online_url")}
                      placeholder="https://zoom.us/j/..."
                      className={cn(
                        "h-10 rounded-lg border-gray-300 pl-10",
                        errors.event_online_url && "border-red-500",
                      )}
                    />
                    <Globe
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                  {errors.event_online_url && (
                    <p className="text-red-500 text-xs">
                      {errors.event_online_url.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Event-specific fields - Only show for events */}
        {listingType === "event" && (
          <div className="space-y-6 pt-4 border-t">
            <h3 className="text-lg font-semibold">Event Ticketing</h3>

            {/* Event Price & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="font-medium text-sm">Ticket Price</label>
                <div className="flex">
                  <Controller
                    name="event_currency"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="py-[19px] rounded-l-lg rounded-r-none border-r border-gray-300 px-2 text-gray-800 w-[100px]">
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GHS">GHS</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Input
                    {...register("event_price")}
                    placeholder="e.g., 50 or Free"
                    type="number"
                    className={cn(
                      "h-10 rounded-r-lg rounded-l-none border-l-0 border-gray-300 px-4 text-gray-800 hide-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none flex-1",
                      errors.event_price && "border-red-500",
                    )}
                  />
                </div>
                {errors.event_price && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.event_price.message}
                  </p>
                )}
              </div>

              {/* Ticket URL */}
              <div className="space-y-1">
                <label className="font-medium text-sm">
                  Ticket Purchase URL (Optional)
                </label>
                <Input
                  {...register("event_ticket_url")}
                  placeholder="www.example.com/tickets"
                  type="url"
                  className="h-10 rounded-lg border-gray-300 px-4 text-gray-800"
                />
                {errors.event_ticket_url && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.event_ticket_url.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    );
  },
);

BusinessDetailsForm.displayName = "BusinessDetailsForm";
