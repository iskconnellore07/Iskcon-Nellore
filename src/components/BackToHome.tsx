import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useBranchPrefix, useBranchName } from "@/hooks/useBranchPrefix";

/**
 * A "← Back to Home" button for sub-pages.
 * Automatically links back to the correct branch landing page.
 */
export default function BackToHome() {
  const branchPrefix = useBranchPrefix();
  const branchName = useBranchName();

  return (
    <Link
      to={branchPrefix || "/"}
      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to ISKCON {branchName}
    </Link>
  );
}
