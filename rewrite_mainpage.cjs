const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'MainPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove CAPABILITIES_TABS
content = content.replace(/\/\/ Capabilities tab content configuration[\s\S]*?\];/g, '// CAPABILITIES_TABS removed');

// 2. Remove unused refs
content = content.replace(/const videoSectionRef = useRef\(null\);[\s\S]*?const videoDetailLineRef = useRef\(null\);/g, '// Unused refs removed');

// 3. Remove scroll-flip animation
content = content.replace(/\/\/ Scroll-flip animation: video expands from grid position to fullscreen on scroll[\s\S]*?mm\.revert\(\);\n    };\n  \}, \[\]\);/g, '// Scroll flip animation removed');

// 4. Replace from Section 3 to the end of </PageTransition>
const section3Start = '{/* 3. About + Video Section (Combined - reference: zetta-joule.com section 2) */}';
const targetIndex = content.indexOf(section3Start);

if (targetIndex !== -1) {
  const beforeSection3 = content.substring(0, targetIndex);
  const newSections = `      {/* Section 2. 교회 비전 (Vision) */}
      <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFDF9', paddingTop: '160px', paddingBottom: '160px' }}>
        <div className="sbc-container" style={{ textAlign: 'center' }}>
          <BlurFade delay={0} inView yOffset={40}>
            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: '300', color: 'var(--color-graphite)', lineHeight: '1.2', letterSpacing: '-0.04em' }}>
              삶이 예배가 되는 <br/>
              <span style={{ color: 'var(--color-slate-blue)', fontStyle: 'italic', fontWeight: '400' }}>따뜻한 공동체</span>
            </h2>
          </BlurFade>
          <BlurFade delay={0.2} inView yOffset={40}>
            <p style={{ marginTop: '2.5rem', fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', color: 'var(--color-iron)', maxWidth: '600px', marginInline: 'auto', fontWeight: '300', lineHeight: '1.8' }}>
              신탄진침례교회는 변하지 않는 복음의 진리를 품고,<br/>
              이웃과 세상을 향해 은혜로운 빛을 흘려보냅니다.
            </p>
          </BlurFade>
        </div>
      </section>

      {/* Section 3. 말씀과 찬양 (Worship Media) */}
      <section style={{ minHeight: '100vh', padding: '120px 0', backgroundColor: '#F7F2EB' }}>
        <div className="sbc-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px' }}>
            <BlurFade delay={0} inView yOffset={20}>
              <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: '300', color: 'var(--color-graphite)', letterSpacing: '-0.02em' }}>주일 예배</h2>
            </BlurFade>
            <BlurFade delay={0.1} inView yOffset={20}>
              <button className="sbc-btn-story" onClick={() => window.open('https://www.youtube.com/@sbc6312', '_blank')} style={{ padding: '8px 20px', fontSize: '13px' }}>
                <span>유튜브 채널</span>
                <span className="material-symbols-outlined sbc-btn-icon" style={{ fontSize: '16px' }}>arrow_outward</span>
              </button>
            </BlurFade>
          </div>
          
          <BlurFade delay={0.2} inView yOffset={40}>
            <div style={{ paddingTop: '56.25%', position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.08)' }}>
              <iframe 
                src={\`https://www.youtube.com/embed/\${worshipVideoId}?autoplay=0&mute=0\`} 
                title="주일 예배 영상" 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen>
              </iframe>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Section 4. 주보 및 소식 (News Showcase) */}
      <section style={{ minHeight: '80vh', padding: '160px 0', backgroundColor: '#F7F2EB' }}>
        <div className="sbc-container">
          <BlurFade delay={0} inView yOffset={20}>
             <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: '300', color: 'var(--color-graphite)', marginBottom: '80px', textAlign: 'center', letterSpacing: '-0.03em' }}>
               은혜로운 발자취
             </h2>
          </BlurFade>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
             {[
               { title: "2024년 춘계 부흥회 안내", date: "2024. 04. 15", category: "교회소식" },
               { title: "다음세대 장학금 수여식", date: "2024. 04. 08", category: "나눔터" },
               { title: "성금요일 연합 예배", date: "2024. 03. 29", category: "예배" }
             ].map((news, idx) => (
               <BlurFade key={idx} delay={0.1 * (idx + 1)} inView yOffset={30}>
                 <div style={{ padding: '48px 40px', backgroundColor: '#FFFDF9', borderRadius: '16px', border: '1px solid var(--color-ash)', transition: 'all 0.4s ease', cursor: 'pointer' }} 
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F7F2EB'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFDF9'; e.currentTarget.style.transform = 'translateY(0)'; }}
                 >
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', fontSize: '13px', color: 'var(--color-steel)' }}>
                     <span>{news.category}</span>
                     <span>{news.date}</span>
                   </div>
                   <h3 style={{ fontSize: '1.3rem', fontWeight: '400', color: 'var(--color-graphite)', lineHeight: '1.5' }}>
                     {news.title}
                   </h3>
                   <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', color: 'var(--color-slate-blue)', fontSize: '14px' }}>
                     자세히 보기 <span className="material-symbols-outlined" style={{ fontSize: '16px', marginLeft: '4px' }}>arrow_right_alt</span>
                   </div>
                 </div>
               </BlurFade>
             ))}
          </div>
        </div>
      </section>

      {/* Section 5. 교회 인스타그램 (Community) */}
      <section className="sbc-insta-section-full" style={{ backgroundColor: '#F7F2EB', paddingBottom: '160px' }}>
        <div className="sbc-insta-preview">
          <div className="sbc-insta-content">
            <BlurFade delay={0} inView>
              <h2 className="sbc-insta-title" style={{ color: 'var(--color-graphite)' }}>
                일상의 은혜
              </h2>
            </BlurFade>
            <BlurFade delay={0.15} inView>
              <p className="sbc-insta-subtitle" style={{ color: 'var(--color-iron)' }}>
                평범한 하루 속, 특별한 나눔.<br/>신탄진침례교회의 따뜻한 순간들.
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

      {/* Section 6. 예배 안내 및 초대 (Invitation & CTA) */}
      <div className="sbc-footer-wrap" ref={footerWrapRef}>
        <section className="sbc-new-family-welcome" ref={nfwRef} style={{ backgroundColor: '#EBE4DB', padding: '200px 0', textAlign: 'center' }}>
          <div className="sbc-container">
            <BlurFade delay={0} inView yOffset={40}>
              <h2 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: '300', color: 'var(--color-graphite)', lineHeight: '1.1', marginBottom: '60px', letterSpacing: '-0.04em' }}>
                당신을 초대합니다
              </h2>
            </BlurFade>
            <BlurFade delay={0.2} inView yOffset={40}>
              <button className="sbc-btn-story" onClick={handleStartChatbot} style={{ padding: '16px 48px', fontSize: '1.2rem', backgroundColor: 'transparent' }}>
                <span>새가족 등록 안내</span>
                <span className="material-symbols-outlined">arrow_outward</span>
              </button>
            </BlurFade>
          </div>
        </section>
      </div>
      </div>

      {/* Section 7. 극도의 미니멀리즘 푸터 (Footer) */}
      <footer className="sbc-footer" ref={footerRef} style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 0, backgroundColor: '#FFFDF9', color: 'var(--color-graphite)' }}>
        <div className="sbc-container" style={{ padding: '80px 0 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img src={sbcLogo} alt="신탄진침례교회 로고" style={{ height: '32px', marginBottom: '40px', opacity: 0.8 }} />
          <div style={{ display: 'flex', gap: '32px', marginBottom: '40px', fontSize: '13px', color: 'var(--color-iron)', fontWeight: '300' }}>
            <span style={{ cursor: 'pointer' }}>교회소개</span>
            <span style={{ cursor: 'pointer' }}>오시는 길</span>
            <span style={{ cursor: 'pointer' }}>개인정보처리방침</span>
            <span style={{ cursor: 'pointer' }}>이용약관</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-steel)', letterSpacing: '0.02em', fontWeight: '300', lineHeight: '1.8' }}>
            대전광역시 대덕구 대덕대로 1447번길 39 (신탄진동)<br/>
            Tel. 042-932-6312 &nbsp;|&nbsp; Fax. 042-932-6314<br/><br/>
            &copy; {new Date().getFullYear()} 신탄진침례교회. All rights reserved.
          </p>
        </div>
      </footer>
    </PageTransition>
  );
}
`;
  content = beforeSection3 + newSections;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully rewrote MainPage.jsx');
} else {
  console.log('Could not find Section 3 start anchor');
}
