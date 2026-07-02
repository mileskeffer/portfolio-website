import { getCollection } from 'astro:content';

function sortByOrder<T extends { data: { order: number } }>(entries: T[]) {
  return [...entries].sort((left, right) => left.data.order - right.data.order);
}

function firstEntry<T extends { data: unknown }>(entries: T[], collectionName: string): T['data'] {
  const entry = entries[0];

  if (!entry) {
    throw new Error(`Expected at least one entry in the "${collectionName}" collection.`);
  }

  return entry.data;
}

export async function getPortfolioContent() {
  const [aboutEntries, projectEntries, experienceEntries, resumeEntries, contactEntries] = await Promise.all([
    getCollection('about'),
    getCollection('projects'),
    getCollection('experience'),
    getCollection('resume'),
    getCollection('contact')
  ]);

  const about = firstEntry(sortByOrder(aboutEntries), 'about');
  const resume = firstEntry(sortByOrder(resumeEntries), 'resume');
  const contact = firstEntry(sortByOrder(contactEntries), 'contact');

  const projects = [...projectEntries]
    .sort((left, right) => {
      if (left.data.featured !== right.data.featured) {
        return Number(right.data.featured) - Number(left.data.featured);
      }

      return left.data.order - right.data.order;
    })
    .map(({ id, data }) => ({
      id,
      ...data
    }));

  const experience = sortByOrder(experienceEntries).map(({ id, data }) => ({
    id,
    ...data
  }));

  return {
    about,
    projects,
    experience,
    resume,
    contact
  };
}

export function getClientPortfolioContent(portfolio: FullPortfolioContent) {
  return {
    about: portfolio.about,
    projects: portfolio.projects,
    experience: portfolio.experience,
    resume: portfolio.resume,
    contact: {
      blurb: portfolio.contact.blurb
    }
  };
}

export function getProtectedContactContent(portfolio: FullPortfolioContent) {
  return {
    email: portfolio.contact.email,
    phone: portfolio.contact.phone,
    location: portfolio.contact.location,
    timezone: portfolio.contact.timezone,
    availability: portfolio.contact.availability,
    links: portfolio.contact.links
  };
}

export function buildResumeDownloadText(portfolio: FullPortfolioContent) {
  const focusAreas = portfolio.resume.focusAreas
    .map((area) => `${area.group}\n${area.items.map((item) => `- ${item}`).join('\n')}`)
    .join('\n\n');

  const education = portfolio.resume.education
    .map((item) => `${item.program} | ${item.institution} | ${item.year}`)
    .join('\n');

  const relevantCoursework = portfolio.resume.relevantCoursework.map((course) => `- ${course}`).join('\n');
  const certifications = portfolio.resume.certifications.map((item) => `- ${item}`).join('\n');
  const volunteerWork = portfolio.resume.volunteerWork
    .map(
      (item) =>
        `${item.title} | ${item.organization}${item.organizationUrl ? ` (${item.organizationUrl})` : ''} | ${item.period}\n${item.summary}`
    )
    .join('\n\n');
  const extracurriculars = portfolio.resume.extracurriculars
    .map(
      (item) =>
        `${item.title} | ${item.organization}${item.organizationUrl ? ` (${item.organizationUrl})` : ''} | ${item.period}\n${item.summary}`
    )
    .join('\n\n');
  const experience = portfolio.experience
    .map(
      (item) =>
        `${item.role} | ${item.company} | ${item.start} - ${item.end}\n${item.summary}\n${item.highlights
          .map((highlight) => `- ${highlight}`)
          .join('\n')}`
    )
    .join('\n\n');

  return [
    portfolio.about.name,
    portfolio.about.role,
    portfolio.contact.email,
    portfolio.contact.phone,
    portfolio.contact.location,
    '',
    portfolio.resume.summary,
    '',
    'FOCUS AREAS',
    focusAreas,
    '',
    'EXPERIENCE',
    experience,
    '',
    'EDUCATION',
    education,
    '',
    'RELEVANT COURSEWORK',
    relevantCoursework,
    '',
    'CERTIFICATIONS',
    certifications,
    ...(volunteerWork ? ['', 'VOLUNTEER WORK', volunteerWork] : []),
    ...(extracurriculars ? ['', 'EXTRACURRICULARS', extracurriculars] : [])
  ].join('\n');
}

export type FullPortfolioContent = Awaited<ReturnType<typeof getPortfolioContent>>;
export type ClientPortfolioContent = ReturnType<typeof getClientPortfolioContent>;
export type ProtectedContactContent = ReturnType<typeof getProtectedContactContent>;
