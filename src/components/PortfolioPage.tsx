import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent
} from 'react';
import { createPortal } from 'react-dom';
import type { ClientPortfolioContent, ProtectedContactContent } from '../lib/portfolio';

type Props = {
  portfolio: ClientPortfolioContent;
  contactDetails: ProtectedContactContent;
};

type ProjectItem = ClientPortfolioContent['projects'][number];
type ThemeMode = 'light' | 'dark';
type ImageMotion = 'forward' | 'backward';
type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void | Promise<void>) => {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
};

const navItems = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  // { id: 'experience', label: 'Experience' },
  { id: 'resume', label: 'Resume' },
  { id: 'contact', label: 'Contact' }
] as const;

const themeStorageKey = 'portfolio-theme';

const projectGroups: Array<{
  description: string;
  id: ProjectItem['category'];
  title: string;
}> = [
  {
    id: 'full-stack',
    title: 'Full Stack Projects',
    description: 'Web applications, data-backed platforms, APIs, and end-to-end product work.'
  },
  {
    id: 'robotics-embedded',
    title: 'Robotics and Embedded Projects',
    description: 'Robotics, connected devices, firmware, sensing, simulation, and autonomous systems.'
  },
  {
    id: 'misc',
    title: 'Misc Projects',
    description: 'Games, experiments, hackathon builds, and projects that cross disciplines.'
  }
];

function getProjectCategory(project: ProjectItem): ProjectItem['category'] {
  if (project.category) {
    return project.category;
  }

  const searchableProjectText = `${project.title} ${project.stack.join(' ')}`.toLowerCase();

  if (/pandata|asltranslate|flask|express|sqlalchemy|mysql/.test(searchableProjectText)) {
    return 'full-stack';
  }

  if (/robot|turtlebot|esp32|arduino|ros 2|embedded|bluetooth low energy/.test(searchableProjectText)) {
    return 'robotics-embedded';
  }

  return 'misc';
}

function ProjectCard({ project }: { project: ProjectItem }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageMotion, setImageMotion] = useState<ImageMotion>('forward');
  const imageCount = project.images.length;
  const activeImage = project.images[activeImageIndex] ?? project.images[0];

  function showImage(nextIndex: number, motion?: ImageMotion) {
    const normalizedIndex = (nextIndex + imageCount) % imageCount;

    if (normalizedIndex === activeImageIndex) {
      return;
    }

    setImageMotion(motion ?? (normalizedIndex > activeImageIndex ? 'forward' : 'backward'));
    startTransition(() => {
      setActiveImageIndex(normalizedIndex);
    });
  }

  function showPreviousImage() {
    showImage(activeImageIndex - 1, 'backward');
  }

  function showNextImage() {
    showImage(activeImageIndex + 1, 'forward');
  }

  useEffect(() => {
    if (!isLightboxOpen || typeof document === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false);
        return;
      }

      if (imageCount <= 1) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        setImageMotion('backward');
        startTransition(() => {
          setActiveImageIndex((currentIndex) => (currentIndex - 1 + imageCount) % imageCount);
        });
      }

      if (event.key === 'ArrowRight') {
        setImageMotion('forward');
        startTransition(() => {
          setActiveImageIndex((currentIndex) => (currentIndex + 1) % imageCount);
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [imageCount, isLightboxOpen]);

  return (
    <article className="project-card" key={project.id} role="listitem">
      <div className="project-media-column">
        <div className="project-carousel">
          <div className="project-image-frame">
            <button
              aria-label={`Open larger image for ${project.title}: ${activeImage.caption}`}
              className="project-image-button"
              onClick={() => setIsLightboxOpen(true)}
              type="button"
            >
              <img
                alt={activeImage.alt}
                className="project-image"
                data-motion={imageMotion}
                draggable={false}
                key={`${project.id}-${activeImage.src}`}
                src={activeImage.src}
              />
              <span className="project-image-zoom-hint" aria-hidden="true">
                <svg aria-hidden="true" className="project-image-zoom-icon" viewBox="0 0 20 20">
                  <path
                    d="M4 8V4h4M12 4h4v4M4 12v4h4M16 12v4h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </span>
            </button>

            {imageCount > 1 ? (
              <div className="project-carousel-controls">
                <button
                  aria-label={`Show previous image for ${project.title}`}
                  className="carousel-button"
                  onClick={showPreviousImage}
                  type="button"
                >
                  Prev
                </button>
                <button
                  aria-label={`Show next image for ${project.title}`}
                  className="carousel-button"
                  onClick={showNextImage}
                  type="button"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>

          <div className="project-carousel-footer">
            <p className="project-carousel-caption" data-motion={imageMotion} key={`${project.id}-${activeImage.caption}`}>
              {activeImage.caption}
            </p>

            {imageCount > 1 ? (
              <div className="carousel-dots" aria-label={`${project.title} image selector`}>
                {project.images.map((image, index) => (
                  <button
                    aria-label={`Show image ${index + 1} for ${project.title}`}
                    aria-pressed={index === activeImageIndex}
                    className={`carousel-dot ${index === activeImageIndex ? 'is-active' : ''}`}
                    key={`${project.id}-${image.src}`}
                    onClick={() => showImage(index, index > activeImageIndex ? 'forward' : 'backward')}
                    type="button"
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {isLightboxOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              aria-labelledby={`${project.id}-lightbox-title`}
              aria-modal="true"
              className="project-lightbox"
              onClick={() => setIsLightboxOpen(false)}
              role="dialog"
            >
              <div className="project-lightbox-surface" onClick={(event) => event.stopPropagation()}>
                <div className="project-lightbox-header">
                  <div>
                    <p className="project-lightbox-eyebrow" data-motion={imageMotion}>
                      {project.title}
                    </p>
                    <h4 data-motion={imageMotion} id={`${project.id}-lightbox-title`} key={`${project.id}-lightbox-title-${activeImage.caption}`}>
                      {activeImage.caption}
                    </h4>
                  </div>

                  <button
                    aria-label="Close enlarged project image"
                    className="modal-close"
                    onClick={() => setIsLightboxOpen(false)}
                    type="button"
                  >
                    Close
                  </button>
                </div>

                <div className="project-lightbox-image-shell">
                  <img
                    alt={activeImage.alt}
                    className="project-lightbox-image"
                    data-motion={imageMotion}
                    key={`${project.id}-lightbox-${activeImage.src}`}
                    src={activeImage.src}
                  />

                  {imageCount > 1 ? (
                    <div className="project-lightbox-controls">
                      <button
                        aria-label={`Show previous enlarged image for ${project.title}`}
                        className="carousel-button"
                        onClick={showPreviousImage}
                        type="button"
                      >
                        Prev
                      </button>
                      <button
                        aria-label={`Show next enlarged image for ${project.title}`}
                        className="carousel-button"
                        onClick={showNextImage}
                        type="button"
                      >
                        Next
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="project-lightbox-meta">
                  <p className="project-lightbox-caption" data-motion={imageMotion} key={`${project.id}-lightbox-caption-${activeImage.alt}`}>
                    {activeImage.alt}
                  </p>
                  {imageCount > 1 ? (
                    <span className="project-lightbox-counter">
                      {activeImageIndex + 1} / {imageCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      <div className="project-copy-column">
        <div className="card-topline">
          <span>{project.year}</span>
          <span>{project.featured ? 'Featured' : 'Case study'}</span>
        </div>

        <h3>{project.title}</h3>
        <div className="project-copy-body">
          <p>{project.summary}</p>
          <p className="impact-copy">{project.impact}</p>

          <ul className="project-detail-list">
            {project.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>

          <ul className="chip-list" aria-label={`${project.title} stack`}>
            {project.stack.map((item) => (
              <li className="chip" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="card-actions">
          {project.liveUrl ? (
            <a href={project.liveUrl} target="_blank" rel="noreferrer">
              Live site
            </a>
          ) : null}
          <a href={project.sourceUrl} target="_blank" rel="noreferrer">
            GitHub link
          </a>
          {project.devpostUrl ? (
            <a href={project.devpostUrl} target="_blank" rel="noreferrer">
              DevPost
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ProjectRail({
  description,
  id,
  projects,
  title
}: {
  description: string;
  id: string;
  projects: ProjectItem[];
  title: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    moved: boolean;
    pointerId: number;
    startScrollLeft: number;
    startX: number;
  } | null>(null);
  const suppressClickRef = useRef(false);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    const target = event.target instanceof HTMLElement ? event.target : null;

    if (target?.closest('a, button, input, textarea, select, label')) {
      return;
    }

    const rail = railRef.current;

    if (!rail || rail.scrollWidth <= rail.clientWidth) {
      return;
    }

    dragStateRef.current = {
      moved: false,
      pointerId: event.pointerId,
      startScrollLeft: rail.scrollLeft,
      startX: event.clientX
    };

    suppressClickRef.current = false;
    rail.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const rail = railRef.current;
    const dragState = dragStateRef.current;

    if (!rail || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;

    if (!dragState.moved && Math.abs(deltaX) > 6) {
      dragState.moved = true;
      suppressClickRef.current = true;
    }

    if (!dragState.moved) {
      return;
    }

    event.preventDefault();
    rail.scrollLeft = dragState.startScrollLeft - deltaX;
  }

  function finishDrag(pointerId: number) {
    const rail = railRef.current;
    const dragState = dragStateRef.current;

    if (!rail || !dragState || dragState.pointerId !== pointerId) {
      return;
    }

    if (rail.hasPointerCapture(pointerId)) {
      rail.releasePointerCapture(pointerId);
    }

    dragStateRef.current = null;
    setIsDragging(false);
  }

  function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }

  return (
    <section className="project-group" aria-labelledby={`${id}-projects-heading`}>
      <div className="project-rail-header">
        <div>
          <h3 id={`${id}-projects-heading`}>{title}</h3>
          <p className="project-rail-copy">{description}</p>
        </div>
        <span className="project-rail-note">Click and drag sideways to browse</span>
      </div>

      <div
        aria-label={`${title} showcase`}
        className={`project-rail ${isDragging ? 'is-dragging' : ''}`}
        onClickCapture={handleClickCapture}
        onPointerCancel={(event) => finishDrag(event.pointerId)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishDrag(event.pointerId)}
        ref={railRef}
        role="list"
      >
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}

export default function PortfolioPage({ portfolio, contactDetails }: Props) {
  const [themeMode, setThemeMode] = useState<ThemeMode | null>(null);
  const [activeSection, setActiveSection] = useState<(typeof navItems)[number]['id']>('about');
  const orbParallaxFrameRef = useRef<number | null>(null);
  const themeRepaintFrameRef = useRef<number[]>([]);
  const brandInitial = portfolio.about.name.trim().charAt(0).toUpperCase() || 'P';
  const volunteerWork = portfolio.resume.volunteerWork ?? [];
  const extracurriculars = portfolio.resume.extracurriculars ?? [];

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setThemeMode(nextTheme);
  }, []);

  useEffect(() => {
    const sections = navItems
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section instanceof HTMLElement);

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (visibleSections[0]) {
          setActiveSection(visibleSections[0].target.id as (typeof navItems)[number]['id']);
        }
      },
      {
        rootMargin: '-20% 0px -45% 0px',
        threshold: [0.25, 0.4, 0.6]
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      themeRepaintFrameRef.current.forEach((frameId) => window.cancelAnimationFrame(frameId));
      themeRepaintFrameRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const rootStyle = document.documentElement.style;
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const setParallax = () => {
      orbParallaxFrameRef.current = null;

      if (reducedMotionQuery.matches) {
        rootStyle.setProperty('--orb-parallax-x', '0px');
        rootStyle.setProperty('--orb-parallax-y', '0px');
        rootStyle.setProperty('--grid-scroll-y', '0px');
        return;
      }

      const scrollY = window.scrollY || window.pageYOffset || 0;
      const scrollX = window.scrollX || 0;
      const maxHorizontalDrift = window.innerWidth * 0.035;
      const maxVerticalDrift = window.innerHeight * 0.18;
      const horizontalDrift = Math.max(
        -maxHorizontalDrift,
        Math.min(maxHorizontalDrift, scrollX * -0.04 + scrollY * 0.02)
      );
      const verticalDrift = -Math.min(scrollY * 0.14, maxVerticalDrift);
      const gridScrollY = scrollY * -0.08;

      rootStyle.setProperty('--orb-parallax-x', `${Math.round(horizontalDrift)}px`);
      rootStyle.setProperty('--orb-parallax-y', `${Math.round(verticalDrift)}px`);
      rootStyle.setProperty('--grid-scroll-y', `${Math.round(gridScrollY)}px`);
    };

    const requestParallaxUpdate = () => {
      if (orbParallaxFrameRef.current !== null) {
        return;
      }

      orbParallaxFrameRef.current = window.requestAnimationFrame(setParallax);
    };

    const handleMotionPreferenceChange = () => {
      requestParallaxUpdate();
    };

    requestParallaxUpdate();
    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    window.addEventListener('resize', requestParallaxUpdate);
    reducedMotionQuery.addEventListener('change', handleMotionPreferenceChange);

    return () => {
      if (orbParallaxFrameRef.current !== null) {
        window.cancelAnimationFrame(orbParallaxFrameRef.current);
        orbParallaxFrameRef.current = null;
      }

      window.removeEventListener('scroll', requestParallaxUpdate);
      window.removeEventListener('resize', requestParallaxUpdate);
      reducedMotionQuery.removeEventListener('change', handleMotionPreferenceChange);
      rootStyle.removeProperty('--orb-parallax-x');
      rootStyle.removeProperty('--orb-parallax-y');
      rootStyle.removeProperty('--grid-scroll-y');
    };
  }, []);

  function toggleTheme() {
    const nextTheme: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);

    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const applyTheme = () => {
        root.dataset.theme = nextTheme;
        root.style.colorScheme = nextTheme;
      };
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const viewTransitionDocument = document as ViewTransitionDocument;

      themeRepaintFrameRef.current.forEach((frameId) => window.cancelAnimationFrame(frameId));
      themeRepaintFrameRef.current = [];

      if (!prefersReducedMotion && typeof viewTransitionDocument.startViewTransition === 'function') {
        void viewTransitionDocument.startViewTransition(() => {
          applyTheme();
        }).finished.catch(() => {
          // Ignore transition failures and keep the theme change.
        });
      } else {
        root.dataset.themeRepaint = 'true';
        applyTheme();

        const firstFrame = window.requestAnimationFrame(() => {
          const secondFrame = window.requestAnimationFrame(() => {
            delete root.dataset.themeRepaint;
            themeRepaintFrameRef.current = [];
          });

          themeRepaintFrameRef.current = [secondFrame];
        });

        themeRepaintFrameRef.current = [firstFrame];
      }
    }

    try {
      window.localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // Ignore storage failures and keep the in-memory theme switch working.
    }
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#about">
          <span className="brand-mark">{brandInitial}</span>
          <span className="brand-copy">
            <strong>{portfolio.about.name}</strong>
            <span>{portfolio.about.role}</span>
          </span>
        </a>

        <div className="topbar-actions">
          <nav className="section-nav" aria-label="Section navigation">
            {navItems.map((item) => (
              <a
                key={item.id}
                className={`nav-link ${activeSection === item.id ? 'is-active' : ''}`}
                href={`#${item.id}`}
                aria-current={activeSection === item.id ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button
            aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="theme-toggle"
            onClick={toggleTheme}
            type="button"
          >
            <span className="theme-toggle-icon" aria-hidden="true">
              {themeMode === 'dark' ? 'Moon' : 'Sun'}
            </span>
            <span className="theme-toggle-copy">
              <strong>Theme</strong>
              <span>{themeMode === 'dark' ? 'Dark mode' : themeMode === 'light' ? 'Light mode' : 'Auto'}</span>
            </span>
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="section-shell section-glass hero-section" id="about">
          <div className="section-heading hero-heading">
            <h1>{portfolio.about.tagline}</h1>
            <p className="section-intro">{portfolio.about.intro}</p>
          </div>

          <div className="hero-grid">
            <article className="hero-card hero-copy">
              <p className="eyebrow">Based in {portfolio.about.location}</p>
              <h2>{portfolio.about.role}</h2>
              <p>{portfolio.about.summary}</p>

              <div className="action-row">
                <a className="button button-primary" href={portfolio.about.ctaPrimaryHref}>
                  {portfolio.about.ctaPrimaryLabel}
                </a>
                <a className="button button-secondary" href={portfolio.about.ctaSecondaryHref}>
                  {portfolio.about.ctaSecondaryLabel}
                </a>
              </div>
            </article>

            <aside className="hero-card hero-aside">
              <div className="aside-block">
                <span className="aside-label">Availability</span>
                <p>{portfolio.about.availability}</p>
              </div>

              <div className="aside-block">
                <span className="aside-label">Focus</span>
                <ul className="specialty-list">
                  {portfolio.about.specialties.map((specialty) => (
                    <li key={specialty}>{specialty}</li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>

          {/* <div className="stats-grid" aria-label="Key stats">
            {portfolio.about.metrics.map((metric) => (
              <article className="stat-card" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div> */}
        </section>

        <section className="section-shell section-glass" id="projects">
          <div className="section-heading">
            <span className="section-kicker">Projects</span>
            <h2>Recent Projects of Mine</h2>
            <p className="section-intro">
              These projects have been completed as part of my coursework and personal development in computer science, with a focus on embedded systems, IoT, and full-stack development.
            </p>
          </div>

          <div className="project-groups">
            {projectGroups.map((group) => {
              const projects = portfolio.projects.filter((project) => getProjectCategory(project) === group.id);

              return projects.length ? <ProjectRail key={group.id} {...group} projects={projects} /> : null;
            })}
          </div>
        </section>

        {/* <section className="section-shell" id="experience">
          <div className="section-heading">
            <span className="section-kicker">Experience</span>
            <h2>Roles where product thinking, systems work, and shipping discipline all mattered.</h2>
          </div>

          <div className="timeline">
            {portfolio.experience.map((item) => (
              <article className="timeline-item" key={item.id}>
                <div className="timeline-meta">
                  <p>
                    {item.start} - {item.end}
                  </p>
                  <span>{item.location}</span>
                </div>

                <div className="timeline-body">
                  <h3>{item.role}</h3>
                  <p className="timeline-company">{item.company}</p>
                  <p>{item.summary}</p>

                  <ul className="detail-list">
                    {item.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>

                  <ul className="chip-list" aria-label={`${item.role} tools`}>
                    {item.tools.map((tool) => (
                      <li className="chip" key={tool}>
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section> */}

        <section className="section-shell section-glass" id="resume">
          <div className="section-heading">
            <span className="section-kicker">Resume</span>
            <h2>{portfolio.resume.headline}</h2>
            <p className="section-intro">{portfolio.resume.summary}</p>
          </div>

          <div className="resume-sheet">
            <section className="resume-block" aria-labelledby="resume-strengths-heading">
              <h3 id="resume-strengths-heading">Core Strengths</h3>

              <div className="resume-columns">
                {portfolio.resume.focusAreas.map((area) => (
                  <div className="resume-group" key={area.group}>
                    <h4>{area.group}</h4>
                    <ul className="resume-bullet-list">
                      {area.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <div className="resume-meta-grid">
              <section className="resume-block" aria-labelledby="resume-education-heading">
                <h3 id="resume-education-heading">Education</h3>
                <ul className="resume-credential-list">
                  {portfolio.resume.education.map((item) => (
                    <li key={`${item.program}-${item.institution}`}>
                      <strong>{item.program}</strong>
                      <span>
                        {item.institution} | {item.year}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="resume-block" aria-labelledby="resume-certifications-heading">
                <h3 id="resume-certifications-heading">Certifications</h3>
                <ul className="resume-bullet-list">
                  {portfolio.resume.certifications.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>

            <section className="resume-block" aria-labelledby="resume-coursework-heading">
              <h3 id="resume-coursework-heading">Relevant Coursework</h3>
              <ul className="resume-coursework-list">
                {portfolio.resume.relevantCoursework.map((course) => (
                  <li key={course}>{course}</li>
                ))}
              </ul>
            </section>

            {volunteerWork.length || extracurriculars.length ? (
              <section className="resume-block" aria-labelledby="resume-community-heading">
                <h3 id="resume-community-heading">Volunteer Work &amp; Extracurriculars</h3>

                <div className="resume-activity-grid">
                  {volunteerWork.length ? (
                    <div className="resume-group">
                      <h4>Volunteer Work</h4>
                      <ul className="resume-activity-list">
                        {volunteerWork.map((activity) => (
                          <li key={`${activity.title}-${activity.organization}-${activity.period}`}>
                            <div className="resume-activity-heading">
                              <strong>{activity.title}</strong>
                              <span>{activity.period}</span>
                            </div>
                            {activity.organizationUrl ? (
                              <a
                                className="resume-activity-organization"
                                href={activity.organizationUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {activity.organization}
                              </a>
                            ) : (
                              <span className="resume-activity-organization">{activity.organization}</span>
                            )}
                            <p>{activity.summary}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {extracurriculars.length ? (
                    <div className="resume-group">
                      <h4>Extracurriculars</h4>
                      <ul className="resume-activity-list">
                        {extracurriculars.map((activity) => (
                          <li key={`${activity.title}-${activity.organization}-${activity.period}`}>
                            <div className="resume-activity-heading">
                              <strong>{activity.title}</strong>
                              <span>{activity.period}</span>
                            </div>
                            {activity.organizationUrl ? (
                              <a
                                className="resume-activity-organization"
                                href={activity.organizationUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {activity.organization}
                              </a>
                            ) : (
                              <span className="resume-activity-organization">{activity.organization}</span>
                            )}
                            <p>{activity.summary}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="resume-block resume-download-row" aria-labelledby="resume-download-heading">
              <div className="resume-download-copy">
                <h3 id="resume-download-heading">Want the PDF?</h3>
                <p>Contact me and let me know you&apos;d like a copy. I&apos;m happy to send over the latest version.</p>
              </div>

              <div className="resume-download-actions">
                <a className="button button-primary" href="#contact">
                  Contact me for the full resume
                </a>
              </div>
            </section>
          </div>
        </section>

        <section className="section-shell section-glass contact-section" id="contact">
          <div className="section-heading">
            <span className="section-kicker">Contact</span>
            <h2>Let&apos;s talk!</h2>
            <p className="section-intro">{portfolio.contact.blurb}</p>
          </div>

          <div className="contact-grid">
            <article className="detail-card">
              <h3>Details</h3>
              <ul className="detail-list">
                <li>
                  <strong>Email</strong>
                  <a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a>
                </li>
                <li>
                  <strong>Phone</strong>
                  <a href={`tel:${contactDetails.phone}`}>{contactDetails.phone}</a>
                </li>
                <li>
                  <strong>Location</strong>
                  <span>{contactDetails.location}</span>
                </li>
                <li>
                  <strong>Timezone</strong>
                  <span>{contactDetails.timezone}</span>
                </li>
                <li>
                  <strong>Availability</strong>
                  <span>{contactDetails.availability}</span>
                </li>
              </ul>
            </article>

            <article className="detail-card">
              <h3>Links</h3>
              <ul className="detail-list">
                {contactDetails.links.map((link) => (
                  <li key={link.label}>
                    <strong>{link.label}</strong>
                    <a href={link.url} target="_blank" rel="noreferrer">
                      {link.url.replace(/^https?:\/\//, '')}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
