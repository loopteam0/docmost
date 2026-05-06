export interface TemplatePage {
  title: string;
  icon?: string;
  content: Record<string, any>;
  children?: TemplatePage[];
}

export interface SpaceTemplate {
  id: string;
  label: string;
  description: string;
  icon: string;
  pages: TemplatePage[];
}

// ─── helpers ────────────────────────────────────────────────────────────────

function doc(...nodes: any[]) {
  return { type: 'doc', content: nodes };
}

function h1(text: string) {
  return {
    type: 'heading',
    attrs: { level: 1 },
    content: [{ type: 'text', text }],
  };
}

function h2(text: string) {
  return {
    type: 'heading',
    attrs: { level: 2 },
    content: [{ type: 'text', text }],
  };
}

function p(text?: string) {
  return {
    type: 'paragraph',
    content: text ? [{ type: 'text', text }] : [],
  };
}

function bulletList(...items: string[]) {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [p(item)],
    })),
  };
}

// ─── template definitions ────────────────────────────────────────────────────

const engineering: SpaceTemplate = {
  id: 'engineering',
  label: 'Engineering',
  description: 'Architecture docs, runbooks, ADRs & API references',
  icon: '⚙️',
  pages: [
    {
      title: 'Architecture Overview',
      icon: '🏗️',
      content: doc(
        h1('Architecture Overview'),
        p('Describe the high-level system architecture here.'),
        h2('Components'),
        p('List the major components and their responsibilities.'),
        h2('Data Flow'),
        p('Explain how data moves through the system.'),
        h2('Infrastructure'),
        p('Document deployment environment, cloud services, and networking.'),
      ),
    },
    {
      title: 'API Reference',
      icon: '📡',
      content: doc(
        h1('API Reference'),
        p('Document your API endpoints and data contracts.'),
        h2('Authentication'),
        p('Describe how clients authenticate with the API.'),
        h2('Endpoints'),
        p('List endpoints with their request/response schemas.'),
        h2('Error Codes'),
        p('Enumerate error codes and their meanings.'),
      ),
    },
    {
      title: 'Runbook',
      icon: '📋',
      content: doc(
        h1('Runbook'),
        p('Step-by-step operational procedures for common tasks.'),
        h2('Deployment'),
        bulletList('Build the Docker image', 'Run migrations', 'Deploy to staging', 'Verify smoke tests', 'Deploy to production'),
        h2('Rollback Procedure'),
        bulletList('Identify the failing deployment', 'Roll back to the previous image tag', 'Verify the service is healthy'),
        h2('On-Call Checklist'),
        p('Steps for the on-call engineer to follow during an incident.'),
      ),
    },
    {
      title: 'ADR Log',
      icon: '📝',
      content: doc(
        h1('Architecture Decision Records'),
        p('A log of significant architecture decisions and their context.'),
        h2('Template'),
        p('**Status:** Proposed | Accepted | Deprecated'),
        p('**Context:** What is the issue that motivated this decision?'),
        p('**Decision:** What was the decision made?'),
        p('**Consequences:** What are the trade-offs?'),
      ),
      children: [
        {
          title: 'ADR-001 – Example Decision',
          icon: '📄',
          content: doc(
            h1('ADR-001 – Example Decision'),
            p('**Status:** Accepted'),
            h2('Context'),
            p('Describe the context and background here.'),
            h2('Decision'),
            p('State the decision clearly.'),
            h2('Consequences'),
            p('Describe the trade-offs and any follow-up actions.'),
          ),
        },
      ],
    },
    {
      title: 'Incident Reports',
      icon: '🚨',
      content: doc(
        h1('Incident Reports'),
        p('Post-mortems and incident reviews live here.'),
        h2('Incident Report Template'),
        p('**Date:** '),
        p('**Severity:** P0 | P1 | P2'),
        p('**Summary:** One-sentence description of the incident.'),
        h2('Timeline'),
        p('Chronological list of events.'),
        h2('Root Cause'),
        p('What caused the incident?'),
        h2('Action Items'),
        p('What will prevent recurrence?'),
      ),
    },
  ],
};

const product: SpaceTemplate = {
  id: 'product',
  label: 'Product',
  description: 'PRDs, roadmap, user stories & meeting notes',
  icon: '🗺️',
  pages: [
    {
      title: 'Product Roadmap',
      icon: '🗺️',
      content: doc(
        h1('Product Roadmap'),
        p('High-level timeline of features and milestones.'),
        h2('Now'),
        p('Features currently in development.'),
        h2('Next'),
        p('Features planned for the next quarter.'),
        h2('Later'),
        p('Longer-term ideas and initiatives.'),
      ),
    },
    {
      title: 'PRD Template',
      icon: '📄',
      content: doc(
        h1('Product Requirements Document'),
        p('**Status:** Draft | In Review | Approved'),
        p('**Author:** '),
        p('**Last Updated:** '),
        h2('Problem Statement'),
        p('What problem are we solving and for whom?'),
        h2('Goals'),
        bulletList('Goal 1', 'Goal 2', 'Goal 3'),
        h2('Non-Goals'),
        p('What is explicitly out of scope?'),
        h2('User Stories'),
        p('As a [user], I want to [action] so that [outcome].'),
        h2('Success Metrics'),
        p('How will we measure success?'),
        h2('Open Questions'),
        p('List unresolved questions.'),
      ),
    },
    {
      title: 'User Stories',
      icon: '👥',
      content: doc(
        h1('User Stories'),
        p('Track feature requests as user stories.'),
        h2('Template'),
        p('**As a** [type of user],'),
        p('**I want** [some goal],'),
        p('**So that** [some reason].'),
        h2('Acceptance Criteria'),
        bulletList('Criterion 1', 'Criterion 2'),
      ),
    },
    {
      title: 'Meeting Notes',
      icon: '🗒️',
      content: doc(
        h1('Meeting Notes'),
        p('Capture decisions and action items from meetings.'),
        h2('Meeting Template'),
        p('**Date:** '),
        p('**Attendees:** '),
        p('**Agenda:** '),
        h2('Discussion'),
        p('Key points discussed.'),
        h2('Decisions'),
        bulletList('Decision 1', 'Decision 2'),
        h2('Action Items'),
        bulletList('[ ] Owner – Action item – Due date'),
      ),
    },
  ],
};

const design: SpaceTemplate = {
  id: 'design',
  label: 'Design',
  description: 'Design system, research notes & component library',
  icon: '🎨',
  pages: [
    {
      title: 'Design System',
      icon: '🎨',
      content: doc(
        h1('Design System'),
        p("Foundations and guidelines for the product's visual language."),
        h2('Colors'),
        p('Document primary, secondary, and semantic color tokens.'),
        h2('Typography'),
        p('Font families, sizes, weights, and line heights.'),
        h2('Spacing'),
        p('Spacing scale and usage guidelines.'),
        h2('Iconography'),
        p('Icon library source and usage rules.'),
      ),
    },
    {
      title: 'Component Library',
      icon: '🧩',
      content: doc(
        h1('Component Library'),
        p('Reference for all shared UI components.'),
        h2('Usage'),
        p('Import components from the shared package and use them as documented below.'),
        h2('Buttons'),
        p('Primary, secondary, and ghost button variants.'),
        h2('Forms'),
        p('Input, select, textarea, and validation patterns.'),
        h2('Layout'),
        p('Grid, stack, and container primitives.'),
      ),
    },
    {
      title: 'Research Notes',
      icon: '🔬',
      content: doc(
        h1('Research Notes'),
        p('Capture findings from user research and usability testing.'),
        h2('Research Template'),
        p('**Date:** '),
        p('**Method:** Interview | Usability Test | Survey'),
        p('**Participants:** '),
        h2('Key Findings'),
        bulletList('Finding 1', 'Finding 2', 'Finding 3'),
        h2('Recommendations'),
        p('What should the team do based on these findings?'),
      ),
    },
    {
      title: 'Handoff Checklist',
      icon: '✅',
      content: doc(
        h1('Design Handoff Checklist'),
        p('Ensure designs are ready before handoff to engineering.'),
        h2('Design Checklist'),
        bulletList(
          '[ ] All states documented (default, hover, focus, disabled, error)',
          '[ ] Responsive breakpoints specified',
          '[ ] Accessibility annotations added',
          '[ ] Assets exported at correct resolutions',
          '[ ] Tokens/variables used consistently',
        ),
        h2('Engineering Notes'),
        p('Add any implementation notes for the engineering team here.'),
      ),
    },
  ],
};

const marketing: SpaceTemplate = {
  id: 'marketing',
  label: 'Marketing',
  description: 'Campaigns, content calendar & brand guidelines',
  icon: '📣',
  pages: [
    {
      title: 'Brand Guidelines',
      icon: '🎯',
      content: doc(
        h1('Brand Guidelines'),
        p('Our brand standards for messaging, visuals, and tone of voice.'),
        h2('Mission & Values'),
        p('Who we are and what we stand for.'),
        h2('Tone of Voice'),
        bulletList('Clear and direct', 'Friendly but professional', 'Avoid jargon'),
        h2('Visual Identity'),
        p('Approved logo usage, colors, and typography.'),
        h2('Messaging Framework'),
        p('Key messages for different audiences.'),
      ),
    },
    {
      title: 'Campaign Planning',
      icon: '📣',
      content: doc(
        h1('Campaign Planning'),
        p('Use this template to plan and track marketing campaigns.'),
        h2('Campaign Brief'),
        p('**Campaign Name:** '),
        p('**Goal:** '),
        p('**Target Audience:** '),
        p('**Timeline:** '),
        h2('Channels'),
        bulletList('Email', 'Social Media', 'Paid Ads', 'Content'),
        h2('Budget'),
        p('Total budget and channel breakdown.'),
        h2('Success Metrics'),
        bulletList('Reach', 'Leads generated', 'Conversions'),
      ),
    },
    {
      title: 'Content Calendar',
      icon: '📅',
      content: doc(
        h1('Content Calendar'),
        p('Plan and track all content publications.'),
        h2('Format'),
        p('**Date | Channel | Topic | Owner | Status**'),
        h2('This Month'),
        p('Add your planned content here.'),
        h2('Content Ideas Backlog'),
        bulletList('Idea 1', 'Idea 2', 'Idea 3'),
      ),
    },
    {
      title: 'Launch Checklist',
      icon: '🚀',
      content: doc(
        h1('Launch Checklist'),
        p('Steps to execute a successful product or campaign launch.'),
        h2('Pre-Launch'),
        bulletList(
          '[ ] Finalize messaging and copy',
          '[ ] Review all assets',
          '[ ] Schedule social posts',
          '[ ] Brief customer success',
          '[ ] Set up tracking/analytics',
        ),
        h2('Launch Day'),
        bulletList(
          '[ ] Publish blog post',
          '[ ] Send email announcement',
          '[ ] Post on social channels',
          '[ ] Monitor metrics',
        ),
        h2('Post-Launch'),
        bulletList(
          '[ ] Compile performance report',
          '[ ] Share learnings with team',
        ),
      ),
    },
  ],
};

const hr: SpaceTemplate = {
  id: 'hr',
  label: 'HR / People Ops',
  description: 'Handbook, onboarding, policies & OKRs',
  icon: '👋',
  pages: [
    {
      title: 'Team Handbook',
      icon: '📖',
      content: doc(
        h1('Team Handbook'),
        p('Everything you need to know about how we work.'),
        h2('Our Mission'),
        p('State the team or company mission here.'),
        h2('How We Work'),
        bulletList('Remote-first / Hybrid policy', 'Async communication norms', 'Meeting cadences'),
        h2('Tools We Use'),
        bulletList('Communication: Slack', 'Docs: Docmost', 'Project Tracking: Linear / Jira'),
        h2('Norms & Expectations'),
        p('Describe collaboration norms, working hours, and response time expectations.'),
      ),
    },
    {
      title: 'Onboarding Guide',
      icon: '🧭',
      content: doc(
        h1('Onboarding Guide'),
        p('Welcome to the team! This guide will help you get up to speed.'),
        h2('Week 1'),
        bulletList(
          '[ ] Set up accounts and tools',
          '[ ] Meet your team',
          '[ ] Read the Team Handbook',
          '[ ] Complete security training',
        ),
        h2('Week 2'),
        bulletList(
          '[ ] Shadow first project',
          '[ ] Review codebase / product area',
          '[ ] Set 30/60/90 day goals with manager',
        ),
        h2('Key Contacts'),
        p('List of people to meet and their roles.'),
      ),
    },
    {
      title: 'Policies',
      icon: '📜',
      content: doc(
        h1('Policies'),
        p('Company policies and guidelines.'),
        h2('Time Off Policy'),
        p('Describe vacation, sick leave, and public holidays.'),
        h2('Remote Work Policy'),
        p('Guidelines for remote and hybrid work arrangements.'),
        h2('Code of Conduct'),
        p('Expected behavior and how to report concerns.'),
      ),
    },
    {
      title: 'OKRs',
      icon: '🎯',
      content: doc(
        h1('OKRs'),
        p('Objectives and Key Results for the team.'),
        h2('Template'),
        p('**Objective:** [Aspirational goal]'),
        bulletList(
          'KR1: [Measurable outcome]',
          'KR2: [Measurable outcome]',
          'KR3: [Measurable outcome]',
        ),
        h2('Current Quarter'),
        p('Add your team OKRs here.'),
        h2('Previous Quarters'),
        p('Archive past OKRs for reference.'),
      ),
    },
  ],
};

const general: SpaceTemplate = {
  id: 'general',
  label: 'General',
  description: 'Getting started pages for any team',
  icon: '📁',
  pages: [
    {
      title: 'Getting Started',
      icon: '👋',
      content: doc(
        h1('Getting Started'),
        p('Welcome to this space! Use this page as a starting point.'),
        h2('What is this space for?'),
        p('Describe the purpose of this space here.'),
        h2('How to contribute'),
        bulletList(
          'Create pages for new topics',
          'Keep pages up to date',
          'Add your name to pages you maintain',
        ),
      ),
    },
    {
      title: 'Meeting Notes',
      icon: '🗒️',
      content: doc(
        h1('Meeting Notes'),
        p('Track decisions and action items from team meetings.'),
        h2('Template'),
        p('**Date:** '),
        p('**Attendees:** '),
        h2('Discussion'),
        p(''),
        h2('Action Items'),
        bulletList('[ ] Owner – Task – Due date'),
      ),
    },
    {
      title: 'Project Overview',
      icon: '🗂️',
      content: doc(
        h1('Project Overview'),
        p('A high-level summary of the project.'),
        h2('Goals'),
        p('What are we trying to achieve?'),
        h2('Scope'),
        p('What is in and out of scope?'),
        h2('Timeline'),
        p('Key milestones and deadlines.'),
        h2('Team'),
        p('List team members and their roles.'),
      ),
    },
  ],
};

// ─── registry ────────────────────────────────────────────────────────────────

export const SPACE_TEMPLATES: SpaceTemplate[] = [
  general,
  engineering,
  product,
  design,
  marketing,
  hr,
];

export const SPACE_TEMPLATE_MAP = new Map<string, SpaceTemplate>(
  SPACE_TEMPLATES.map((t) => [t.id, t]),
);
