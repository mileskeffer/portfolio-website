import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const about = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/about' }),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    role: z.string(),
    tagline: z.string(),
    intro: z.string(),
    summary: z.string(),
    location: z.string(),
    availability: z.string(),
    specialties: z.array(z.string()),
    metrics: z.array(
      z.object({
        label: z.string(),
        value: z.string()
      })
    ),
    ctaPrimaryLabel: z.string(),
    ctaPrimaryHref: z.string(),
    ctaSecondaryLabel: z.string(),
    ctaSecondaryHref: z.string()
  })
});

const projects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/projects' }),
  schema: z
    .object({
      order: z.number(),
      title: z.string(),
      year: z.string(),
      featured: z.boolean(),
      summary: z.string(),
      impact: z.string(),
      details: z.array(z.string()).min(1),
      stack: z.array(z.string()),
      images: z
        .array(
          z.object({
            src: z.string(),
            alt: z.string(),
            caption: z.string()
          })
        )
        .min(1),
      liveUrl: z.string().optional(),
      liveURL: z.string().optional(),
      sourceUrl: z.string().optional(),
      sourceURL: z.string().optional(),
      devpostUrl: z.string().optional(),
      devpostURL: z.string().optional()
    })
    .superRefine((data, ctx) => {
      if (!data.sourceUrl && !data.sourceURL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Each project needs either "sourceUrl" or "sourceURL".',
          path: ['sourceUrl']
        });
      }
    })
    .transform((data) => ({
      order: data.order,
      title: data.title,
      year: data.year,
      featured: data.featured,
      summary: data.summary,
      impact: data.impact,
      details: data.details,
      stack: data.stack,
      images: data.images,
      liveUrl: data.liveUrl ?? data.liveURL,
      sourceUrl: data.sourceUrl ?? data.sourceURL ?? '',
      devpostUrl: data.devpostUrl ?? data.devpostURL
    }))
});

const experience = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/experience' }),
  schema: z.object({
    order: z.number(),
    role: z.string(),
    company: z.string(),
    location: z.string(),
    start: z.string(),
    end: z.string(),
    summary: z.string(),
    highlights: z.array(z.string()),
    tools: z.array(z.string())
  })
});

const resume = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/resume' }),
  schema: z.object({
    order: z.number(),
    headline: z.string(),
    summary: z.string(),
    downloadFilename: z.string(),
    focusAreas: z.array(
      z.object({
        group: z.string(),
        items: z.array(z.string())
      })
    ),
    education: z.array(
      z.object({
        program: z.string(),
        institution: z.string(),
        year: z.string()
      })
    ),
    relevantCoursework: z.array(z.string()),
    certifications: z.array(z.string())
  })
});

const contact = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/contact' }),
  schema: z.object({
    order: z.number(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    timezone: z.string(),
    availability: z.string(),
    blurb: z.string(),
    links: z.array(
      z.object({
        label: z.string(),
        url: z.string()
      })
    )
  })
});

export const collections = {
  about,
  projects,
  experience,
  resume,
  contact
};
