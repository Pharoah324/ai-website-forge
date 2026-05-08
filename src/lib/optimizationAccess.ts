import type { Profile } from "@/hooks/useProfile";

export type Plan = Profile["plan"];

export type OptimizationAccess = {
  plan: Plan;
  isAdmin: boolean;
  // gates
  fullScores: boolean;          // all 4 score widgets vs SEO-only
  topAndLowPages: boolean;
  keywordOpportunities: boolean;
  technicalAudit: boolean;       // metadata + alt text
  mobileSpeed: boolean;
  contentClusterEngine: boolean; // pillar mind-map
  internalLinkingMap: boolean;
  blogClusterSuggestions: boolean;
  automationInsights: boolean;
  gscIntegration: boolean;
  gaIntegration: boolean;
  multiClient: boolean;
  whiteLabel: boolean;
  pdfExport: boolean;
  monthlyGrowthEmail: boolean;
  // numeric caps
  aiRecommendationsPerMonth: number; // -1 = unlimited
  visibleIssues: number;             // free/starter teaser
  // helpers
  upgradeTo: "builder" | "pro" | "agency" | null;
};

export function getAccess(plan: Plan, isAdmin = false): OptimizationAccess {
  // admins bypass everything
  if (isAdmin) {
    return {
      plan, isAdmin: true,
      fullScores: true, topAndLowPages: true, keywordOpportunities: true,
      technicalAudit: true, mobileSpeed: true, contentClusterEngine: true,
      internalLinkingMap: true, blogClusterSuggestions: true,
      automationInsights: true, gscIntegration: true, gaIntegration: true,
      multiClient: true, whiteLabel: true, pdfExport: true,
      monthlyGrowthEmail: true,
      aiRecommendationsPerMonth: -1, visibleIssues: 999,
      upgradeTo: null,
    };
  }
  switch (plan) {
    case "free":
    case "starter":
      return {
        plan, isAdmin: false,
        fullScores: false, topAndLowPages: false, keywordOpportunities: false,
        technicalAudit: false, mobileSpeed: false, contentClusterEngine: false,
        internalLinkingMap: false, blogClusterSuggestions: false,
        automationInsights: false, gscIntegration: false, gaIntegration: false,
        multiClient: false, whiteLabel: false, pdfExport: false,
        monthlyGrowthEmail: false,
        aiRecommendationsPerMonth: 0, visibleIssues: 3,
        upgradeTo: "builder",
      };
    case "builder":
      return {
        plan, isAdmin: false,
        fullScores: true, topAndLowPages: true, keywordOpportunities: true,
        technicalAudit: true, mobileSpeed: true, contentClusterEngine: false,
        internalLinkingMap: false, blogClusterSuggestions: false,
        automationInsights: false, gscIntegration: false, gaIntegration: false,
        multiClient: false, whiteLabel: false, pdfExport: false,
        monthlyGrowthEmail: false,
        aiRecommendationsPerMonth: 5, visibleIssues: 999,
        upgradeTo: "pro",
      };
    case "pro":
      return {
        plan, isAdmin: false,
        fullScores: true, topAndLowPages: true, keywordOpportunities: true,
        technicalAudit: true, mobileSpeed: true, contentClusterEngine: true,
        internalLinkingMap: true, blogClusterSuggestions: true,
        automationInsights: true, gscIntegration: true, gaIntegration: true,
        multiClient: false, whiteLabel: false, pdfExport: false,
        monthlyGrowthEmail: true,
        aiRecommendationsPerMonth: -1, visibleIssues: 999,
        upgradeTo: "agency",
      };
    case "agency":
      return {
        plan, isAdmin: false,
        fullScores: true, topAndLowPages: true, keywordOpportunities: true,
        technicalAudit: true, mobileSpeed: true, contentClusterEngine: true,
        internalLinkingMap: true, blogClusterSuggestions: true,
        automationInsights: true, gscIntegration: true, gaIntegration: true,
        multiClient: true, whiteLabel: true, pdfExport: true,
        monthlyGrowthEmail: true,
        aiRecommendationsPerMonth: -1, visibleIssues: 999,
        upgradeTo: null,
      };
  }
}

export function scoreColor(value: number): string {
  if (value <= 40) return "#EF4444";
  if (value <= 70) return "#F59E0B";
  return "#10B981";
}
