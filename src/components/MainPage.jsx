import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_CHATBOT } from '../constants/routes';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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

  // Header scroll visibility logic
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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


  return (
    <div className="sbc-clone-root">
      {/* 1. Header Navigation Bar */}
      <nav className={`sbc-nav ${isNavVisible ? '' : 'sbc-nav-hidden'} ${isAtTop ? 'sbc-nav-top' : ''}`}>
        <div className="sbc-nav-container">
          <div className="sbc-nav-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {/* 신탄진침례교회 Logo Lockup (Clean SVG representation) */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="sbc-logo-svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M5.58516 25.3643L4.10156 26.6986H27.8938C28.631 25.8788 29.2854 24.9831 29.8426 24.0234H9.08022C7.7899 24.0234 6.5449 24.5006 5.58516 25.3643Z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M15.9991 32.0008C19.2436 32.0008 22.2615 31.0345 24.7834 29.375H7.21484C9.73683 31.0345 12.7547 32.0008 15.9991 32.0008Z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M26.8216 6.26714L27.896 5.30078H4.10506C3.36792 6.12052 2.71343 7.01623 2.15625 7.97593H22.3695C24.0144 7.97593 25.6006 7.36812 26.8229 6.26847L26.8216 6.26714Z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M15.9991 0C12.7547 0 9.73683 0.966359 7.21484 2.62583H24.7834C22.2628 0.966359 19.2436 0 15.9991 0Z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M20.6886 11.8913C21.575 11.0929 22.7267 10.6517 23.9197 10.6517H31.0831C30.7512 9.71734 30.3367 8.82296 29.8448 7.97656H27.1762C25.7246 7.97656 24.3249 8.51372 23.2466 9.48408C22.5068 10.1492 21.5457 10.5184 20.55 10.5184H0.964567C0.651318 11.3781 0.408717 12.2725 0.246094 13.1936H17.2935C18.5478 13.1936 19.7568 12.7297 20.6886 11.8913Z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M14.7073 17.2351C15.5951 16.4367 16.7454 15.9955 17.9385 15.9955H32C32 15.0837 31.9227 14.1907 31.7761 13.3203H21.1949C19.7433 13.3203 18.3437 13.8575 17.2653 14.8278C16.5255 15.493 15.5644 15.8622 14.5687 15.8622H0.000611414C-0.00738643 16.7725 0.0632612 17.6656 0.201891 18.536H11.3122C12.5666 18.536 13.7756 18.0721 14.7073 17.2337V17.2351Z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M11.3349 20.1833C10.5951 20.8484 9.63407 21.2176 8.63834 21.2176H0.871094C1.19367 22.1507 1.5989 23.0464 2.0801 23.8928H5.38188C6.63621 23.8928 7.84522 23.4289 8.77697 22.5905C9.66339 21.7921 10.8151 21.3509 12.0081 21.3509H31.083C31.3882 20.4912 31.6215 19.5968 31.7761 18.6758H15.2646C13.8129 18.6758 12.4133 19.2129 11.3349 20.1833Z" fill="currentColor"/>
            </svg>
            <span className="sbc-logo-text">신탄진침례교회</span>
          </div>

          <div className="sbc-nav-menu">
            <span className="sbc-nav-item">Company</span>
            <span className="sbc-nav-item">Technology</span>
            <span className="sbc-nav-item">Solutions</span>
            <span className="sbc-nav-item">Our Edge</span>
            <span className="sbc-nav-item">Our Team</span>
            <span className="sbc-nav-item">Investors</span>
            <span className="sbc-nav-item">News</span>
          </div>

          <div className="sbc-nav-actions">
            {/* AI Assistant access button representing 신탄진침례교회's 'Get in Touch' button */}
            <button className="sbc-btn-accent" onClick={handleStartChatbot}>
              AI 음성 비서 시작하기
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Header Section */}
      <header className="sbc-hero">
        <div className="sbc-hero-overlay"></div>
        <div className="sbc-hero-container">
          <div className="sbc-hero-top-spacing"></div>
          
          <h2 className="sbc-hero-title">
            <span className="sbc-title-line">Powering</span>
            <span className="sbc-title-span-wrap">
              <span className="sbc-title-span-the">the</span>
              <span className="sbc-title-span-world">&nbsp;World</span>
            </span>
            {/* Exploeded / Center Reactor Illustration */}
            <img 
              className="sbc-hero-reactor" 
              src="https://cdn.prod.website-files.com/695e44c5cda75248659e97f1/696a6637ba3fff5cf7e4326a_zj-home-atf-reactor.webp" 
              alt="Compact nuclear reactor illustration" 
            />
          </h2>

          <div className="sbc-hero-bottom">
            <div className="sbc-hero-content">
              <h1 className="sbc-hero-caption">
                Clean Heat and Electricity to Power a World of Industrial Applications
              </h1>
              <div className="sbc-hero-line"></div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. About + Video Section (Combined - reference: zetta-joule.com section 2) */}
      <section className="sbc-video-section-wrapper" ref={videoSectionRef}>
        {/* About text above video pin area */}
        <div className="sbc-about-area">
          <div className="sbc-container">
            <div className="sbc-about-grid">
              <h2 className="sbc-label-style-2">The Name Reflects our Mission</h2>
              <div className="sbc-about-text-column">
                <p className="sbc-heading-style-h5">
                  Projections by the U.S. Department of Energy show that annual global energy demand by the year 2050 will reach one billion times one trillion (zetta) units of energy (joules).
                </p>
                <button className="sbc-btn-story" onClick={handleStartChatbot}>
                  <span>음성 비서 체험하기</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none" className="sbc-btn-icon">
                    <path d="M3.67242 12.9971V2.5H4.67242V11.9971H15.7824L15.6133 11.9455L12.4346 8.69261L13.1494 7.99339L17.209 12.1477L17.5508 12.4973L17.209 12.8469L13.1494 17.0012L12.4346 16.302L15.6162 13.0452L15.7753 12.9971H3.67242Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll-flip pinned video area */}
        <div className="sbc-video-pin-space" ref={scrollFlipComponentRef}>
          <div className="sbc-video-sticky-box">
            <div className="sbc-container sbc-video-grid-container">
              <div className="sbc-video-grid">
                {/* Left Column: Text (1fr) */}
                <div className="sbc-video-left-col" ref={videoTextRef}>
                  <p className="sbc-scroll-flip-text">
                    Our name, 신탄진침례교회, reflects our commitment to being part of the solution for meeting this tremendous need by providing clean, reliable heat and power.
                  </p>
                </div>
                
                {/* Right Column: Video (2fr) — scroll-flip origin */}
                <div className="sbc-video-right-col" ref={scrollFlipOriginRef}>
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

      {/* 4. Modernizing SMR / Technology Section */}
      <section className="sbc-section sbc-section-duck-egg">
        <div className="sbc-container">
          <div className="sbc-tech-grid">
            <h2 className="sbc-heading-style-h3">Modernizing Proven Technology</h2>
            <div className="sbc-tech-column">
              <p className="sbc-text-medium">
                We're the only Western advanced small modular reactor (SMR) company modernizing the established, publicly available technology of Japan's High Temperature Engineering Test Reactor, which is capable of producing industrial process heat up to 950 °C.
              </p>
              <button className="sbc-btn-story" onClick={handleStartChatbot}>
                <span>기술 사양 살펴보기</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none" className="sbc-btn-icon">
                  <path d="M3.67242 12.9971V2.5H4.67242V11.9971H15.7824L15.6133 11.9455L12.4346 8.69261L13.1494 7.99339L17.209 12.1477L17.5508 12.4973L17.209 12.8469L13.1494 17.0012L12.4346 16.302L15.6162 13.0452L15.7753 12.9971H3.67242Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="sbc-tech-card-wrapper">
            <div className="sbc-tech-image-container">
              <img 
                src="https://cdn.prod.website-files.com/695e44c5cda75248659e97f1/69aada08819f41c24bb14aa6_home-building.webp" 
                alt="신탄진침례교회 modern building complex" 
                className="sbc-tech-img"
              />
              <div className="sbc-tech-overlay-card">
                <div className="sbc-card-label-dot">
                  <span className="sbc-card-dot"></span>
                  <span className="sbc-card-label">Design Meets Resilience</span>
                </div>
                <p className="sbc-card-body">
                  Our SMR facility will be a next-generation energy campus, defined by contemporary architectural elements - softened structural lines and sculpted façades that integrate thoughtfully with surrounding environments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Intelligent Systems Section */}
      <section className="sbc-section sbc-section-duck-egg-dark">
        <div className="sbc-container">
          <div className="sbc-tech-grid">
            <h2 className="sbc-label-style-2">Intelligent Systems</h2>
            <div className="sbc-tech-column">
              <p className="sbc-heading-style-h5">
                Our modernized design leverages artificial intelligence and AI-based digital twins to streamline operations, cut costs, accelerate delivery, and minimize human error.
              </p>
            </div>
          </div>

          <div className="sbc-intelligent-wrapper">
            <div className="sbc-reactor-illustration-panel">
              <img 
                src="https://cdn.prod.website-files.com/695e44c5cda75248659e97f1/698e0426c2766ca571c6e042_home-mobile-reactor.webp" 
                alt="3D exploded reactor view" 
                className="sbc-reactor-illustration" 
              />
              
              <div className="sbc-reactor-stats-overlay">
                <div className="sbc-stat-row">
                  <span className="sbc-stat-label">Reactor type</span>
                  <span className="sbc-stat-val">HTGR</span>
                </div>
                <div className="sbc-stat-row">
                  <span className="sbc-stat-label">Capacity</span>
                  <span className="sbc-stat-val">30 MWth</span>
                </div>
                <div className="sbc-stat-row">
                  <span className="sbc-stat-label">Heat Output</span>
                  <span className="sbc-stat-val">UP TO 950 °C</span>
                </div>
              </div>
            </div>

            {/* Grid details */}
            <div className="sbc-details-grid">
              <div className="sbc-detail-card">
                <h3 className="sbc-detail-title">Heat</h3>
                <div className="sbc-detail-line"></div>
                <p className="sbc-detail-desc">
                  High-temperature heat opens up the widest range of applications, from Chemicals to Steelmaking and District heating.
                </p>
              </div>
              <div className="sbc-detail-card">
                <h3 className="sbc-detail-title">Heat &amp; Power</h3>
                <div className="sbc-detail-line"></div>
                <p className="sbc-detail-desc">
                  Can produce heat and electricity for Oil &amp; Gas facilities, Mining operations &amp; other industrial facilities.
                </p>
              </div>
              <div className="sbc-detail-card">
                <h3 className="sbc-detail-title">Hydrogen</h3>
                <div className="sbc-detail-line"></div>
                <p className="sbc-detail-desc">
                  Highly efficient hydrogen production for Chemicals (ammonia, polymers, e-fuels), Oil &amp; Gas facilities, and Sustainable Aviation Fuel.
                </p>
              </div>
              <div className="sbc-detail-card">
                <h3 className="sbc-detail-title">Electricity</h3>
                <div className="sbc-detail-line"></div>
                <p className="sbc-detail-desc">
                  Designed to produce 24/7 clean power for Data Centers, Microgrids, and Residential and Commercial users.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Unmatched Heat Capabilities Section (Dark theme) */}
      <section className="sbc-section sbc-section-dark">
        <div className="sbc-container">
          <div className="sbc-capabilities-intro">
            <h2 className="sbc-heading-style-h3 text-white">Unmatched Heat Capabilities</h2>
            <p className="sbc-text-medium text-grey-350">
              Our ZJ advanced SMR will be designed to operate at temperatures up to 950 °C, which is approximately 600 °C higher than conventional water-cooled reactors, while also providing reliable power.
            </p>
          </div>

          {/* Interactive tab block */}
          <div className="sbc-tab-container">
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
          </div>
        </div>
      </section>

      {/* 7. Clean Energy as a Service */}
      <section className="sbc-section sbc-section-white">
        <div className="sbc-container">
          <div className="sbc-energy-grid">
            <div className="sbc-energy-text">
              <h2 className="sbc-heading-style-h3">24/7 Clean Energy as a Service</h2>
              <p className="sbc-card-body text-grey-750">
                We provide our customers with a range of financing and operational benefits, including the option to operate solely as off-takers.<br/><br/>
                Through this Energy-as-a-Service approach, we own, operate, and staff nuclear facilities, freeing our customers from the complexities of managing a nuclear plant.
              </p>
              
              <div style={{ marginTop: '32px' }}>
                <button className="sbc-btn-story" onClick={handleStartChatbot}>
                  <span>AI 음성 서비스 연동하기</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none" className="sbc-btn-icon">
                    <path d="M3.67242 12.9971V2.5H4.67242V11.9971H15.7824L15.6133 11.9455L12.4346 8.69261L13.1494 7.99339L17.209 12.1477L17.5508 12.4973L17.209 12.8469L13.1494 17.0012L12.4346 16.302L15.6162 13.0452L15.7753 12.9971H3.67242Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
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

      {/* 8. Footer Section */}
      <footer className="sbc-footer">
        <div className="sbc-container">
          <div className="sbc-footer-top">
            <div className="sbc-footer-brand">
              <div className="sbc-nav-brand">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="sbc-logo-svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M5.58516 25.3643L4.10156 26.6986H27.8938C28.631 25.8788 29.2854 24.9831 29.8426 24.0234H9.08022C7.7899 24.0234 6.5449 24.5006 5.58516 25.3643Z" fill="white"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M15.9991 32.0008C19.2436 32.0008 22.2615 31.0345 24.7834 29.375H7.21484C9.73683 31.0345 12.7547 32.0008 15.9991 32.0008Z" fill="white"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M26.8216 6.26714L27.896 5.30078H4.10506C3.36792 6.12052 2.71343 7.01623 2.15625 7.97593H22.3695C24.0144 7.97593 25.6006 7.36812 26.8229 6.26847L26.8216 6.26714Z" fill="white"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M15.9991 0C12.7547 0 9.73683 0.966359 7.21484 2.62583H24.7834C22.2628 0.966359 19.2436 0 15.9991 0Z" fill="white"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M20.6886 11.8913C21.575 11.0929 22.7267 10.6517 23.9197 10.6517H31.0831C30.7512 9.71734 30.3367 8.82296 29.8448 7.97656H27.1762C25.7246 7.97656 24.3249 8.51372 23.2466 9.48408C22.5068 10.1492 21.5457 10.5184 20.55 10.5184H0.964567C0.651318 11.3781 0.408717 12.2725 0.246094 13.1936H17.2935C18.5478 13.1936 19.7568 12.7297 20.6886 11.8913Z" fill="white"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M14.7073 17.2351C15.5951 16.4367 16.7454 15.9955 17.9385 15.9955H32C32 15.0837 31.9227 14.1907 31.7761 13.3203H21.1949C19.7433 13.3203 18.3437 13.8575 17.2653 14.8278C16.5255 15.493 15.5644 15.8622 14.5687 15.8622H0.000611414C-0.00738643 16.7725 0.0632612 17.6656 0.201891 18.536H11.3122C12.5666 18.536 13.7756 18.0721 14.7073 17.2337V17.2351Z" fill="white"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.3349 20.1833C10.5951 20.8484 9.63407 21.2176 8.63834 21.2176H0.871094C1.19367 22.1507 1.5989 23.0464 2.0801 23.8928H5.38188C6.63621 23.8928 7.84522 23.4289 8.77697 22.5905C9.66339 21.7921 10.8151 21.3509 12.0081 21.3509H31.083C31.3882 20.4912 31.6215 19.5968 31.7761 18.6758H15.2646C13.8129 18.6758 12.4133 19.2129 11.3349 20.1833Z" fill="white"/>
                </svg>
                <span className="sbc-logo-text" style={{ color: 'white' }}>신탄진침례교회</span>
              </div>
            </div>

            <div className="sbc-footer-nav">
              <span className="sbc-footer-link">Company</span>
              <span className="sbc-footer-link">Technology</span>
              <span className="sbc-footer-link">Solutions</span>
              <span className="sbc-footer-link">Our Edge</span>
              <span className="sbc-footer-link">Our Team</span>
              <span className="sbc-footer-link">Investors</span>
              <span className="sbc-footer-link">News</span>
            </div>
          </div>

          <div className="sbc-footer-bottom">
            <span className="sbc-footer-copy">
              &copy; {new Date().getFullYear()} 신탄진침례교회 Inc. All rights reserved.
            </span>
            <div className="sbc-footer-sub-links">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
