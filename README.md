# 🎨 SoundCanvas - AI 음향 시각화 예술 생성기

SoundCanvas는 음악을 아름다운 시각 예술로 변환하는 혁신적인 웹 애플리케이션입니다. 고급 오디오 분석과 AI 기반 시각화 기술을 사용하여 소리의 독특하고 예술적인 표현을 생성합니다.

## ✨ 주요 기능

### 🎵 오디오 기반 예술 생성
- **정적 이미지 생성**: 동영상이 아닌 고품질 정적 예술 작품 생성
- **실시간 오디오 분석**: 주파수, 진폭, 음성학적 특성 분석
- **전체 캔버스 활용**: 중앙 집중이 아닌 전체 화면을 활용한 풍부한 구성

### 🎨 3가지 아티스틱 스타일

#### 1. **Mandala (만다라)**
- Abstract Expressionist 기법
- 임파스토(Impasto) 효과와 유기적 브러시 스트로크
- 캔버스 텍스처와 자연스러운 페인트 분사 효과

#### 2. **InkFlow (잉크플로우)**
- 수채화 & 잉크 아트 기법
- 종이 텍스처와 잉크 번짐 효과
- 유동적이고 자연스러운 흐름

#### 3. **NeonGrid (네온그리드)**
- 혼합 매체 아트 기법
- 찢어진 종이 가장자리와 콜라주 효과
- 추상적 색상 필드와 제스처 마킹

### 🖼️ 고급 예술 기법
- **실제 페인팅 텍스처**: 캔버스 직조, 임파스토, 수채화 종이
- **유기적 브러시워크**: 다중 모 브러시 시뮬레이션
- **자연스러운 색상 혼합**: HSL 기반 예술적 팔레트
- **전문가급 구성**: 황금비와 예술적 균형 적용

## 🚀 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion
- **Audio Processing**: Web Audio API, FFT 분석
- **Canvas Rendering**: HTML5 Canvas 2D API
- **UI Components**: Radix UI, Lucide React
- **Backend**: Supabase (데이터베이스 & 인증)
- **Deployment**: Vercel

## 🎯 사용법

### 1. 오디오 업로드
- MP3, WAV, M4A, OGG, WebM 형식 지원
- 최대 50MB 파일 크기
- 마이크 녹음도 지원

### 2. 스타일 선택
- Mandala, InkFlow, NeonGrid 중 선택
- 민감도, 스무딩, 스케일 조정

### 3. 예술 작품 생성
- "이미지 생성" 버튼 클릭
- 오디오 분석 기반 고유한 작품 생성
- 각 생성마다 다른 결과물

### 4. 내보내기 & 공유
- PNG/JPG 형식으로 다운로드
- 다양한 해상도 지원 (512px ~ 2048px)
- 갤러리에 공유 가능

## 🛠️ 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/smc2315/soundcanvas.git
cd soundcanvas
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
`.env.local` 파일 생성:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 5. 빌드 및 배포
```bash
npm run build
npm start
```

## 📁 프로젝트 구조

```
soundcanvas/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── create/             # 음악 업로드 및 스타일 선택
│   │   ├── result/             # 시각화 생성 및 편집
│   │   ├── gallery/            # 공유 갤러리
│   │   └── my-works/           # 사용자 작품 관리
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   ├── ui/                 # 기본 UI 컴포넌트
│   │   ├── audio/              # 오디오 관련 컴포넌트
│   │   └── visualization/      # 시각화 컨트롤
│   ├── lib/                    # 핵심 라이브러리
│   │   ├── audio/              # 오디오 처리 및 분석
│   │   ├── visualization/      # 시각화 렌더링 엔진
│   │   ├── frames/             # 프레임 렌더링
│   │   └── supabase/           # 데이터베이스 연결
│   └── utils/                  # 유틸리티 함수
├── public/                     # 정적 파일
└── docs/                       # 문서
```

## 🔧 주요 알고리즘

### 오디오 분석
- **FFT (Fast Fourier Transform)**: 주파수 스펙트럼 분석
- **RMS (Root Mean Square)**: 음량 계산
- **Spectral Centroid**: 음색 밝기 측정
- **Zero Crossing Rate**: 음성학적 특성 분석

### 시각화 기법
- **주파수 대역 분리**: Bass (20-250Hz), Mid (250-4000Hz), Treble (4000-20000Hz)
- **동적 색상 매핑**: 주파수별 HSL 색상 공간 활용
- **유기적 패턴 생성**: 수학적 함수와 노이즈 조합
- **텍스처 시뮬레이션**: 실제 페인팅 기법 모방

## 🎨 예술적 특징

### Abstract Expressionist (추상 표현주의)
- Jackson Pollock 스타일의 드리핑과 스플래터
- 자발적이고 제스처적인 브러시워크
- 감정적 강도와 에너지 표현

### Watercolor & Ink (수채화 & 잉크)
- 자연스러운 물감 번짐과 bleeding 효과
- 종이 텍스처와 그레인 시뮬레이션
- 투명도와 레이어링을 통한 깊이감

### Mixed Media (혼합 매체)
- 콜라주와 텍스처 조합
- 디지털과 아날로그 기법 융합
- 현대적 추상 표현

## 🌐 라이브 데모

🔗 **배포 URL**: [https://soundcanvas.vercel.app](https://soundcanvas.vercel.app)

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 기여하기

1. 포크 (Fork) 프로젝트
2. 기능 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시 (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📞 연락처

프로젝트 링크: [https://github.com/smc2315/soundcanvas](https://github.com/smc2315/soundcanvas)

---

**🎨 음악을 시각 예술로 변환하는 새로운 경험을 만나보세요!**