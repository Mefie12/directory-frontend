"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type ListingType = "business" | "event" | "community";

interface BasicInfo {
  name: string;
  category: string;
  subcategory: string;
  description: string;
}

export interface DaySchedule {
  day_of_week: string;
  startTime: string;
  endTime: string;
}

interface BusinessDetails {
  address: string;
  location: string;
  email: string;
  businessHours: DaySchedule[];
  tags: string[];
}

interface Media {
  images: File[];
  coverPhoto: File | null;
}

interface ListingContextType {
  listingType: ListingType;
  setListingType: (type: ListingType) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  basicInfo: BasicInfo;
  setBasicInfo: (info: BasicInfo) => void;
  businessDetails: BusinessDetails;
  setBusinessDetails: (details: BusinessDetails) => void;
  media: Media;
  setMedia: (media: Media) => void;
  resetListing: () => void;
}

const ListingContext = createContext<ListingContextType | undefined>(undefined);

export function ListingProvider({ children }: { children: ReactNode }) {
  const [listingType, setListingType] = useState<ListingType>("business");
  const [currentStep, setCurrentStep] = useState(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: "",
    category: "",
    subcategory: "",
    description: "",
  });
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    address: "",
    location: "",
    email: "",
    businessHours: [
      { day_of_week: "Monday",  startTime: "", endTime: "" },
      { day_of_week: "Tuesday",  startTime: "", endTime: "" },
      { day_of_week: "Wednesday",  startTime: "", endTime: "" },
      { day_of_week: "Thursday",  startTime: "", endTime: "" },
      { day_of_week: "Friday",  startTime: "", endTime: "" },
      { day_of_week: "Saturday",  startTime: "", endTime: "" },
      { day_of_week: "Sunday",  startTime: "", endTime: "" },
    ],
    tags: [],
  });
  const [media, setMedia] = useState<Media>({
    images: [],
    coverPhoto: null,
  });

  const resetListing = () => {
    setCurrentStep(1);
    setBasicInfo({ name: "", category: "", subcategory: "", description: "" });
    setBusinessDetails({
      address: "",
      location: "",
      email: "",
      businessHours: [
        { day_of_week: "Monday",  startTime: "", endTime: "" },
        { day_of_week: "Tuesday",  startTime: "", endTime: "" },
        { day_of_week: "Wednesday",  startTime: "", endTime: "" },
        { day_of_week: "Thursday",  startTime: "", endTime: "" },
        { day_of_week: "Friday",  startTime: "", endTime: "" },
        { day_of_week: "Saturday",  startTime: "", endTime: "" },
        { day_of_week: "Sunday",  startTime: "", endTime: "" },
      ],
      tags: [],
    });
    setMedia({ images: [], coverPhoto: null });
  };

  return (
    <ListingContext.Provider
      value={{
        listingType,
        setListingType,
        currentStep,
        setCurrentStep,
        basicInfo,
        setBasicInfo,
        businessDetails,
        setBusinessDetails,
        media,
        setMedia,
        resetListing,
      }}
    >
      {children}
    </ListingContext.Provider>
  );
}

export function useListing() {
  const context = useContext(ListingContext);
  if (!context) {
    throw new Error("useListing must be used within a ListingProvider");
  }
  return context;
}
