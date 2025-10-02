# SoundCanvas GitHub 배포 가이드

## 🚀 GitHub 리포지토리 생성 및 배포

### 1단계: GitHub에서 새 리포지토리 생성

1. **GitHub 웹사이트 방문**: https://github.com/smc2315
2. **"New repository" 클릭** (초록색 버튼)
3. **리포지토리 설정**:
   - Repository name: `soundcanvas`
   - Description: `SoundCanvas - AI-powered Audio Visualization Art Generator`
   - Public 선택 (Vercel 무료 배포를 위해)
   - **Don't initialize with README, .gitignore, or license** (이미 있음)

### 2단계: 로컬 리포지토리를 GitHub에 연결

터미널에서 다음 명령어 실행:

\`\`\`bash
# GitHub 리모트 추가
git remote add origin https://github.com/smc2315/soundcanvas.git

# 브랜치 이름을 main으로 설정 (이미 설정됨)
git branch -M main

# GitHub에 푸시
git push -u origin main
\`\`\`

### 3단계: Vercel에서 GitHub 연동 배포

1. **Vercel 웹사이트 방문**: https://vercel.com
2. **GitHub 계정으로 로그인**
3. **"Add New Project" 클릭**
4. **GitHub 리포지토리 import**:
   - `smc2315/soundcanvas` 선택
   - "Import" 클릭
5. **배포 설정**:
   - Framework Preset: Next.js (자동 감지됨)
   - Build Command: `npm run build` (자동 설정됨)
   - Output Directory: `.next` (자동 설정됨)
   - Install Command: `npm install` (자동 설정됨)
6. **"Deploy" 클릭**

### 4단계: 환경변수 설정 (필요시)

Vercel 대시보드에서:
1. 프로젝트 설정 → Environment Variables
2. 필요한 환경변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📋 자동 배포 설정

GitHub에 push할 때마다 자동으로 Vercel에 배포됩니다:

\`\`\`bash
# 코드 변경 후
git add .
git commit -m "Update features"
git push origin main
\`\`\`

## 🌐 배포 후 확인사항

- ✅ 정적 이미지 생성 기능
- ✅ 3가지 아티스틱 스타일 (Mandala, InkFlow, NeonGrid)
- ✅ 전체 캔버스 커버리지
- ✅ 페인팅 텍스처 효과
- ✅ 반응형 디자인
- ✅ 오디오 파일 업로드 및 분석

## 🔗 예상 배포 URL

배포 완료 후 다음과 같은 URL을 받게 됩니다:
- Production: `https://soundcanvas-xxx.vercel.app`
- 커스텀 도메인 설정 가능

## 🛠️ 문제 해결

배포 중 문제가 발생하면:
1. Vercel 대시보드의 배포 로그 확인
2. Build 에러시 로컬에서 `npm run build` 테스트
3. 환경변수 설정 확인

---

**배포 준비 완료!** 위 단계를 따라하시면 SoundCanvas가 전세계에서 접근 가능한 웹앱으로 배포됩니다. 🎨