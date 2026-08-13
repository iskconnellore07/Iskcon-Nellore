import { useParams } from "react-router-dom";
import Index from "./Index";

const BranchLanding = () => {
  const { branch } = useParams();
  
  // Format branch name: capitalize first letter
  const formattedBranch = branch 
    ? branch.charAt(0).toUpperCase() + branch.slice(1)
    : "Nellore";

  return <Index branch={formattedBranch} />;
};

export default BranchLanding;
