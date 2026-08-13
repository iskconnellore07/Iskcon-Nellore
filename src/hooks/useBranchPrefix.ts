import { useLocation } from "react-router-dom";

// Top-level global routes that are NOT branch names
const GLOBAL_ROUTES = [
  "about", "darshan", "events", "contact", "support-us", 
  "festivals", "courses", "gallery", "annadaan", "goshala", 
  "receipt", "accommodation", "form", "admin", "login"
];

/**
 * Returns the branch prefix for building branch-aware links.
 * Automatically supports any new branch created in the future.
 */
export function useBranchPrefix(): string {
  const location = useLocation();
  const firstSegment = location.pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  
  if (firstSegment && !GLOBAL_ROUTES.includes(firstSegment)) {
    return `/${firstSegment}`;
  }
  
  return "";
}

/**
 * Returns the branch name for display purposes.
 * e.g. "Gudur", "Kavali", "Nellore"
 */
export function useBranchName(): string {
  const prefix = useBranchPrefix();
  if (!prefix) return "Nellore";
  const slug = prefix.replace("/", "");
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}
