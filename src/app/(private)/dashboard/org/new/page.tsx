"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrganizationsGate } from "@/components/dashboard/organizations/organizations-gate";
import { OrganizationForm } from "@/components/dashboard/organizations/organization-form";
import { createOrganization } from "@/lib/api";
import { useOrganizations } from "@/hooks/useOrganizations";
import { getAuthToken } from "@/lib/client-auth";

export default function NewOrganizationPage() {
  const router = useRouter();
  const { refresh } = useOrganizations();

  return (
    <OrganizationsGate>
      <div className="mx-auto max-w-xl space-y-6 p-4 lg:p-8">
        <div>
          <h1 className="text-xl font-bold text-[#1F3A4C]">New organization</h1>
          <p className="mt-1 text-sm text-gray-600">
            An organization holds your listings. You&apos;ll be its owner, and you can add team members later.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <OrganizationForm
            submitLabel="Create organization"
            onCancel={() => router.back()}
            onSubmit={async (values) => {
              const token = getAuthToken() ?? undefined;
              const organization = await createOrganization(
                { name: values.name, country: values.country, entity_kind: values.entity_kind },
                token,
              );
              toast.success(`${organization.name} created.`);
              await refresh();
              router.push(`/dashboard/org/${organization.slug}`);
            }}
          />
        </div>
      </div>
    </OrganizationsGate>
  );
}
