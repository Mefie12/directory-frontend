"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, MapPin, Trash2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

export default function EditListingPage() {
  const router = useRouter();
  const [images, setImages] = useState([
    "/images/placeholders/restaurant-1.jpg",
    "/images/placeholders/restaurant-2.jpg",
    "/images/placeholders/restaurant-3.jpg",
  ]);
  const [coverPhoto] = useState("/images/placeholders/restaurant-cover.jpg");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Edit a listing</h1>
          <p className="text-sm text-gray-500">
            Create a new listing and manage it
          </p>
        </div>
      </div>

      {/* Form */}
      <form className="space-y-8">
        {/* Basic Info */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business name
            </label>
            <Input placeholder="Enter business name" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food & Dining</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short description
            </label>
            <Textarea
              placeholder="Short description about your business"
              className="h-24 resize-none"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-white text-sm text-gray-500">
              Details & Media
            </span>
          </div>
        </div>

        {/* Details & Media */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="relative">
                <Input placeholder="Address" className="pr-10" />
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <Input placeholder="Enter location" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input type="email" placeholder="Enter email address" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex">
                <Select defaultValue="us">
                  <SelectTrigger className="w-20 rounded-r-none border-r-0">
                    <SelectValue>
                      <span className="flex items-center">
                        🇺🇸 +1
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">🇺🇸 +1</SelectItem>
                    <SelectItem value="gh">🇬🇭 +233</SelectItem>
                    <SelectItem value="uk">🇬🇧 +44</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  placeholder="Enter number"
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business hours
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select business hours" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mon-fri">Mon - Fri, 9am - 5pm</SelectItem>
                  <SelectItem value="24/7">Open 24/7</SelectItem>
                  <SelectItem value="custom">Custom Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <Input placeholder="Enter tags" />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center">
                <Upload className="w-10 h-10 text-gray-400 mb-4" />
                <p className="text-sm text-gray-500 mb-2">
                  Drag and drop files here
                </p>
                <p className="text-xs text-gray-400 mb-4">or</p>
                <Button variant="secondary" size="sm">
                  Choose files
                  <Upload className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              {images.map((src, index) => (
                <div key={index} className="relative w-24 h-16 rounded-lg overflow-hidden group">
                  <Image
                    src={src}
                    alt={`Uploaded image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cover Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select cover photo
            </label>
            <div className="relative w-full h-48 rounded-lg overflow-hidden group">
              <Image
                src={coverPhoto}
                alt="Cover photo"
                fill
                className="object-cover"
              />
              <button
                type="button"
                className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <Button variant="secondary" size="sm">
                  Change Cover
                  <ImageIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <Button variant="outline" type="button">
            Cancel
          </Button>
          <Button className="bg-[#84cc16] hover:bg-[#65a30d] text-white">
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}