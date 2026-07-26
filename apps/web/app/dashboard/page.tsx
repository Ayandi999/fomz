"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { useUser } from "~/hooks/api/auth/useUser";
import { useCreateForm } from "~/hooks/api/forms/useCreateForm";
import { useDeleteForm } from "~/hooks/api/forms/useDeleteForm";
import { useUserForms } from "~/hooks/api/forms/useUserForms";

import { Sidebar } from "~/components/dashboard/Sidebar";
import { DashboardHeader } from "~/components/dashboard/DashboardHeader";
import { FormsList } from "~/components/dashboard/FormsList";
import { QuickStartTemplates } from "~/components/dashboard/QuickStartTemplates";
import { CreateFormModal } from "~/components/dashboard/CreateFormModal";
import { PublishShareModal } from "~/components/dashboard/PublishShareModal";

export default function DashboardPage() {
  const { user, isLoading: isUserLoading, isFetched } = useUser();
  const { createFormAsync, isPending: isCreating } = useCreateForm();
  const { deleteFormAsync } = useDeleteForm();
  const { forms: realForms, isLoading: isFormsLoading, refetch: refetchForms } = useUserForms();
  
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "name" | "responses">("recent");
  
  // Publish modal state
  const [selectedFormForModal, setSelectedFormForModal] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isFetched && !isUserLoading && !user?.id) {
      router.replace("/sign-in");
    }
  }, [user, isUserLoading, isFetched, router]);

  const displayForms = realForms || [];
  const sortedForms = [...displayForms].sort((a, b) => {
    if (sortBy === "name") return a.title.localeCompare(b.title);
    if (sortBy === "responses") return (b.responses || 0) - (a.responses || 0);
    const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return dateB - dateA;
  });

  const handleCreateSubmit = async (title: string, description?: string) => {
    const createToastId = toast.loading("Creating form...");
    try {
      await createFormAsync({ title, description });
      await refetchForms();
      setShowCreate(false);
      toast.success("Form created successfully!", { id: createToastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create form.", { id: createToastId });
    }
  };

  const handleCreateFromTemplate = async (templateName: string) => {
    const createToastId = toast.loading(`Creating ${templateName} form...`);
    try {
      await createFormAsync({ title: `${templateName} Form` });
      await refetchForms();
      toast.success(`${templateName} form created!`, { id: createToastId });
    } catch (err) {
      console.error(err);
      toast.error(`Failed to create ${templateName} form.`, { id: createToastId });
    }
  };

  const handleDeleteForm = async (formId: string) => {
    const deleteToastId = toast.loading("Deleting form...");
    try {
      await deleteFormAsync({ formId });
      await refetchForms();
      toast.success("Form deleted successfully!", { id: deleteToastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete form.", { id: deleteToastId });
    }
  };

  const handlePublishSuccess = async (updatedForm: any) => {
    await refetchForms();
    setSelectedFormForModal(updatedForm);
  };

  if (isUserLoading || isFormsLoading || !user?.id) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
            Orienting workspace…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0F0F0F] text-foreground antialiased font-sans select-none pb-12">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #111111;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #333333;
          border-radius: 999px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #555555;
        }
      `}</style>
      
      <DashboardHeader user={user} />

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
        <Sidebar />

        <main className="flex-1 w-full max-w-none px-4 lg:px-8 py-8 overflow-y-auto scrollbar-thin">
          <div className="flex flex-col lg:flex-row gap-8">
            <FormsList 
              forms={sortedForms}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onCreateClick={() => setShowCreate(true)}
              onPublishClick={(form) => setSelectedFormForModal(form)}
              onDeleteForm={handleDeleteForm}
            />
            
            <QuickStartTemplates 
              onCreateFromTemplate={handleCreateFromTemplate} 
            />
          </div>
        </main>
      </div>

      <CreateFormModal 
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateSubmit}
        isPending={isCreating}
      />

      <PublishShareModal
        form={selectedFormForModal}
        isOpen={!!selectedFormForModal}
        onClose={() => setSelectedFormForModal(null)}
        onSuccess={handlePublishSuccess}
      />
    </div>
  );
}
