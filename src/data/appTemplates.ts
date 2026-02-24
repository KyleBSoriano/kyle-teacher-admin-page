import { App } from "@/types";

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  apps: string[]; // app IDs
  isDefault?: boolean;
  period?: string; // Period this template is associated with
  classId?: string; // Class this template belongs to
  isCustom?: boolean; // Whether this is a custom template
}

// Store custom templates separately
let customTemplates: AppTemplate[] = [];

export const appTemplates: AppTemplate[] = [
  {
    id: "template1",
    name: "Default",
    description: "Basic educational apps for learning and productivity",
    apps: ["app1", "app17", "app18", "app6", "app2", "app3", "app5", "app11", "app12"], // Calculator, Notes, Calendar, Google Docs, Dictionary, Quizlet, Desmos, Google Classroom, Canva
    isDefault: true
  },
  {
    id: "template2", 
    name: "Custom",
    description: "Create a Custom Template",
    apps: ["app24"], // Phone app only
  }
];

// Helper functions for custom templates
export const addCustomTemplate = (template: AppTemplate) => {
  customTemplates.push(template);
  console.log('Custom template added:', template);
  console.log('All custom templates:', customTemplates);
};

export const getCustomTemplatesForPeriod = (period: string): AppTemplate[] => {
  const filtered = customTemplates.filter(template => template.period === period);
  console.log(`Getting custom templates for period "${period}":`, filtered);
  return filtered;
};

export const getAllTemplatesForPeriod = (period: string): AppTemplate[] => {
  // Get custom templates for this specific period
  const periodCustomTemplates = getCustomTemplatesForPeriod(period);
  
  // Always include default templates (they are available for all periods)
  const defaultTemplates = appTemplates;
  
  const result = [...defaultTemplates, ...periodCustomTemplates];
  console.log(`Getting all templates for period "${period}":`, result);
  console.log(`Found ${periodCustomTemplates.length} custom templates for this period`);
  return result;
};

export const getTemplateApps = (templateId: string, allApps: App[]): App[] => {
  // Search in both default templates and custom templates
  let template = appTemplates.find(t => t.id === templateId);
  if (!template) {
    template = customTemplates.find(t => t.id === templateId);
  }
  if (!template) return [];
  
  return allApps.filter(app => template.apps.includes(app.id));
};