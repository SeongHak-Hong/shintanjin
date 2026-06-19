import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_CHATBOT } from '../constants/routes';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BlurFade } from './ui/blur-fade';
import { Floating, FloatingElement } from './ui/ParallaxFloating';
import { motion } from 'framer-motion';
import sbcLogo from '../assets/SBC-logo.svg';
import PageTransition from './PageTransition';

gsap.registerPlugin(ScrollTrigger);

// Navigation menu data with 2-depth sub-items
const NAV_MENU_DATA = [
  {
    id: 'about',
    label: '교회소개',
    desc: '은혜가 머무는 신탄진교회의 비전과 섬기는 사람들의 이야기',
    children: [
      { id: 'greeting', label: '인사말 및 비전' },
      { id: 'worship-direction', label: '예배 및 오시는 길' },
      { id: 'leaders', label: '섬기는 사람들' },
    ],
  },
  {
    id: 'worship',
    label: '예배찬양',
    desc: '영혼을 깨우는 생명력 있는 말씀과 깊은 울림이 있는 찬양',
    children: [
      { id: 'sermons', label: '주일 및 수요 말씀' },
      { id: 'choir-gallery', label: '찬양대 갤러리' },
    ],
  },
  {
    id: 'training',
    label: '양육훈련',
    desc: '신앙의 뿌리를 내리고 삶을 나누는 따뜻한 성장의 시간',
    children: [
      { id: 'newcomer', label: '새가족 안내' },
      { id: 'smallgroup', label: '교구 및 소그룹' },
    ],
  },
  {
    id: 'nextgen',
    label: '다음세대',
    desc: '말씀 안에서 꿈을 키우며 자라나는 우리 교회의 빛나는 미래',
    children: null, // 단일 페이지
  },
  {
    id: 'mission',
    label: '선교전도',
    desc: '이웃과 열방을 향해 예수 그리스도의 사랑을 흘려보내는 발걸음',
    children: null, // 단일 페이지
  },
  {
    id: 'community',
    label: '나눔터',
    desc: '매주 업데이트되는 교회의 생생한 소식과 성도들의 아름다운 일상',
    children: [
      { id: 'news', label: '교회 소식 및 주보' },
      { id: 'fellowship', label: '교우동정 및 갤러리' },
      { id: 'schedule', label: '사역 일정' },
    ],
  },
];

// Capabilities tab content configuration
const CAPABILITIES_TABS = [
  {
    id: "cities",
    title: "Cities & Infrastructure",
    image: "https://cdn.prod.website-files.com/695e44c5cda75248659e97f1/697b9086bf46f572e49c7ce3_Cities%20%26%20infrastructure.webp",
    alt: "district heating (100–250 °C) and seawater desalination (100–200 °C)"
  },
  {
    id: "materials",
    title: "Materials & Manufacturing",
    image: "https://cdn.prod.website-files.com/695e44c5cda75248659e97f1/697b9086b5bb830f9131a517_Materials%20%26%20manufacturing.webp",
    alt: "Recycled Polymer, Tape & Lamination, Lamination & Paperboard"
  },
  {
    id: "fuels",
    title: "Fuels & Upstream",
    image: "https://cdn.prod.website-files.com/695e44c5cda75248659e97f1/697b9087b0a86eeb3a2db9a0_Fuels%20%26%20upstream.webp",
    alt: "petrochemical, oil refining, fertilizers"
  },
  {
    id: "hydrogen",
    title: "H₂ Hydrogen",
    image: "https://cdn.prod.website-files.com/695e44c5cda75248659e97f1/697b9086bea790d5c29d9f7f_H2%20Hydrogen.webp",
    alt: "methane reforming, steam electrolysis, thermochemical hydrogen"
  }
];

export default function MainPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [worshipVideoId, setWorshipVideoId] = useState('myMnI5oGxQs'); // Fallback default ID

  useEffect(() => {
    const fetchLatestWorshipVideo = async () => {
      try {
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        if (!apiKey) {
          console.warn('VITE_YOUTUBE_API_KEY is missing. Using fallback video.');
          return;
        }

        const channelId = 'UCj3wg1t2u2eiMQxWIgT2OeQ';
        const query = encodeURIComponent('주일예배 | 주일2부예배');
        const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10&q=${query}&type=video`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          // Filter out Wednesday/Afternoon worships
          const filteredItems = data.items.filter(item => {
            const title = item.snippet.title;
            return !title.includes('수요') && !title.includes('오후');
          });

          if (filteredItems.length > 0) {
            setWorshipVideoId(filteredItems[0].id.videoId);
          } else {
            setWorshipVideoId(data.items[0].id.videoId);
          }
        }
      } catch (error) {
        console.error('Error fetching YouTube video:', error);
      }
    };

    fetchLatestWorshipVideo();
  }, []);

  const videoSectionRef = useRef(null);
  const videoWrapperRef = useRef(null);
  const videoTextRef = useRef(null);
  const scrollFlipComponentRef = useRef(null);
  const scrollFlipOriginRef = useRef(null);
  const videoOverlayRef = useRef(null);
  const videoDetailLineRef = useRef(null);

  const handleStartChatbot = () => {
    navigate(ROUTE_CHATBOT);
  };

  // Flyout navigation hover state
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [activeMenuData, setActiveMenuData] = useState(null);
  const [showFlyout, setShowFlyout] = useState(false);
  const menuCloseTimerRef = useRef(null);

  const handleMenuEnter = useCallback((menuId) => {
    if (menuCloseTimerRef.current) {
      clearTimeout(menuCloseTimerRef.current);
      menuCloseTimerRef.current = null;
    }
    setHoveredMenu(menuId);
    const data = NAV_MENU_DATA.find((m) => m.id === menuId);
    if (data) {
      setActiveMenuData(data);
      setShowFlyout(true);
    }
  }, []);

  const handleMenuLeave = useCallback(() => {
    menuCloseTimerRef.current = setTimeout(() => {
      setHoveredMenu(null);
      setShowFlyout(false);
      menuCloseTimerRef.current = null;
    }, 150);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (menuCloseTimerRef.current) clearTimeout(menuCloseTimerRef.current);
    };
  }, []);

  // Mobile menu states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileActiveMenu, setMobileActiveMenu] = useState(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Header scroll visibility logic
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const footerWrapRef = useRef(null);
  const nfwRef = useRef(null);
  const footerRef = useRef(null);
  const [footerHeight, setFooterHeight] = useState(0);

  // Measure footer height accurately even after images load
  useEffect(() => {
    if (footerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setFooterHeight(entry.target.offsetHeight);
        }
      });
      observer.observe(footerRef.current);

      // Initial measurement
      setFooterHeight(footerRef.current.offsetHeight);

      return () => observer.disconnect();
    }
  }, []);

  // Footer reveal: fixed footer with translateY parallax & welcome section scale (desktop only)
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: nfwRef.current,
          start: "top top",
          end: "max",
          scrub: true,
        }
      });

      tl.fromTo(footerRef.current,
        { y: "15%" },
        { y: "0%", ease: "none" }
      ).fromTo(nfwRef.current,
        { scale: 1, transformOrigin: "bottom center" },
        { scale: 0.98, ease: "none" },
        "<" // start at the same time
      );
    });
    return () => mm.revert();
  }, [footerHeight]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsAtTop(currentScrollY < 10);

      // Hide if scrolling down and past 50px, otherwise show
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Scroll-flip animation: video expands from grid position to fullscreen on scroll
  useEffect(() => {
    const componentEl = scrollFlipComponentRef.current;
    const originEl = scrollFlipOriginRef.current;
    const videoBlock = videoWrapperRef.current;
    const overlayEl = videoOverlayRef.current;
    const detailLineEl = videoDetailLineRef.current;

    if (!componentEl || !originEl || !videoBlock || !overlayEl) return;

    // Only run on desktop (>=992px), matching zetta-joule.com behavior
    const mm = gsap.matchMedia();

    mm.add('(min-width: 992px)', (context) => {
      // Hide overlay details initially
      gsap.set(overlayEl, { opacity: 0 });
      if (detailLineEl) {
        gsap.set(detailLineEl, { width: '50%', opacity: 0 });
      }

      let detailsAreVisible = false;

      // Detail text reveal timeline (paused, triggered by scroll progress)
      const detailTl = gsap.timeline({ paused: true });
      detailTl
        .to(overlayEl, { opacity: 1, duration: 0.1 });
      if (detailLineEl) {
        detailTl.to(detailLineEl, { width: '100%', opacity: 1, duration: 0.9, ease: 'power4.out' });
      }

      // Calculate the transform needed to go from origin position to fullscreen
      function createScrollFlipAnimation() {
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        const videoOuterEl = originEl.querySelector('.sbc-video-wrapper-outer');
        if (!videoOuterEl) return null;

        const videoInnerEl = videoOuterEl.querySelector('.sbc-video-wrapper');
        if (!videoInnerEl) return null;

        // Ensure transform-origin is top left so x/y translation moves the top-left corner
        gsap.set(videoInnerEl, { transformOrigin: 'top left' });

        const compRect = componentEl.getBoundingClientRect();
        const outerRect = videoOuterEl.getBoundingClientRect();

        // Calculate position relative to the component container
        // Since componentEl is pinned at the top of the viewport,
        // moving the element to (-relLeft, -relTop) will place it at (0, 0) of the viewport.
        const relLeft = outerRect.left - compRect.left;
        const relTop = outerRect.top - compRect.top;
        const elWidth = outerRect.width;
        const elHeight = outerRect.height;

        // Set componentEl to be the pin container: 100vh, relative, overflow hidden
        gsap.set(componentEl, {
          position: 'relative',
          height: '100vh',
          overflow: 'hidden',
        });

        const flipTl = gsap.timeline({
          scrollTrigger: {
            trigger: componentEl,
            start: 'top top',
            end: '+=100%',
            pin: true,
            scrub: 0.4,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              // Show/hide detail overlay at ~50% progress
              if (self.direction === 1) {
                if (self.progress > 0.45 && !detailsAreVisible) {
                  detailsAreVisible = true;
                  gsap.set(overlayEl, { opacity: 1 });
                  detailTl.restart();
                }
              }
              if (self.direction === -1) {
                if (self.progress < 0.55 && detailsAreVisible) {
                  detailsAreVisible = false;
                  detailTl.pause();
                  gsap.to(overlayEl, {
                    opacity: 0,
                    duration: 0.4,
                    ease: 'power4.out',
                    overwrite: true,
                  });
                }
              }
            },
          },
        });

        // Animate the inner video wrapper's dimensions and position directly.
        // It has position:absolute, so changing width/height won't affect the grid layout.
        flipTl.fromTo(
          videoInnerEl,
          {
            width: elWidth,
            height: elHeight,
            x: 0,
            y: 0,
            borderRadius: 'var(--radius-cards)',
          },
          {
            width: viewportW,
            height: viewportH,
            x: -relLeft,
            y: -relTop,
            borderRadius: '0px',
            ease: 'none',
            duration: 1,
          }
        );

        // Hold at the end briefly
        flipTl.to({}, { duration: 0.4 });

        return flipTl;
      }

      let flipTl = createScrollFlipAnimation();

      // Handle resize: recreate animation with new measurements
      let resizeTimer;
      let windowWidth = window.innerWidth;

      function onResize() {
        if (window.innerWidth === windowWidth) return;
        windowWidth = window.innerWidth;

        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (flipTl && flipTl.scrollTrigger) {
            flipTl.scrollTrigger.kill();
            flipTl.kill();
          }

          const videoOuterEl = originEl.querySelector('.sbc-video-wrapper-outer');
          if (videoOuterEl) {
            gsap.set(videoOuterEl, { clearProps: 'transform,scale,x,y,borderRadius' });
          }
          gsap.set(componentEl, { clearProps: 'height,overflow' });

          flipTl = createScrollFlipAnimation();
          ScrollTrigger.refresh();
        }, 200);
      }

      window.addEventListener('resize', onResize);

      context.add(() => {
        return () => {
          window.removeEventListener('resize', onResize);
        };
      });
    });

    return () => {
      mm.revert();
    };
  }, []);

  const instagramImages = [
    "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=500&h=500&fit=crop", // community
    "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=500&h=500&fit=crop", // worship/music
    "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500&h=500&fit=crop", // people gathering
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop", // music
    "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=500&h=500&fit=crop", // friends
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=500&h=500&fit=crop"  // group
  ];

  return (
    <PageTransition>
      <div className="sbc-clone-root" style={{ position: 'relative', zIndex: 1, backgroundColor: 'var(--color-paper-white)', marginBottom: footerHeight }}>
        {/* 1. Header Navigation Bar with Flyout 2-depth Menu */}
        <nav
          className={`sbc-nav ${isNavVisible ? '' : 'sbc-nav-hidden'} ${isAtTop ? 'sbc-nav-top' : ''} ${showFlyout ? 'sbc-nav-flyout-open' : ''}`}
          onMouseLeave={handleMenuLeave}
        >
          <div className="sbc-nav-container">
            <div className="sbc-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src={sbcLogo} alt="신탄진침례교회 로고" height="40" className="sbc-logo-image" />
            </div>

            <div className="sbc-nav-menu">
              {NAV_MENU_DATA.map((menu) => (
                <span
                  key={menu.id}
                  className={`sbc-nav-item ${hoveredMenu === menu.id ? 'sbc-nav-item-active' : ''}`}
                  onMouseEnter={() => handleMenuEnter(menu.id)}
                >
                  {menu.label}
                  {menu.children && (
                    <span className="material-symbols-outlined sbc-nav-chevron">expand_more</span>
                  )}
                </span>
              ))}
            </div>

            <div className="sbc-nav-actions">
              <button className="sbc-btn-story sbc-hide-on-mobile" style={{ gap: 'var(--spacing-8)' }} onClick={handleStartChatbot}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
                새가족 등록
              </button>
              <button className="sbc-hamburger-btn" onClick={toggleMobileMenu}>
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>
          </div>

          {/* Flyout 2-depth Sub-menu Panel */}
          <div
            className={`sbc-flyout-panel ${showFlyout ? 'sbc-flyout-panel-open' : ''}`}
            onMouseEnter={() => { if (hoveredMenu) handleMenuEnter(hoveredMenu); }}
            onMouseLeave={handleMenuLeave}
          >
            <div className="sbc-flyout-inner">
              {activeMenuData && (
                <>
                  <div className="sbc-flyout-category-wrap">
                    <span className="sbc-flyout-category">{activeMenuData.desc}</span>
                  </div>
                  <div className="sbc-flyout-content-wrap">
                    <div className="sbc-flyout-columns-container">
                      {NAV_MENU_DATA.map((menu) => (
                        <div key={menu.id} className="sbc-flyout-column-slot">
                          <div className="sbc-flyout-slot-measure">
                            {menu.label}
                            {menu.children && (
                              <span className="material-symbols-outlined sbc-nav-chevron">expand_more</span>
                            )}
                          </div>

                          {activeMenuData.id === menu.id && activeMenuData.children && (
                            <div className="sbc-flyout-links">
                              {activeMenuData.children.map((child) => (
                                <a key={child.id} className="sbc-flyout-link" href={`#${child.id}`}>
                                  <span className="sbc-flyout-link-text">{child.label}</span>
                                  <span className="material-symbols-outlined sbc-flyout-link-arrow">arrow_forward</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Flyout backdrop overlay */}
        {activeMenuData && (
          <div
            className={`sbc-flyout-backdrop ${showFlyout ? 'sbc-flyout-backdrop-open' : ''}`}
            onMouseEnter={handleMenuLeave}
          />
        )}

        {/* Mobile Menu Fullscreen Overlay (Accordion Style) */}
        <div
          className={`sbc-mobile-menu-overlay ${isMobileMenuOpen ? 'sbc-mobile-menu-open' : ''}`}
          data-lenis-prevent="true"
        >
          <div className="sbc-mobile-menu-header">
            <button className="sbc-mobile-close-btn" onClick={toggleMobileMenu}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="sbc-mobile-menu-body">
            <div className="sbc-mobile-accordion">
              {NAV_MENU_DATA.map((menu) => (
                <div key={menu.id} className="sbc-mobile-accordion-item">
                  <div
                    className={`sbc-mobile-accordion-header ${mobileActiveMenu === menu.id ? 'active' : ''}`}
                    onClick={() => setMobileActiveMenu(mobileActiveMenu === menu.id ? null : menu.id)}
                  >
                    <span className="sbc-mobile-accordion-title">{menu.label}</span>
                    {menu.children ? (
                      <span className={`material-symbols-outlined sbc-mobile-accordion-chevron ${mobileActiveMenu === menu.id ? 'open' : ''}`}>
                        expand_more
                      </span>
                    ) : (
                      <span className="material-symbols-outlined sbc-mobile-accordion-chevron" style={{ visibility: 'hidden' }}>
                        expand_more
                      </span>
                    )}
                  </div>
                  {menu.children && (
                    <div className={`sbc-mobile-accordion-content ${mobileActiveMenu === menu.id ? 'open' : ''}`}>
                      {menu.children.map(child => (
                        <div
                          key={child.id}
                          className="sbc-mobile-2depth-link"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            window.location.hash = child.id;
                          }}
                        >
                          {child.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="sbc-mobile-accordion-footer">
              <div className="sbc-mobile-footer-link" onClick={() => {
                setIsMobileMenuOpen(false);
                handleStartChatbot();
              }}>
                <span className="sbc-mobile-footer-title">새가족 등록</span>
                <span className="material-symbols-outlined sbc-mobile-footer-icon">arrow_outward</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Hero Header Section */}
        <header className="sbc-hero">
          <div className="sbc-hero-overlay"></div>
          <div className="sbc-hero-container">
            <div className="sbc-hero-top-spacing"></div>

            <BlurFade delay={0} inView><h2 className="sbc-hero-title" style={{ fontSize: '5.5rem', fontWeight: '300', letterSpacing: '-0.02em', lineHeight: '1.2', textAlign: 'center', width: '100%', position: 'relative', zIndex: 10, transform: `translate3d(0px, ${lastScrollY * -0.15}px, 0px)`, willChange: 'transform' }}>
              <span className="sbc-title-line">말씀 위에</span>
              <span className="sbc-title-span-wrap" style={{ display: 'inline-block' }}>
                <span className="sbc-title-span-world" style={{ fontWeight: '400', color: 'var(--color-slate-blue)' }}>&nbsp;든든히 세워지는 교회</span>
              </span>
            </h2></BlurFade>

            <div className="sbc-hero-bottom">
              <div className="sbc-hero-content" style={{ justifyContent: 'center' }}>
              </div>
            </div>
          </div>
        </header>

        {/* 3. About + Video Section (Combined - reference: zetta-joule.com section 2) */}
        <section className="sbc-video-section-wrapper" ref={videoSectionRef}>
          {/* About text above video pin area */}
          <div className="sbc-about-area">
            <div className="sbc-container">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '64px' }}>
                <div>
                  <BlurFade delay={0} inView><h2 className="sbc-label-style-2" style={{ margin: 0 }}>2026 비전 말씀</h2></BlurFade>
                </div>
                <BlurFade delay={0.15} inView><p className="sbc-heading-style-h5" style={{ maxWidth: '1000px', fontSize: '40px', fontWeight: 'var(--font-weight-regular)', lineHeight: '1.5', wordBreak: 'keep-all', margin: 0 }}>
                  지금 내가 너희를 주와 및 그 은혜의 말씀께 부탁하노니<br />
                  그 말씀이 너희를 능히 든든히 세우사<br />
                  거룩하게 하심을 입은 모든 자 가운데 기업이 있게 하시리라<br />
                  <span style={{ display: 'block', marginTop: '32px', fontSize: '24px', color: 'var(--color-iron)', fontWeight: '400' }}>행 20:32</span>
                </p></BlurFade>
              </div>
            </div>
          </div>

          {/* Scroll-flip pinned video area */}
          <div className="sbc-video-pin-space" ref={scrollFlipComponentRef}>
            <div className="sbc-video-sticky-box">
              <div className="sbc-container sbc-video-grid-container">
                <div className="sbc-grid">
                  {/* Left Column: Text */}
                  <div className="sbc-col-span-4 sbc-video-left-col" ref={videoTextRef}>
                    <BlurFade delay={0} inView><p className="sbc-scroll-flip-text" style={{ wordBreak: 'keep-all', lineHeight: '1.8', fontSize: 'var(--text-subheading)' }}>
                      아름다운 교회의 풍경과 그 안에서 피어나는 성도들의 따뜻한 일상. 서로 사랑하고 섬기며 기쁨을 나누는 신탄진침례교회의 생생한 은혜의 순간들을 영상으로 만나보세요.
                    </p></BlurFade>
                  </div>

                  {/* Right Column: Video */}
                  <div className="sbc-col-span-8 sbc-video-right-col" ref={scrollFlipOriginRef}>
                    <div className="sbc-video-wrapper-outer">
                      <div className="sbc-video-wrapper" ref={videoWrapperRef}>
                        <video
                          className="sbc-bg-video"
                          src="https://sbc-joule.b-cdn.net/Zj-Homepage-Video.mp4"
                          playsInline
                          loop
                          autoPlay
                          muted
                          poster="https://cdn.prod.website-files.com/695e44c5cda75248659e97f1/69680419e6f814b622cdad5e_Homepage%20Video%20Poster.webp"
                        ></video>

                        <div className="sbc-video-overlay-details" ref={videoOverlayRef}>
                          <div className="sbc-video-details-line" ref={videoDetailLineRef}></div>
                          <div className="sbc-video-details-grid">
                            <div>
                              <h3 className="sbc-video-title">신탄진침례교회</h3>
                              <h4 className="sbc-video-subtitle">\ ˈze-tə-ˌjül \</h4>
                            </div>
                            <div>
                              <h4 className="sbc-video-def-text">One zettajoule equals 10²¹ joules, or one billion trillion joules.</h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. 온라인 예배 (Online Worship) - Replaced old Intelligent Systems */}
        <section className="sbc-section sbc-section-duck-egg-dark">
          <div className="sbc-container">
            <div className="sbc-grid" style={{ marginBottom: '60px' }}>
              <div className="sbc-col-span-4">
                <BlurFade delay={0} inView><h2 className="sbc-label-style-2">온라인 예배</h2></BlurFade>
              </div>
              <div className="sbc-col-span-8 sbc-tech-column">
                <BlurFade delay={0.15} inView><p className="sbc-heading-style-h5" style={{ wordBreak: 'keep-all' }}>
                  신탄진침례교회의 예배를 온라인으로 함께할 수 있습니다. 장소와 시간에 구애받지 않고, 언제 어디서나 생명력 있는 말씀과 은혜로운 찬양의 자리에 동참해 보세요.
                </p></BlurFade>
                <BlurFade delay={0.3} inView><button className="sbc-btn-story" onClick={() => window.open('https://www.youtube.com/@sbc6312', '_blank')}>
                  <span>교회 유튜브 바로가기</span>
                  <span className="material-symbols-outlined sbc-btn-icon">arrow_outward</span>
                </button></BlurFade>
              </div>
            </div>

            <div className="sbc-intelligent-wrapper" style={{ alignItems: 'flex-start' }}>
              {/* Left Column: 16:9 Video without extra decorative wrapper */}
              <div style={{ width: '100%', position: 'relative', paddingTop: '56.25%', borderRadius: '16px', overflow: 'hidden' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${worshipVideoId}`}
                  title="주일 예배 영상"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen>
                </iframe>
              </div>

              {/* Right Column: Worship Video Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', padding: '24px 0 0 24px' }}>
                <BlurFade delay={0.3} inView>
                  <div>
                    <h3 style={{ color: 'var(--color-iron)', fontSize: '13px', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: '400' }}>제목</h3>
                    <p style={{ color: 'var(--color-graphite)', fontSize: '1.5rem', fontWeight: '400', wordBreak: 'keep-all', lineHeight: '1.4' }}>" 하나님이 찾으시는 지혜로운 자 "</p>
                  </div>
                </BlurFade>
                <BlurFade delay={0.4} inView>
                  <div>
                    <h3 style={{ color: 'var(--color-iron)', fontSize: '13px', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: '400' }}>성경</h3>
                    <p style={{ color: 'var(--color-graphite)', fontSize: '1.1rem', fontWeight: '300' }}>시편 53편</p>
                  </div>
                </BlurFade>
                <BlurFade delay={0.5} inView>
                  <div>
                    <h3 style={{ color: 'var(--color-iron)', fontSize: '13px', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: '400' }}>설교</h3>
                    <p style={{ color: 'var(--color-graphite)', fontSize: '1.1rem', fontWeight: '300' }}>최영락 담임목사</p>
                  </div>
                </BlurFade>
                <BlurFade delay={0.6} inView>
                  <div>
                    <h3 style={{ color: 'var(--color-iron)', fontSize: '13px', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: '400' }}>찬양</h3>
                    <p style={{ color: 'var(--color-graphite)', fontSize: '1.1rem', fontWeight: '300', lineHeight: '1.6', wordBreak: 'keep-all' }}>
                      인도 - 홍성문 집사<br/>
                      맑은골찬양단, 그레이스찬양단
                    </p>
                  </div>
                </BlurFade>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Unmatched Heat Capabilities Section (Dark theme) */}
        <section className="sbc-section sbc-section-dark">
          <div className="sbc-container">
            <div className="sbc-capabilities-intro">
              <BlurFade delay={0} inView><h2 className="sbc-heading-style-h3 text-white">Unmatched Heat Capabilities</h2></BlurFade>
              <BlurFade delay={0.15} inView><p className="sbc-text-medium text-grey-350">
                Our ZJ advanced SMR will be designed to operate at temperatures up to 950 °C, which is approximately 600 °C higher than conventional water-cooled reactors, while also providing reliable power.
              </p></BlurFade>
            </div>

            {/* Interactive tab block */}
            <BlurFade delay={0.3} inView><div className="sbc-tab-container">
              <div className="sbc-tab-nav">
                {CAPABILITIES_TABS.map((tab, idx) => (
                  <button
                    key={tab.id}
                    className={`sbc-tab-btn ${activeTab === idx ? 'active' : ''}`}
                    onClick={() => setActiveTab(idx)}
                  >
                    {tab.title}
                  </button>
                ))}
                <div
                  className="sbc-tab-indicator"
                  style={{
                    width: `${100 / CAPABILITIES_TABS.length}%`,
                    transform: `translateX(${activeTab * 100}%)`
                  }}
                ></div>
              </div>

              {/* Tab contents */}
              <div className="sbc-tab-content-wrapper">
                <div className="sbc-tab-graphic-panel">
                  <img
                    src={CAPABILITIES_TABS[activeTab].image}
                    alt={CAPABILITIES_TABS[activeTab].alt}
                    className="sbc-tab-chart-img"
                  />
                  <div className="sbc-tab-lottie-fallback-bg">
                    <img
                      src="https://cdn.prod.website-files.com/695e44c5cda75248659e97f1/697b8c20cee891cc29cdab97_Capabilities%20BG.webp"
                      alt="Capabilities chart background comparisons"
                      className="sbc-tab-bg-graphic"
                    />
                  </div>
                </div>
              </div>
            </div></BlurFade>
          </div>
        </section>

        {/* 7. Clean Energy as a Service */}
        <section className="sbc-section sbc-section-white">
          <div className="sbc-container">
            <div className="sbc-energy-grid">
              <div className="sbc-energy-text">
                <BlurFade delay={0} inView><h2 className="sbc-heading-style-h3">24/7 Clean Energy as a Service</h2></BlurFade>
                <BlurFade delay={0.15} inView><p className="sbc-card-body text-grey-750">
                  We provide our customers with a range of financing and operational benefits, including the option to operate solely as off-takers.<br /><br />
                  Through this Energy-as-a-Service approach, we own, operate, and staff nuclear facilities, freeing our customers from the complexities of managing a nuclear plant.
                </p></BlurFade>

                <BlurFade delay={0.3} inView><div style={{ marginTop: '32px' }}>
                  <button className="sbc-btn-story" onClick={handleStartChatbot}>
                    <span>AI 음성 서비스 연동하기</span>
                    <span className="material-symbols-outlined sbc-btn-icon">arrow_outward</span>
                  </button>
                </div></BlurFade>
              </div>

              <div className="sbc-energy-image-panel">
                <img
                  src="https://cdn.prod.website-files.com/695e44c5cda75248659e97f1/698c5e78e72fb7b630ca3d27_home-clean-energy-v3.webp"
                  alt="Clean Energy as a Service conceptual layout grid"
                  className="sbc-energy-net-img"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 7.5. Instagram Section */}
        <section className="sbc-insta-section-full">
          <div className="sbc-insta-preview">
            <div className="sbc-insta-content">
              <BlurFade delay={0} inView>
                <h2 className="sbc-insta-title">
                  삶이 되는 예배
                </h2>
              </BlurFade>
              <BlurFade delay={0.15} inView>
                <p className="sbc-insta-subtitle">
                  평범한 일상 속, 특별한 은혜.<br />신탄진침례교회의 따뜻한 순간들.
                </p>
              </BlurFade>
              <BlurFade delay={0.3} inView>
                <button className="sbc-btn-story sbc-btn-insta" onClick={() => window.open('https://instagram.com/shintanjin_baptist_church', '_blank')}>
                  <span>Instagram 방문하기</span>
                  <span className="material-symbols-outlined sbc-btn-icon">arrow_outward</span>
                </button>
              </BlurFade>
            </div>

            <Floating sensitivity={-1} className="overflow-hidden">
              <FloatingElement depth={0.5} style={{ top: '8%', left: '11%' }}>
                <motion.img
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  src={instagramImages[0]}
                  className="sbc-floating-img sbc-f-img-1"
                />
              </FloatingElement>
              <FloatingElement depth={1} style={{ top: '10%', left: '32%' }}>
                <motion.img
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  src={instagramImages[1]}
                  className="sbc-floating-img sbc-f-img-2"
                />
              </FloatingElement>
              <FloatingElement depth={2} style={{ top: '2%', left: '53%' }}>
                <motion.img
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  src={instagramImages[2]}
                  className="sbc-floating-img sbc-f-img-3"
                />
              </FloatingElement>
              <FloatingElement depth={1} style={{ top: '0%', left: '83%' }}>
                <motion.img
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  src={instagramImages[3]}
                  className="sbc-floating-img sbc-f-img-4"
                />
              </FloatingElement>

              <FloatingElement depth={1} style={{ top: '40%', left: '2%' }}>
                <motion.img
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  src={instagramImages[4]}
                  className="sbc-floating-img sbc-f-img-5"
                />
              </FloatingElement>
              <FloatingElement depth={2} style={{ top: '70%', left: '77%' }}>
                <motion.img
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  src={instagramImages[5]}
                  className="sbc-floating-img sbc-f-img-6"
                />
              </FloatingElement>

              <FloatingElement depth={4} style={{ top: '73%', left: '15%' }}>
                <motion.img
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  src={instagramImages[0]}
                  className="sbc-floating-img sbc-f-img-7"
                />
              </FloatingElement>
              <FloatingElement depth={1} style={{ top: '80%', left: '50%' }}>
                <motion.img
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  src={instagramImages[1]}
                  className="sbc-floating-img sbc-f-img-8"
                />
              </FloatingElement>
            </Floating>
          </div>
        </section>

        {/* 8. New Family Welcome & Footer Section */}
        <div className="sbc-footer-wrap" ref={footerWrapRef}>
          <section className="sbc-new-family-welcome" ref={nfwRef}>
            <div className="sbc-container sbc-grid" style={{ alignItems: 'center' }}>
              <div className="sbc-col-span-5 sbc-nfw-content">
                <BlurFade delay={0} inView><div className="sbc-nfw-icon">
                  <span className="material-symbols-outlined">favorite</span>
                </div></BlurFade>
                <BlurFade delay={0.15} inView><h2 className="sbc-nfw-title">
                  새가족 환영. 신탄진침례교회는<br />
                  처음 오신 여러분을 진심으로<br />
                  환영하고 축복합니다.
                </h2></BlurFade>
                <BlurFade delay={0.3} inView><button className="sbc-btn-accent sbc-nfw-btn">
                  <span>새가족 등록 안내</span>
                  <span className="material-symbols-outlined">arrow_outward</span>
                </button></BlurFade>
              </div>
              <div className="sbc-col-span-7 sbc-nfw-images">
                <img src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=600&auto=format&fit=crop" alt="새가족 환영 1" className="sbc-nfw-img" />
                <img src="https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=600&auto=format&fit=crop" alt="새가족 환영 2" className="sbc-nfw-img" />
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="sbc-footer" ref={footerRef} style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 0 }}>
        <div className="sbc-container sbc-footer-inner">
          <div className="sbc-grid">
            <div className="sbc-col-span-6">
              <h2 className="sbc-footer-slogan">
                세상을 살리는 복음<br />
                은혜가 머무는 신탄진침례교회
              </h2>
            </div>
            <div className="sbc-col-span-6 sbc-grid">
              <div className="sbc-col-span-4 sbc-footer-col">
                <span className="sbc-footer-link">교회소개</span>
                <span className="sbc-footer-link">예배찬양</span>
                <span className="sbc-footer-link">양육훈련</span>
                <span className="sbc-footer-link">다음세대</span>
                <span className="sbc-footer-link">선교전도</span>
              </div>
              <div className="sbc-col-span-4 sbc-footer-col">
                <span className="sbc-footer-link">교회소식 및 주보</span>
                <span className="sbc-footer-link">교우동정 및 갤러리</span>
                <span className="sbc-footer-link">사역 일정</span>
                <span className="sbc-footer-link">오시는 길</span>
              </div>
              <div className="sbc-col-span-4 sbc-footer-col">
                <span className="sbc-footer-link" onClick={() => window.open('https://youtube.com/@sbc6312', '_blank')}>YouTube</span>
                <span className="sbc-footer-link" onClick={() => window.open('https://instagram.com/shintanjin_baptist_church', '_blank')}>Instagram</span>
              </div>
            </div>
          </div>

          <div className="sbc-footer-space"></div>

          <div className="sbc-footer-bottom">
            <div className="sbc-footer-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="sbc-footer-logo-wrap">
                <img src={sbcLogo} alt="신탄진침례교회 로고" className="sbc-footer-logo" />
              </div>
            </div>

            <div className="sbc-footer-copy-wrap">
              <div className="sbc-footer-sub-links-wrap">
                <span className="sbc-footer-sub-link">개인정보처리방침</span>
                <span className="sbc-footer-sub-link">이용약관</span>
              </div>
              <span className="sbc-footer-copy">&copy; {new Date().getFullYear()} 신탄진침례교회. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </PageTransition>
  );
}
