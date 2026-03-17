import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchUI } from "@/components/search/search-ui";

export default function SearchPage() {
  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 shrink-0">
        <SidebarTrigger />
        <div className="font-semibold">Semantic Search</div>
      </header>
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Search Knowledge Base
            </h1>
            <p className="text-muted-foreground">
              Perform direct semantic searches to find specific phrases or
              paragraphs in your uploaded documents.
            </p>
          </div>

          <SearchUI />
        </div>
      </div>
    </>
  );
}
