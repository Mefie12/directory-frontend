import { useListing } from "@/context/listing-form-context";
import { FileUploader } from "@/components/dashboard/listing/media-uploader";

type MediaUploadStepProps = {
  listingType: "business" | "event";
};


export function MediaUploadStep({ listingType }: MediaUploadStepProps) {
  const { media, setMedia } = useListing();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Media Upload</h2>
        <p className="text-sm text-muted-foreground">
          {listingType === "business" ? "Upload your business images and cover photo" : "Upload event flyers and promotional images"}
        </p>
      </div>

      <div className="space-y-6">
        <FileUploader
          label={listingType === "business" ? "Business Images" : "Event Images"}
          multiple
          files={media.images}
          onChange={(files) => setMedia({ ...media, images: files })}
          emptyText="No images uploaded yet"
        />

        <FileUploader
          label={listingType === "business" ? "Cover Photo" : "Main Event Flyer"}
          multiple={false}
          files={media.coverPhoto ? [media.coverPhoto] : []}
          onChange={(files) => setMedia({ ...media, coverPhoto: files[0] || null })}
          emptyText={listingType === "business" ? "No cover photo uploaded" : "No event flyer uploaded"}
        />
      </div>
    </div>
  );
}
