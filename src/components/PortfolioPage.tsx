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
import { getBadgesForStackItem, getTechBadges, type TechBadge } from '../lib/techIcons';

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
    id: 'robotics-embedded',
    title: 'Robotics and Embedded Projects',
    description: 'Robotics, connected devices, firmware, sensing, simulation, and autonomous systems.'
  },
  {
    id: 'full-stack',
    title: 'Full Stack Projects',
    description: 'Web applications, data-backed platforms, APIs, and end-to-end product work.'
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

function ProjectLinks({ project }: { project: ProjectItem }) {
  return (
    <>
      {project.liveUrl ? (
        <a href={project.liveUrl} target="_blank" rel="noreferrer">
          Live site
        </a>
      ) : null}
      <a href={project.sourceUrl} target="_blank" rel="noreferrer">
        GitHub
      </a>
      {project.devpostUrl ? (
        <a href={project.devpostUrl} target="_blank" rel="noreferrer">
          DevPost
        </a>
      ) : null}
    </>
  );
}

function ProjectMeta({ project }: { project: ProjectItem }) {
  return (
    <p className="project-meta">
      <span>{project.year}</span>
      {project.featured ? <span className="project-meta-featured">Featured</span> : null}
    </p>
  );
}

function TechBadgeIcon({ badge }: { badge: TechBadge }) {
  return badge.icon ? (
    <svg aria-hidden="true" className="tech-icon" viewBox="0 0 24 24">
      <path d={badge.icon.path} fill="currentColor" />
    </svg>
  ) : (
    <span aria-hidden="true" className="tech-icon tech-monogram">
      {badge.monogram}
    </span>
  );
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg aria-hidden="true" className="project-image-nav-icon" viewBox="0 0 20 20">
      <path
        d={direction === 'left' ? 'M12.5 4.5 7 10l5.5 5.5' : 'M7.5 4.5 13 10l-5.5 5.5'}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ProjectCard({ project }: { project: ProjectItem }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [imageMotion, setImageMotion] = useState<ImageMotion>('forward');
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);
  const imageCount = project.images.length;
  const activeImage = project.images[activeImageIndex] ?? project.images[0];
  const techBadges = getTechBadges(project.stack);

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

  // Any click on the card opens the detail view, except on its own controls (carousel buttons, links).
  function handleCardClick(event: ReactMouseEvent<HTMLElement>) {
    const target = event.target as Element;

    // React bubbles clicks from the portaled dialog through this card; ignore anything outside the card's DOM.
    if (!event.currentTarget.contains(target) || target.closest('a, button')) {
      return;
    }

    setIsDetailOpen(true);
  }

  useEffect(() => {
    if (!isDetailOpen || typeof document === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const detailTrigger = detailTriggerRef.current;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDetailOpen(false);
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
      detailTrigger?.focus();
    };
  }, [imageCount, isDetailOpen]);

  const imageNavButtons =
    imageCount > 1 ? (
      <>
        <button
          aria-label={`Show previous image for ${project.title}`}
          className="project-image-nav project-image-nav-prev"
          onClick={showPreviousImage}
          type="button"
        >
          <ChevronIcon direction="left" />
        </button>
        <button
          aria-label={`Show next image for ${project.title}`}
          className="project-image-nav project-image-nav-next"
          onClick={showNextImage}
          type="button"
        >
          <ChevronIcon direction="right" />
        </button>
      </>
    ) : null;

  function renderImageDots(className: string) {
    return imageCount > 1 ? (
      <div className={`carousel-dots ${className}`} aria-label={`${project.title} image selector`}>
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
    ) : null;
  }

  return (
    <article className="project-card" key={project.id} onClick={handleCardClick} role="listitem">
      <div className="project-image-frame">
        <img
          alt={activeImage.alt}
          className="project-image"
          data-motion={imageMotion}
          draggable={false}
          key={`${project.id}-${activeImage.src}`}
          src={activeImage.src}
        />
        {imageNavButtons}
        {renderImageDots('project-image-dots')}
      </div>

      <div className="project-card-body">
        <ProjectMeta project={project} />
        <h3>{project.title}</h3>
        <p className="project-summary">{project.summary}</p>

        {techBadges.length ? (
          <ul className="tech-logos" aria-label={`${project.title} built with`}>
            {techBadges.map((badge) => (
              <li className="tech-logo" data-label={badge.label} key={badge.key}>
                <TechBadgeIcon badge={badge} />
                <span className="sr-only">{badge.label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="card-actions">
          <button
            className="project-details-button"
            onClick={() => setIsDetailOpen(true)}
            ref={detailTriggerRef}
            type="button"
          >
            View details
          </button>
          <span className="project-links">
            <ProjectLinks project={project} />
          </span>
        </div>
      </div>

      {isDetailOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              aria-labelledby={`${project.id}-detail-title`}
              aria-modal="true"
              className="project-detail-overlay"
              onClick={() => setIsDetailOpen(false)}
              role="dialog"
            >
              <div className="project-detail-surface" onClick={(event) => event.stopPropagation()}>
                <div className="project-detail-header">
                  <div>
                    <ProjectMeta project={project} />
                    <h3 id={`${project.id}-detail-title`}>{project.title}</h3>
                  </div>

                  <button
                    aria-label="Close project details"
                    autoFocus
                    className="modal-close"
                    onClick={() => setIsDetailOpen(false)}
                    type="button"
                  >
                    Close
                  </button>
                </div>

                <div className="project-detail-layout">
                  <div className="project-gallery">
                    <div className="project-gallery-stage">
                      <img
                        alt={activeImage.alt}
                        className="project-gallery-image"
                        data-motion={imageMotion}
                        key={`${project.id}-detail-${activeImage.src}`}
                        src={activeImage.src}
                      />
                      {imageNavButtons}
                    </div>

                    <div className="project-gallery-meta">
                      <p className="project-gallery-caption" data-motion={imageMotion} key={`${project.id}-caption-${activeImage.src}`}>
                        {activeImage.caption}
                      </p>
                      {imageCount > 1 ? (
                        <span className="project-gallery-counter">
                          {activeImageIndex + 1} / {imageCount}
                        </span>
                      ) : null}
                    </div>

                    {renderImageDots('project-gallery-dots')}
                  </div>

                  <div className="project-detail-copy">
                    <p>{project.summary}</p>

                    <section className="project-details-block">
                      <span className="aside-label">My role</span>
                      <p>{project.impact}</p>
                    </section>

                    {project.details.length ? (
                      <section className="project-details-block">
                        <span className="aside-label">Highlights</span>
                        <ul className="project-detail-list">
                          {project.details.map((detail) => (
                            <li key={detail}>{detail}</li>
                          ))}
                        </ul>
                      </section>
                    ) : null}

                    <section className="project-details-block">
                      <span className="aside-label">Built with</span>
                      <ul className="chip-list" aria-label={`${project.title} full stack`}>
                        {project.stack.map((item) => {
                          const [badge] = getBadgesForStackItem(item);

                          return (
                            <li className={`chip ${badge ? 'chip-with-icon' : ''}`} key={item}>
                              {badge ? <TechBadgeIcon badge={badge} /> : null}
                              {item}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  </div>
                </div>

                <div className="card-actions project-details-actions">
                  <ProjectLinks project={project} />
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
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
  const [canScroll, setCanScroll] = useState(false);
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    moved: boolean;
    pointerId: number;
    startScrollLeft: number;
    startX: number;
  } | null>(null);
  const suppressClickRef = useRef(false);

  // Only advertise dragging/swiping when the rail actually overflows (e.g. 2-3 cards fit on desktop).
  useEffect(() => {
    const rail = railRef.current;

    if (!rail || typeof ResizeObserver === 'undefined') {
      return;
    }

    const updateCanScroll = () => setCanScroll(rail.scrollWidth > rail.clientWidth + 1);
    const resizeObserver = new ResizeObserver(updateCanScroll);

    updateCanScroll();
    resizeObserver.observe(rail);

    return () => resizeObserver.disconnect();
  }, [projects.length]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    // Touch and pen get native swipe scrolling (with scroll snap), so only mice use the manual drag.
    if (event.pointerType !== 'mouse' || event.button !== 0) {
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
        {canScroll ? (
          <span className="project-rail-note">
            <span className="project-rail-note-mouse">Click and drag sideways to browse</span>
            <span className="project-rail-note-touch">Swipe sideways to browse</span>
          </span>
        ) : null}
      </div>

      <div
        aria-label={`${title} showcase`}
        className={`project-rail ${canScroll ? 'can-scroll' : ''} ${isDragging ? 'is-dragging' : ''}`}
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const sections = navItems
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section instanceof HTMLElement);
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const minOpacity = 0.05;
    const maxShift = 50;
    let frameId: number | null = null;

    const updateReveal = () => {
      frameId = null;
      const viewportHeight = window.innerHeight;

      sections.forEach((section) => {
        let progress = 1;

        if (!reducedMotionQuery.matches) {
          const rect = section.getBoundingClientRect();
          // Short sections (e.g. contact at the page bottom) must still reach full opacity once fully in view.
          const fadeDistance = Math.max(1, Math.min(viewportHeight * 0.55, rect.height * 0.8));
          progress = Math.min(1, Math.max(0, (viewportHeight - rect.top) / fadeDistance));
        }

        const eased = 1 - (1 - progress) ** 3;
        section.style.setProperty('--reveal-opacity', (minOpacity + (1 - minOpacity) * eased).toFixed(3));
        section.style.setProperty('--reveal-shift', `${((1 - eased) * maxShift).toFixed(1)}px`);
      });
    };

    const requestRevealUpdate = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(updateReveal);
    };

    requestRevealUpdate();
    window.addEventListener('scroll', requestRevealUpdate, { passive: true });
    window.addEventListener('resize', requestRevealUpdate);
    reducedMotionQuery.addEventListener('change', requestRevealUpdate);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener('scroll', requestRevealUpdate);
      window.removeEventListener('resize', requestRevealUpdate);
      reducedMotionQuery.removeEventListener('change', requestRevealUpdate);
      sections.forEach((section) => {
        section.style.removeProperty('--reveal-opacity');
        section.style.removeProperty('--reveal-shift');
      });
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
              {themeMode === 'dark' ? 'Dark' : 'Light'}
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
            <article className="hero-copy">
              <h2 className="hero-copy-title">About me</h2>
              <p className="hero-summary">{portfolio.about.summary}</p>

              <div className="action-row">
                <a className="button button-primary" href={portfolio.about.ctaPrimaryHref}>
                  {portfolio.about.ctaPrimaryLabel}
                </a>
                <a className="button button-secondary" href={portfolio.about.ctaSecondaryHref}>
                  {portfolio.about.ctaSecondaryLabel}
                </a>
              </div>
            </article>

            <aside className="hero-aside">
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
